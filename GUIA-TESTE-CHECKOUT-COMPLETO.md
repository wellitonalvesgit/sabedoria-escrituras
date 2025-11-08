# 🧪 Guia de Teste - Sistema de Checkout Completo

## 📋 Visão Geral

O sistema agora suporta **dois fluxos de compra**:

1. **Compra pela Landing Page (sem conta)** - Cliente compra primeiro, conta criada automaticamente
2. **Compra dentro da Plataforma (com conta)** - Cliente já logado compra cursos adicionais

---

## 🎯 Cenário 1: Compra pela Landing Page (Sem Conta)

### Como Funciona

1. Cliente clica em "Comprar" na landing page
2. Preenche dados: nome, email, CPF (opcional)
3. Escolhe PIX ou Boleto
4. Realiza pagamento na Korvex
5. **Sistema cria conta automaticamente** quando pagamento confirmado
6. Cliente recebe email com:
   - ✅ Confirmação da compra
   - 🔑 Email e senha provisória
   - 🎁 Informação de acesso vitalício
   - 🚀 Link para fazer login

### Exemplo de Requisição (Landing Page)

```javascript
// Chamada da landing page para criar checkout
fetch('https://app.paulocartas.com.br/api/courses/COURSE_ID/purchase', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    payment_method: 'PIX', // ou 'BOLETO'
    client: {
      name: 'João da Silva',
      email: 'joao@example.com',
      phone: '11999999999',
      cpf: '12345678900' // opcional
    }
  })
})
.then(res => res.json())
.then(data => {
  if (data.checkoutUrl) {
    // Redirecionar para checkout da Korvex
    window.location.href = data.checkoutUrl
  }
  // Ou se for PIX, mostrar QR Code
  if (data.pix) {
    console.log('QR Code:', data.pix.qrCode)
  }
})
```

### O que Acontece no Backend

1. **API de Compra** (`/api/courses/[id]/purchase`)
   - Verifica se cliente está autenticado (opcional)
   - Se não autenticado, exige `client.name` e `client.email`
   - Cria checkout na Korvex
   - Salva compra com status `pending` e metadata
   - Flag `requiresUserCreation: true` no metadata

2. **Webhook Korvex** (`/api/webhooks/korvex`)
   - Recebe notificação `TRANSACTION_PAID`
   - Detecta que `user_id` é NULL
   - Cria usuário automaticamente:
     - Gera senha provisória aleatória
     - Cria no Supabase Auth
     - Cria registro na tabela `users`
   - Associa compra ao novo usuário
   - Envia email com credenciais via Resend

### Email Recebido

```
Assunto: 🎉 Bem-vindo! Acesso ao curso: [Nome do Curso]

Olá João da Silva,

É com grande alegria que informamos que sua compra foi confirmada com sucesso!

Criamos automaticamente sua conta de acesso à plataforma.
Abaixo estão suas credenciais:

🔑 SUAS CREDENCIAIS DE ACESSO:
- Email: joao@example.com
- Senha Provisória: aB3$xY9#mK2&

⚠️ Importante: Esta é uma senha provisória.
Recomendamos que você altere sua senha no primeiro acesso.

📦 DETALHES DA COMPRA:
- Curso: Unção do Leão
- Valor: R$ 9,97
- Status: ✅ Confirmado

🎁 Acesso Vitalício!
Você agora tem acesso vitalício a este curso.

[Botão: 🚀 Fazer Login e Acessar Curso]
```

---

## 🎯 Cenário 2: Compra dentro da Plataforma (Com Conta)

### Como Funciona

1. Cliente já está **logado na plataforma**
2. Navega pelos cursos disponíveis
3. Clica em "Comprar" em um curso do Arsenal Espiritual
4. Escolhe PIX ou Boleto
5. Realiza pagamento
6. Recebe email de **confirmação de compra** (sem credenciais)

### Exemplo de Requisição (Plataforma)

