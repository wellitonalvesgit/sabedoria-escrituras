# Configuração das Variáveis de Ambiente

## Arquivo .env

Adicione estas variáveis ao seu arquivo `.env` na raiz do projeto:

```env
# Supabase Configuration
# IMPORTANTE: Obtenha suas chaves no painel do Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Resend API Configuration
# IMPORTANTE: Obtenha sua chave em https://resend.com
RESEND_API_KEY=re_your_resend_api_key_here

# Claude API Configuration (Opcional)
# Obtenha sua chave em: https://console.anthropic.com/
ANTHROPIC_API_KEY=sk-ant-your_anthropic_key_here

# Korvex Payment Gateway Configuration
# Gateway de pagamento para infoprodutores
# IMPORTANTE: Obtenha suas chaves no painel da Korvex
KORVEX_PUBLIC_KEY=your_korvex_public_key_here
KORVEX_PRIVATE_KEY=your_korvex_private_key_here
KORVEX_API_URL=https://app.korvex.com.br/api/v1
KORVEX_SANDBOX=true

# Asaas Payment Gateway Configuration (Alternativa)
ASAAS_API_KEY=your_asaas_api_key_here
ASAAS_API_URL=https://www.asaas.com/api/v3
ASAAS_SANDBOX=true

# Site Configuration
# Em produção, use: https://app.paulocartas.com.br
# Em desenvolvimento, use: http://localhost:3000
NEXT_PUBLIC_SITE_URL=https://app.paulocartas.com.br
NEXT_PUBLIC_EMAIL_DOMAIN=paulocartas.com.br
```

## Instruções

1. **Substitua os placeholders** pelas suas chaves reais
2. **Copie para o arquivo `.env`** na raiz do projeto
3. **Salve o arquivo**
4. **NUNCA commit o arquivo `.env`** (já está no .gitignore)
5. **Reinicie o servidor** com `npm run dev`
6. **Teste as funcionalidades** de login

## Verificação

Para verificar se as configurações estão corretas:

1. **Console do navegador** deve mostrar:
   - ✅ Supabase URL: Configurada
   - ✅ Supabase Anon Key: Configurada
   - ✅ Service Role Key: Configurada

2. **Teste de email** deve funcionar:
   - Cadastro de usuário
   - Link mágico
   - Código de acesso
   - Recuperação de senha

## Problemas Comuns

### **"Service Role Key: Missing"**
- Verifique se `SUPABASE_SERVICE_ROLE_KEY` está no `.env`
- Reinicie o servidor após alterar o `.env`

### **"Erro ao enviar email"**
- Verifique se `RESEND_API_KEY` está correto
- Confirme se a chave do Resend é válida

### **"Código não encontrado"**
- Verifique se o localStorage está habilitado
- Teste em aba normal (não anônima)

### **"ANTHROPIC_API_KEY não está configurada"**
- A Claude API é opcional
- Para usar funcionalidades com IA, obtenha uma chave em https://console.anthropic.com/
- Adicione `ANTHROPIC_API_KEY` no arquivo `.env`

---

## Claude API (Opcional)

O projeto agora inclui suporte para Claude API. Para usar:

1. **Obtenha uma chave da API:**
   - Acesse https://console.anthropic.com/
   - Crie uma conta ou faça login
   - Gere uma API key

2. **Adicione ao `.env`:**
   ```env
   ANTHROPIC_API_KEY=sk-ant-sua-chave-aqui
   ```

3. **Instale as dependências:**
   ```bash
   npm install
   # ou
   pnpm install
   ```

4. **Use no código:**
   ```typescript
   import { askClaude, generateSummary } from '@/lib/claude'
   
   // Fazer uma pergunta
   const response = await askClaude('Explique o que é TypeScript')
   
   // Gerar resumo
   const summary = await generateSummary('Texto longo aqui...')
   ```

5. **Teste a API:**
   - GET `/api/claude` - Verifica se está configurada
   - POST `/api/claude` - Usa a Claude API

---

## Korvex Payment Gateway

O projeto agora suporta integração com o gateway de pagamento Korvex, ideal para infoprodutores.

### Configuração

1. **Obtenha suas chaves no painel da Korvex** e adicione ao `.env`:
   ```env
   KORVEX_PUBLIC_KEY=your_public_key_here
   KORVEX_PRIVATE_KEY=your_private_key_here
   KORVEX_API_URL=https://app.korvex.com.br/api/v1
   KORVEX_SANDBOX=true
   KORVEX_WEBHOOK_TOKEN=your_webhook_token_here
   ```

2. **Execute a migração do banco de dados:**
   - Acesse o SQL Editor no Supabase
   - Execute o arquivo `supabase-korvex-integration.sql`
   - Isso adiciona os campos necessários nas tabelas `subscriptions` e `payments`

3. **Configure o webhook:**
   - No painel da Korvex, configure o webhook para:
   - URL: `https://app.paulocartas.com.br/api/webhooks/korvex`
   - Eventos: `TRANSACTION_CREATED`, `TRANSACTION_PAID`, `TRANSACTION_CANCELED`, `TRANSACTION_REFUNDED`
   - Copie o token gerado e adicione ao `.env` como `KORVEX_WEBHOOK_TOKEN`
   
   ⚠️ **IMPORTANTE**: Use o domínio `app.paulocartas.com.br` (não `paulocartas.com.br`)

### Uso - Checkout da Korvex

O sistema usa o checkout interno da Korvex. O fluxo é:

1. **Aluno clica em "Comprar"** na página de planos
2. **Sistema cria transação** na Korvex via `/api/korvex/checkout`
3. **Aluno é redirecionado** para o checkout da Korvex
4. **Aluno faz o pagamento** no checkout da Korvex
5. **Korvex redireciona** para `/checkout/korvex/callback`
6. **Sistema valida pagamento** e libera acesso ao plano

```typescript
// Criar checkout (chamado automaticamente pela página de checkout)
const response = await fetch('/api/korvex/checkout', {
  method: 'POST',
  body: JSON.stringify({
    plan_name: 'premium-monthly',
    cycle: 'monthly',
    payment_method: 'PIX' // ou 'BOLETO'
  })
})

// Retorna checkoutUrl para redirecionar
const { checkoutUrl, transactionId, identifier } = await response.json()
window.location.href = checkoutUrl
```

### Funcionalidades

- ✅ Checkout interno da Korvex (redirecionamento)
- ✅ Criação de transações automaticamente
- ✅ Pagamentos via PIX e Boleto
- ✅ Assinaturas recorrentes (mensais/anuais)
- ✅ Webhooks para notificações de status
- ✅ Callback automático após pagamento
- ✅ Liberação automática de acesso ao plano

---

**✅ Com essas configurações, todas as funcionalidades de login devem funcionar perfeitamente!**
