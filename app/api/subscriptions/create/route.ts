import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { getAsaasService } from '@/lib/asaas'
import { getKorvexService } from '@/lib/korvex'
import { SUPABASE_CONFIG } from '@/lib/supabase-config'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()

    // Usar ANON_KEY apenas para autenticação
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

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Usar SERVICE_ROLE_KEY para operações no banco (bypassa RLS)
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

    // Parse do body
    const body = await request.json()
    const { plan_name, cycle, payment_method, customer_data, gateway = 'korvex' } = body

    // Validações
    if (!plan_name || !cycle || !payment_method) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

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

    // Calcular valor
    const value = cycle === 'monthly' ? plan.price_monthly : plan.price_yearly

    // Calcular data de vencimento (hoje + 3 dias)
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 3)
    const dueDateStr = dueDate.toISOString().split('T')[0]

    // Determinar tipo de pagamento
    let paymentMethodFormatted: 'PIX' | 'BOLETO' | 'CREDIT_CARD' = 'PIX'
    if (payment_method === 'BOLETO' || payment_method === 'boleto') paymentMethodFormatted = 'BOLETO'
    if (payment_method === 'CREDIT_CARD' || payment_method === 'credit_card') paymentMethodFormatted = 'CREDIT_CARD'

    let customerId: string
    let subscriptionId: string
    let paymentId: string
    let invoiceUrl: string | null = null
    let pixData: any = null
    let boletoUrl: string | null = null

    // Usar Korvex ou Asaas conforme escolha
    if (gateway === 'korvex') {
      const korvex = getKorvexService()

      // Criar/atualizar cliente na Korvex
      const korvexCustomer = await korvex.createOrUpdateCustomer({
        name: customer_data.name || userData?.name || 'Usuário',
        email: customer_data.email || userData?.email || user.email!,
        cpfCnpj: customer_data.cpf?.replace(/\D/g, ''),
        phone: customer_data.phone?.replace(/\D/g, ''),
        externalReference: user.id
      })

      customerId = korvexCustomer.id || korvexCustomer.customer_id || korvexCustomer.data?.id

      // Criar assinatura recorrente na Korvex
      const korvexSubscription = await korvex.createSubscription({
        customer: customerId,
        paymentMethod: paymentMethodFormatted,
        cycle: cycle === 'monthly' ? 'MONTHLY' : 'YEARLY',
        value: Number(value),
        nextDueDate: dueDateStr,
        description: `Assinatura ${plan.display_name}`,
        externalReference: user.id
      })

      subscriptionId = korvexSubscription.id || korvexSubscription.subscription_id || korvexSubscription.data?.id

      // Buscar primeira cobrança
      const firstPaymentId = korvexSubscription.payment_id || 
                            korvexSubscription.payments?.[0]?.id || 
                            korvexSubscription.id
      
      const firstPayment = await korvex.getPayment(firstPaymentId)
      paymentId = firstPayment.id || firstPayment.payment_id || firstPaymentId
      invoiceUrl = firstPayment.checkout_url || firstPayment.invoice_url || firstPayment.payment_url

      // Buscar dados adicionais do pagamento (PIX/Boleto)
      if (paymentMethodFormatted === 'PIX') {
        pixData = await korvex.getPixQrCode(paymentId)
      } else if (paymentMethodFormatted === 'BOLETO') {
        boletoUrl = await korvex.getBoletoUrl(paymentId)
      }

      // Atualizar/criar assinatura no banco
      const { data: existingSubscription } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .single()

      const subscriptionData = {
        user_id: user.id,
        plan_id: plan.id,
        status: 'active',
        korvex_customer_id: customerId,
        korvex_subscription_id: subscriptionId,
        payment_method: payment_method.toLowerCase(),
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(dueDateStr).toISOString(),
        trial_ends_at: plan.trial_days > 0
          ? new Date(Date.now() + plan.trial_days * 24 * 60 * 60 * 1000).toISOString()
          : null
      }

      let subscription
      if (existingSubscription) {
        const { data } = await supabase
          .from('subscriptions')
          .update(subscriptionData)
          .eq('id', existingSubscription.id)
          .select()
          .single()
        subscription = data
      } else {
        const { data } = await supabase
          .from('subscriptions')
          .insert(subscriptionData)
          .select()
          .single()
        subscription = data
      }

      // Registrar pagamento no banco
      const { data: payment } = await supabase
        .from('payments')
        .insert({
          subscription_id: subscription.id,
          user_id: user.id,
          amount: value,
          status: 'pending',
          payment_method: payment_method.toLowerCase(),
          korvex_payment_id: paymentId,
          korvex_invoice_url: invoiceUrl,
          boleto_url: boletoUrl,
          pix_qrcode: pixData?.encodedImage,
          pix_copy_paste: pixData?.payload,
          due_date: dueDateStr,
          description: `Pagamento - ${plan.display_name}`
        })
        .select()
        .single()

      return NextResponse.json({
        success: true,
        gateway: 'korvex',
        subscription_id: subscription.id,
        payment_id: payment.id,
        korvex_payment_id: paymentId,
        pix_qrcode: pixData?.encodedImage,
        pix_copy_paste: pixData?.payload,
        boleto_url: boletoUrl,
        checkout_url: invoiceUrl
      })

    } else {
      // Usar Asaas (gateway padrão anterior)
      const asaas = getAsaasService()

      // Criar/atualizar cliente no Asaas
      const asaasCustomer = await asaas.createOrUpdateCustomer({
        name: customer_data.name || userData?.name || 'Usuário',
        email: customer_data.email || userData?.email || user.email!,
        cpfCnpj: customer_data.cpf?.replace(/\D/g, ''),
        phone: customer_data.phone?.replace(/\D/g, ''),
        externalReference: user.id
      })

      customerId = asaasCustomer.id

      // Determinar tipo de cobrança para Asaas
      let billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' = 'PIX'
      if (paymentMethodFormatted === 'BOLETO') billingType = 'BOLETO'
      if (paymentMethodFormatted === 'CREDIT_CARD') billingType = 'CREDIT_CARD'

      // Criar assinatura recorrente no Asaas
      const asaasSubscription = await asaas.createSubscription({
        customer: customerId,
        billingType,
        cycle: cycle === 'monthly' ? 'MONTHLY' : 'YEARLY',
        value: Number(value),
        nextDueDate: dueDateStr,
        description: `Assinatura ${plan.display_name}`,
        externalReference: user.id
      })

      subscriptionId = asaasSubscription.id

      // Buscar primeira cobrança
      const firstPayment = await asaas.getPayment(asaasSubscription.payments?.[0]?.id || asaasSubscription.id)
      paymentId = firstPayment.id
      invoiceUrl = firstPayment.invoiceUrl

      // Buscar dados adicionais do pagamento (PIX/Boleto)
      if (paymentMethodFormatted === 'PIX') {
        pixData = await asaas.getPixQrCode(paymentId)
      } else if (paymentMethodFormatted === 'BOLETO') {
        boletoUrl = await asaas.getBoletoUrl(paymentId)
      }

      // Atualizar/criar assinatura no banco
      const { data: existingSubscription } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .single()

      const subscriptionData = {
        user_id: user.id,
        plan_id: plan.id,
        status: 'active',
        asaas_customer_id: customerId,
        asaas_subscription_id: subscriptionId,
        payment_method: payment_method.toLowerCase(),
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(asaasSubscription.nextDueDate).toISOString(),
        trial_ends_at: plan.trial_days > 0
          ? new Date(Date.now() + plan.trial_days * 24 * 60 * 60 * 1000).toISOString()
          : null
      }

      let subscription
      if (existingSubscription) {
        const { data } = await supabase
          .from('subscriptions')
          .update(subscriptionData)
          .eq('id', existingSubscription.id)
          .select()
          .single()
        subscription = data
      } else {
        const { data } = await supabase
          .from('subscriptions')
          .insert(subscriptionData)
          .select()
          .single()
        subscription = data
      }

      // Registrar pagamento no banco
      const { data: payment } = await supabase
        .from('payments')
        .insert({
          subscription_id: subscription.id,
          user_id: user.id,
          amount: value,
          status: 'pending',
          payment_method: payment_method.toLowerCase(),
          asaas_payment_id: paymentId,
          asaas_invoice_url: invoiceUrl,
          boleto_url: boletoUrl,
          pix_qrcode: pixData?.encodedImage,
          pix_copy_paste: pixData?.payload,
          due_date: dueDateStr,
          description: `Pagamento - ${plan.display_name}`
        })
        .select()
        .single()

      return NextResponse.json({
        success: true,
        gateway: 'asaas',
        subscription_id: subscription.id,
        payment_id: payment.id,
        asaas_payment_id: paymentId,
        pix_qrcode: pixData?.encodedImage,
        pix_copy_paste: pixData?.payload,
        boleto_url: boletoUrl,
        invoice_url: invoiceUrl
      })
    }
  } catch (error) {
    console.error('Erro ao criar assinatura:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro ao processar assinatura'
      },
      { status: 500 }
    )
  }
}
