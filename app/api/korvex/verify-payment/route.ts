import { NextRequest, NextResponse } from 'next/server'
import { getKorvexService } from '@/lib/korvex'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_CONFIG } from '@/lib/supabase-config'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get('transactionId')
    const identifier = searchParams.get('identifier')

    if (!transactionId || !identifier) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios não fornecidos' },
        { status: 400 }
      )
    }

    // Buscar transação na Korvex
    const korvex = getKorvexService()
    const transaction = await korvex.getTransaction(transactionId, identifier)

    // Buscar pagamento no banco
    const supabase = createClient(
      SUPABASE_CONFIG.url,
      SUPABASE_CONFIG.serviceRoleKey
    )

    const { data: payment } = await supabase
      .from('payments')
      .select('*, subscriptions(user_id, plan_id)')
      .eq('korvex_payment_id', transactionId)
      .single()

    if (transaction.status === 'COMPLETED') {
      // Se pagamento ainda não foi confirmado no banco, atualizar
      if (payment && payment.status !== 'confirmed') {
        await supabase
          .from('payments')
          .update({
            status: 'confirmed',
            paid_at: transaction.payedAt || new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', payment.id)

        // Se tem assinatura associada, ativar
        if (payment.subscription_id) {
          const { data: subscription } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('id', payment.subscription_id)
            .single()

          if (subscription) {
            // Calcular período baseado no metadata ou webhook
            const metadata = payment.metadata as any
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

            await supabase
              .from('subscriptions')
              .update({
                status: 'active',
                current_period_start: periodStart.toISOString(),
                current_period_end: periodEnd.toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', subscription.id)

            // Atualizar acesso do usuário e limpar allowed_courses
            await supabase
              .from('users')
              .update({
                access_expires_at: periodEnd.toISOString(),
                allowed_courses: null, // Limpar lista específica para dar acesso total
                updated_at: new Date().toISOString()
              })
              .eq('id', subscription.user_id)
          }
        }
      }

      return NextResponse.json({
        success: true,
        payment: {
          status: 'confirmed',
          transactionId: transaction.id,
          amount: transaction.amount
        }
      })
    }

    return NextResponse.json({
      success: false,
      message: 'Pagamento ainda não confirmado',
      payment: {
        status: transaction.status.toLowerCase(),
        transactionId: transaction.id
      }
    })

  } catch (error) {
    console.error('Erro ao verificar pagamento:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro ao verificar pagamento'
      },
      { status: 500 }
    )
  }
}

