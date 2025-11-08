# ⚙️ Configuração do Sistema de Checkout

## ✅ Status Atual

### Webhook Corvex
- **URL configurada:** `https://app.paulocartas.com.br/api/webhooks/korvex`
- **Token:** `qavskvbs` ✅ (já configurado no .env)
- **Status:** ✅ Configurado

### Código
- ✅ API de compra aceita compras sem login
- ✅ Webhook cria usuários automaticamente
- ✅ Templates de email implementados
- ✅ Sistema de senha provisória funcionando

---

## 🔧 Configurações Pendentes

### 1. Resend API Key (OBRIGATÓRIO)

O sistema precisa enviar emails. Configure sua conta no Resend:

**Passos:**
1. Acesse: https://resend.com
2. Crie uma conta (gratuita para até 3.000 emails/mês)
3. Vá em "API Keys"
4. Crie uma nova chave
5. Copie a chave (formato: `re_xxxxxxxxxxxxx`)

**Adicione no `.env`:**
```env
RESEND_API_KEY=re_sua_chave_aqui
```

**Verificar domínio:**
- Adicione `paulocartas.com.br` como domínio verificado no Resend
- Ou use o domínio de teste `resend.dev` (apenas para testes)

---

### 2. Corvex API Key (OBRIGATÓRIO)

Para criar checkouts na Corvex, você precisa da API Key.

**Passos:**
1. Acesse: https://app.korvex.com.br
2. Vá em "Configurações" ou "API"
3. Copie sua API Key

**Adicione no `.env`:**
```env
KORVEX_API_KEY=sua_api_key_corvex_aqui
```

---

### 3. URL do Site (IMPORTANTE)

**Para produção:**
```env
NEXT_PUBLIC_SITE_URL=https://app.paulocartas.com.br
```

**Para desenvolvimento local:**
```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

### 4. Configuração na Vercel (se usar)

Se você faz deploy na Vercel, adicione as mesmas variáveis lá:

**Painel da Vercel → Settings → Environment Variables:**

```
RESEND_API_KEY=re_xxxxx
KORVEX_API_KEY=xxxxx
KORVEX_WEBHOOK_TOKEN=qavskvbs
NEXT_PUBLIC_SITE_URL=https://app.paulocartas.com.br
```

**Importante:** Depois de adicionar as variáveis, faça um novo deploy.

---

## 📋 Checklist de Configuração

### Backend
- [x] Webhook token configurado (`qavskvbs`)
- [ ] RESEND_API_KEY configurada
- [ ] KORVEX_API_KEY configurada
- [ ] Domínio verificado no Resend
- [ ] Variáveis configuradas na Vercel (se aplicável)

### Corvex (Painel)
- [x] Webhook criado
- [x] URL: `https://app.paulocartas.com.br/api/webhooks/korvex`
- [x] Token: `qavskvbs`
- [ ] Eventos ativados:
  - [ ] `TRANSACTION_PAID`
  - [ ] `TRANSACTION_CREATED` (opcional)
  - [ ] `TRANSACTION_CANCELED` (opcional)
  - [ ] `TRANSACTION_REFUNDED` (opcional)

### Resend (Painel)
- [ ] Conta criada
- [ ] API Key gerada
- [ ] Domínio `paulocartas.com.br` verificado
- [ ] Remetente configurado: `As Cartas de Paulo <noreply@paulocartas.com.br>`

---

## 🧪 Como Testar Após Configurar

### 1. Testar envio de email

```bash
curl -X POST https://app.paulocartas.com.br/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to": "seu-email@example.com"}'
```

Se retornar sucesso, o Resend está configurado corretamente.

### 2. Testar compra simulada

```bash
curl -X POST https://app.paulocartas.com.br/api/test-course-purchase \
  -H "Content-Type: application/json" \
  -d '{"email": "seu-email@example.com"}'
```

Isso deve:
- Criar uma compra
- Criar um usuário (se não existir)
- Enviar email com credenciais

### 3. Testar compra real (pequeno valor)

1. Acesse a landing page
2. Clique em "Comprar" em um curso
3. Preencha dados (use seu email real)
4. Complete pagamento PIX (R$ 9,97)
5. Aguarde confirmação (pode levar alguns segundos)
6. Verifique seu email

**Você deve receber:**
- Email com suas credenciais
- Senha provisória
- Link para fazer login

---

## 🔍 Verificar se Está Funcionando

### Logs do Servidor

Acesse os logs da Vercel ou do servidor e procure por:

**Quando webhook recebe pagamento:**
```
📩 Webhook Korvex recebido: TRANSACTION_PAID
🔄 Compra sem usuário. Criando usuário automaticamente...
👤 Criando novo usuário: email@example.com
✅ Usuário criado no Auth
✅ Usuário criado na tabela users
📧 Enviando email de boas-vindas com credenciais
✅ Email enviado com sucesso via Resend
```

**Se algo der errado:**
```
❌ Erro ao criar usuário: [descrição do erro]
❌ Falha ao enviar email via Resend
```

### Dashboard Resend

- Acesse: https://resend.com/emails
- Veja todos os emails enviados
- Clique em cada um para ver detalhes
- Verifique se foram entregues com sucesso

### Dashboard Corvex

- Acesse: https://app.korvex.com.br
- Vá em "Webhooks" ou "Logs"
- Verifique se os webhooks estão sendo disparados
- Status deve ser "200 OK"

---

## 🐛 Problemas Comuns

### Email não chega

**Causas:**
1. RESEND_API_KEY não configurada ou inválida
2. Domínio não verificado no Resend
3. Email do destinatário inválido

**Soluções:**
- Verifique variável no .env e Vercel
- Adicione e verifique domínio no Resend
- Teste com email diferente

### Webhook não processa

**Causas:**
1. Token inválido
2. URL incorreta
3. Servidor offline

**Soluções:**
- Confirme token `qavskvbs` na Corvex
- Confirme URL termina com `/api/webhooks/korvex`
- Acesse a URL diretamente (deve retornar JSON)

### Usuário não é criado

**Causas:**
1. Email já existe
2. Erro no Supabase Auth
3. SERVICE_ROLE_KEY inválida

**Soluções:**
- Verifique logs do servidor
- Confirme SERVICE_ROLE_KEY no .env
- Teste criar usuário manualmente no Supabase

---

## 📞 Próximos Passos

1. **Configure RESEND_API_KEY** (prioritário)
2. **Configure KORVEX_API_KEY** (prioritário)
3. **Verifique domínio no Resend**
4. **Teste com compra real pequena**
5. **Monitore logs por alguns dias**

---

## 📝 Resumo do Arquivo .env

Seu arquivo `.env` deve ter no mínimo:

```env
# Supabase (já configurado ✅)
NEXT_PUBLIC_SUPABASE_URL=https://aqvqpkmjdtzeoclndwhj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Resend (CONFIGURAR ⚠️)
RESEND_API_KEY=re_sua_chave_aqui

# Corvex (CONFIGURAR ⚠️)
KORVEX_API_KEY=sua_api_key_aqui
KORVEX_WEBHOOK_TOKEN=qavskvbs

# Site
NEXT_PUBLIC_SITE_URL=https://app.paulocartas.com.br
```

---

**Última atualização:** 2025-11-07
**Status:** ⚠️ Aguardando configuração de RESEND_API_KEY e KORVEX_API_KEY