```javascript
// Cliente já logado (cookies de sessão presentes)
fetch(`https://app.paulocartas.com.br/api/courses/${courseId}/purchase`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // Importante para enviar cookies
  body: JSON.stringify({
    payment_method: 'PIX',
    // client é opcional, pega dados do usuário logado
    client: {
      phone: '11999999999', // opcional
      cpf: '12345678900'     // opcional
    }
  })
})
.then(res => res.json())
.then(data => {
  if (data.checkoutUrl) {
    window.location.href = data.checkoutUrl
  }
})
```

### O que Acontece no Backend

1. **API de Compra**
   - Detecta usuário autenticado via cookies
   - Usa dados do usuário logado (name, email)
   - Cria checkout com `userId` já preenchido
   - Flag `requiresUserCreation: false` no metadata

2. **Webhook Korvex**
   - Recebe `TRANSACTION_PAID`
   - Compra já tem `user_id` preenchido
   - Atualiza status para `completed`
   - Envia email de confirmação de compra (SEM credenciais)

### Email Recebido

```
Assunto: 🎉 Compra confirmada: [Nome do Curso]

Olá João da Silva,

É com grande alegria que informamos que sua compra foi confirmada com sucesso!

📦 DETALHES DA COMPRA:
- Curso: Unção do Leão
- Valor: R$ 9,97
- Status: ✅ Confirmado

🎁 Acesso Vitalício!
Você agora tem acesso vitalício a este curso.

[Botão: 📖 Acessar Curso Agora]
```

---

## 🧪 Como Testar SEM Pagar

### Opção 1: API de Teste Automática

```bash
curl -X POST https://app.paulocartas.com.br/api/test-course-purchase \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seu-email@example.com"
  }'
```

Esta API:
- Cria compra simulada com status `completed`
- Envia email real via Resend
- Você pode verificar se recebeu o email

### Opção 2: Testar Criação de Usuário Manualmente

Você pode simular o webhook localmente. Crie um arquivo `test-webhook.js`:

```javascript
const payload = {
  event: 'TRANSACTION_PAID',
  client: {
    name: 'João da Silva',
    email: 'joao@example.com',
    phone: '11999999999',
    cpf: '12345678900'
  },
  transaction: {
    id: 'test-transaction-123',
    status: 'COMPLETED',
    paymentMethod: 'PIX',
    amount: 9.97,
    payedAt: new Date().toISOString()
  }
}

fetch('http://localhost:3000/api/webhooks/korvex', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
})
.then(res => res.json())
.then(data => console.log('Resultado:', data))
```

**Importante:** Você precisará ter uma compra pendente no banco com o `payment_id` correspondente.

---

## ✅ Checklist de Verificação

### Para Compra SEM Conta (Landing Page)

- [ ] Cliente pode comprar sem estar logado
- [ ] Sistema valida email e nome no body
- [ ] Checkout é criado na Korvex
- [ ] Compra fica `pending` no banco
- [ ] Webhook recebe `TRANSACTION_PAID`
- [ ] Sistema cria usuário automaticamente
- [ ] Senha provisória é gerada (12 caracteres)
- [ ] Usuário é criado no Supabase Auth
- [ ] Registro é criado na tabela `users`
- [ ] Compra é associada ao novo usuário
- [ ] Email com credenciais é enviado
- [ ] Cliente consegue fazer login com senha provisória
- [ ] Cliente tem acesso ao curso comprado

### Para Compra COM Conta (Dentro da Plataforma)

- [ ] Cliente logado pode comprar
- [ ] Sistema detecta autenticação via cookies
- [ ] Checkout usa dados do usuário logado
- [ ] Compra fica `pending` com `user_id` preenchido
- [ ] Webhook recebe `TRANSACTION_PAID`
- [ ] Sistema NÃO cria novo usuário
- [ ] Compra é atualizada para `completed`
- [ ] Email de confirmação é enviado (SEM credenciais)
- [ ] Cliente tem acesso ao curso comprado

---

## 🔧 Configurações Necessárias

### Variáveis de Ambiente

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Resend (Email)
RESEND_API_KEY=re_your_api_key

# Korvex (Pagamentos)
KORVEX_API_KEY=your_korvex_key
KORVEX_WEBHOOK_TOKEN=your_webhook_token

# Site
NEXT_PUBLIC_SITE_URL=https://app.paulocartas.com.br
```

