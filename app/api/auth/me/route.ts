import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { SUPABASE_CONFIG } from '@/lib/supabase-config'

/**
 * API para obter dados do usuário autenticado atual
 * Substitui a função getCurrentUser() de lib/auth.ts
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()

    // Criar cliente com SERVICE_ROLE_KEY para bypass RLS
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

    // Verificar sessão do Supabase Auth
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Buscar dados completos do usuário na tabela users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (userError || !userData) {
      console.error('Erro ao buscar dados do usuário:', userError)
      return NextResponse.json(
        { error: 'Dados do usuário não encontrados' },
        { status: 404 }
      )
    }

    // Verificar se o usuário está ativo
    if (userData.status !== 'active') {
      return NextResponse.json(
        { error: 'Sua conta está inativa. Entre em contato com o suporte' },
        { status: 403 }
      )
    }

    // Verificar se o acesso não expirou
    if (userData.access_expires_at) {
      const expirationDate = new Date(userData.access_expires_at)
      const now = new Date()

      if (expirationDate < now) {
        return NextResponse.json(
          { error: 'Seu acesso expirou. Entre em contato com o administrador' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        avatar_url: userData.avatar_url,
        role: userData.role,
        status: userData.status,
        total_points: userData.total_points,
        total_reading_minutes: userData.total_reading_minutes,
        courses_enrolled: userData.courses_enrolled,
        courses_completed: userData.courses_completed,
        current_level: userData.current_level,
        access_days: userData.access_days,
        access_expires_at: userData.access_expires_at,
        allowed_courses: userData.allowed_courses,
        blocked_courses: userData.blocked_courses,
        created_at: userData.created_at,
        updated_at: userData.updated_at,
        last_active_at: userData.last_active_at
      }
    })

  } catch (error) {
    console.error('Erro ao obter dados do usuário:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
