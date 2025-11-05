import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_CONFIG } from '@/lib/supabase-config'

/**
 * Webhook da Korvex
 * Recebe notificações sobre mudanças de status de transações
 *
 * Documentação: https://app.korvex.com.br/docs/webhooks
 *
 * Eventos suportados:
 * - TRANSACTION_CREATED - Transação criada
 * - TRANSACTION_PAID - Transação paga
 * - TRANSACTION_CANCELED - Transação cancelada
 * - TRANSACTION_REFUNDED - Transação estornada
 *
 * Configurar na Korvex:
 * 1. Acessar o painel da Korvex
 * 2. Ir em Configurações > Webhooks
 * 3. Adicionar URL: https://seudominio.com/api/webhooks/korvex
 * 4. Selecionar eventos desejados
 * 5. Copiar o token gerado e adicionar ao .env como KORVEX_WEBHOOK_TOKEN
 */

interface KorvexWebhookPayload {
  event: 'TRANSACTION_CREATED' | 'TRANSACTION_PAID' | 'TRANSACTION_CANCELED' | 'TRANSACTION_REFUNDED'
  token: string
  offerCode?: string
  client: {
    id: string
    name: string
    email: string
    phone: string
    cpf: string | null
    cnpj: string | null
    address?: {
      country: string
      zipCode: string
      state: string
      city: string
      neighborhood: string
      street: string
      number: string
      complement?: string
    }
  }
  transaction: {
    id: string
    identifier?: string
    status: 'COMPLETED' | 'FAILED' | 'PENDING' | 'REFUNDED' | 'CHARGED_BACK'
    paymentMethod: 'PIX' | 'BOLETO' | 'CREDIT_CARD'
    originalCurrency: string
    originalAmount: number
    currency: string
    exchangeRate?: number
    amount: number
    createdAt: string
    payedAt: string | null
    pixInformation?: {
      qrCode: string
      endToEndId: string | null
    }
    pixMetadata?: {
      payerDocument: string | null
      payerName: string | null
      payerBankName: string | null
      payerBankAccount: string | null
      payerBankBranch: string | null
      receiverDocument: string | null
      receiverName: string | null
      receiverPixKey: string | null
      receiverBankName: string | null
      receiverBankAccount: string | null
      receiverBankBranch: string | null
    }
  }
  subscription: {
    id: string
    identifier?: string
    cycle: number
    startAt: string
    intervalType: 'DAYS' | 'WEEKS' | 'MONTHS' | 'YEARS'
    intervalCount: number
  } | null
  orderItems?: Array<{
    id: string
    price: number
    product: {
      id: string
      name: string
      externalId?: string
    }
  }>
  trackProps?: Record<string, string>
}

