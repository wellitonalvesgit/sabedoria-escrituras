# 🔐 Credenciais do Supabase para Vercel

## 📋 Variáveis de Ambiente Necessárias

### 1. **NEXT_PUBLIC_SUPABASE_URL**
```
NEXT_PUBLIC_SUPABASE_URL=https://aqvqpkmjdtzeoclndwhj.supabase.co
```

### 2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
```
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxdnFwa21qZHR6ZW9jbG5kd2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwOTI2ODYsImV4cCI6MjA3NjY2ODY4Nn0.ZStT6hrlRhT3bigKWc3i6An_lL09R_t5gdZ4WIyyYyY
```

### 3. **SUPABASE_SERVICE_ROLE_KEY** ⚠️ SECRETA
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxdnFwa21qZHR6ZW9jbG5kd2hqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTA5MjY4NiwiZXhwIjoyMDc2NjY4Njg2fQ.0sBklMOxA7TsCiCP8_8oxjumxK43jj8PRia1LE_Mybs
```

## 🚀 Como Configurar na Vercel

### Passo 1: Acessar o Dashboard
1. Vá para [vercel.com/dashboard](https://vercel.com/dashboard)
2. Selecione seu projeto `sabedoria-escrituras`

### Passo 2: Configurar Variáveis de Ambiente
1. Clique em **Settings** (Configurações)
2. Clique em **Environment Variables** (Variáveis de Ambiente)
3. Adicione cada variável:

#### Variável 1:
- **Name:** `NEXT_PUBLIC_SUPABASE_URL`
- **Value:** `https://aqvqpkmjdtzeoclndwhj.supabase.co`
- **Environments:** ✅ Production, ✅ Preview, ✅ Development

#### Variável 2:
- **Name:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxdnFwa21qZHR6ZW9jbG5kd2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwOTI2ODYsImV4cCI6MjA3NjY2ODY4Nn0.ZStT6hrlRhT3bigKWc3i6An_lL09R_t5gdZ4WIyyYyY`
- **Environments:** ✅ Production, ✅ Preview, ✅ Development

#### Variável 3:
- **Name:** `SUPABASE_SERVICE_ROLE_KEY`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxdnFwa21qZHR6ZW9jbG5kd2hqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTA5MjY4NiwiZXhwIjoyMDc2NjY4Njg2fQ.0sBklMOxA7TsCiCP8_8oxjumxK43jj8PRia1LE_Mybs`
- **Environments:** ✅ Production, ✅ Preview, ✅ Development

### Passo 3: Salvar e Fazer Deploy
1. Clique em **Save** para cada variável
2. Vá para **Deployments** (Deployments)
3. Clique em **Redeploy** no último deployment

## 🔍 Informações do Projeto Supabase

- **Projeto:** sabedoria-escrituras
- **URL:** https://aqvqpkmjdtzeoclndwhj.supabase.co
- **Dashboard:** https://supabase.com/dashboard/project/aqvqpkmjdtzeoclndwhj

## ⚠️ Importante sobre Segurança

### ✅ Variáveis Seguras (Frontend)
- `NEXT_PUBLIC_SUPABASE_URL` - Pode ser exposta no frontend
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Pode ser exposta no frontend

### ⚠️ Variável Secreta (Apenas Server-side)
- `SUPABASE_SERVICE_ROLE_KEY` - **NUNCA** exponha no frontend
- Usada apenas em API routes e server components
- Bypassa Row Level Security (RLS)

## 🧪 Testando a Configuração

Após configurar as variáveis, você pode testar se estão funcionando:

1. Faça um novo deploy
2. Acesse a aplicação
3. Verifique se os dados do Supabase estão carregando
4. Teste as funcionalidades de autenticação e dados

## 👤 Credenciais de Acesso

### Usuário Admin
- **Email:** `admin@teste.com`
- **Senha:** `123456`
- **Role:** `admin`
- **Status:** `active`

### Usuário de Teste (Aluno)
- **Email:** `aluno@teste.com`
- **Senha:** `123456`
- **Role:** `student`
- **Status:** `active`

## 📞 Suporte

Se tiver problemas:
1. Verifique se todas as variáveis foram adicionadas corretamente
2. Confirme que o deploy foi feito após adicionar as variáveis
3. Verifique os logs da Vercel para erros de conexão com Supabase
4. Use as credenciais acima para testar o login
