import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { SUPABASE_CONFIG } from '@/lib/supabase-config'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()

    // ANON_KEY apenas para autenticação
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
      console.error('Erro de autenticação na API gamification:', authError)
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    // SERVICE_ROLE_KEY para operações no banco
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

    const { data: stats, error } = await supabase
      .from('users')
      .select('total_points, current_level, courses_completed, total_reading_minutes')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Erro ao buscar stats:', error)
      return NextResponse.json({ error: 'Erro ao buscar estatísticas' }, { status: 500 })
    }

    return NextResponse.json({ stats })

  } catch (error) {
    console.error('Erro na API de gamificação:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()

    // ANON_KEY apenas para autenticação
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
      console.error('Erro de autenticação na API gamification:', authError)
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    // SERVICE_ROLE_KEY para operações no banco
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

    const { totalPoints, level, coursesCompleted, pagesRead, currentStreak } = await request.json()

    const { error } = await supabase
      .from('users')
      .update({
        total_points: totalPoints,
        current_level: level,
        courses_completed: coursesCompleted,
        total_reading_minutes: pagesRead * 2, // Estimativa: 2 min por página
        last_active_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (error) {
      console.error('Erro ao atualizar stats:', error)
      return NextResponse.json({ error: 'Erro ao salvar estatísticas' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Estatísticas atualizadas com sucesso' })

  } catch (error) {
    console.error('Erro na API de gamificação:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
