# Instruções para Reset de Usuários

Este documento contém instruções para resetar completamente os usuários do sistema e criar novos usuários de teste. Use esta abordagem apenas quando outras soluções não funcionarem.

## ⚠️ ATENÇÃO

Este procedimento é **destrutivo** e irá:
- Excluir todos os usuários existentes
- Limpar todas as tabelas relacionadas (assinaturas, progresso, etc.)
- Criar novos usuários de teste

Certifique-se de fazer backup dos dados importantes antes de prosseguir.

## 1. Executar o Script SQL

Execute o script `reset-users.sql` no banco de dados:

```bash
psql -f reset-users.sql
```

Este script irá:
1. Limpar todas as tabelas relacionadas a usuários
2. Excluir todos os usuários existentes
3. Criar um usuário administrador
4. Criar um usuário de teste
5. Configurar acesso a todos os cursos para ambos os usuários

## 2. Reiniciar o Servidor

Após executar o script, reinicie o servidor:

```bash
npm run dev
```

## 3. Limpar Dados do Navegador

Limpe completamente os dados do navegador:
- Cookies
- LocalStorage
- SessionStorage
- Cache

## 4. Fazer Login com os Novos Usuários

### Usuário Administrador
- **Email**: admin@example.com
- **Senha**: admin123

### Usuário de Teste
- **Email**: teste@example.com
- **Senha**: teste123

## 5. Verificar Acesso aos Cursos

Após fazer login, verifique se:
- O usuário pode ver seu perfil
- O usuário tem acesso a todos os cursos
- As assinaturas estão funcionando corretamente

## 6. Resolver Problemas Específicos

Se ainda houver problemas após o reset:

### Problema: Usuário não consegue fazer login
Verifique se o hash da senha está correto:
```sql
UPDATE auth.users
SET encrypted_password = crypt('nova_senha', gen_salt('bf'))
WHERE email = 'teste@example.com';
```

### Problema: Usuário não tem acesso aos cursos
Verifique e atualize a lista de cursos permitidos:
```sql
UPDATE public.users
SET allowed_courses = (
    SELECT array_agg(id::text)
    FROM courses
    WHERE status = 'published'
),
blocked_courses = ARRAY[]::text[]
WHERE email = 'teste@example.com';
```

### Problema: Assinatura não está funcionando
Crie uma nova assinatura para o usuário:
```sql
INSERT INTO subscriptions (
    user_id,
    status,
    subscription_id,
    current_period_start,
    current_period_end,
    cancel_at_period_end,
    created_at,
    updated_at
) VALUES (
    (SELECT id FROM auth.users WHERE email = 'teste@example.com'),
    'active',
    'sub_' || (SELECT id FROM auth.users WHERE email = 'teste@example.com'),
    now(),
    now() + interval '365 days',
    false,
    now(),
    now()
);
```

## 7. Restaurar Usuários Originais (Opcional)

Se necessário, você pode restaurar os usuários originais usando um script de backup.
