import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Atualiza dados do perfil do usuário
 *
 * PUT /api/profile/update
 * Body: { name: string, email: string }
 */
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies()

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

    // Verificar autenticação
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const { name, email } = await request.json()

    console.log('🔄 Atualizando perfil do usuário:', authUser.id)
    console.log('📝 Novos dados:', { name, email })

    // Atualizar nome na tabela users
    const { error: updateError } = await supabase
      .from('users')
      .update({
        name,
        updated_at: new Date().toISOString()
      })
      .eq('id', authUser.id)

    if (updateError) {
      console.error('❌ Erro ao atualizar usuário:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar perfil', details: updateError },
        { status: 500 }
      )
    }

    // Se o email mudou, atualizar no Supabase Auth
    if (email !== authUser.email) {
      const { error: emailError } = await supabase.auth.updateUser({
        email
      })

      if (emailError) {
        console.error('❌ Erro ao atualizar email:', emailError)
        return NextResponse.json(
          { error: 'Erro ao atualizar email. Verifique se o email já não está em uso.' },
          { status: 400 }
        )
      }

      console.log('✅ Email atualizado (verificação enviada)')
    }

    console.log('✅ Perfil atualizado com sucesso')

    return NextResponse.json({
      success: true,
      message: 'Perfil atualizado com sucesso'
    })
  } catch (error) {
    console.error('❌ Erro ao atualizar perfil:', error)
    return NextResponse.json(
      { error: 'Erro interno ao atualizar perfil' },
      { status: 500 }
    )
  }
}
