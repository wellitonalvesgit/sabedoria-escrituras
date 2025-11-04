import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getAsaasService } from '@/lib/asaas'
import { SUPABASE_CONFIG } from '@/lib/supabase-config'

/**
 * Cancela a assinatura do usuário
 *
 * POST /api/subscriptions/cancel
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()

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

    // Verificar autenticação
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Buscar assinatura ativa do usuário
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'Nenhuma assinatura ativa encontrada' },
        { status: 404 }
      )
    }

    // Cancelar no Asaas se houver asaas_subscription_id
    if (subscription.asaas_subscription_id) {
      try {
        const asaas = getAsaasService()
        await asaas.cancelSubscription(subscription.asaas_subscription_id)
      } catch (asaasError) {
        console.error('Erro ao cancelar no Asaas:', asaasError)
        // Continuar mesmo se falhar no Asaas
      }
    }

    // Atualizar status no banco
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', subscription.id)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      success: true,
      message: 'Assinatura cancelada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error)
    return NextResponse.json(
      { error: 'Erro ao cancelar assinatura' },
      { status: 500 }
    )
  }
}
