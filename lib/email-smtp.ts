import nodemailer from 'nodemailer'

interface SMTPConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
  tls?: {
    rejectUnauthorized: boolean
  }
}

interface EmailData {
  to: string
  subject: string
  html: string
  text?: string
  from?: string
}

/**
 * Configura o transporter SMTP baseado nas variáveis de ambiente
 */
function createSMTPTransporter(): nodemailer.Transporter | null {
  try {
    const host = process.env.SMTP_HOST
    const port = parseInt(process.env.SMTP_PORT || '587')
    const user = process.env.SMTP_USER
    const pass = process.env.SMTP_PASS
    const secure = process.env.SMTP_SECURE === 'true'
    const from = process.env.SMTP_FROM || 'noreply@sabedoriaescrituras.com'

    if (!host || !user || !pass) {
      console.log('⚠️  Configurações SMTP incompletas')
      return null
    }

    const config: SMTPConfig = {
      host,
      port,
      secure,
      auth: {
        user,
        pass
      }
    }

    // Configurações adicionais para Gmail
    if (host.includes('gmail.com')) {
      config.tls = {
        rejectUnauthorized: false
      }
    }

    const transporter = nodemailer.createTransporter(config)
    
    console.log('✅ Transporter SMTP configurado:', {
      host,
      port,
      secure,
      user: user.substring(0, 3) + '***' // Ocultar senha nos logs
    })

    return transporter
  } catch (error) {
    console.error('❌ Erro ao configurar SMTP:', error)
    return null
  }
}

/**
 * Envia email usando SMTP tradicional
 */
export async function sendEmailSMTP({ to, subject, html, text, from }: EmailData): Promise<boolean> {
  try {
    console.log('📧 Enviando email via SMTP para:', to)
    console.log('📝 Assunto:', subject)

    const transporter = createSMTPTransporter()
    if (!transporter) {
      console.error('❌ Transporter SMTP não configurado')
      return false
    }

    // Verificar conexão SMTP
    await transporter.verify()
    console.log('✅ Conexão SMTP verificada')

    const mailOptions = {
      from: from || process.env.SMTP_FROM || 'noreply@sabedoriaescrituras.com',
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '')
    }

    const result = await transporter.sendMail(mailOptions)
    console.log('✅ Email enviado com sucesso via SMTP:', result.messageId)
    return true

  } catch (error) {
    console.error('❌ Erro ao enviar email via SMTP:', error)
    return false
  }
}

/**
 * Template de email profissional para novo usuário
 */
export function generateEmailTemplate(
  name: string,
  email: string,
  temporaryPassword: string,
  accessDays: number
): { subject: string; html: string; text: string } {
  
  const subject = `🎉 Bem-vindo à As Cartas de Paulo!`
  
  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bem-vindo à As Cartas de Paulo</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background-color: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #F3C77A;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #F3C77A;
            margin-bottom: 10px;
        }
        .credentials {
            background-color: #f8f9fa;
            border: 2px solid #F3C77A;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
        }
        .credential-item {
            margin: 10px 0;
            font-size: 16px;
        }
        .credential-label {
            font-weight: bold;
            color: #666;
        }
        .credential-value {
            color: #F3C77A;
            font-weight: bold;
            font-size: 18px;
        }
        .warning {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
            color: #856404;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #F3C77A, #FFD88A);
            color: #333;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 25px;
            font-weight: bold;
            margin: 20px 0;
            transition: transform 0.2s;
        }
        .cta-button:hover {
            transform: translateY(-2px);
        }
        .features {
            margin: 30px 0;
        }
        .feature-item {
            margin: 10px 0;
            padding: 10px;
            background-color: #f8f9fa;
            border-radius: 5px;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">📚 As Cartas de Paulo</div>
            <p>Plataforma de Estudos Bíblicos</p>
        </div>

        <h2>🎉 Olá, ${name}!</h2>
        
        <p>É com grande alegria que damos as boas-vindas à <strong>As Cartas de Paulo</strong>! Sua conta foi criada com sucesso e você já pode começar sua jornada de estudos bíblicos.</p>

        <div class="credentials">
            <h3>🔑 Suas Credenciais de Acesso</h3>
            <div class="credential-item">
                <div class="credential-label">Email:</div>
                <div class="credential-value">${email}</div>
            </div>
            <div class="credential-item">
                <div class="credential-label">Senha Temporária:</div>
                <div class="credential-value">${temporaryPassword}</div>
            </div>
        </div>

        <div class="warning">
            <strong>⚠️ Importante:</strong> Esta é uma senha temporária. Por motivos de segurança, recomendamos que você altere sua senha no primeiro acesso através do seu perfil.
        </div>

        <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login" class="cta-button">
                🚀 Acessar a Plataforma
            </a>
        </div>

        <div class="features">
            <h3>🌟 O que você encontrará na plataforma:</h3>
            <div class="feature-item">📖 <strong>Cursos Bíblicos Completos:</strong> Estudos profundos e organizados</div>
            <div class="feature-item">🎯 <strong>Sistema de Gamificação:</strong> Pontos e conquistas para motivar seus estudos</div>
            <div class="feature-item">📝 <strong>Marcação e Resumos:</strong> Sistema similar ao Kindle para suas anotações</div>
            <div class="feature-item">🏆 <strong>Ranking e Certificados:</strong> Acompanhe seu progresso e conquiste certificados</div>
            <div class="feature-item">📱 <strong>Interface Responsiva:</strong> Estude em qualquer dispositivo</div>
        </div>

        <div class="warning">
            <strong>📅 Período de Acesso:</strong> Sua conta está ativa por <strong>${accessDays} dias</strong>. Após esse período, você pode renovar sua assinatura para continuar tendo acesso a todos os conteúdos.
        </div>

        <p>Se você tiver alguma dúvida ou precisar de ajuda, não hesite em entrar em contato conosco. Estamos aqui para apoiar sua jornada de estudos!</p>

        <div class="footer">
            <p><strong>As Cartas de Paulo</strong></p>
            <p>📧 Suporte: ascartasdepailoo@gmail.com</p>
            <p>🌐 <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}">sabedoriaescrituras.com</a></p>
        </div>
    </div>
</body>
</html>`

  const text = `
Bem-vindo à As Cartas de Paulo!

Olá, ${name}!

É com grande alegria que damos as boas-vindas à As Cartas de Paulo! Sua conta foi criada com sucesso.

SUAS CREDENCIAIS DE ACESSO:
Email: ${email}
Senha Temporária: ${temporaryPassword}

IMPORTANTE: Esta é uma senha temporária. Por motivos de segurança, recomendamos que você altere sua senha no primeiro acesso.

ACESSE A PLATAFORMA:
${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login

O QUE VOCÊ ENCONTRARÁ:
- Cursos Bíblicos Completos
- Sistema de Gamificação
- Marcação e Resumos
- Ranking e Certificados
- Interface Responsiva

PERÍODO DE ACESSO: ${accessDays} dias

Suporte: ascartasdepailoo@gmail.com
`

  return { subject, html, text }
}

/**
 * Verifica se o SMTP está configurado
 */
export function isSMTPConfigured(): boolean {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  )
}

/**
 * Testa a conexão SMTP
 */
export async function testSMTPConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const transporter = createSMTPTransporter()
    if (!transporter) {
      return {
        success: false,
        message: 'Configurações SMTP não encontradas'
      }
    }

    await transporter.verify()
    return {
      success: true,
      message: 'Conexão SMTP verificada com sucesso'
    }
  } catch (error) {
    return {
      success: false,
      message: `Erro na conexão SMTP: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    }
  }
}
