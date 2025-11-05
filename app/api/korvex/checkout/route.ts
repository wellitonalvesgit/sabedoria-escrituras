import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { getKorvexService } from '@/lib/korvex'
import { SUPABASE_CONFIG } from '@/lib/supabase-config'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()

    // Verificar autenticação
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

    // Buscar dados do usuário e plano
    const body = await request.json()
    const { plan_name, cycle, payment_method = 'PIX', client: clientData } = body

    if (!plan_name || !cycle) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    // Validar dados do cliente
    if (!clientData || !clientData.name || !clientData.email || !clientData.cpf || !clientData.phone) {
      return NextResponse.json(
        { error: 'Dados do cliente incompletos' },
        { status: 400 }
      )
    }

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

    // Buscar plano
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('name', plan_name)
      .single()

    if (planError || !plan) {
      return NextResponse.json(
        { error: 'Plano não encontrado' },
        { status: 404 }
      )
    }

    // Buscar dados do usuário
    const { data: userData } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', user.id)
      .single()

    // Calcular valor
    const value = cycle === 'monthly' ? plan.price_monthly : plan.price_yearly

    // Gerar identificador único para a transação
    const identifier = `${user.id}-${plan_name}-${cycle}-${Date.now()}`

    // URL de callback após pagamento
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const callbackUrl = `${siteUrl}/checkout/korvex/callback?identifier=${identifier}&userId=${user.id}&planId=${plan.id}`

    // Criar transação na Korvex
    const korvex = getKorvexService()
    
    // Determinar intervalo para assinatura recorrente
    const intervalType = cycle === 'monthly' ? 'MONTHS' : 'YEARS'
    const intervalCount = 1

    const paymentRequest = {
      identifier,
      amount: Number(value),
      client: {
        name: clientData.name,
        email: clientData.email,
        phone: clientData.phone,
        document: clientData.cpf
      },
      products: [
        {
          id: plan.id,
          name: plan.display_name,
          quantity: 1,
          price: Number(value)
        }
      ],
      metadata: {
        userId: user.id,
        planId: plan.id,
        planName: plan_name,
        cycle: cycle,
        purchaseType: 'RECURRING', // Assinatura recorrente
        intervalType: intervalType,
        intervalCount: intervalCount
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

    // Criar assinatura pendente no banco (será ativada quando pagamento for confirmado)
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .single()

    let subscription
    if (existingSubscription) {
      // Atualizar assinatura existente
      const { data } = await supabase
        .from('subscriptions')
        .update({
          plan_id: plan.id,
          status: 'pending',
          payment_method: payment_method.toLowerCase(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSubscription.id)
        .select()
        .single()
      subscription = data
    } else {
      // Criar nova assinatura
      const { data } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          plan_id: plan.id,
          status: 'pending',
          payment_method: payment_method.toLowerCase(),
          korvex_subscription_id: null, // Será preenchido pelo webhook
        })
        .select()
        .single()
      subscription = data
    }

    // Salvar transação pendente no banco
    const { data: payment } = await supabase
      .from('payments')
      .insert({
        subscription_id: subscription.id,
        user_id: user.id,
        amount: value,
        status: 'pending',
        payment_method: payment_method.toLowerCase(),
        korvex_payment_id: korvexResponse.transactionId,
        korvex_invoice_url: korvexResponse.order?.url,
        pix_qrcode: korvexResponse.pix?.base64,
        pix_copy_paste: korvexResponse.pix?.qrCode,
        description: `Assinatura ${plan.display_name}`,
        metadata: {
          plan_id: plan.id,
          plan_name: plan_name,
          cycle: cycle,
          identifier: identifier,
          intervalType: intervalType,
          intervalCount: intervalCount,
          userId: user.id
        }
      })
      .select()
      .single()

    // Retornar URL do checkout ou dados do PIX
    return NextResponse.json({
      success: true,
      transactionId: korvexResponse.transactionId,
      checkoutUrl: korvexResponse.order?.url, // URL do checkout da Korvex
      pix: payment_method === 'PIX' ? {
        qrCode: korvexResponse.pix?.qrCode,
        base64: korvexResponse.pix?.base64,
        image: korvexResponse.pix?.image
      } : null,
      identifier: identifier
    })

  } catch (error) {
    console.error('Erro ao criar checkout Korvex:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro ao processar checkout'
      },
      { status: 500 }
    )
  }
}

