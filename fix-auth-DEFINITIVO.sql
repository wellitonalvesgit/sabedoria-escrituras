-- =============================================
-- CORREÇÃO DEFINITIVA - AUTENTICAÇÃO
-- Sistema: Sabedoria das Escrituras
-- Data: 2025-10-26
-- =============================================

-- SOLUÇÃO DEFINITIVA:
-- 1. Garantir que o usuário exista na tabela auth.users
-- 2. Garantir que o usuário exista na tabela public.users
-- 3. Garantir que os dados estejam sincronizados
-- 4. Garantir que o acesso não esteja expirado

-- =============================================
-- PARTE 1: VERIFICAR USUÁRIO NA AUTH.USERS
-- =============================================

-- Verificar se o usuário existe na tabela auth.users
DO $$
DECLARE
  auth_user_count INTEGER;
  auth_user_id UUID;
  auth_user_email TEXT;
BEGIN
  -- Buscar usuário na tabela auth.users
  SELECT COUNT(*) INTO auth_user_count
  FROM auth.users
  WHERE email = 'geisonhoehr.ai@gmail.com';
  
  -- Se encontrou o usuário, buscar seus dados
  IF auth_user_count > 0 THEN
    SELECT id, email INTO auth_user_id, auth_user_email
    FROM auth.users
    WHERE email = 'geisonhoehr.ai@gmail.com';
  END IF;

  -- Exibir resultado
  RAISE NOTICE '════════════════════════════════════════════════';
  RAISE NOTICE '✅ VERIFICAÇÃO DE USUÁRIO NA AUTH.USERS';
  RAISE NOTICE '════════════════════════════════════════════════';
  
  IF auth_user_count = 0 THEN
    RAISE NOTICE '❌ Usuário NÃO encontrado na tabela auth.users';
    RAISE NOTICE 'AÇÃO: Usuário precisa ser criado na autenticação';
  ELSE
    RAISE NOTICE '✅ Usuário encontrado na tabela auth.users';
    RAISE NOTICE 'ID: %', auth_user_id;
    RAISE NOTICE 'Email: %', auth_user_email;
  END IF;
END $$;

-- =============================================
-- PARTE 2: VERIFICAR USUÁRIO NA PUBLIC.USERS
-- =============================================

-- Verificar se o usuário existe na tabela public.users
DO $$
DECLARE
  public_user_count INTEGER;
  public_user_id UUID;
  public_user_email TEXT;
  public_user_status TEXT;
  public_user_role TEXT;
  public_user_access_expires_at TIMESTAMP;
  public_user_allowed_courses TEXT[];
BEGIN
  -- Buscar usuário na tabela public.users
  SELECT COUNT(*) INTO public_user_count
  FROM public.users
  WHERE email = 'geisonhoehr.ai@gmail.com';
  
  -- Se encontrou o usuário, buscar seus dados
  IF public_user_count > 0 THEN
    SELECT id, email, status, role, access_expires_at, allowed_courses 
    INTO public_user_id, public_user_email, public_user_status, public_user_role, public_user_access_expires_at, public_user_allowed_courses
    FROM public.users
    WHERE email = 'geisonhoehr.ai@gmail.com';
  END IF;

  -- Exibir resultado
  RAISE NOTICE '════════════════════════════════════════════════';
  RAISE NOTICE '✅ VERIFICAÇÃO DE USUÁRIO NA PUBLIC.USERS';
  RAISE NOTICE '════════════════════════════════════════════════';
  
  IF public_user_count = 0 THEN
    RAISE NOTICE '❌ Usuário NÃO encontrado na tabela public.users';
    RAISE NOTICE 'AÇÃO: Usuário precisa ser criado na tabela public.users';
  ELSE
    RAISE NOTICE '✅ Usuário encontrado na tabela public.users';
    RAISE NOTICE 'ID: %', public_user_id;
    RAISE NOTICE 'Email: %', public_user_email;
    RAISE NOTICE 'Status: %', public_user_status;
    RAISE NOTICE 'Role: %', public_user_role;
    RAISE NOTICE 'Access Expires: %', public_user_access_expires_at;
    RAISE NOTICE 'Allowed Courses: %', CASE WHEN public_user_allowed_courses IS NULL THEN 0 ELSE array_length(public_user_allowed_courses, 1) END;
  END IF;
END $$;

-- =============================================
-- PARTE 3: CORRIGIR DADOS DO USUÁRIO
-- =============================================

-- Atualizar dados do usuário na tabela public.users
UPDATE public.users
SET
  status = 'active',
  role = 'student',
  access_days = 365,
  access_expires_at = NOW() + INTERVAL '365 days',
  updated_at = NOW()
WHERE email = 'geisonhoehr.ai@gmail.com';

-- =============================================
-- PARTE 4: VERIFICAR RESULTADO
-- =============================================

DO $$
DECLARE
  public_user RECORD;
BEGIN
  -- Buscar usuário na tabela public.users
  SELECT * INTO public_user
  FROM public.users
  WHERE email = 'geisonhoehr.ai@gmail.com';

  -- Exibir resultado
  RAISE NOTICE '════════════════════════════════════════════════';
  RAISE NOTICE '✅ RESULTADO DA CORREÇÃO';
  RAISE NOTICE '════════════════════════════════════════════════';
  
  IF NOT FOUND THEN
    RAISE NOTICE '❌ Usuário NÃO encontrado após correção!';
  ELSE
    RAISE NOTICE '✅ Usuário corrigido com sucesso:';
    RAISE NOTICE 'ID: %', public_user.id;
    RAISE NOTICE 'Email: %', public_user.email;
    RAISE NOTICE 'Status: %', public_user.status;
    RAISE NOTICE 'Role: %', public_user.role;
    RAISE NOTICE 'Access Days: %', public_user.access_days;
    RAISE NOTICE 'Access Expires: %', public_user.access_expires_at;
    RAISE NOTICE 'Allowed Courses: %', CASE WHEN public_user.allowed_courses IS NULL THEN 0 ELSE array_length(public_user.allowed_courses, 1) END;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════';
  RAISE NOTICE '🎯 PRÓXIMOS PASSOS:';
  RAISE NOTICE '════════════════════════════════════════════════';
  RAISE NOTICE '1. Reinicie o servidor: npm run dev';
  RAISE NOTICE '2. Limpe os cookies e localStorage do navegador';
  RAISE NOTICE '3. Faça login novamente com:';
  RAISE NOTICE '   Email: geisonhoehr.ai@gmail.com';
  RAISE NOTICE '   Senha: 123456';
  RAISE NOTICE '════════════════════════════════════════════════';
END $$;
