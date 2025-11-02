# Fluxo de Autenticação e Acesso aos Cursos

Este documento descreve o fluxo completo de autenticação e acesso aos cursos na plataforma, identificando os pontos críticos e possíveis problemas.

## 1. Fluxo de Autenticação

### 1.1. Login do Usuário
- O usuário envia email e senha para `/api/auth/login`
- Supabase verifica as credenciais contra a tabela `auth.users`
- Se válido, retorna um token JWT e cria uma sessão

### 1.2. Middleware (middleware.ts)
- Intercepta todas as requisições para rotas protegidas
- Verifica se há uma sessão válida usando `supabase.auth.getSession()`
- Usa `SERVICE_ROLE_KEY` para bypassar RLS
- Verifica se o usuário existe na tabela `public.users`
- Verifica status, expiração de acesso e permissões
- Se tudo estiver correto, permite acesso à rota solicitada

### 1.3. Gerenciador de Sessão (lib/session.ts)
- Inicializa no lado do cliente
- Busca a sessão atual usando `supabase.auth.getSession()`
- Busca dados do usuário da tabela `public.users`
- Mantém estado da sessão e dados do usuário
- Fornece métodos para verificar acesso a cursos e categorias

## 2. Fluxo de Acesso aos Cursos

### 2.1. Listagem de Cursos
- Componente de listagem busca cursos da tabela `courses`
- Políticas RLS determinam quais cursos o usuário pode ver
- Cursos são exibidos com base no status de acesso

### 2.2. Verificação de Acesso a um Curso
- Quando o usuário tenta acessar um curso, o componente `PremiumAccessGate` é ativado
- Faz uma requisição para `/api/courses/[id]/access`
- O endpoint verifica:
  - Se o usuário está autenticado
  - Se o curso existe
  - Se o usuário tem permissão para acessar o curso (via `allowed_courses`)
  - Se o usuário tem uma assinatura ativa
- Retorna um objeto com `canAccess` e informações adicionais

### 2.3. Exibição do Conteúdo do Curso
- Se `canAccess` for `true`, o conteúdo do curso é exibido
- Caso contrário, é mostrado um bloqueio de acesso

## 3. Políticas RLS (Row Level Security)

### 3.1. Tabela `users`
- `users_can_view_own`: Usuários podem ver seus próprios dados
- `users_can_update_own`: Usuários podem atualizar seus próprios dados
- `users_can_insert_own`: Usuários podem inserir seus próprios dados

### 3.2. Tabela `courses`
- `Admins can manage courses`: Administradores podem gerenciar todos os cursos
- `Anyone can view published courses`: Qualquer usuário pode ver cursos publicados
- `Users can view allowed courses`: Usuários podem ver cursos em sua lista de `allowed_courses`

### 3.3. Tabela `course_pdfs`
- `Admins can manage PDFs`: Administradores podem gerenciar todos os PDFs
- `Anyone can view PDFs of published courses`: Qualquer usuário pode ver PDFs de cursos publicados
- `Users can view PDFs of allowed courses`: Usuários podem ver PDFs de cursos em sua lista de `allowed_courses`

## 4. Pontos Críticos e Possíveis Problemas

### 4.1. Variáveis de Ambiente
- `NEXT_PUBLIC_SUPABASE_URL`: URL do projeto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Chave anônima para operações client-side
- `SUPABASE_SERVICE_ROLE_KEY`: Chave de serviço para operações server-side (bypassar RLS)

Se alguma dessas variáveis estiver incorreta ou ausente, o sistema de autenticação não funcionará corretamente.

### 4.2. Sincronização entre `auth.users` e `public.users`
- Quando um usuário se registra, ele é criado em `auth.users`
- Um trigger deve criar o mesmo usuário em `public.users`
- Se houver discrepância entre as tabelas, o usuário pode autenticar mas não ter acesso

### 4.3. Políticas RLS
- Se as políticas RLS estiverem mal configuradas, o usuário pode não conseguir ver seus dados ou cursos
- O middleware usa `SERVICE_ROLE_KEY` para bypassar RLS, mas o cliente normal está sujeito às políticas

### 4.4. Múltiplas Instâncias do Cliente Supabase
- Criar múltiplas instâncias do cliente Supabase pode causar problemas de autenticação
- O warning "Multiple GoTrueClient instances detected" indica esse problema

### 4.5. Cookies e LocalStorage
- A sessão é armazenada em cookies e localStorage
- Se houver problemas com cookies ou localStorage, a sessão pode ser perdida

## 5. Verificações e Correções

### 5.1. Verificar Variáveis de Ambiente
```bash
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
echo $SUPABASE_SERVICE_ROLE_KEY
```

### 5.2. Verificar Usuário nas Tabelas
```sql
-- Verificar em auth.users
SELECT * FROM auth.users WHERE email = 'geisonhoehr.ai@gmail.com';

-- Verificar em public.users
SELECT * FROM public.users WHERE email = 'geisonhoehr.ai@gmail.com';
```

### 5.3. Verificar Políticas RLS
```sql
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename IN ('users', 'courses', 'course_pdfs');
```

### 5.4. Verificar Acesso aos Cursos
```sql
-- Verificar cursos permitidos para o usuário
SELECT 
    u.email, 
    array_length(u.allowed_courses, 1) as num_allowed_courses,
    array_length(u.blocked_courses, 1) as num_blocked_courses
FROM public.users u
WHERE u.email = 'geisonhoehr.ai@gmail.com';

-- Verificar todos os cursos publicados
SELECT COUNT(*) FROM courses WHERE status = 'published';
```

### 5.5. Verificar Assinatura
```sql
-- Verificar assinatura do usuário
SELECT s.* 
FROM subscriptions s
JOIN public.users u ON s.user_id = u.id
WHERE u.email = 'geisonhoehr.ai@gmail.com'
ORDER BY s.created_at DESC
LIMIT 1;
```

## 6. Soluções Comuns

### 6.1. Corrigir Sincronização de Usuários
```sql
-- Verificar se o usuário existe em auth.users mas não em public.users
INSERT INTO public.users (id, email, name, status, role)
SELECT id, email, email, 'active', 'student'
FROM auth.users
WHERE email = 'geisonhoehr.ai@gmail.com'
AND NOT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.users.id
);
```

### 6.2. Atualizar Lista de Cursos Permitidos
```sql
-- Atualizar allowed_courses para incluir todos os cursos publicados
UPDATE public.users
SET allowed_courses = (
    SELECT array_agg(id::text)
    FROM courses
    WHERE status = 'published'
),
blocked_courses = ARRAY[]::text[],
updated_at = NOW()
WHERE email = 'geisonhoehr.ai@gmail.com';
```

### 6.3. Criar ou Atualizar Assinatura
```sql
-- Criar ou atualizar assinatura
INSERT INTO subscriptions (
    user_id,
    status,
    price_id,
    subscription_id,
    current_period_start,
    current_period_end,
    cancel_at_period_end,
    created_at,
    updated_at
) VALUES (
    (SELECT id FROM public.users WHERE email = 'geisonhoehr.ai@gmail.com'),
    'active',
    'price_premium_annual',
    'sub_' || (SELECT id FROM public.users WHERE email = 'geisonhoehr.ai@gmail.com'),
    NOW(),
    NOW() + INTERVAL '365 days',
    false,
    NOW(),
    NOW()
)
ON CONFLICT (user_id) DO UPDATE
SET
    status = 'active',
    current_period_start = NOW(),
    current_period_end = NOW() + INTERVAL '365 days',
    updated_at = NOW();
```
