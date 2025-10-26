import { NextRequest, NextResponse } from 'next/server'
import { resetPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 })
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }

    console.log('🔑 Enviando email de recuperação para:', email)

    const { error } = await resetPassword(email)

    if (error) {
      console.error('❌ Erro ao enviar email de recuperação:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ Email de recuperação enviado com sucesso para:', email)

    return NextResponse.json({ 
      success: true,
      message: 'Email de recuperação enviado! Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.'
    })

  } catch (error) {
    console.error('❌ Erro na API de esqueci senha:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
