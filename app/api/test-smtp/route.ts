import { NextRequest, NextResponse } from 'next/server'
import { sendEmailSMTP, testSMTPConnection, generateEmailTemplate } from '@/lib/email-smtp'
import { sendEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { email, testType = 'smtp' } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 })
    }

    console.log('🧪 Testando sistema de email...')
    console.log('📧 Email de destino:', email)
    console.log('🔧 Tipo de teste:', testType)

    let emailSent = false
    let method = 'Nenhum método configurado'
    let details = {}

    if (testType === 'smtp') {
      // Testar apenas SMTP
      console.log('📧 Testando conexão SMTP...')
      const connectionTest = await testSMTPConnection()
      
      if (!connectionTest.success) {
        return NextResponse.json({
          success: false,
          method: 'SMTP',
          message: connectionTest.message,
          details: {
            smtpConfigured: false,
            error: connectionTest.message
          }
        })
      }

      console.log('✅ Conexão SMTP OK, enviando email de teste...')
      
      const template = generateEmailTemplate(
        'Usuário Teste',
        email,
        '123456',
        30
      )

      emailSent = await sendEmailSMTP({
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text
      })

      if (emailSent) {
        method = 'SMTP'
        console.log('✅ Email enviado com sucesso via SMTP')
      }

      details = {
        smtpConfigured: true,
        connectionTest: connectionTest.message
      }

    } else if (testType === 'all') {
      // Testar sistema completo com fallback
      console.log('📧 Testando sistema completo de email...')
      
      const template = generateEmailTemplate(
        'Usuário Teste',
        email,
        '123456',
        30
      )

      emailSent = await sendEmail({
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text
      })

      if (emailSent) {
        method = 'Sistema Completo (SMTP/Resend/Supabase)'
        console.log('✅ Email enviado com sucesso via sistema completo')
      }

      details = {
        smtpConfigured: !!process.env.SMTP_HOST,
        resendConfigured: !!process.env.RESEND_API_KEY,
        supabaseConfigured: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      }
    }

    return NextResponse.json({
      success: emailSent,
      method: method,
      message: emailSent 
        ? `Email de teste enviado com sucesso via ${method}` 
        : 'Falha ao enviar email de teste. Verifique as configurações.',
      details: {
        ...details,
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        testEmail: email,
        testType
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const testConnection = searchParams.get('test-connection') === 'true'

    if (testConnection) {
      // Apenas testar conexão SMTP
      const connectionTest = await testSMTPConnection()
      
      return NextResponse.json({
        success: connectionTest.success,
        message: connectionTest.message,
        smtpConfigured: !!(
          process.env.SMTP_HOST &&
          process.env.SMTP_USER &&
          process.env.SMTP_PASS
        ),
        details: {
          host: process.env.SMTP_HOST || 'Não configurado',
          port: process.env.SMTP_PORT || 'Não configurado',
          user: process.env.SMTP_USER ? 
            process.env.SMTP_USER.substring(0, 3) + '***' : 'Não configurado',
          secure: process.env.SMTP_SECURE || 'false'
        }
      })
    }

    // Retornar status das configurações
    return NextResponse.json({
      smtp: {
        configured: !!(
          process.env.SMTP_HOST &&
          process.env.SMTP_USER &&
          process.env.SMTP_PASS
        ),
        host: process.env.SMTP_HOST || 'Não configurado',
        port: process.env.SMTP_PORT || '587',
        user: process.env.SMTP_USER ? 
          process.env.SMTP_USER.substring(0, 3) + '***' : 'Não configurado'
      },
      resend: {
        configured: !!process.env.RESEND_API_KEY,
        apiKey: process.env.RESEND_API_KEY ? 'Configurado' : 'Não configurado'
      },
      supabase: {
        configured: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        serviceRole: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Configurado' : 'Não configurado'
      }
    })

  } catch (error) {
    console.error('❌ Erro ao verificar configurações:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
