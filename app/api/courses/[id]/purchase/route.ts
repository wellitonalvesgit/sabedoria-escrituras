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

    // Autenticação
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

    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
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

    // Buscar dados do usuário
    const { data: userData } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', user.id)
      .single()

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

    // Verificar se o usuário já comprou este curso
    const { data: existingPurchase } = await supabase
      .from('user_course_purchases')
      .select('id')
      .eq('user_id', user.id)
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

    // Parse do body
    const body = await request.json()
    const { payment_method, client } = body

    if (!payment_method) {
      return NextResponse.json(
        { error: 'Método de pagamento não informado' },
        { status: 400 }
      )
    }

    // Criar checkout na Korvex
    const korvex = getKorvexService()
    const identifier = `${user.id}-${courseId}-${Date.now()}`
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const callbackUrl = `${siteUrl}/checkout/course/callback?identifier=${identifier}&userId=${user.id}&courseId=${courseId}`

    const paymentRequest = {
      identifier,
      amount: Number(course.price),
      client: {
        name: client?.name || userData?.name || 'Usuário',
        email: client?.email || userData?.email || user.email!,
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
        userId: user.id,
        courseId: course.id,
        courseTitle: course.title,
        purchaseType: 'ONCE'
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
    const { error: purchaseError } = await supabase
      .from('user_course_purchases')
      .insert({
        user_id: user.id,
        course_id: courseId,
        payment_status: 'pending',
        payment_id: korvexResponse.transactionId,
        amount: course.price,
        currency: 'BRL',
        is_active: true,
        expires_at: null // Vitalício
      })

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

