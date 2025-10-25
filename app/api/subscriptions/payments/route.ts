import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Busca histórico de pagamentos do usuário
 *
 * GET /api/subscriptions/payments
 */
export async function GET(request: NextRequest) {
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
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Buscar todas as assinaturas do usuário para pegar os IDs
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', user.id)

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        payments: []
      })
    }

    const subscriptionIds = subscriptions.map(s => s.id)

    // Buscar pagamentos dessas assinaturas
    const { data: payments, error } = await supabase
      .from('payments')
      .select('*')
      .in('subscription_id', subscriptionIds)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      throw error
    }

    return NextResponse.json({
      payments: payments || []
    })
  } catch (error) {
    console.error('Erro ao buscar pagamentos:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar pagamentos' },
      { status: 500 }
    )
  }
}
