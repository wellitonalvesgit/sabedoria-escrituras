import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { getKorvexService } from '@/lib/korvex'
import { SUPABASE_CONFIG } from '@/lib/supabase-config'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params
    const cookieStore = await cookies()

    // Parse do body primeiro para obter dados do cliente
    const body = await request.json()
    const { payment_method, client } = body

    // Tentar autenticação (opcional)
    const supabaseAnon = createServerClient(
      SUPABASE_CONFIG.url,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { user } } = await supabaseAnon.auth.getUser()

    // Se não está autenticado, exigir email e nome no body
    if (!user) {
      if (!client?.email || !client?.name) {
        return NextResponse.json({
          error: 'Para comprar sem cadastro, informe seu nome e email'
        }, { status: 400 })
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(client.email)) {
        return NextResponse.json({
          error: 'Email inválido'
        }, { status: 400 })
      }
    }

    // Usar SERVICE_ROLE_KEY para operações no banco
    const supabase = createServerClient(
      SUPABASE_CONFIG.url,
      SUPABASE_CONFIG.serviceRoleKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    // Buscar dados do usuário se autenticado
    let userData = null
    let userId = user?.id || null

    if (user) {
      const { data } = await supabase
        .from('users')
        .select('name, email')
        .eq('id', user.id)
        .single()
      userData = data
    } else {
      // Se não autenticado, verificar se já existe usuário com este email
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('email', client.email)
        .maybeSingle()

      if (existingUser) {
        userId = existingUser.id
        userData = existingUser
      }
    }

    // Buscar curso
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select(`
        id,
        title,
        slug,
        price,
        course_categories (
          categories (
            slug
          )
        )
      `)
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 })
    }

    // Verificar se o curso pertence ao Arsenal Espiritual
    const categorySlug = course.course_categories?.[0]?.categories?.slug
    if (categorySlug !== 'arsenal-espiritual') {
      return NextResponse.json(
        { error: 'Este curso não pode ser comprado individualmente' },
        { status: 400 }
      )
    }

    // Verificar se o curso tem preço
    if (!course.price || course.price <= 0) {
      return NextResponse.json(
        { error: 'Este curso não está disponível para venda' },
        { status: 400 }
      )
    }

    // Verificar se o usuário já comprou este curso (apenas se userId existir)
    if (userId) {
      const { data: existingPurchase } = await supabase
        .from('user_course_purchases')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .eq('is_active', true)
        .eq('payment_status', 'completed')
        .maybeSingle()

      if (existingPurchase) {
        return NextResponse.json(
          { error: 'Você já possui este curso' },
          { status: 400 }
        )
      }
    }

    if (!payment_method) {
      return NextResponse.json(
        { error: 'Método de pagamento não informado' },
        { status: 400 }
      )
    }

    // Criar checkout na Korvex
    const korvex = getKorvexService()
    const clientEmail = client?.email || userData?.email || user?.email
    const clientName = client?.name || userData?.name || 'Usuário'
    const identifier = `${userId || clientEmail}-${courseId}-${Date.now()}`
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const callbackUrl = userId
      ? `${siteUrl}/checkout/course/callback?identifier=${identifier}&userId=${userId}&courseId=${courseId}`
      : `${siteUrl}/checkout/course/callback?identifier=${identifier}&courseId=${courseId}`

    const paymentRequest = {
      identifier,
      amount: Number(course.price),
      client: {
        name: clientName,
        email: clientEmail,
        phone: client?.phone?.replace(/\D/g, '') || '',
        document: client?.cpf?.replace(/\D/g, '') || ''
      },
      products: [{
        id: course.id,
        name: course.title,
        quantity: 1,
        price: Number(course.price)
      }],
      metadata: {
        userId: userId,
        clientEmail: clientEmail,
        clientName: clientName,
        courseId: course.id,
        courseTitle: course.title,
        purchaseType: 'ONCE',
        requiresUserCreation: !userId // Flag para indicar que precisa criar usuário
      },
      callbackUrl: callbackUrl
    }

    let korvexResponse
    if (payment_method === 'PIX') {
      korvexResponse = await korvex.receivePix(paymentRequest)
    } else if (payment_method === 'BOLETO') {
      korvexResponse = await korvex.receiveBoleto(paymentRequest)
    } else {
      return NextResponse.json(
        { error: 'Método de pagamento não suportado via checkout. Use PIX ou Boleto.' },
        { status: 400 }
      )
    }

    // Criar registro de compra pendente
    // Se userId não existir, vamos criar a compra com user_id NULL
    // e o webhook vai criar o usuário e associar a compra depois
    const purchaseData: any = {
      course_id: courseId,
      payment_status: 'pending',
      payment_id: korvexResponse.transactionId,
      amount: course.price,
      currency: 'BRL',
      is_active: true,
      expires_at: null, // Vitalício
      metadata: {
        clientEmail: clientEmail,
        clientName: clientName,
        requiresUserCreation: !userId
      }
    }

    // Adicionar user_id apenas se existir
    if (userId) {
      purchaseData.user_id = userId
    }

    const { error: purchaseError } = await supabase
      .from('user_course_purchases')
      .insert(purchaseData)

    if (purchaseError) {
      console.error('Erro ao criar compra:', purchaseError)
      return NextResponse.json(
        { error: 'Erro ao processar compra' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      transactionId: korvexResponse.transactionId,
      checkoutUrl: korvexResponse.order?.url,
      pix: payment_method === 'PIX' ? {
        qrCode: korvexResponse.pix?.code,
        base64: korvexResponse.pix?.base64,
        image: korvexResponse.pix?.image
      } : null,
      identifier: identifier
    })
  } catch (error) {
    console.error('Erro ao processar compra do curso:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao processar compra' },
      { status: 500 }
    )
  }
}

