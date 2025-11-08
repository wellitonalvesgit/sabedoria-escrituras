/**
 * Templates de email para diferentes eventos
 */

/**
 * Template de email para novo usuário criado após compra de curso
 * Inclui credenciais de acesso e informações do curso comprado
 */
export function generateNewUserCourseEmailTemplate(
  name: string,
  email: string,
  temporaryPassword: string,
  courseTitle: string,
  price: number,
  purchaseDate: string
): { subject: string; html: string; text: string } {
  const subject = `🎉 Bem-vindo! Acesso ao curso: ${courseTitle}`

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://app.paulocartas.com.br'

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #F3C77A;">
        <h1 style="color: #F3C77A; font-size: 28px; margin: 0;">📚 As Cartas de Paulo</h1>
        <h2 style="color: #2c3e50; font-size: 24px; margin: 10px 0;">Bem-vindo!</h2>
      </div>

      <p>Olá <strong>${name}</strong>,</p>

      <p>É com grande alegria que informamos que sua compra foi confirmada com sucesso! 🎉</p>

      <p>Criamos automaticamente sua conta de acesso à plataforma. Abaixo estão suas credenciais:</p>

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

      <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; border-left: 4px solid #4caf50; margin: 20px 0;">
        <h3 style="color: #2c3e50; margin-top: 0;">📦 Detalhes da Compra</h3>
        <p><strong>Curso:</strong> ${courseTitle}</p>
        <p><strong>Valor:</strong> R$ ${price.toFixed(2).replace('.', ',')}</p>
        <p><strong>Data da Compra:</strong> ${new Date(purchaseDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        <p><strong>Status:</strong> <span style="color: #4caf50; font-weight: bold;">✅ Confirmado</span></p>
      </div>

      <div style="background: #e8f4fd; border: 1px solid #bee5eb; color: #0c5460; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <strong>🎁 Acesso Vitalício!</strong> Você agora tem acesso vitalício a este curso. Pode estudar no seu próprio ritmo, quando e onde quiser.
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${siteUrl}/login"
           style="display: inline-block; background: #F3C77A; color: #2c3e50; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
          🚀 Fazer Login e Acessar Curso
        </a>
      </div>

      <div style="background: #e8f4fd; padding: 15px; border-radius: 6px; border-left: 4px solid #3498db; margin: 20px 0;">
        <h3 style="color: #2c3e50; margin-top: 0;">💡 Primeiros Passos:</h3>
        <ol style="margin: 10px 0; padding-left: 20px;">
          <li>Faça login com seu email e senha provisória</li>
          <li>Altere sua senha no menu Perfil</li>
          <li>Acesse seu curso no Dashboard</li>
          <li>Comece seus estudos no seu próprio ritmo</li>
        </ol>
      </div>

      <div style="background: #e8f4fd; padding: 15px; border-radius: 6px; border-left: 4px solid #3498db; margin: 20px 0;">
        <h3 style="color: #2c3e50; margin-top: 0;">🎯 O que você encontrará na plataforma:</h3>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>📖 Cursos bíblicos completos e organizados</li>
          <li>📚 Materiais de estudo em PDF</li>
          <li>🏆 Sistema de gamificação com pontos e níveis</li>
          <li>📊 Acompanhamento do seu progresso</li>
          <li>✨ Faça anotações e marcações (tipo Kindle)</li>
        </ul>
      </div>

      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px;">
        <p>Se você tiver alguma dúvida sobre o curso ou o acesso, não hesite em entrar em contato conosco.</p>
        <p><strong>Equipe As Cartas de Paulo</strong></p>
        <p>📧 Email: contato@paulocartas.com.br</p>
      </div>
    </div>
  `

  const text = `
Bem-vindo à As Cartas de Paulo!

Olá ${name},

É com grande alegria que informamos que sua compra foi confirmada com sucesso!

Criamos automaticamente sua conta de acesso à plataforma. Abaixo estão suas credenciais:

SUAS CREDENCIAIS DE ACESSO:
- Email: ${email}
- Senha Provisória: ${temporaryPassword}

IMPORTANTE: Esta é uma senha provisória. Recomendamos que você altere sua senha no primeiro acesso através do seu perfil.

DETALHES DA COMPRA:
- Curso: ${courseTitle}
- Valor: R$ ${price.toFixed(2).replace('.', ',')}
- Data da Compra: ${new Date(purchaseDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
- Status: ✅ Confirmado

ACESSO VITALÍCIO!
Você agora tem acesso vitalício a este curso. Pode estudar no seu próprio ritmo, quando e onde quiser.

FAZER LOGIN:
${siteUrl}/login

PRIMEIROS PASSOS:
1. Faça login com seu email e senha provisória
2. Altere sua senha no menu Perfil
3. Acesse seu curso no Dashboard
4. Comece seus estudos no seu próprio ritmo

O QUE VOCÊ ENCONTRARÁ:
- Cursos bíblicos completos e organizados
- Materiais de estudo em PDF
- Sistema de gamificação com pontos e níveis
- Acompanhamento do seu progresso
- Faça anotações e marcações

Se você tiver alguma dúvida sobre o curso ou o acesso, não hesite em entrar em contato conosco.

Equipe As Cartas de Paulo
Email: contato@paulocartas.com.br
  `

  return { subject, html, text }
}

/**
 * Template de email para compra de curso confirmada
 */
export function generateCoursePurchaseEmailTemplate(
  name: string,
  courseTitle: string,
  price: number,
  purchaseDate: string
): { subject: string; html: string; text: string } {
  const subject = `🎉 Compra confirmada: ${courseTitle}`
  
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://app.paulocartas.com.br'
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #F3C77A;">
        <h1 style="color: #F3C77A; font-size: 28px; margin: 0;">📚 As Cartas de Paulo</h1>
        <h2 style="color: #2c3e50; font-size: 24px; margin: 10px 0;">Compra Confirmada!</h2>
      </div>

      <p>Olá <strong>${name}</strong>,</p>

      <p>É com grande alegria que informamos que sua compra foi confirmada com sucesso! 🎉</p>

      <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; border-left: 4px solid #4caf50; margin: 20px 0;">
        <h3 style="color: #2c3e50; margin-top: 0;">📦 Detalhes da Compra</h3>
        <p><strong>Curso:</strong> ${courseTitle}</p>
        <p><strong>Valor:</strong> R$ ${price.toFixed(2).replace('.', ',')}</p>
        <p><strong>Data da Compra:</strong> ${new Date(purchaseDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        <p><strong>Status:</strong> <span style="color: #4caf50; font-weight: bold;">✅ Confirmado</span></p>
      </div>

      <div style="background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <strong>🎁 Acesso Vitalício!</strong> Você agora tem acesso vitalício a este curso. Pode estudar no seu próprio ritmo, quando e onde quiser.
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${siteUrl}/course/${courseTitle.toLowerCase().replace(/\s+/g, '-')}" 
           style="display: inline-block; background: #F3C77A; color: #2c3e50; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
          📖 Acessar Curso Agora
        </a>
      </div>

      <div style="background: #e8f4fd; padding: 15px; border-radius: 6px; border-left: 4px solid #3498db; margin: 20px 0;">
        <h3 style="color: #2c3e50; margin-top: 0;">💡 Dicas para aproveitar ao máximo:</h3>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Estude no seu próprio ritmo</li>
          <li>Faça anotações e marcações (tipo Kindle)</li>
          <li>Complete o curso para ganhar pontos e subir de nível</li>
          <li>Compartilhe seu progresso com a comunidade</li>
        </ul>
      </div>

      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px;">
        <p>Se você tiver alguma dúvida sobre o curso ou o acesso, não hesite em entrar em contato conosco.</p>
        <p><strong>Equipe As Cartas de Paulo</strong></p>
        <p>📧 Email: contato@paulocartas.com.br</p>
      </div>
    </div>
  `

  const text = `
Compra Confirmada - As Cartas de Paulo

Olá ${name},

É com grande alegria que informamos que sua compra foi confirmada com sucesso!

DETALHES DA COMPRA:
- Curso: ${courseTitle}
- Valor: R$ ${price.toFixed(2).replace('.', ',')}
- Data da Compra: ${new Date(purchaseDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
- Status: ✅ Confirmado

ACESSO VITALÍCIO!
Você agora tem acesso vitalício a este curso. Pode estudar no seu próprio ritmo, quando e onde quiser.

ACESSAR CURSO:
${siteUrl}/course/${courseTitle.toLowerCase().replace(/\s+/g, '-')}

DICAS PARA APROVEITAR AO MÁXIMO:
- Estude no seu próprio ritmo
- Faça anotações e marcações
- Complete o curso para ganhar pontos
- Compartilhe seu progresso

Se você tiver alguma dúvida sobre o curso ou o acesso, não hesite em entrar em contato conosco.

Equipe As Cartas de Paulo
Email: contato@paulocartas.com.br
  `

  return { subject, html, text }
}

