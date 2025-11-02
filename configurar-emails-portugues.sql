-- Script para configurar templates de email em português no Supabase
-- Este script deve ser executado no Supabase Dashboard > Authentication > Email Templates

-- 1. CONFIRMAÇÃO DE CADASTRO (Signup Confirmation)
-- Assunto: "Confirme seu cadastro - Sabedoria das Escrituras"
-- Conteúdo HTML:
/*
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #F3C77A;">
    <h1 style="color: #F3C77A; font-size: 28px; margin: 0;">📚 Sabedoria das Escrituras</h1>
    <h2 style="color: #2c3e50; font-size: 24px; margin: 10px 0;">Confirme seu cadastro</h2>
  </div>

  <p>Olá!</p>
  <p>Obrigado por se cadastrar na nossa plataforma de estudos bíblicos!</p>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #F3C77A; margin: 20px 0;">
    <h3 style="color: #2c3e50; margin-top: 0;">🔑 Confirme seu email</h3>
    <p>Para ativar sua conta, clique no botão abaixo:</p>
    <div style="text-align: center; margin: 20px 0;">
      <a href="{{ .ConfirmationURL }}" 
         style="display: inline-block; background: #F3C77A; color: #2c3e50; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
        ✅ Confirmar Email
      </a>
    </div>
    <p style="text-align: center; color: #666; font-size: 14px;">
      Ou copie e cole este link no seu navegador:<br>
      <code style="background: #e9ecef; padding: 5px; border-radius: 4px; word-break: break-all;">{{ .ConfirmationURL }}</code>
    </p>
  </div>

  <div style="background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 6px; margin: 20px 0;">
    <strong>⚠️ Importante:</strong> Este link expira em 24 horas. Se não conseguir confirmar agora, você pode solicitar um novo link de confirmação.
  </div>

  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px;">
    <p>Se você não se cadastrou em nossa plataforma, pode ignorar este email.</p>
    <p><strong>Equipe Sabedoria das Escrituras</strong></p>
  </div>
</div>
*/

-- 2. RECUPERAÇÃO DE SENHA (Password Recovery)
-- Assunto: "Redefinir sua senha - Sabedoria das Escrituras"
-- Conteúdo HTML:
/*
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #F3C77A;">
    <h1 style="color: #F3C77A; font-size: 28px; margin: 0;">📚 Sabedoria das Escrituras</h1>
    <h2 style="color: #2c3e50; font-size: 24px; margin: 10px 0;">Redefinir senha</h2>
  </div>

  <p>Olá!</p>
  <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #F3C77A; margin: 20px 0;">
    <h3 style="color: #2c3e50; margin-top: 0;">🔑 Redefinir sua senha</h3>
    <p>Para criar uma nova senha, clique no botão abaixo:</p>
    <div style="text-align: center; margin: 20px 0;">
      <a href="{{ .ConfirmationURL }}" 
         style="display: inline-block; background: #F3C77A; color: #2c3e50; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
        🔒 Redefinir Senha
      </a>
    </div>
    <p style="text-align: center; color: #666; font-size: 14px;">
      Ou copie e cole este link no seu navegador:<br>
      <code style="background: #e9ecef; padding: 5px; border-radius: 4px; word-break: break-all;">{{ .ConfirmationURL }}</code>
    </p>
  </div>

  <div style="background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 6px; margin: 20px 0;">
    <strong>⚠️ Importante:</strong> Este link expira em 1 hora por motivos de segurança. Se não conseguir redefinir agora, você pode solicitar um novo link.
  </div>

  <div style="background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 6px; margin: 20px 0;">
    <strong>🔒 Segurança:</strong> Se você não solicitou a redefinição de senha, ignore este email. Sua conta permanece segura.
  </div>

  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px;">
    <p><strong>Equipe Sabedoria das Escrituras</strong></p>
  </div>
</div>
*/

-- 3. LINK MÁGICO (Magic Link)
-- Assunto: "Seu link de acesso - Sabedoria das Escrituras"
-- Conteúdo HTML:
/*
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #F3C77A;">
    <h1 style="color: #F3C77A; font-size: 28px; margin: 0;">📚 Sabedoria das Escrituras</h1>
    <h2 style="color: #2c3e50; font-size: 24px; margin: 10px 0;">Seu link de acesso</h2>
  </div>

  <p>Olá!</p>
  <p>Você solicitou um link de acesso à nossa plataforma.</p>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #F3C77A; margin: 20px 0;">
    <h3 style="color: #2c3e50; margin-top: 0;">✨ Acesso rápido</h3>
    <p>Clique no botão abaixo para fazer login automaticamente:</p>
    <div style="text-align: center; margin: 20px 0;">
      <a href="{{ .ConfirmationURL }}" 
         style="display: inline-block; background: #F3C77A; color: #2c3e50; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
        🚀 Acessar Plataforma
      </a>
    </div>
    <p style="text-align: center; color: #666; font-size: 14px;">
      Ou copie e cole este link no seu navegador:<br>
      <code style="background: #e9ecef; padding: 5px; border-radius: 4px; word-break: break-all;">{{ .ConfirmationURL }}</code>
    </p>
  </div>

  <div style="background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; padding: 15px; border-radius: 6px; margin: 20px 0;">
    <strong>💡 Como funciona:</strong> Este link permite que você faça login sem precisar digitar sua senha. É seguro e prático!
  </div>

  <div style="background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 6px; margin: 20px 0;">
    <strong>⚠️ Importante:</strong> Este link expira em 1 hora. Se não conseguir acessar agora, você pode solicitar um novo link.
  </div>

  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px;">
    <p><strong>Equipe Sabedoria das Escrituras</strong></p>
  </div>
</div>
*/

