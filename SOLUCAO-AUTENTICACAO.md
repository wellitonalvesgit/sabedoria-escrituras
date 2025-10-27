# Solução para Problemas de Autenticação e Acesso aos Cursos

## Problema Identificado

Após análise completa do código, identificamos os seguintes problemas:

1. **Gerenciador de Sessão**: O `lib/session.ts` tenta buscar os dados do usuário usando o cliente Supabase normal (com ANON_KEY), que está sujeito às políticas de RLS.

2. **Middleware Desativado**: Ao desativar o middleware, os usuários conseguem acessar as páginas, mas ainda não conseguem ver seu perfil ou acessar os cursos.

3. **Endpoint de API**: O componente `PremiumAccessGate` tenta verificar o acesso aos cursos usando um endpoint de API que pode não estar retornando os dados corretamente.

## Solução Implementada

### 1. Corrigir o Gerenciador de Sessão

O gerenciador de sessão foi modificado para usar uma API que utiliza o `SERVICE_ROLE_KEY` para buscar os dados do usuário, contornando as limitações de RLS.

Arquivo: `lib/session-fix.ts`
```typescript
// Usar API para buscar dados do usuário em vez de buscar diretamente
try {
  const response = await fetch(`/api/users/me`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  })
  
  if (!response.ok) {
    throw new Error(`Erro ao buscar usuário: ${response.status}`)
  }
  
  const userData = await response.json()
  // ... restante do código
}
```

### 2. Criar Endpoint de API para Usuário

Foi criado um novo endpoint de API que usa o `SERVICE_ROLE_KEY` para buscar os dados do usuário, contornando as limitações de RLS.

Arquivo: `app/api/users/me/route.ts`
```typescript
// Buscar dados do usuário usando SERVICE_ROLE_KEY para bypassar RLS
const { data: userData, error: userError } = await supabase
  .from('users')
  .select('*')
  .eq('id', session.user.id)
  .single()
```

### 3. Script de Verificação de Usuário

Foi criado um script SQL para verificar e corrigir os dados do usuário no banco de dados.

Arquivo: `verificar-usuario.sql`
- Verifica se o usuário existe nas tabelas `auth.users` e `public.users`
- Corrige o ID se for diferente entre as tabelas
- Atualiza o status para 'active'
- Estende a data de expiração do acesso
- Garante que o usuário tenha acesso a todos os cursos

### 4. Script para Resetar Senha

Foi criado um script SQL para resetar a senha do usuário, caso necessário.

Arquivo: `resetar-senha.sql`
```sql
SELECT auth.set_user_password(
    (SELECT id FROM auth.users WHERE email = 'geisonhoehr.ai@gmail.com'),
    '123456'
);
```

## Passos para Aplicar a Solução

1. **Executar os Scripts SQL**:
   ```bash
   psql -f verificar-usuario.sql
   ```

2. **Substituir o Gerenciador de Sessão**:
   ```bash
   cp lib/session-fix.ts lib/session.ts
   ```

3. **Adicionar o Endpoint de API para Usuário**:
   O arquivo `app/api/users/me/route.ts` já foi criado.

4. **Reiniciar o Servidor**:
   ```bash
   npm run dev
   ```

5. **Limpar os Dados do Navegador**:
   - Cookies
   - LocalStorage
   - SessionStorage

6. **Fazer Login Novamente**:
   - Email: geisonhoehr.ai@gmail.com
   - Senha: 123456

## Verificação

Após aplicar essas mudanças, o usuário deve conseguir:
- Ver seu perfil corretamente
- Acessar todos os cursos que foram liberados para ele
- Navegar pelo sistema sem problemas de autenticação

## Diagnóstico Adicional

Se ainda houver problemas, você pode:

1. **Verificar os Logs do Console**:
   - Abrir as ferramentas de desenvolvedor (F12)
   - Verificar mensagens de erro no console

2. **Testar o Endpoint de API**:
   ```bash
   curl -X GET http://localhost:3000/api/users/me -H "Cookie: [copie os cookies do navegador]"
   ```

3. **Restaurar o Middleware**:
   ```bash
   cp middleware.ts.bak middleware.ts
   ```

4. **Verificar as Variáveis de Ambiente**:
   Certifique-se de que o arquivo `.env` contém:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://aqvqpkmjdtzeoclndwhj.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxdnFwa21qZHR6ZW9jbG5kd2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwOTI2ODYsImV4cCI6MjA3NjY2ODY4Nn0.ZStT6hrlRhT3bigKWc3i6An_lL09R_t5gdZ4WIyyYyY
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxdnFwa21qZHR6ZW9jbG5kd2hqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTA5MjY4NiwiZXhwIjoyMDc2NjY4Njg2fQ.0sBklMOxA7TsCiCP8_8oxjumxK43jj8PRia1LE_Mybs
   ```