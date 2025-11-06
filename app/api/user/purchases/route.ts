import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { SUPABASE_CONFIG } from '@/lib/supabase-config'

/**
 * GET /api/user/purchases - Buscar compras individuais de cursos do usuário
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()

    // Autenticação com ANON_KEY
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
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Usar SERVICE_ROLE_KEY para buscar compras
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

    // Buscar compras ativas do usuário
    const { data: purchases, error } = await supabase
      .from('user_course_purchases')
      .select('course_id, payment_status, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .eq('payment_status', 'completed')

    if (error) {
      console.error('Erro ao buscar compras:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar compras' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      purchases: purchases || []
    })
  } catch (error) {
    console.error('Erro na API de compras:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