-- 4. CONVITE DE USUÁRIO (User Invite)
-- Assunto: "Você foi convidado - Sabedoria das Escrituras"
-- Conteúdo HTML:
/*
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #F3C77A;">
    <h1 style="color: #F3C77A; font-size: 28px; margin: 0;">📚 Sabedoria das Escrituras</h1>
    <h2 style="color: #2c3e50; font-size: 24px; margin: 10px 0;">Você foi convidado!</h2>
  </div>

  <p>Olá!</p>
  <p>Você foi convidado para participar da nossa plataforma de estudos bíblicos!</p>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #F3C77A; margin: 20px 0;">
    <h3 style="color: #2c3e50; margin-top: 0;">🎉 Aceite seu convite</h3>
    <p>Para criar sua conta e começar seus estudos, clique no botão abaixo:</p>
    <div style="text-align: center; margin: 20px 0;">
      <a href="{{ .ConfirmationURL }}" 
         style="display: inline-block; background: #F3C77A; color: #2c3e50; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
        ✅ Aceitar Convite
      </a>
    </div>
    <p style="text-align: center; color: #666; font-size: 14px;">
      Ou copie e cole este link no seu navegador:<br>
      <code style="background: #e9ecef; padding: 5px; border-radius: 4px; word-break: break-all;">{{ .ConfirmationURL }}</code>
    </p>
  </div>

  <div style="background: #e8f4fd; padding: 15px; border-radius: 6px; border-left: 4px solid #3498db; margin: 20px 0;">
    <h3 style="color: #2c3e50; margin-top: 0;">🎯 O que você encontrará:</h3>
    <ul>
      <li>📖 Cursos bíblicos completos e organizados</li>
      <li>📚 Materiais de estudo em PDF</li>
      <li>🏆 Sistema de gamificação com pontos e níveis</li>
      <li>📊 Acompanhamento do seu progresso</li>
      <li>👥 Comunidade de estudantes</li>
    </ul>
  </div>

  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px;">
    <p><strong>Equipe Sabedoria das Escrituras</strong></p>
  </div>
</div>
*/

-- 5. MUDANÇA DE EMAIL (Email Change)
-- Assunto: "Confirme a mudança de email - Sabedoria das Escrituras"
-- Conteúdo HTML:
/*
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #F3C77A;">
    <h1 style="color: #F3C77A; font-size: 28px; margin: 0;">📚 Sabedoria das Escrituras</h1>
    <h2 style="color: #2c3e50; font-size: 24px; margin: 10px 0;">Confirme a mudança de email</h2>
  </div>

  <p>Olá!</p>
  <p>Você solicitou a alteração do seu email de <strong>{{ .Email }}</strong> para <strong>{{ .NewEmail }}</strong>.</p>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #F3C77A; margin: 20px 0;">
    <h3 style="color: #2c3e50; margin-top: 0;">✉️ Confirme a mudança</h3>
    <p>Para confirmar a alteração do seu email, clique no botão abaixo:</p>
    <div style="text-align: center; margin: 20px 0;">
      <a href="{{ .ConfirmationURL }}" 
         style="display: inline-block; background: #F3C77A; color: #2c3e50; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
        ✅ Confirmar Mudança
      </a>
    </div>
    <p style="text-align: center; color: #666; font-size: 14px;">
      Ou copie e cole este link no seu navegador:<br>
      <code style="background: #e9ecef; padding: 5px; border-radius: 4px; word-break: break-all;">{{ .ConfirmationURL }}</code>
    </p>
  </div>

  <div style="background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 6px; margin: 20px 0;">
    <strong>⚠️ Importante:</strong> Este link expira em 24 horas. Se não conseguir confirmar agora, você pode solicitar uma nova alteração.
  </div>

  <div style="background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 6px; margin: 20px 0;">
    <strong>🔒 Segurança:</strong> Se você não solicitou a mudança de email, ignore este email e entre em contato conosco.
  </div>

  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px;">
    <p><strong>Equipe Sabedoria das Escrituras</strong></p>
  </div>
</div>
*/

-- INSTRUÇÕES PARA APLICAR:
-- 1. Acesse o Supabase Dashboard
-- 2. Vá para Authentication > Email Templates
-- 3. Para cada template (Confirmation, Recovery, Magic Link, Invite, Email Change):
--    - Cole o assunto correspondente no campo "Subject"
--    - Cole o HTML correspondente no campo "Body"
-- 4. Salve as alterações

-- VERIFICAÇÃO DA CONFIGURAÇÃO DO RESEND:
-- Verifique se a chave da API do Resend está configurada corretamente:
-- 1. Acesse o Supabase Dashboard
-- 2. Vá para Settings > API
-- 3. Verifique se RESEND_API_KEY está configurada
-- 4. Ou configure via CLI: supabase secrets set RESEND_API_KEY=re_BfCFPuAB_CKMsfpzJqTSwkWuQ18quM5PY
