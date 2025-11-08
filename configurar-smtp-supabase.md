# Configuração SMTP no Supabase Dashboard

Baseado na imagem do Dashboard, você precisa configurar o SMTP customizado para usar o Resend.

## Passos para Configurar:

### 1. Acesse Email Provider
- No Dashboard do Supabase, vá para **Authentication** → **Emails**
- Procure pela seção **Email Provider** ou **SMTP Settings**

### 2. Configure SMTP Customizado
Configure os seguintes valores:

```
SMTP Host: smtp.resend.com
SMTP Port: 587
SMTP User: resend
SMTP Password: re_your_resend_api_key_here
SMTP Sender Name: Sabedoria das Escrituras
SMTP Admin Email: noreply@paulocartas.com.br
```

### 3. Configurações Adicionais
- **Enable custom SMTP**: ✅ Ativado
- **Enable email confirmations**: ✅ Ativado (já está)
- **Enable email change confirmations**: ✅ Ativado

### 4. Rate Limits
Ajuste os limites para produção:
- **Email per hour**: `1000` (ou conforme necessário)

## Verificação

Após configurar, teste:
1. **Cadastro de usuário** - deve enviar email via Resend
2. **Link mágico** - deve enviar email via Resend  
3. **Recuperação de senha** - deve enviar email via Resend

## Próximo Passo

Depois de configurar o SMTP, vamos testar o login e verificar se o problema do perfil do usuário é resolvido.
