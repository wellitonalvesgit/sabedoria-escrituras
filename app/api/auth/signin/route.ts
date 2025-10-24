import { NextRequest, NextResponse } from 'next/server'
import { signIn, getCurrentUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 })
    }

    const { user, error } = await signIn(email, password)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 401 })
    }

    // Buscar dados completos do usuário da tabela users
    const fullUser = await getCurrentUser()

    if (!fullUser) {
      return NextResponse.json({ error: 'Erro ao buscar dados do usuário' }, { status: 500 })
    }

    return NextResponse.json({ 
      user: fullUser,
      message: 'Login realizado com sucesso'
    })

  } catch (error) {
    console.error('Erro na API de login:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

