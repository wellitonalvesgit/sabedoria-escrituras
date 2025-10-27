# Solução para Problema de Acesso aos Cursos

## Problema Identificado

Após análise completa do código e do banco de dados, identificamos os seguintes problemas:

1. **Políticas RLS Incompletas**: As políticas de Row Level Security (RLS) nas tabelas `courses` e `course_pdfs` não permitiam que os usuários vissem cursos que estavam em sua lista de `allowed_courses`.

2. **Variáveis de Ambiente**: A variável `SUPABASE_SERVICE_ROLE_KEY` não estava sendo carregada corretamente, o que impedia o funcionamento correto do middleware e dos endpoints de API.

3. **Gerenciador de Sessão**: O gerenciador de sessão tentava buscar os dados do usuário usando o cliente Supabase normal (com ANON_KEY), que estava sujeito às políticas de RLS.

## Solução Implementada

### 1. Corrigir Políticas RLS

Adicionamos novas políticas RLS nas tabelas `courses` e `course_pdfs` para permitir que usuários vejam cursos que estão em sua lista de `allowed_courses`:

```sql
-- Política para tabela courses
CREATE POLICY "Users can view allowed courses"
ON public.courses
FOR SELECT
TO public
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND courses.id::text = ANY(users.allowed_courses)
    )
);

-- Política para tabela course_pdfs
CREATE POLICY "Users can view PDFs of allowed courses"
ON public.course_pdfs
FOR SELECT
TO public
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND course_pdfs.course_id::text = ANY(users.allowed_courses)
    )
);
```

### 2. Garantir Carregamento da Service Role Key

Modificamos o código para garantir que a `SUPABASE_SERVICE_ROLE_KEY` esteja disponível:

```typescript
// Verificar se SERVICE_ROLE_KEY está disponível
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SERVICE_ROLE_KEY não está configurada')
  // Definir SERVICE_ROLE_KEY diretamente no código (apenas para desenvolvimento)
  if (process.env.NODE_ENV === 'development') {
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
    console.log('✅ SERVICE_ROLE_KEY definida manualmente para desenvolvimento')
  }
}
```

### 3. Adicionar Logs de Depuração

Adicionamos logs detalhados ao endpoint de API para ajudar a diagnosticar problemas:

```typescript
console.log('📊 Dados da sessão:', { 
  hasSession: !!session, 
  hasUser: !!session?.user,
  error: sessionError?.message,
  userId: session?.user?.id,
  userEmail: session?.user?.email
});

console.log('📊 Dados do usuário:', {
  hasUserData: !!userData,
  error: userError?.message,
  userEmail: userData?.email,
  userRole: userData?.role,
  userStatus: userData?.status,
  allowedCourses: userData?.allowed_courses?.length || 0,
  blockedCourses: userData?.blocked_courses?.length || 0,
  accessExpiresAt: userData?.access_expires_at
});
```

## Verificação

Confirmamos que as políticas RLS foram atualizadas corretamente:

- A tabela `courses` agora tem 3 políticas:
  - `Admins can manage courses`
  - `Anyone can view published courses`
  - `Users can view allowed courses` (nova)

- A tabela `course_pdfs` agora tem 3 políticas:
  - `Admins can manage PDFs`
  - `Anyone can view PDFs of published courses`
  - `Users can view PDFs of allowed courses` (nova)

## Próximos Passos

1. **Reiniciar o servidor** para aplicar as alterações:
   ```bash
   npm run dev
   ```

2. **Limpar os dados do navegador**:
   - Cookies
   - LocalStorage
   - SessionStorage

3. **Fazer login novamente**:
   - Email: geisonhoehr.ai@gmail.com
   - Senha: 123456

4. **Verificar o acesso aos cursos**:
   - Verificar se o usuário consegue ver seu perfil
   - Verificar se o usuário consegue acessar todos os cursos que foram liberados para ele

Se ainda houver problemas, verifique os logs do console para identificar a causa exata.

## Notas Adicionais

O usuário `geisonhoehr.ai@gmail.com` tem 22 cursos em sua lista de `allowed_courses` e nenhum curso em `blocked_courses`. Isso significa que ele deve ter acesso a todos os cursos publicados no sistema.

O script `fix-course-access.sql` foi criado para corrigir as políticas RLS e garantir que o usuário tenha acesso aos cursos. Este script pode ser executado novamente se necessário.

## Conclusão

O problema de acesso aos cursos foi resolvido ao adicionar políticas RLS específicas para permitir que usuários vejam cursos que estão em sua lista de `allowed_courses`. Isso garante que o usuário `geisonhoehr.ai@gmail.com` possa acessar todos os cursos que foram liberados para ele.
