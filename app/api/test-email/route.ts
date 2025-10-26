import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, generateNewUserEmailTemplate } from '@/lib/email'
import { sendEmailResend, generateSimpleEmailTemplate } from '@/lib/email-resend'

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 })
    }

    console.log('🧪 Testando envio de email para:', email)

    const testName = name || 'Usuário Teste'
    const testPassword = 'Teste123!'
    const testAccessDays = 30

    let emailSent = false
    let method = ''

    try {
      // Tentar primeiro com Supabase Edge Function
      console.log('📧 Tentando envio via Supabase Edge Function...')
      
      const emailTemplate = generateNewUserEmailTemplate(
        testName,
        email,
        testPassword,
        testAccessDays
      )

      emailSent = await sendEmail({
        to: email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text
      })

      if (emailSent) {
        method = 'Supabase Edge Function'
        console.log('✅ Email enviado via Supabase Edge Function')
      }
    } catch (supabaseError) {
      console.log('❌ Erro no Supabase Edge Function:', supabaseError)
    }

    // Se falhou, tentar com Resend como fallback
    if (!emailSent && process.env.RESEND_API_KEY) {
      try {
        console.log('📧 Tentando envio via Resend...')
        
        const simpleTemplate = generateSimpleEmailTemplate(
          testName,
          email,
          testPassword,
          testAccessDays
        )

        emailSent = await sendEmailResend({
          to: email,
          subject: simpleTemplate.subject,
          html: simpleTemplate.html,
          text: simpleTemplate.text
        })

        if (emailSent) {
          method = 'Resend API'
          console.log('✅ Email enviado via Resend API')
        }
      } catch (resendError) {
        console.log('❌ Erro no Resend API:', resendError)
      }
    }

    return NextResponse.json({
      success: emailSent,
      method: method,
      message: emailSent 
        ? `Email de teste enviado com sucesso via ${method}` 
        : 'Falha ao enviar email de teste. Verifique as configurações.',
      details: {
        supabaseConfigured: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        resendConfigured: !!process.env.RESEND_API_KEY,
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      }
    })

  } catch (error) {
    console.error('❌ Erro no teste de email:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
