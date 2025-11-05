/**
 * Sistema de envio de email usando Resend como fallback
 * Mais confiável que a função Edge do Supabase
 */

interface EmailData {
  to: string
  subject: string
  html: string
  text?: string
}

/**
 * Envia email usando Resend API
 */
export async function sendEmailResend({ to, subject, html, text }: EmailData): Promise<boolean> {
  try {
    console.log('📧 Enviando email via Resend para:', to)
    console.log('📝 Assunto:', subject)

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'As Cartas de Paulo <noreply@paulocartas.com.br>',
        to: [to],
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, '')
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('❌ Erro ao enviar email via Resend:', errorData)
      return false
    }

    const data = await response.json()
    console.log('✅ Email enviado com sucesso via Resend:', data)
    return true
  } catch (error) {
    console.error('❌ Erro ao enviar email via Resend:', error)
    return false
  }
}

/**
 * Template de email simples para novo usuário
 */
export function generateSimpleEmailTemplate(
  name: string,
  email: string,
  temporaryPassword: string,
  accessDays: number
): { subject: string; html: string; text: string } {
  const subject = `🎓 Bem-vindo à As Cartas de Paulo!`
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #F3C77A;">
        <h1 style="color: #F3C77A; font-size: 28px; margin: 0;">📚 As Cartas de Paulo</h1>
        <h2 style="color: #2c3e50; font-size: 24px; margin: 10px 0;">Bem-vindo, ${name}!</h2>
      </div>

      <p>É com grande alegria que te damos as boas-vindas à nossa plataforma de estudos bíblicos!</p>

      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #F3C77A; margin: 20px 0;">
        <h3 style="color: #2c3e50; margin-top: 0;">🔑 Suas Credenciais de Acesso</h3>
        <p><strong>Email:</strong> <code style="background: #e9ecef; padding: 2px 6px; border-radius: 4px;">${email}</code></p>
        <p><strong>Senha Provisória:</strong></p>
        <div style="font-size: 18px; font-weight: bold; color: #e74c3c; background: #ffe6e6; padding: 10px; border-radius: 6px; text-align: center; margin: 15px 0;">
          ${temporaryPassword}
        </div>
      </div>

      <div style="background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <strong>⚠️ Importante:</strong> Esta é uma senha provisória. Recomendamos que você altere sua senha no primeiro acesso através do seu perfil.
      </div>

      <div style="background: #e8f4fd; padding: 15px; border-radius: 6px; border-left: 4px solid #3498db; margin: 20px 0;">
        <h3 style="color: #2c3e50; margin-top: 0;">📅 Acesso à Plataforma</h3>
        <p>Seu acesso está ativo por <strong>${accessDays} dias</strong> a partir de hoje.</p>
        <p>Durante este período, você terá acesso completo a todos os cursos e materiais disponíveis.</p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login" 
           style="display: inline-block; background: #F3C77A; color: #2c3e50; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
          🚀 Acessar Plataforma
        </a>
      </div>

      <div style="background: #e8f4fd; padding: 15px; border-radius: 6px; border-left: 4px solid #3498db; margin: 20px 0;">
        <h3 style="color: #2c3e50; margin-top: 0;">🎯 O que você encontrará na plataforma:</h3>
        <ul>
          <li>📖 Cursos bíblicos completos e organizados</li>
          <li>📚 Materiais de estudo em PDF</li>
          <li>🏆 Sistema de gamificação com pontos e níveis</li>
          <li>📊 Acompanhamento do seu progresso</li>
          <li>👥 Comunidade de estudantes</li>
        </ul>
      </div>

      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px;">
        <p>Se você tiver alguma dúvida, não hesite em entrar em contato conosco.</p>
        <p><strong>Equipe As Cartas de Paulo</strong></p>
        <p>📧 Email: contato@sabedoriaescrituras.com</p>
      </div>
    </div>
  `

  const text = `
Bem-vindo à As Cartas de Paulo!

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

Equipe As Cartas de Paulo
Email: contato@sabedoriaescrituras.com
  `

  return { subject, html, text }
}
