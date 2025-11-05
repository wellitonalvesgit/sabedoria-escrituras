import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { SUPABASE_CONFIG } from '@/lib/supabase-config'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()

    console.log('🔍 Testando sessão...')
    console.log('📝 Cookies disponíveis:', cookieStore.getAll().map(c => c.name))

    // Tentar obter token do header Authorization
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    console.log('🔑 Token do header:', token ? 'Presente' : 'Ausente')

    let session = null
    let sessionError = null

    if (token) {
      // Se temos token, usar ANON_KEY para verificar o token
      const supabaseAnon = createServerClient(
        SUPABASE_CONFIG.url,
        SUPABASE_CONFIG.anonKey,
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
          global: {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        }
      )

      const result = await supabaseAnon.auth.getUser(token)
      console.log('👤 Resultado getUser (com token):', result.data.user ? 'Usuário encontrado' : 'Sem usuário')
      if (result.data.user) {
        session = { user: result.data.user }
      } else {
        sessionError = result.error
      }
    } else {
      // Fallback: tentar via cookies
      const supabase = createServerClient(
        SUPABASE_CONFIG.url,
        SUPABASE_CONFIG.anonKey,
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

      const result = await supabase.auth.getSession()
      session = result.data.session
      sessionError = result.error
      console.log('👤 Resultado getSession (via cookies):', session ? 'Sessão encontrada' : 'Sem sessão')
    }

    if (sessionError) {
      console.error('❌ Erro de sessão:', sessionError)
      return NextResponse.json({
        authenticated: false,
        error: 'Erro ao verificar sessão',
        details: sessionError
      })
    }

    if (!session) {
      console.log('⚠️  Sem sessão ativa')
      return NextResponse.json({
        authenticated: false,
        error: 'Usuário não autenticado',
        cookies: cookieStore.getAll().map(c => c.name)
      })
    }

    console.log('✅ Sessão válida, buscando dados do usuário...')

    // Buscar dados do usuário
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

    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (userError || !userData) {
      console.error('❌ Erro ao buscar dados do usuário:', userError)
      return NextResponse.json({
        authenticated: true,
        userDataError: true,
        error: 'Erro ao buscar dados do usuário',
        details: userError
      })
    }

    console.log('✅ Dados do usuário encontrados:', userData.email)

    return NextResponse.json({
      authenticated: true,
      session: {
        userId: session.user.id,
        email: session.user.email
      },
      userData: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        status: userData.status,
        allowed_courses: userData.allowed_courses,
        allowed_courses_count: userData.allowed_courses?.length || 0,
        blocked_courses: userData.blocked_courses,
        blocked_courses_count: userData.blocked_courses?.length || 0,
        access_expires_at: userData.access_expires_at
      }
    })

  } catch (error) {
    console.error('❌ Erro geral:', error)
    return NextResponse.json({
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
