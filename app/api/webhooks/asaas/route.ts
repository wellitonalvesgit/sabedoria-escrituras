import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Webhook do Asaas
 * Recebe notificações sobre mudanças de status de pagamentos
 *
 * Configurar no Asaas:
 * 1. Ir em Configurações > Integrações > Webhooks
 * 2. Adicionar URL: https://seudominio.com/api/webhooks/asaas
 * 3. Selecionar eventos:
 *    - PAYMENT_CREATED
 *    - PAYMENT_CONFIRMED
 *    - PAYMENT_RECEIVED
 *    - PAYMENT_OVERDUE
 *    - PAYMENT_REFUNDED
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log('📩 Webhook Asaas recebido:', {
      event: body.event,
      payment_id: body.payment?.id
    })

    // Criar cliente Supabase com service role (bypass RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { event, payment } = body

    if (!event || !payment) {
      console.error('❌ Webhook inválido: evento ou payment ausente')
      return NextResponse.json({ error: 'Invalid webhook data' }, { status: 400 })
    }

    // Buscar pagamento no banco pelo asaas_payment_id
    const { data: existingPayment, error: findError } = await supabase
      .from('payments')
      .select('*, subscriptions(user_id)')
      .eq('asaas_payment_id', payment.id)
      .single()

    if (findError || !existingPayment) {
      console.error('❌ Pagamento não encontrado no banco:', payment.id)
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Processar evento
    switch (event) {
      case 'PAYMENT_CREATED':
        console.log('📝 Pagamento criado:', payment.id)
        await handlePaymentCreated(supabase, existingPayment, payment)
        break

      case 'PAYMENT_CONFIRMED':
      case 'PAYMENT_RECEIVED':
        console.log('✅ Pagamento confirmado/recebido:', payment.id)
        await handlePaymentConfirmed(supabase, existingPayment, payment)
        break

      case 'PAYMENT_OVERDUE':
        console.log('⚠️ Pagamento vencido:', payment.id)
        await handlePaymentOverdue(supabase, existingPayment, payment)
        break

      case 'PAYMENT_REFUNDED':
        console.log('🔄 Pagamento reembolsado:', payment.id)
        await handlePaymentRefunded(supabase, existingPayment, payment)
        break

      default:
        console.log('ℹ️ Evento não tratado:', event)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('❌ Erro no webhook Asaas:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handlePaymentCreated(supabase: any, existingPayment: any, payment: any) {
  // Atualizar status do pagamento
  await supabase
    .from('payments')
    .update({
      status: 'pending',
      updated_at: new Date().toISOString()
    })
    .eq('id', existingPayment.id)

  console.log('✅ Pagamento atualizado para pending')
}

async function handlePaymentConfirmed(supabase: any, existingPayment: any, payment: any) {
  // Atualizar pagamento
  await supabase
    .from('payments')
    .update({
      status: 'confirmed',
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', existingPayment.id)

  // Buscar assinatura
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('id', existingPayment.subscription_id)
    .single()

  if (subscription) {
    // Ativar assinatura
    const updates: any = {
      status: 'active',
      updated_at: new Date().toISOString()
    }

    // Se estava em trial, encerrar trial
    if (subscription.status === 'trial') {
      updates.trial_ends_at = new Date().toISOString()
    }

    // Atualizar período se necessário
    if (!subscription.current_period_end || new Date(subscription.current_period_end) < new Date()) {
      const periodStart = new Date()
      const periodEnd = new Date()

      // Verificar se é mensal ou anual pelo valor do pagamento
      if (payment.value >= 200) {
        // Anual
        periodEnd.setFullYear(periodEnd.getFullYear() + 1)
      } else {
        // Mensal
        periodEnd.setMonth(periodEnd.getMonth() + 1)
      }

      updates.current_period_start = periodStart.toISOString()
      updates.current_period_end = periodEnd.toISOString()
    }

    await supabase
      .from('subscriptions')
      .update(updates)
      .eq('id', subscription.id)

    console.log('✅ Assinatura ativada:', subscription.id)

    // Atualizar access_expires_at do usuário
    if (subscription.user_id) {
      const periodEnd = updates.current_period_end || subscription.current_period_end

      await supabase
        .from('users')
        .update({
          access_expires_at: periodEnd,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.user_id)

      console.log('✅ Acesso do usuário atualizado até:', periodEnd)
    }
  }
}

async function handlePaymentOverdue(supabase: any, existingPayment: any, payment: any) {
  // Atualizar pagamento
  await supabase
    .from('payments')
    .update({
      status: 'overdue',
      updated_at: new Date().toISOString()
    })
    .eq('id', existingPayment.id)

  // Atualizar assinatura para past_due
  await supabase
    .from('subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString()
    })
    .eq('id', existingPayment.subscription_id)

  console.log('⚠️ Assinatura marcada como past_due')
}

async function handlePaymentRefunded(supabase: any, existingPayment: any, payment: any) {
  // Atualizar pagamento
  await supabase
    .from('payments')
    .update({
      status: 'refunded',
      updated_at: new Date().toISOString()
    })
    .eq('id', existingPayment.id)

  // Cancelar assinatura
  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', existingPayment.subscription_id)

  console.log('🔄 Assinatura cancelada por reembolso')
}

// Método GET para verificar se webhook está funcionando
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    message: 'Asaas webhook endpoint is running',
    timestamp: new Date().toISOString()
  })
}
