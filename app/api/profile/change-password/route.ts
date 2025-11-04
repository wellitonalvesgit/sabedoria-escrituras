import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { SUPABASE_CONFIG } from '@/lib/supabase-config'

/**
 * Troca a senha do usuário
 *
 * POST /api/profile/change-password
 * Body: { currentPassword: string, newPassword: string }
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()

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

    // Verificar autenticação
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const { currentPassword, newPassword } = await request.json()

    console.log('🔄 Alterando senha do usuário:', user.id)

    // Validar senha atual fazendo login
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword
    })

    if (signInError) {
      console.error('❌ Senha atual incorreta')
      return NextResponse.json(
        { error: 'Senha atual incorreta' },
        { status: 400 }
      )
    }

    // Atualizar para nova senha
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (updateError) {
      console.error('❌ Erro ao atualizar senha:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar senha', details: updateError },
        { status: 500 }
      )
    }

    console.log('✅ Senha alterada com sucesso')

    return NextResponse.json({
      success: true,
      message: 'Senha alterada com sucesso'
    })
  } catch (error) {
    console.error('❌ Erro ao trocar senha:', error)
    return NextResponse.json(
      { error: 'Erro interno ao trocar senha' },
      { status: 500 }
    )
  }
}
