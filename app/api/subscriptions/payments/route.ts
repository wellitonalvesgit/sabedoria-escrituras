import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { SUPABASE_CONFIG } from '@/lib/supabase-config'

/**
 * Busca histórico de pagamentos do usuário
 *
 * GET /api/subscriptions/payments
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()

    // Usar ANON_KEY para verificar autenticação
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
    const { data: { user } } = await supabaseAnon.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Usar SERVICE_ROLE_KEY para bypassar RLS e melhorar performance
    const supabaseAdmin = createServerClient(
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

    // Buscar todas as assinaturas do usuário para pegar os IDs
    const { data: subscriptions } = await supabaseAdmin
      .from('subscriptions')
      .select('id')
      .eq('user_id', user.id)

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        payments: []
      })
    }

    const subscriptionIds = subscriptions.map(s => s.id)

    // Buscar pagamentos dessas assinaturas com melhor performance
    const { data: payments, error } = await supabaseAdmin
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
