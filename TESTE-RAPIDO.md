# 🧪 Como Testar o Sistema AGORA

## ⚠️ Problema Atual

As novas APIs que criei ainda não estão no servidor (precisam de deploy). Mas você pode testar o sistema completo de 3 formas:

---

## ✅ OPÇÃO 1: Fazer Deploy e Testar (Recomendado)

### Passo 1: Fazer Deploy na Vercel

Se você usa Vercel:

```bash
cd /Users/poker/Downloads/sabedoria-escrituras-main
git add .
git commit -m "feat: adiciona criação automática de usuário no checkout"
git push
```

Aguarde o deploy completar (2-3 minutos).

### Passo 2: Configurar Variáveis na Vercel

**Vercel Dashboard → Settings → Environment Variables:**

Adicione estas variáveis:
```
RESEND_API_KEY=re_4fEsvSgi_PAogMQGJh9jLgVvsfbcxtoCM
KORVEX_PUBLIC_KEY=oseias01fab_3fsgxpo0jjk6iccb
KORVEX_PRIVATE_KEY=inyug04lxkve178wrd7nbps81ndnep4rb7q0esasvi2vjvp8dduyny4cuv26chf2
KORVEX_WEBHOOK_TOKEN=qavskvbs
KORVEX_API_URL=https://app.korvex.com.br/api/v1
KORVEX_SANDBOX=true
```

### Passo 3: Fazer Novo Deploy

Após adicionar as variáveis, faça um novo deploy (pode ser via dashboard da Vercel).

### Passo 4: Testar

Abra o arquivo `teste-checkout-final.html` no navegador e teste!

---

## ✅ OPÇÃO 2: Testar Localmente (Rápido)

Se quiser testar sem fazer deploy:

### Passo 1: Rodar servidor local

```bash
cd /Users/poker/Downloads/sabedoria-escrituras-main
npm install
npm run dev
```

### Passo 2: Atualizar arquivo de teste

Abra `teste-checkout-final.html` em um editor e mude a URL:

**De:**
```javascript
const response = await fetch('https://app.paulocartas.com.br/api/test-webhook-user', {
```

**Para:**
```javascript
const response = await fetch('http://localhost:3000/api/test-webhook-user', {
```

### Passo 3: Testar

Abra o arquivo `teste-checkout-final.html` no navegador.

---

## ✅ OPÇÃO 3: Teste Direto via Script Node.js

Criei um script que testa tudo localmente:

### Passo 1: Criar arquivo de teste

```bash
cd /Users/poker/Downloads/sabedoria-escrituras-main
```

Crie arquivo `test-user-creation.js`:

```javascript
require('dotenv').config({ path: '.env' });

async function testUserCreation() {
  console.log('🧪 Testando criação de usuário e envio de email...\n');

  const email = 'geisonveiga511@gmail.com';
  const name = 'Geison Veiga';

  console.log('📧 Email:', email);
  console.log('👤 Nome:', name);
  console.log('');

  try {
    const response = await fetch('http://localhost:3000/api/test-webhook-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name })
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ SUCESSO!\n');
      console.log('Mensagem:', data.message);
      console.log('');
      console.log('👤 Usuário:');
      console.log('  - ID:', data.user.id);
      console.log('  - Nome:', data.user.name);
      console.log('  - Email:', data.user.email);
      console.log('  - Novo?:', data.user.isNew ? 'SIM' : 'NÃO');
      console.log('');

      if (data.credentials) {
        console.log('🔑 CREDENCIAIS DE ACESSO:');
        console.log('  - Email:', data.credentials.email);
        console.log('  - Senha:', data.credentials.temporaryPassword);
        console.log('');
      }

      if (data.email) {
        console.log('📧 Email:');
        console.log('  - Enviado?:', data.email.sent ? 'SIM' : 'NÃO');
        if (data.email.to) console.log('  - Para:', data.email.to);
        if (data.email.subject) console.log('  - Assunto:', data.email.subject);
        if (data.email.error) console.log('  - Erro:', data.email.error);
        console.log('');
      }

      console.log('🎉 Teste concluído com sucesso!');
      console.log('');
      console.log('📱 Próximos passos:');
      console.log('1. Verifique seu email:', email);
      console.log('2. Procure por email com assunto sobre "Bem-vindo"');
      console.log('3. Use as credenciais acima para fazer login');
      console.log('4. Acesse: https://app.paulocartas.com.br/login');
    } else {
      console.log('❌ ERRO:', data.error);
    }
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
    console.log('');
    console.log('Certifique-se que o servidor está rodando:');
    console.log('  npm run dev');
  }
}

testUserCreation();
```

### Passo 2: Rodar servidor

```bash
npm run dev
```

### Passo 3: Rodar teste (em outro terminal)

```bash
node test-user-creation.js
```

Vai mostrar tudo no terminal, incluindo a **senha provisória**!

---

## 🎯 Resumo

| Opção | Vantagem | Desvantagem |
|-------|----------|-------------|
| **1. Deploy** | Testa ambiente real | Demora alguns minutos |
| **2. Local** | Rápido para testar | Não testa produção |
| **3. Script** | Simples e direto | Precisa de Node.js |

---

## 📝 Qual Escolher?

- **Use Opção 1** se quer testar tudo em produção
- **Use Opção 2** se quer testar rápido localmente
- **Use Opção 3** se prefere terminal (mais fácil de debug)

---

## 🚀 Minha Recomendação

**Faça Opção 3 AGORA** (mais rápido):
1. Rode `npm run dev` no terminal
2. Crie o arquivo `test-user-creation.js` com o código acima
3. Em outro terminal: `node test-user-creation.js`
4. Veja o resultado no terminal
5. Verifique seu email

**Depois faça Opção 1** (para produção):
1. Commit e push o código
2. Configure variáveis na Vercel
3. Aguarde deploy
4. Teste em produção

---

**Última atualização:** 2025-11-07
**Status:** Aguardando deploy ou teste local