export async function POST(request: NextRequest) {
  try {
    const body: KorvexWebhookPayload = await request.json()

    console.log('📩 Webhook Korvex recebido:', {
      event: body.event,
      transaction_id: body.transaction.id,
      transaction_identifier: body.transaction.identifier,
      subscription_id: body.subscription?.id,
      status: body.transaction.status
    })

    // Validar token do webhook (se configurado)
    const webhookToken = process.env.KORVEX_WEBHOOK_TOKEN
    if (webhookToken && body.token !== webhookToken) {
      console.error('❌ Token de validação inválido')
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Criar cliente Supabase com service role (bypass RLS)
    const supabase = createClient(
      SUPABASE_CONFIG.url,
      SUPABASE_CONFIG.serviceRoleKey
    )

    // Buscar pagamento no banco pelo transaction.id ou identifier
    const transactionId = body.transaction.id
    const transactionIdentifier = body.transaction.identifier

    let existingPayment = null
    let existingCoursePurchase = null

    // Tentar buscar por transaction.id (korvex_payment_id)
    if (transactionId) {
      const { data, error } = await supabase
        .from('payments')
        .select('*, subscriptions(user_id, plan_id)')
        .eq('korvex_payment_id', transactionId)
        .single()

      if (!error && data) {
        existingPayment = data
      }
    }

    // Se não encontrou, tentar buscar por identifier (se existir)
    if (!existingPayment && transactionIdentifier) {
      const { data, error } = await supabase
        .from('payments')
        .select('*, subscriptions(user_id, plan_id)')
        .eq('korvex_payment_id', transactionIdentifier)
        .single()

      if (!error && data) {
        existingPayment = data
      }
    }

    // Verificar se é compra individual de curso (buscar em user_course_purchases)
    if (transactionId) {
      const { data, error } = await supabase
        .from('user_course_purchases')
        .select('*')
        .eq('payment_id', transactionId)
        .single()

      if (!error && data) {
        existingCoursePurchase = data
      }
    }

    // Processar evento conforme documentação oficial
    switch (body.event) {
      case 'TRANSACTION_CREATED':
        console.log('📝 Transação criada:', transactionId)
        await handleTransactionCreated(supabase, existingPayment, body)
        break

      case 'TRANSACTION_PAID':
        console.log('✅ Transação paga:', transactionId)
        // Se é compra de curso, processar separadamente
        if (existingCoursePurchase) {
          await handleCoursePurchasePaid(supabase, existingCoursePurchase, body)
        } else {
          await handleTransactionPaid(supabase, existingPayment, body)
        }
        break

      case 'TRANSACTION_CANCELED':
        console.log('❌ Transação cancelada:', transactionId)
        await handleTransactionCanceled(supabase, existingPayment, body)
        break

      case 'TRANSACTION_REFUNDED':
        console.log('🔄 Transação estornada:', transactionId)
        await handleTransactionRefunded(supabase, existingPayment, body)
        break

      default:
        console.log('ℹ️ Evento não tratado:', body.event)
    }

    // Retornar 200 para indicar sucesso (conforme documentação)
    return NextResponse.json({ received: true, event: body.event })
  } catch (error) {
    console.error('❌ Erro no webhook Korvex:', error)
    // Retornar 500 para indicar erro e permitir retry
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleTransactionCreated(
  supabase: any,
  existingPayment: any,
  payload: KorvexWebhookPayload
) {
  // Se pagamento já existe, apenas atualizar status
  if (existingPayment) {
    await supabase
      .from('payments')
      .update({
        status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', existingPayment.id)

    console.log('✅ Pagamento atualizado para pending')
    return
  }

  // Se não existe, pode ser que o pagamento foi criado antes do registro no banco
  // Ou é um pagamento novo que precisa ser criado
  console.log('⚠️ Pagamento não encontrado no banco para TRANSACTION_CREATED')
}

async function handleTransactionPaid(
  supabase: any,
  existingPayment: any,
  payload: KorvexWebhookPayload
) {
  if (!existingPayment) {
    console.error('❌ Pagamento não encontrado no banco:', payload.transaction.id)
    return
  }

  const transaction = payload.transaction

  // Mapear status da Korvex para status do banco
  let status = 'confirmed'
  if (transaction.status === 'COMPLETED') {
    status = 'confirmed'
  } else if (transaction.status === 'PENDING') {
    status = 'pending'
  } else if (transaction.status === 'FAILED') {
    status = 'failed'
  }

  // Atualizar pagamento
  await supabase
    .from('payments')
    .update({
      status: status,
      paid_at: transaction.payedAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Atualizar informações PIX se disponível
      pix_qrcode: transaction.pixInformation?.qrCode || existingPayment.pix_qrcode,
      pix_copy_paste: transaction.pixInformation?.qrCode || existingPayment.pix_copy_paste,
    })
    .eq('id', existingPayment.id)

  // Buscar assinatura se existir
  const subscriptionId = existingPayment.subscription_id
  if (subscriptionId) {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single()

    if (subscription && transaction.status === 'COMPLETED') {
      // Ativar assinatura
      const updates: any = {
        status: 'active',
        updated_at: new Date().toISOString()
      }

      // Se estava em trial, encerrar trial
      if (subscription.status === 'trial') {
        updates.trial_ends_at = new Date().toISOString()
      }

      // Atualizar período baseado na subscription do webhook ou metadata
      if (payload.subscription) {
        const startAt = new Date(payload.subscription.startAt)
        const intervalCount = payload.subscription.intervalCount
        const intervalType = payload.subscription.intervalType

        let periodEnd = new Date(startAt)
        
        switch (intervalType) {
          case 'DAYS':
            periodEnd.setDate(periodEnd.getDate() + intervalCount)
            break
          case 'WEEKS':
            periodEnd.setDate(periodEnd.getDate() + (intervalCount * 7))
            break
          case 'MONTHS':
            periodEnd.setMonth(periodEnd.getMonth() + intervalCount)
            break
          case 'YEARS':
            periodEnd.setFullYear(periodEnd.getFullYear() + intervalCount)
            break
        }

        updates.current_period_start = startAt.toISOString()
        updates.current_period_end = periodEnd.toISOString()
      } else {
        // Calcular período baseado no metadata do pagamento
        const metadata = existingPayment.metadata as any
        const intervalType = metadata?.intervalType || 'MONTHS'
        const intervalCount = metadata?.intervalCount || 1

        const periodStart = new Date()
        const periodEnd = new Date()

        switch (intervalType) {
          case 'DAYS':
            periodEnd.setDate(periodEnd.getDate() + intervalCount)
            break
          case 'WEEKS':
            periodEnd.setDate(periodEnd.getDate() + (intervalCount * 7))
            break
          case 'MONTHS':
            periodEnd.setMonth(periodEnd.getMonth() + intervalCount)
            break
          case 'YEARS':
            periodEnd.setFullYear(periodEnd.getFullYear() + intervalCount)
            break
        }

        updates.current_period_start = periodStart.toISOString()
        updates.current_period_end = periodEnd.toISOString()
      }

      await supabase
        .from('subscriptions')
        .update(updates)
        .eq('id', subscription.id)

      console.log('✅ Assinatura ativada:', subscription.id)

      // Atualizar access_expires_at do usuário e limpar allowed_courses
      if (subscription.user_id) {
        const periodEnd = updates.current_period_end || subscription.current_period_end

        await supabase
          .from('users')
          .update({
            access_expires_at: periodEnd,
            allowed_courses: null, // Limpar lista específica para dar acesso total
            updated_at: new Date().toISOString()
          })
          .eq('id', subscription.user_id)

        console.log('✅ Acesso do usuário atualizado até:', periodEnd)
        console.log('✅ Lista de cursos permitidos limpa (acesso total)')
      }
    }
  } else {
    // Se não tem assinatura, criar uma nova baseada no metadata do pagamento
    const metadata = existingPayment.metadata as any
    if (metadata?.planId && metadata?.userId) {
      const periodStart = new Date()
      const periodEnd = new Date()
      const intervalType = metadata?.intervalType || 'MONTHS'
      const intervalCount = metadata?.intervalCount || 1

      switch (intervalType) {
        case 'DAYS':
          periodEnd.setDate(periodEnd.getDate() + intervalCount)
          break
        case 'WEEKS':
          periodEnd.setDate(periodEnd.getDate() + (intervalCount * 7))
          break
        case 'MONTHS':
          periodEnd.setMonth(periodEnd.getMonth() + intervalCount)
          break
        case 'YEARS':
          periodEnd.setFullYear(periodEnd.getFullYear() + intervalCount)
          break
      }

      // Verificar se já existe assinatura
      const { data: existingSubscription } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', metadata.userId)
        .single()

      const subscriptionData = {
        user_id: metadata.userId,
        plan_id: metadata.planId,
        status: 'active',
        korvex_subscription_id: payload.subscription?.id || null,
        payment_method: transaction.paymentMethod.toLowerCase(),
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
        updated_at: new Date().toISOString()
      }

      if (existingSubscription) {
        await supabase
          .from('subscriptions')
          .update(subscriptionData)
          .eq('id', existingSubscription.id)
      } else {
        await supabase
          .from('subscriptions')
          .insert(subscriptionData)
      }

      // Atualizar pagamento com subscription_id
      const { data: updatedSubscription } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', metadata.userId)
        .single()

      if (updatedSubscription) {
        await supabase
          .from('payments')
          .update({ subscription_id: updatedSubscription.id })
          .eq('id', existingPayment.id)
      }

      // Atualizar acesso do usuário e limpar allowed_courses
      await supabase
        .from('users')
        .update({
          access_expires_at: periodEnd.toISOString(),
          allowed_courses: null, // Limpar lista específica para dar acesso total
          updated_at: new Date().toISOString()
        })
        .eq('id', metadata.userId)

      console.log('✅ Assinatura criada e ativada:', updatedSubscription?.id)
      console.log('✅ Lista de cursos permitidos limpa (acesso total)')
    }
  }

  console.log('✅ Transação processada com sucesso')
}

async function handleTransactionCanceled(
  supabase: any,
  existingPayment: any,
  payload: KorvexWebhookPayload
) {
  if (!existingPayment) {
    console.error('❌ Pagamento não encontrado no banco:', payload.transaction.id)
    return
  }

  // Atualizar pagamento
  await supabase
    .from('payments')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString()
    })
    .eq('id', existingPayment.id)

  console.log('✅ Pagamento cancelado')
}

async function handleTransactionRefunded(
  supabase: any,
  existingPayment: any,
  payload: KorvexWebhookPayload
) {
  if (!existingPayment) {
    console.error('❌ Pagamento não encontrado no banco:', payload.transaction.id)
    return
  }

  // Atualizar pagamento
  await supabase
    .from('payments')
    .update({
      status: 'refunded',
      updated_at: new Date().toISOString()
    })
    .eq('id', existingPayment.id)

  // Cancelar assinatura se existir
  if (existingPayment.subscription_id) {
    await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', existingPayment.subscription_id)

    console.log('🔄 Assinatura cancelada por estorno')
  }

  console.log('✅ Transação estornada')
}

async function handleCoursePurchasePaid(
  supabase: any,
  existingPurchase: any,
  payload: KorvexWebhookPayload
) {
  const transaction = payload.transaction

  if (transaction.status === 'COMPLETED') {
    // Atualizar compra do curso para completed
    await supabase
      .from('user_course_purchases')
      .update({
        payment_status: 'completed',
        purchase_date: transaction.payedAt || new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', existingPurchase.id)

    console.log('✅ Compra do curso confirmada:', existingPurchase.course_id)
    console.log('✅ Usuário agora tem acesso ao curso:', existingPurchase.user_id)

    // Buscar dados do usuário e curso para enviar email
    const { data: userData } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', existingPurchase.user_id)
      .single()

    const { data: courseData } = await supabase
      .from('courses')
      .select('title, price')
      .eq('id', existingPurchase.course_id)
      .single()

    if (userData && courseData) {
      // Enviar email de confirmação via Resend
      try {
        const { generateCoursePurchaseEmailTemplate } = await import('@/lib/email-templates')
        const { sendEmailResend } = await import('@/lib/email-resend')

        const emailTemplate = generateCoursePurchaseEmailTemplate(
          userData.name,
          courseData.title,
          Number(existingPurchase.amount || courseData.price || 0),
          transaction.payedAt || new Date().toISOString()
        )

        console.log('📧 Preparando envio de email via Resend para:', userData.email)
        const emailSent = await sendEmailResend({
          to: userData.email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          text: emailTemplate.text
        })

        if (emailSent) {
          console.log('✅ Email de confirmação enviado com sucesso via Resend para:', userData.email)
        } else {
          console.error('❌ Falha ao enviar email de confirmação via Resend')
        }
      } catch (error) {
        console.error('❌ Erro ao enviar email de confirmação via Resend:', error)
      }
    }
  } else if (transaction.status === 'FAILED') {
    // Atualizar compra do curso para failed
    await supabase
      .from('user_course_purchases')
      .update({
        payment_status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('id', existingPurchase.id)

    console.log('❌ Compra do curso falhou:', existingPurchase.course_id)
  }
}

// Método GET para verificar se webhook está funcionando
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    message: 'Korvex webhook endpoint is running',
    timestamp: new Date().toISOString(),
    supported_events: [
      'TRANSACTION_CREATED',
      'TRANSACTION_PAID',
      'TRANSACTION_CANCELED',
      'TRANSACTION_REFUNDED'
    ]
  })
}
