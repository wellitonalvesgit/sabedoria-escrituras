# Desativar Sistema de Email Padrão do Supabase

Agora que o Resend está configurado e funcionando, precisamos desativar o sistema de email padrão do Supabase para evitar conflitos.

## Configurações Necessárias

### 1. Via Dashboard do Supabase

1. Acesse o **Dashboard do Supabase** → **Authentication** → **Settings**
2. Na seção **Email Provider**, configure:
   - **Enable custom SMTP**: ✅ Ativado
   - **SMTP Host**: `smtp.resend.com`
   - **SMTP Port**: `587`
   - **SMTP User**: `resend`
   - **SMTP Password**: `re_BfCFPuAB_CKMsfpzJqTSwkWuQ18quM5PY`
   - **SMTP Sender Name**: `Sabedoria das Escrituras`
   - **SMTP Admin Email**: `noreply@paulocartas.com.br`

### 2. Configurações Adicionais

- **Enable email confirmations**: ✅ Ativado
- **Enable email change confirmations**: ✅ Ativado
- **Enable phone confirmations**: ❌ Desativado (se não usar)

### 3. Rate Limits

Ajuste os limites de email para produção:
- **Email per hour**: `1000` (ou conforme necessário)
- **SMS per hour**: `0` (se não usar SMS)

## Verificação

Após configurar, teste:
1. **Cadastro de usuário** - deve enviar email via Resend
2. **Link mágico** - deve enviar email via Resend  
3. **Recuperação de senha** - deve enviar email via Resend

## Troubleshooting

Se ainda houver problemas:
1. Verifique se o domínio `paulocartas.com.br` está autorizado no Resend
2. Confirme se a API key do Resend está correta
3. Verifique os logs do Supabase para erros de email

## Próximos Passos

1. Configurar templates de email em português no Supabase Dashboard
2. Testar todos os fluxos de autenticação
3. Monitorar entregabilidade dos emails
