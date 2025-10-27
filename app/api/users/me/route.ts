import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { SUPABASE_CONFIG } from '@/lib/supabase-config'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [API /users/me] Iniciando verificação de usuário')
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    console.log('🍪 [API /users/me] Cookies disponíveis:', allCookies.map(c => c.name).join(', '))

    // Tentar obter token do header Authorization
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    console.log('🔑 [API /users/me] Token recebido via header:', token ? 'SIM' : 'NÃO')

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
        console.log('✅ [API /users/me] Usuário autenticado via token')
      } else {
        sessionError = result.error
        console.log('❌ [API /users/me] Erro ao validar token:', result.error?.message)
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
      console.log('📊 [API /users/me] Tentativa via cookies:', session ? 'SUCESSO' : 'FALHOU')
    }

    console.log('📊 [API /users/me] Dados da sessão final:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      error: sessionError?.message,
      userId: session?.user?.id,
      userEmail: session?.user?.email
    })

    if (sessionError || !session) {
      console.error('❌ [API /users/me] Sessão não encontrada')
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
      console.error('Erro ao buscar dados do usuário:', userError)
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

    // NOTA: Não bloquear o usuário se access_expires_at expirou
    // Isso apenas indica que o período de teste gratuito acabou
    // O usuário ainda pode ter acesso através de:
    // - Cursos gratuitos
    // - Cursos específicos em allowed_courses
    // - Assinatura ativa
    // A verificação de acesso real é feita em cada curso individualmente

    // Retornar dados do usuário (incluindo info de expiração)
    return NextResponse.json(userData)

  } catch (error) {
    console.error('Erro na API de usuário:', error)
    return NextResponse.json({
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}
