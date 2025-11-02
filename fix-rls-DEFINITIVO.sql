-- =============================================
-- CORREÇÃO DEFINITIVA - RLS SIMPLES (SEM RECURSÃO)
-- Sistema: Sabedoria das Escrituras
-- Data: 2025-10-26
-- =============================================

-- SOLUÇÃO DEFINITIVA:
-- Políticas MUITO SIMPLES que verificam apenas auth.uid() = id
-- SEM subqueries, SEM EXISTS, SEM recursão
-- Admins usarão SERVICE_ROLE_KEY que bypassa RLS

-- =============================================
-- PARTE 1: LIMPAR TUDO
-- =============================================

-- Desabilitar RLS temporariamente
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Remover TODAS as políticas
DROP POLICY IF EXISTS "Usuários só podem ver seus próprios dados" ON public.users;
DROP POLICY IF EXISTS "Usuários só podem editar seus próprios dados" ON public.users;
DROP POLICY IF EXISTS "Administradores podem ver todos os usuários" ON public.users;
DROP POLICY IF EXISTS "Administradores podem editar todos os usuários" ON public.users;
DROP POLICY IF EXISTS "Administradores podem inserir usuários" ON public.users;
DROP POLICY IF EXISTS "Administradores podem excluir usuários" ON public.users;
DROP POLICY IF EXISTS "Serviço de autenticação pode inserir usuários" ON public.users;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.users;
DROP POLICY IF EXISTS "users_select_own_or_admin" ON public.users;
DROP POLICY IF EXISTS "users_update_own_or_admin" ON public.users;
DROP POLICY IF EXISTS "users_insert_signup_or_admin" ON public.users;
DROP POLICY IF EXISTS "users_delete_admin_only" ON public.users;
DROP POLICY IF EXISTS "users_select_policy" ON public.users;
DROP POLICY IF EXISTS "users_update_policy" ON public.users;
DROP POLICY IF EXISTS "users_insert_policy" ON public.users;
DROP POLICY IF EXISTS "users_delete_policy" ON public.users;

-- =============================================
-- PARTE 2: ATUALIZAR DADOS DO USUÁRIO
-- =============================================

-- Aproveitar que RLS está desabilitado para atualizar
UPDATE public.users
SET
  status = 'active',
  role = COALESCE(role, 'student'),
  access_days = COALESCE(access_days, 30),
  access_expires_at = CASE
    WHEN access_expires_at IS NULL OR access_expires_at < NOW()
    THEN NOW() + INTERVAL '365 days'
    ELSE access_expires_at
  END,
  updated_at = NOW()
WHERE email = 'geisonhoehr.ai@gmail.com';

-- =============================================
-- PARTE 3: CRIAR POLÍTICAS SUPER SIMPLES
-- =============================================

-- Reabilitar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- POLÍTICA 1: SELECT - Ver APENAS próprio perfil
-- Admins usarão SERVICE_ROLE_KEY que bypassa RLS
DROP POLICY IF EXISTS "users_can_view_own" ON public.users;
CREATE POLICY "users_can_view_own"
ON public.users
FOR SELECT
USING (auth.uid() = id);

-- POLÍTICA 2: UPDATE - Atualizar APENAS próprio perfil
-- Admins usarão SERVICE_ROLE_KEY que bypassa RLS
DROP POLICY IF EXISTS "users_can_update_own" ON public.users;
CREATE POLICY "users_can_update_own"
ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- POLÍTICA 3: INSERT - Criar própria conta durante signup
-- Admins usarão SERVICE_ROLE_KEY que bypassa RLS
DROP POLICY IF EXISTS "users_can_insert_own" ON public.users;
CREATE POLICY "users_can_insert_own"
ON public.users
FOR INSERT
WITH CHECK (auth.uid() = id);

-- POLÍTICA 4: DELETE - Ninguém pode deletar via RLS
-- Admins usarão SERVICE_ROLE_KEY que bypassa RLS
-- Não criar política de DELETE = ninguém pode deletar com RLS ativo

-- =============================================
-- PARTE 4: VERIFICAÇÕES
-- =============================================

DO $$
DECLARE
  policy_count INTEGER;
  user_record RECORD;
  rls_enabled BOOLEAN;
BEGIN
  -- Verificar se RLS está habilitado
  SELECT relrowsecurity INTO rls_enabled
  FROM pg_class
  WHERE relname = 'users';

  RAISE NOTICE '════════════════════════════════════════════════';
  RAISE NOTICE '✅ CORREÇÃO APLICADA COM SUCESSO!';
  RAISE NOTICE '════════════════════════════════════════════════';
  RAISE NOTICE '';

  -- Contar políticas
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'users';

  RAISE NOTICE '📊 RLS Status: %', CASE WHEN rls_enabled THEN 'HABILITADO ✅' ELSE 'DESABILITADO ❌' END;
  RAISE NOTICE '📊 Total de políticas: %', policy_count;
  RAISE NOTICE '';

  -- Listar políticas
  RAISE NOTICE '📋 Políticas criadas:';
  FOR user_record IN
    SELECT policyname, cmd
    FROM pg_policies
    WHERE tablename = 'users'
    ORDER BY policyname
  LOOP
    RAISE NOTICE '   - % (%)', user_record.policyname, user_record.cmd;
  END LOOP;

  RAISE NOTICE '';

  -- Verificar usuário teste
  SELECT * INTO user_record
  FROM public.users
  WHERE email = 'geisonhoehr.ai@gmail.com';

  IF FOUND THEN
    RAISE NOTICE '✅ Usuário teste configurado:';
    RAISE NOTICE '   Email: %', user_record.email;
    RAISE NOTICE '   Status: %', user_record.status;
    RAISE NOTICE '   Role: %', user_record.role;
    RAISE NOTICE '   Access Days: %', user_record.access_days;
    RAISE NOTICE '   Access Expires: %', user_record.access_expires_at;
  ELSE
    RAISE NOTICE '❌ Usuário teste NÃO encontrado!';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════';
  RAISE NOTICE '🎯 PRÓXIMOS PASSOS:';
  RAISE NOTICE '════════════════════════════════════════════════';
  RAISE NOTICE '1. Reinicie o servidor: npm run dev';
  RAISE NOTICE '2. Execute teste: node test-user-flow.js';
  RAISE NOTICE '3. Teste no navegador: http://localhost:3000/login';
  RAISE NOTICE '   Email: geisonhoehr.ai@gmail.com';
  RAISE NOTICE '   Senha: 123456';
  RAISE NOTICE '════════════════════════════════════════════════';
END $$;

-- =============================================
-- DOCUMENTAÇÃO FINAL
-- =============================================

-- COMO FUNCIONA:
--
-- 1. Políticas SIMPLES: Apenas auth.uid() = id
-- 2. SEM recursão, SEM subqueries, SEM EXISTS
-- 3. Usuários comuns: Veem e editam APENAS seu próprio perfil
-- 4. Admins: Usam SERVICE_ROLE_KEY que bypassa RLS
--
-- IMPORTANTE:
-- - Middleware usa SERVICE_ROLE_KEY (já configurado)
-- - APIs administrativas usam SERVICE_ROLE_KEY
-- - Cliente usa ANON_KEY com RLS ativo
-- - Sistema seguro e sem recursão!
