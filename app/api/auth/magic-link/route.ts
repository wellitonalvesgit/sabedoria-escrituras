import { NextRequest, NextResponse } from 'next/server'
import { sendMagicLink } from '@/lib/auth'

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

    console.log('🔗 Enviando link mágico para:', email)

    const { error } = await sendMagicLink(email)

    if (error) {
      console.error('❌ Erro ao enviar link mágico:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ Link mágico enviado com sucesso para:', email)

    return NextResponse.json({ 
      success: true,
      message: 'Link mágico enviado! Verifique seu email e clique no link para fazer login.'
    })

  } catch (error) {
    console.error('❌ Erro na API de link mágico:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
