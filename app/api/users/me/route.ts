import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()

    // Primeiro, usar ANON_KEY para verificar a sessão
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

    // Verificar sessão do usuário
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json({
        error: 'Usuário não autenticado'
      }, { status: 401 })
    }

    // Agora usar SERVICE_ROLE_KEY para buscar dados do usuário (bypassar RLS)
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

    // Verificar se o acesso não expirou
    if (userData.access_expires_at) {
      const expirationDate = new Date(userData.access_expires_at)
      const now = new Date()
      
      if (expirationDate < now) {
        return NextResponse.json({
          error: 'Acesso expirado'
        }, { status: 403 })
      }
    }

    // Retornar dados do usuário
    return NextResponse.json(userData)

  } catch (error) {
    console.error('Erro na API de usuário:', error)
    return NextResponse.json({
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}
