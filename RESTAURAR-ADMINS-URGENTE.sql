-- =============================================
-- RESTAURAR TODOS OS ADMINISTRADORES
-- Problema: Script fix-rls-DEFINITIVO.sql sobrescreveu roles
-- Solução: Restaurar manualmente os admins conhecidos
-- =============================================

-- PASSO 1: Verificar estado atual dos usuários
SELECT
  id,
  email,
  name,
  role,
  status,
  created_at
FROM public.users
ORDER BY created_at ASC;

-- =============================================
-- PASSO 2: RESTAURAR ADMINISTRADORES
-- =============================================

-- Se você souber quais emails são admins, adicione aqui:
-- Exemplo baseado nas evidências do chat:

-- Admin 1: geisonhoehr@gmail.com (confirmado como admin)
UPDATE public.users
SET
  role = 'admin',
  updated_at = NOW()
WHERE email = 'geisonhoehr@gmail.com';

-- ADICIONE OUTROS ADMINS AQUI:
-- UPDATE public.users SET role = 'admin', updated_at = NOW() WHERE email = 'outro-admin@exemplo.com';
-- UPDATE public.users SET role = 'admin', updated_at = NOW() WHERE email = 'mais-um-admin@exemplo.com';

-- =============================================
-- PASSO 3: VERIFICAÇÃO
-- =============================================

-- Listar todos os admins atualizados
SELECT
  id,
  email,
  name,
  role,
  status,
  created_at,
  updated_at
FROM public.users
WHERE role = 'admin'
ORDER BY email;

-- Contar total de admins
SELECT
  COUNT(*) as total_admins,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as admins_ativos
FROM public.users
WHERE role = 'admin';

-- =============================================
-- INSTRUÇÕES PARA O USUÁRIO
-- =============================================

/*

🚨 IMPORTANTE: DEPOIS DE RESTAURAR OS ADMINS NO BANCO:

1. LIMPAR CACHE DO MIDDLEWARE:
   - O middleware tem cache de 30 segundos
   - Reinicie o servidor: Ctrl+C e depois npm run dev

2. LIMPAR CACHE DO SESSIONMANAGER:
   - Acesse: http://localhost:3000/forcar-refresh-admin.html
   - Clique em "Invalidar Cache do SessionManager"
   - Clique em "Forçar Refresh da Sessão"
   - Clique em "Recarregar Página Completa"

3. VERIFICAR NO NAVEGADOR:
   - Faça logout
   - Faça login novamente com o email do admin
   - Verifique se aparece menu de administrador

4. SE AINDA NÃO FUNCIONAR:
   - Abra DevTools (F12)
   - Vá em Application > Storage > Clear site data
   - Faça login novamente

CAUSA DO PROBLEMA:
- O script fix-rls-DEFINITIVO.sql tinha a linha 48:
  role = COALESCE(role, 'student')
- Isso pode ter convertido admins em students se foi executado sem WHERE clause
- Este script restaura os admins conhecidos manualmente

*/
