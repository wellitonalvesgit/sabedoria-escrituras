import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

interface EmailData {
  to: string
  subject: string
  html: string
  text?: string
}

/**
 * Envia email usando a função Edge do Supabase
 */
export async function sendEmail({ to, subject, html, text }: EmailData): Promise<boolean> {
  try {
    console.log('📧 Enviando email para:', to)
    console.log('📝 Assunto:', subject)

    // Usar a função Edge do Supabase para envio de email
    const { data, error } = await adminClient.functions.invoke('send-email', {
      body: {
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, '') // Converter HTML para texto simples
      }
    })

    if (error) {
      console.error('❌ Erro ao enviar email:', error)
      return false
    }

    console.log('✅ Email enviado com sucesso:', data)
    return true
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error)
    return false
  }
}

/**
 * Template de email para novo usuário
 */
export function generateNewUserEmailTemplate(
  name: string,
  email: string,
  temporaryPassword: string,
  accessDays: number
): { subject: string; html: string; text: string } {
  const subject = `🎓 Bem-vindo à Sabedoria das Escrituras!`
  
  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bem-vindo à Sabedoria das Escrituras</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container {
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 3px solid #F3C77A;
            }
            .logo {
                font-size: 28px;
                font-weight: bold;
                color: #F3C77A;
                margin-bottom: 10px;
            }
            .welcome {
                font-size: 24px;
                color: #2c3e50;
                margin-bottom: 20px;
            }
            .credentials {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                border-left: 4px solid #F3C77A;
                margin: 20px 0;
            }
            .credential-item {
                margin: 10px 0;
                font-size: 16px;
            }
            .credential-label {
                font-weight: bold;
                color: #2c3e50;
            }
            .credential-value {
                font-family: 'Courier New', monospace;
                background: #e9ecef;
                padding: 5px 10px;
                border-radius: 4px;
                margin-left: 10px;
            }
            .password {
                font-size: 18px;
                font-weight: bold;
                color: #e74c3c;
                background: #ffe6e6;
                padding: 10px;
                border-radius: 6px;
                text-align: center;
                margin: 15px 0;
            }
            .info-box {
                background: #e8f4fd;
                padding: 15px;
                border-radius: 6px;
                border-left: 4px solid #3498db;
                margin: 20px 0;
            }
            .cta-button {
                display: inline-block;
                background: #F3C77A;
                color: #2c3e50;
                padding: 15px 30px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: bold;
                font-size: 16px;
                margin: 20px 0;
                text-align: center;
            }
            .cta-button:hover {
                background: #FFD88A;
            }
            .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                text-align: center;
                color: #666;
                font-size: 14px;
            }
            .warning {
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                color: #856404;
                padding: 15px;
                border-radius: 6px;
                margin: 20px 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">📚 Sabedoria das Escrituras</div>
                <h1 class="welcome">Bem-vindo, ${name}!</h1>
            </div>

            <p>É com grande alegria que te damos as boas-vindas à nossa plataforma de estudos bíblicos!</p>

            <div class="credentials">
                <h3>🔑 Suas Credenciais de Acesso</h3>
                <div class="credential-item">
                    <span class="credential-label">Email:</span>
                    <span class="credential-value">${email}</span>
                </div>
                <div class="credential-item">
                    <span class="credential-label">Senha Provisória:</span>
                </div>
                <div class="password">${temporaryPassword}</div>
            </div>

            <div class="warning">
                <strong>⚠️ Importante:</strong> Esta é uma senha provisória. Recomendamos que você altere sua senha no primeiro acesso através do seu perfil.
            </div>

            <div class="info-box">
                <h3>📅 Acesso à Plataforma</h3>
                <p>Seu acesso está ativo por <strong>${accessDays} dias</strong> a partir de hoje.</p>
                <p>Durante este período, você terá acesso completo a todos os cursos e materiais disponíveis.</p>
            </div>

            <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login" class="cta-button" style="margin-right: 10px;">
                    🚀 Acessar Plataforma
                </a>
                <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login?tab=magic" 
                   style="display: inline-block; background: #3498db; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                    ✨ Link Mágico
                </a>
            </div>

            <div class="info-box">
                <h3>🎯 O que você encontrará na plataforma:</h3>
                <ul>
                    <li>📖 Cursos bíblicos completos e organizados</li>
                    <li>📚 Materiais de estudo em PDF</li>
                    <li>🏆 Sistema de gamificação com pontos e níveis</li>
                    <li>📊 Acompanhamento do seu progresso</li>
                    <li>👥 Comunidade de estudantes</li>
                </ul>
            </div>

            <div class="footer">
                <p>Se você tiver alguma dúvida, não hesite em entrar em contato conosco.</p>
                <p><strong>Equipe Sabedoria das Escrituras</strong></p>
                <p>📧 Email: contato@sabedoriaescrituras.com</p>
            </div>
        </div>
    </body>
    </html>
  `

  const text = `
Bem-vindo à Sabedoria das Escrituras!

Olá ${name},

É com grande alegria que te damos as boas-vindas à nossa plataforma de estudos bíblicos!

SUAS CREDENCIAIS DE ACESSO:
- Email: ${email}
- Senha Provisória: ${temporaryPassword}

IMPORTANTE: Esta é uma senha provisória. Recomendamos que você altere sua senha no primeiro acesso através do seu perfil.

ACESSO À PLATAFORMA:
Seu acesso está ativo por ${accessDays} dias a partir de hoje.
Durante este período, você terá acesso completo a todos os cursos e materiais disponíveis.

ACESSAR PLATAFORMA:
${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login

O QUE VOCÊ ENCONTRARÁ:
- Cursos bíblicos completos e organizados
- Materiais de estudo em PDF
- Sistema de gamificação com pontos e níveis
- Acompanhamento do seu progresso
- Comunidade de estudantes

Se você tiver alguma dúvida, não hesite em entrar em contato conosco.

Equipe Sabedoria das Escrituras
Email: contato@sabedoriaescrituras.com
  `

  return { subject, html, text }
}
