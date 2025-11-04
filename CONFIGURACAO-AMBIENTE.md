# Configuração das Variáveis de Ambiente

## Arquivo .env

Adicione estas variáveis ao seu arquivo `.env` na raiz do projeto:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://aqvqpkmjdtzeoclndwhj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxdnFwa21qZHR6ZW9jbG5kd2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwOTI2ODYsImV4cCI6MjA3NjY2ODY4Nn0.ZStT6hrlRhT3bigKWc3i6An_lL09R_t5gdZ4WIyyYyY
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxdnFwa21qZHR6ZW9jbG5kd2hqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTA5MjY4NiwiZXhwIjoyMDc2NjY4Njg2fQ.0sBklMOxA7TsCiCP8_8oxjumxK43jj8PRia1LE_Mybs

# Resend API Configuration
RESEND_API_KEY=re_BfCFPuAB_CKMsfpzJqTSwkWuQ18quM5PY

# Claude API Configuration (Opcional)
# Obtenha sua chave em: https://console.anthropic.com/
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Korvex Payment Gateway Configuration
# Gateway de pagamento para infoprodutores
KORVEX_PUBLIC_KEY=oseias01fab_3fsgxpo0jjk6iccb
KORVEX_PRIVATE_KEY=inyug04lxkve178wrd7nbps81ndnep4rb7q0esasvi2vjvp8dduyny4cuv26chf2
KORVEX_API_URL=https://api.korvex.com.br/v1
KORVEX_SANDBOX=true

# Asaas Payment Gateway Configuration (Alternativa)
ASAAS_API_KEY=your_asaas_api_key_here
ASAAS_API_URL=https://www.asaas.com/api/v3
ASAAS_SANDBOX=true

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_EMAIL_DOMAIN=paulocartas.com.br
```

## Instruções

1. **Copie o conteúdo acima** para seu arquivo `.env`
2. **Salve o arquivo** na raiz do projeto
3. **Reinicie o servidor** com `npm run dev`
4. **Teste as funcionalidades** de login

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

1. **Adicione as chaves ao `.env`:**
   ```env
   KORVEX_PUBLIC_KEY=oseias01fab_3fsgxpo0jjk6iccb
   KORVEX_PRIVATE_KEY=inyug04lxkve178wrd7nbps81ndnep4rb7q0esasvi2vjvp8dduyny4cuv26chf2
   KORVEX_API_URL=https://app.korvex.com.br/api/v1
   KORVEX_SANDBOX=true
   KORVEX_WEBHOOK_TOKEN=token_gerado_no_painel_korvex
   ```

2. **Execute a migração do banco de dados:**
   - Acesse o SQL Editor no Supabase
   - Execute o arquivo `supabase-korvex-integration.sql`
   - Isso adiciona os campos necessários nas tabelas `subscriptions` e `payments`

3. **Configure o webhook:**
   - No painel da Korvex, configure o webhook para:
   - URL: `https://seudominio.com/api/webhooks/korvex`
   - Eventos: `TRANSACTION_CREATED`, `TRANSACTION_PAID`, `TRANSACTION_CANCELED`, `TRANSACTION_REFUNDED`
   - Copie o token gerado e adicione ao `.env` como `KORVEX_WEBHOOK_TOKEN`

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
