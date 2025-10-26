import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 })
    }

    // Usar o cliente configurado

    // Buscar o usuário pelo email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Atualizar a senha no Supabase Auth
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userData.id,
      { password: password }
    )

    if (updateError) {
      console.error('Erro ao atualizar senha:', updateError)
      return NextResponse.json({ error: 'Erro ao atualizar senha' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Senha atualizada com sucesso' 
    })

  } catch (error) {
    console.error('Erro na API de atualização de senha:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
