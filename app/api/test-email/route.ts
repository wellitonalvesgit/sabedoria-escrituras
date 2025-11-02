import { NextRequest, NextResponse } from 'next/server'
import { sendEmailResend } from '@/lib/email-resend'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const to = searchParams.get('to')

    if (!to) {
      return NextResponse.json({
        error: 'Parâmetro "to" é obrigatório',
        example: '/api/test-email?to=seu-email@example.com'
      }, { status: 400 })
    }

    console.log('📧 Testando envio de email para:', to)

    const success = await sendEmailResend({
      to,
      subject: '🧪 Teste de Email - Sabedoria das Escrituras',
      html: '<h1>Teste de Email</h1><p>Email funcionando via Resend!</p>',
      text: 'Teste de Email - Email funcionando via Resend!'
    })

    if (success) {
      return NextResponse.json({
        success: true,
        message: '✅ Email enviado com sucesso!',
        to
      })
    } else {
      return NextResponse.json({
        success: false,
        message: '❌ Falha ao enviar email'
      }, { status: 500 })
    }
  } catch (error) {
    console.error('❌ Erro:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
