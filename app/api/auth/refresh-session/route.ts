import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { SUPABASE_CONFIG } from '@/lib/supabase-config'

/**
 * API para forçar refresh da sessão
 * Útil quando dados do usuário mudam no banco mas cache está desatualizado
 */
export async function POST(request: NextRequest) {
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
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Buscar dados ATUALIZADOS do usuário direto do banco
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    console.log('🔄 Sessão atualizada para:', {
      email: userData.email,
      role: userData.role,
      status: userData.status
    })

    return NextResponse.json({
      success: true,
      message: 'Sessão atualizada com sucesso',
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        status: userData.status
      }
    })

  } catch (error) {
    console.error('Erro ao atualizar sessão:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
