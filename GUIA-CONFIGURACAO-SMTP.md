# 📧 Guia de Configuração SMTP - Sabedoria das Escrituras

## 🎯 Objetivo
Configurar o sistema de envio de emails para que funcione completamente, incluindo:
- ✅ Login com link mágico
- ✅ Recuperação de senha
- ✅ Emails de boas-vindas
- ✅ Notificações do sistema

## 🔧 Opções de Configuração

### **OPÇÃO 1: Gmail (Recomendado para testes)**

1. **Ativar autenticação de 2 fatores no Gmail**
2. **Gerar senha de app:**
   - Acesse: https://myaccount.google.com/security
   - Clique em "Senhas de app"
   - Gere uma senha para "Mail"
   - Copie a senha gerada

3. **Configurar variáveis de ambiente:**
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=seu-email@gmail.com
   SMTP_PASS=sua-senha-de-app
   SMTP_FROM=noreply@sabedoriaescrituras.com
   SMTP_SECURE=false
   ```

### **OPÇÃO 2: Outlook/Hotmail**

1. **Configurar variáveis de ambiente:**
   ```bash
   SMTP_HOST=smtp-mail.outlook.com
   SMTP_PORT=587
   SMTP_USER=seu-email@outlook.com
   SMTP_PASS=sua-senha
   SMTP_FROM=noreply@sabedoriaescrituras.com
   SMTP_SECURE=false
   ```

### **OPÇÃO 3: Provedor Personalizado**

1. **Configurar variáveis de ambiente:**
   ```bash
   SMTP_HOST=smtp.seudominio.com
   SMTP_PORT=587
   SMTP_USER=noreply@seudominio.com
   SMTP_PASS=sua-senha
   SMTP_FROM=noreply@seudominio.com
   SMTP_SECURE=false
   ```

## 📋 Como Configurar

### **Passo 1: Criar arquivo .env.local**
```bash
# Copie o conteúdo do arquivo email-config-example.txt
# Renomeie para .env.local
# Configure suas credenciais SMTP
```

### **Passo 2: Configurar variáveis**
```bash
# Exemplo para Gmail:
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app
SMTP_FROM=noreply@sabedoriaescrituras.com
SMTP_SECURE=false
```

### **Passo 3: Testar configuração**
```bash
# Acesse: http://localhost:3000/api/test-smtp?test-connection=true
# Ou use a API de teste completa
```

## 🧪 Como Testar

### **Teste 1: Verificar Conexão SMTP**
```bash
GET /api/test-smtp?test-connection=true
```

### **Teste 2: Enviar Email de Teste**
```bash
POST /api/test-smtp
{
  "email": "seu-email@exemplo.com",
  "testType": "smtp"
}
```

### **Teste 3: Testar Sistema Completo**
```bash
POST /api/test-smtp
{
  "email": "seu-email@exemplo.com",
  "testType": "all"
}
```

## 🔍 Troubleshooting

### **Erro: "Invalid login credentials"**
- ✅ Verifique se a senha de app está correta
- ✅ Certifique-se de que a autenticação de 2 fatores está ativada
- ✅ Use a senha de app, não a senha normal do Gmail

### **Erro: "Connection timeout"**
- ✅ Verifique se a porta está correta (587 para TLS)
- ✅ Verifique se o firewall não está bloqueando
- ✅ Teste com diferentes provedores SMTP

### **Erro: "Authentication failed"**
- ✅ Verifique se o usuário e senha estão corretos
- ✅ Para Gmail, use senha de app
- ✅ Para outros provedores, verifique as configurações

## 📊 Status das Configurações

### **Verificar Status Atual:**
```bash
GET /api/test-smtp
```

### **Resposta Esperada:**
```json
{
  "smtp": {
    "configured": true,
    "host": "smtp.gmail.com",
    "port": "587",
    "user": "seu***@gmail.com"
  },
  "resend": {
    "configured": false,
    "apiKey": "Não configurado"
  },
  "supabase": {
    "configured": true,
    "serviceRole": "Configurado"
  }
}
```

## 🚀 Próximos Passos

1. **Configure o SMTP** seguindo as instruções acima
2. **Teste a conexão** usando a API de teste
3. **Envie um email de teste** para verificar se está funcionando
4. **Teste o login com link mágico** na página de login
5. **Teste a recuperação de senha** na página de login

## 📞 Suporte

Se tiver problemas com a configuração:
- 📧 Email: ascartasdepailoo@gmail.com
- 📚 Documentação: Ver arquivo CONFIGURACAO-EMAILS.md
- 🧪 Testes: Use as APIs de teste criadas

---

**✅ Após configurar o SMTP, o sistema estará 100% funcional para vendas!**