### Webhook na Korvex

Configure na Korvex:
- **URL:** `https://app.paulocartas.com.br/api/webhooks/korvex`
- **Eventos:** `TRANSACTION_PAID`, `TRANSACTION_CREATED`, `TRANSACTION_CANCELED`, `TRANSACTION_REFUNDED`
- **Token:** Mesmo valor de `KORVEX_WEBHOOK_TOKEN`

---

## 🐛 Troubleshooting

### Erro: "Para comprar sem cadastro, informe seu nome e email"

**Causa:** Requisição sem autenticação não incluiu `client.name` ou `client.email`

**Solução:** Adicione ao body:
```json
{
  "payment_method": "PIX",
  "client": {
    "name": "Nome Completo",
    "email": "email@example.com"
  }
}
```

### Erro: "Email inválido"

**Causa:** Formato de email incorreto

**Solução:** Verifique se o email está no formato `usuario@dominio.com`

### Email não está sendo enviado

**Possíveis causas:**
1. `RESEND_API_KEY` não configurada
2. Domínio não verificado no Resend
3. Email do destinatário inválido

**Verificar:**
- Logs do servidor: `✅ Email enviado com sucesso` ou `❌ Erro ao enviar`
- Dashboard do Resend: https://resend.com/emails

### Usuário não foi criado

**Verificar logs:**
- `👤 Criando novo usuário: email@example.com`
- `✅ Usuário criado no Auth: user-id`
- `✅ Usuário criado na tabela users: user-id`

**Possíveis erros:**
- Email já existe
- Erro no Supabase Auth
- Permissões insuficientes (verificar SERVICE_ROLE_KEY)

---

## 📊 Fluxograma do Sistema

```
Landing Page (Sem conta)              Plataforma (Com conta)
        ↓                                      ↓
    Comprar curso                          Comprar curso
        ↓                                      ↓
    Dados: nome, email                   Usa dados da sessão
        ↓                                      ↓
    API cria checkout                    API cria checkout
        ↓                                      ↓
    metadata.requiresUserCreation        metadata.requiresUserCreation
         = true                                = false
        ↓                                      ↓
    Pagamento confirmado                 Pagamento confirmado
        ↓                                      ↓
    Webhook: TRANSACTION_PAID            Webhook: TRANSACTION_PAID
        ↓                                      ↓
    Cria usuário automático              Usuário já existe
        ↓                                      ↓
    Gera senha provisória                Atualiza compra
        ↓                                      ↓
    Email COM credenciais                Email SEM credenciais
        ↓                                      ↓
    Cliente faz login                    Cliente já está logado
        ↓                                      ↓
    Acessa curso                         Acessa curso
```

---

## 📝 Logs Esperados

### Compra SEM conta (novo usuário)

```
📩 Webhook Korvex recebido: TRANSACTION_PAID
🔄 Compra sem usuário. Criando usuário automaticamente...
👤 Criando novo usuário: joao@example.com
✅ Usuário criado no Auth: abc123-def456
✅ Usuário criado na tabela users: abc123-def456
✅ Usuário associado à compra: abc123-def456
✅ Compra do curso confirmada: course-id
✅ Usuário agora tem acesso ao curso: abc123-def456
📧 Enviando email de boas-vindas com credenciais para: joao@example.com
✅ Email enviado com sucesso via Resend para: joao@example.com
```

### Compra COM conta (usuário existente)

```
📩 Webhook Korvex recebido: TRANSACTION_PAID
✅ Compra do curso confirmada: course-id
✅ Usuário agora tem acesso ao curso: abc123-def456
📧 Enviando email de confirmação de compra para: joao@example.com
✅ Email enviado com sucesso via Resend para: joao@example.com
```

---

**Última atualização:** 2025-01-07
**Status:** ✅ Implementado e pronto para teste
