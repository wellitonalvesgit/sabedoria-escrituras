# Diagnóstico de Autenticação e Acesso aos Cursos

Após uma análise completa do sistema de autenticação e acesso aos cursos, identifiquei os seguintes pontos:

## 1. Estado Atual do Usuário

### 1.1. Tabela `auth.users`
- **ID**: 8f7961f5-7c0c-4134-b60a-d561ebed0d51
- **Email**: geisonhoehr.ai@gmail.com
- **Role**: authenticated

### 1.2. Tabela `public.users`
- **ID**: 8f7961f5-7c0c-4134-b60a-d561ebed0d51
- **Email**: geisonhoehr.ai@gmail.com
- **Status**: active
- **Role**: student
- **Access Expires**: 2026-10-26 (válido)
- **Allowed Courses**: 22 cursos
- **Blocked Courses**: nenhum

### 1.3. Assinatura
- **ID**: 527e5072-6327-4566-90e8-ec92e8f7cf44
- **Status**: trial
- **Período**: 26/10/2025 a 25/11/2025 (válido)

## 2. Políticas RLS

### 2.1. Tabela `users`
- **Problema Identificado**: Há políticas conflitantes
  - `Users can view all users`: permite que qualquer usuário veja todos os usuários (qual=true)
  - `users_can_view_own`: permite que usuários vejam apenas seus próprios dados (qual=auth.uid() = id)

### 2.2. Tabela `courses`
- Políticas corretas:
  - `Admins can manage courses`
  - `Anyone can view published courses`
  - `Users can view allowed courses`

### 2.3. Tabela `course_pdfs`
- Políticas corretas:
  - `Admins can manage PDFs`
  - `Anyone can view PDFs of published courses`
  - `Users can view PDFs of allowed courses`

## 3. Problemas Identificados

### 3.1. Conflito de Políticas RLS na Tabela `users`
A política `Users can view all users` está permitindo que qualquer usuário veja todos os usuários, o que pode estar causando confusão no sistema de autenticação. Isso conflita com a política `users_can_view_own`.

### 3.2. Múltiplas Políticas de Inserção e Atualização
Há políticas duplicadas para inserção e atualização na tabela `users`:
- `Users can insert own profile` e `users_can_insert_own`
- `Users can update own profile` e `users_can_update_own`

### 3.3. Possível Problema com o Middleware
O middleware está tentando usar `SERVICE_ROLE_KEY` para bypassar RLS, mas se essa variável não estiver configurada corretamente, o middleware não conseguirá acessar os dados do usuário.

### 3.4. Possível Problema com o Cliente Supabase
Se o cliente Supabase estiver sendo inicializado incorretamente, pode haver problemas com a sessão e autenticação.

## 4. Soluções Recomendadas

### 4.1. Corrigir Políticas RLS na Tabela `users`
```sql
-- Remover política conflitante
DROP POLICY IF EXISTS "Users can view all users" ON public.users;

-- Garantir que apenas a política correta exista
DROP POLICY IF EXISTS "users_can_view_own" ON public.users;
CREATE POLICY "users_can_view_own"
ON public.users
FOR SELECT
USING (auth.uid() = id);
```

### 4.2. Remover Políticas Duplicadas
```sql
-- Remover políticas duplicadas de inserção
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Remover políticas duplicadas de atualização
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
```

### 4.3. Garantir SERVICE_ROLE_KEY Correto
Verificar se a variável `SUPABASE_SERVICE_ROLE_KEY` está configurada corretamente no arquivo `.env` ou `.env.local`:
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxdnFwa21qZHR6ZW9jbG5kd2hqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTA5MjY4NiwiZXhwIjoyMDc2NjY4Njg2fQ.0sBklMOxA7TsCiCP8_8oxjumxK43jj8PRia1LE_Mybs
```

### 4.4. Verificar Inicialização do Cliente Supabase
Garantir que o cliente Supabase esteja sendo inicializado corretamente no arquivo `lib/supabase.ts`:
```typescript
// Instância singleton para evitar múltiplas instâncias do GoTrueClient
let supabaseInstance: ReturnType<typeof createClient> | null = null

function getSupabaseClient() {
  // Server-side: sempre criar nova instância
  if (typeof window === 'undefined') {
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  }

  // Client-side: usar singleton para evitar múltiplas instâncias
  if (!supabaseInstance) {
    console.log('🔧 Criando instância singleton do Supabase Client')
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
        storageKey: 'sb-auth-token',
        flowType: 'pkce'
      }
    })
  }

  return supabaseInstance
}
```

### 4.5. Verificar Gerenciador de Sessão
Garantir que o gerenciador de sessão esteja usando o cliente Supabase corretamente e buscando os dados do usuário:
```typescript
// Buscar dados completos do usuário
try {
  // Usar cliente admin para bypassar RLS
  const { supabaseAdmin } = await import('@/lib/supabase')
  
  if (!supabaseAdmin) {
    throw new Error('Cliente admin não disponível')
  }
  
  const { data: userData, error: userError } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single()

  // ... restante do código
} catch (error) {
  // Fallback para cliente normal
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single()

  // ... restante do código
}
```

## 5. Próximos Passos

1. **Executar o script SQL para corrigir as políticas RLS**:
   ```sql
   -- Corrigir políticas RLS na tabela users
   DROP POLICY IF EXISTS "Users can view all users" ON public.users;
   DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
   DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
   ```

2. **Verificar e corrigir as variáveis de ambiente**:
   ```bash
   echo "NEXT_PUBLIC_SUPABASE_URL=https://aqvqpkmjdtzeoclndwhj.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxdnFwa21qZHR6ZW9jbG5kd2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwOTI2ODYsImV4cCI6MjA3NjY2ODY4Nn0.ZStT6hrlRhT3bigKWc3i6An_lL09R_t5gdZ4WIyyYyY
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxdnFwa21qZHR6ZW9jbG5kd2hqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTA5MjY4NiwiZXhwIjoyMDc2NjY4Njg2fQ.0sBklMOxA7TsCiCP8_8oxjumxK43jj8PRia1LE_Mybs" > .env.local
   ```

3. **Reiniciar o servidor**:
   ```bash
   npm run dev
   ```

4. **Limpar os dados do navegador**:
   - Cookies
   - LocalStorage
   - SessionStorage

5. **Fazer login novamente**:
   - Email: geisonhoehr.ai@gmail.com
   - Senha: 123456

## 6. Conclusão

O problema parece estar relacionado a um conflito nas políticas RLS da tabela `users` e possivelmente a problemas com a variável `SUPABASE_SERVICE_ROLE_KEY`. Os dados do usuário estão corretos no banco de dados, com acesso a 22 cursos e uma assinatura válida. Corrigindo as políticas RLS e garantindo que as variáveis de ambiente estejam configuradas corretamente, o sistema deve funcionar como esperado.
