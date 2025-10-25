import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { getAsaasService } from '@/lib/asaas'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
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
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Buscar dados do usuário
    const { data: userData } = await supabase
      .from('users')
      .select('full_name, email')
      .eq('id', user.id)
      .single()

    // Parse do body
    const body = await request.json()
    const { plan_name, cycle, payment_method, customer_data } = body

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

    // Inicializar serviço Asaas
    const asaas = getAsaasService()

    // Criar/atualizar cliente no Asaas
    const asaasCustomer = await asaas.createOrUpdateCustomer({
      name: customer_data.name || userData?.full_name || 'Usuário',
      email: customer_data.email || userData?.email || user.email!,
      cpfCnpj: customer_data.cpf?.replace(/\D/g, ''),
      phone: customer_data.phone?.replace(/\D/g, ''),
      externalReference: user.id
    })

    // Calcular data de vencimento (hoje + 3 dias)
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 3)
    const dueDateStr = dueDate.toISOString().split('T')[0]

    // Determinar tipo de cobrança
    let billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' = 'PIX'
    if (payment_method === 'BOLETO') billingType = 'BOLETO'
    if (payment_method === 'CREDIT_CARD') billingType = 'CREDIT_CARD'

    // Criar assinatura recorrente no Asaas
    const asaasSubscription = await asaas.createSubscription({
      customer: asaasCustomer.id,
      billingType,
      cycle: cycle === 'monthly' ? 'MONTHLY' : 'YEARLY',
      value: Number(value),
      nextDueDate: dueDateStr,
      description: `Assinatura ${plan.display_name}`,
      externalReference: user.id
    })

    // Buscar primeira cobrança
    const firstPayment = await asaas.getPayment(asaasSubscription.payments?.[0]?.id || asaasSubscription.id)

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
      asaas_customer_id: asaasCustomer.id,
      asaas_subscription_id: asaasSubscription.id,
      payment_method: payment_method.toLowerCase(),
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(asaasSubscription.nextDueDate).toISOString(),
      trial_ends_at: plan.trial_days > 0
        ? new Date(Date.now() + plan.trial_days * 24 * 60 * 60 * 1000).toISOString()
        : null
    }

    let subscription
    if (existingSubscription) {
      // Atualizar assinatura existente
      const { data } = await supabase
        .from('subscriptions')
        .update(subscriptionData)
        .eq('id', existingSubscription.id)
        .select()
        .single()
      subscription = data
    } else {
      // Criar nova assinatura
      const { data } = await supabase
        .from('subscriptions')
        .insert(subscriptionData)
        .select()
        .single()
      subscription = data
    }

    // Buscar dados adicionais do pagamento (PIX/Boleto)
    let pixData = null
    let boletoUrl = null

    if (payment_method === 'PIX') {
      pixData = await asaas.getPixQrCode(firstPayment.id)
    } else if (payment_method === 'BOLETO') {
      boletoUrl = await asaas.getBoletoUrl(firstPayment.id)
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
        asaas_payment_id: firstPayment.id,
        asaas_invoice_url: firstPayment.invoiceUrl,
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
      subscription_id: subscription.id,
      payment_id: payment.id,
      asaas_payment_id: firstPayment.id,
      pix_qrcode: pixData?.encodedImage,
      pix_copy_paste: pixData?.payload,
      boleto_url: boletoUrl,
      invoice_url: firstPayment.invoiceUrl
    })
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
