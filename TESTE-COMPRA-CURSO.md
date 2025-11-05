# 🧪 Guia de Teste - Fluxo de Compra de Curso Individual

## 📋 Resumo da Implementação

### ✅ O que foi implementado:

1. **API de Compra de Curso** (`/api/courses/[id]/purchase`)
   - Cria checkout na Korvex
   - Salva compra pendente no banco
   - Retorna URL de checkout ou dados PIX

2. **Webhook Korvex** (`/api/webhooks/korvex`)
   - Processa pagamentos confirmados
   - Atualiza status da compra
   - **Envia email via Resend automaticamente**

3. **Template de Email** (`lib/email-templates.ts`)
   - Email profissional de confirmação de compra
   - Inclui detalhes da compra e link para acessar o curso

4. **Sistema de Acesso**
   - Verifica compras individuais na função `check_user_course_access()`
   - Libera acesso vitalício após pagamento confirmado

---

## 🧪 Como Testar o Fluxo Completo

### Opção 1: Teste Real (Recomendado)

#### Passo 1: Acessar um curso do Arsenal Espiritual
1. Faça login na plataforma
2. Acesse o dashboard: `https://app.paulocartas.com.br/dashboard`
3. Encontre um curso do **Arsenal Espiritual** (ex: "Unção do Leão")
4. Clique no curso (você verá a tela de bloqueio)

#### Passo 2: Clicar em "Comprar"
1. Na tela de bloqueio, você verá o botão **"Comprar por R$ 9,97"**
2. Clique no botão
3. Será redirecionado para o checkout da Korvex

#### Passo 3: Realizar Pagamento
1. Escolha PIX ou Boleto
2. Complete o pagamento na Korvex
3. Aguarde confirmação

#### Passo 4: Verificar Acesso e Email
1. Após pagamento confirmado, você será redirecionado para o curso
2. Verifique se recebeu o email de confirmação no seu email cadastrado
3. Confirme que tem acesso ao curso

---

### Opção 2: Teste Simulado (Desenvolvimento)

#### Teste 1: Simular Compra e Email

```bash
# Fazer uma requisição POST para a API de teste
curl -X POST https://app.paulocartas.com.br/api/test-course-purchase \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seu-email@exemplo.com"
  }'
```

**Ou via código JavaScript:**

```javascript
// No console do navegador (logado na plataforma)
fetch('/api/test-course-purchase', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'seu-email@exemplo.com' // opcional
  })
})
.then(res => res.json())
.then(data => {
  console.log('✅ Compra de teste criada:', data)
  console.log('📧 Email enviado:', data.email.sent ? 'Sim' : 'Não')
})
```

#### Teste 2: Simular Webhook da Korvex

Para testar o webhook diretamente, você pode usar o código abaixo:

```bash
# Simular webhook de pagamento confirmado
curl -X POST https://app.paulocartas.com.br/api/webhooks/korvex \
  -H "Content-Type: application/json" \
  -d '{
    "event": "TRANSACTION_PAID",
    "token": "seu-token-webhook",
    "transaction": {
      "id": "test-transaction-123",
      "status": "COMPLETED",
      "paymentMethod": "PIX",
      "amount": 9.97,
      "payedAt": "2025-01-05T12:00:00Z"
    },
    "client": {
      "id": "client-id",
      "name": "Nome do Usuário",
      "email": "usuario@exemplo.com"
    }
  }'
```

**Nota:** Você precisará ajustar o `transaction.id` para corresponder a um `payment_id` existente na tabela `user_course_purchases`.

---

## 📧 Verificação do Email

### Configuração do Resend

O sistema está configurado para usar o Resend com:
- **From:** `As Cartas de Paulo <noreply@paulocartas.com.br>`
- **API Key:** Configurada via `RESEND_API_KEY` no `.env`

### Verificar se o Email foi Enviado

1. **Verificar logs do servidor:**
   - Procure por: `✅ Email enviado com sucesso via Resend`
   - Ou: `❌ Erro ao enviar email via Resend`

2. **Verificar caixa de entrada:**
   - O email deve chegar em alguns segundos
   - Verifique a pasta de spam caso não apareça

3. **Verificar dashboard do Resend:**
   - Acesse: https://resend.com/emails
   - Veja os logs de envio

---

## 🐛 Troubleshooting

### Problema: Email não está sendo enviado

**Soluções:**
1. Verificar se `RESEND_API_KEY` está configurada no `.env` e na Vercel
2. Verificar se o domínio `paulocartas.com.br` está verificado no Resend
3. Verificar logs do servidor para erros específicos

### Problema: Webhook não está processando

**Soluções:**
1. Verificar se o webhook está configurado na Korvex apontando para:
   `https://app.paulocartas.com.br/api/webhooks/korvex`
2. Verificar se o token está correto: `KORVEX_WEBHOOK_TOKEN`
3. Verificar logs do servidor para erros

### Problema: Acesso não está sendo liberado

**Soluções:**
1. Verificar se a função `check_user_course_access()` está funcionando
2. Verificar se o `payment_status` está como `completed`
3. Verificar se o curso está na categoria `arsenal-espiritual`

---

## 📝 Checklist de Teste

- [ ] Acessar curso do Arsenal Espiritual sem acesso
- [ ] Ver botão "Comprar por R$ 9,97" na tela de bloqueio
- [ ] Clicar em "Comprar" e ser redirecionado para checkout
- [ ] Completar pagamento na Korvex
- [ ] Verificar redirecionamento para o curso após pagamento
- [ ] Verificar se o acesso foi liberado (pode acessar o curso)
- [ ] Verificar se o email de confirmação foi recebido
- [ ] Verificar se o email contém todas as informações corretas
- [ ] Verificar se o link do curso no email funciona

---

## 🎯 Próximos Passos

1. **Testar em produção** com um pagamento real
2. **Monitorar logs** do Resend e do servidor
3. **Ajustar template de email** se necessário
4. **Adicionar mais informações** ao email (ex: número do pedido)

---

**Última atualização:** 2025-01-05
**Status:** ✅ Pronto para teste

