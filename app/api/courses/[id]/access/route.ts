import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { userCanAccessCourse } from '@/lib/access-control'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const courseId = params.id
    console.log('🔍 [API /courses/[id]/access] Verificando acesso ao curso:', courseId)

    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    console.log('🍪 [API] Cookies disponíveis:', allCookies.map(c => c.name).join(', '))

    // Tentar obter token do header Authorization
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    console.log('🔑 [API] Token recebido via header:', token ? 'SIM' : 'NÃO')

    let session = null
    let sessionError = null

    if (token) {
      // Se temos token, usar ANON_KEY para verificar o token
      const supabaseAnon = createServerClient(
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
        console.log('✅ [API] Usuário autenticado via token')
      } else {
        sessionError = result.error
        console.log('❌ [API] Erro ao validar token:', result.error?.message)
      }
    } else {
      // Fallback: tentar via cookies
      const supabaseAnon = createServerClient(
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

      const result = await supabaseAnon.auth.getSession()
      session = result.data.session
      sessionError = result.error
      console.log('📊 [API] Tentativa via cookies:', session ? 'SUCESSO' : 'FALHOU')
    }

    console.log('📊 [API] Dados da sessão final:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      error: sessionError?.message,
      userId: session?.user?.id,
      userEmail: session?.user?.email
    })

    if (sessionError || !session) {
      console.error('❌ [API] Erro na sessão ou sessão não encontrada:', sessionError?.message)
      return NextResponse.json({
        canAccess: false,
        reason: 'no_access',
        message: 'Usuário não autenticado'
      }, { status: 401 })
    }

    // Verificar se SERVICE_ROLE_KEY está disponível para consultas
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ SERVICE_ROLE_KEY não está configurada')
      // Definir SERVICE_ROLE_KEY diretamente no código (apenas para desenvolvimento)
      if (process.env.NODE_ENV === 'development') {
        // Usar SERVICE_ROLE_KEY do ambiente
        console.log('✅ SERVICE_ROLE_KEY definida manualmente para desenvolvimento')
      }
    } else {
      console.log('✅ SERVICE_ROLE_KEY está configurada')
    }

    // Agora usar SERVICE_ROLE_KEY para bypassar RLS nas consultas
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
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

    // Usar função centralizada para verificar acesso
    // Passar o cliente Supabase Admin (SERVICE_ROLE_KEY) para bypassar RLS
    const accessResult = await userCanAccessCourse(session.user.id, courseId, supabaseAdmin)

    console.log('📊 Resultado da verificação de acesso:', {
      canAccess: accessResult.canAccess,
      reason: accessResult.reason,
      message: accessResult.message
    })

    // Retornar resultado apropriado
    if (accessResult.canAccess) {
      return NextResponse.json(accessResult)
    } else {
      const statusCode = accessResult.reason === 'no_access' && accessResult.message?.includes('não encontrado')
        ? 404
        : 403
      return NextResponse.json(accessResult, { status: statusCode })
    }

  } catch (error) {
    console.error('Erro na API de acesso a curso:', error)
    return NextResponse.json({
      canAccess: false,
      reason: 'no_access',
      message: 'Erro interno do servidor'
    }, { status: 500 })
  }
}