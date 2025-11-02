import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { SUPABASE_CONFIG } from '@/lib/supabase-config'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()

    // Tentar obter token do header Authorization
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

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
    }

    if (sessionError || !session) {
      return NextResponse.json({
        error: 'Usuário não autenticado'
      }, { status: 401 })
    }

    // Agora usar SERVICE_ROLE_KEY para buscar dados do usuário (bypassar RLS)
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

    // Buscar dados do usuário usando SERVICE_ROLE_KEY para bypassar RLS
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({
        error: 'Erro ao buscar dados do usuário'
      }, { status: 500 })
    }

    // Verificar se o usuário existe e está ativo
    if (userData.status !== 'active') {
      return NextResponse.json({
        error: 'Usuário inativo'
      }, { status: 403 })
    }

    return NextResponse.json(userData)

  } catch (error) {
    return NextResponse.json({
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}
