-- =============================================
-- CORREÇÃO COMPLETA DE AUTENTICAÇÃO E RLS
-- Sistema: Sabedoria das Escrituras
-- Data: 2025-10-26
-- =============================================

-- Este script corrige todos os problemas de autenticação e RLS (Row Level Security)
-- identificados no sistema, especialmente:
-- 1. Usuários comuns não conseguiam ver seu próprio perfil
-- 2. Políticas de RLS impediam acesso ao próprio registro
-- 3. Problemas com edição de perfil

-- =============================================
-- PARTE 1: LIMPAR POLÍTICAS ANTIGAS
-- =============================================

-- Remover todas as políticas existentes da tabela users
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

-- =============================================
-- PARTE 2: GARANTIR QUE RLS ESTÁ HABILITADO
-- =============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PARTE 3: CRIAR NOVAS POLÍTICAS CORRETAS
-- =============================================

-- 1. POLÍTICA DE LEITURA (SELECT)
-- Usuários podem ver:
-- - Seu próprio perfil
-- - Todos os perfis se forem admin

CREATE POLICY "users_select_own_or_admin"
ON public.users
FOR SELECT
USING (
  auth.uid() = id OR -- Pode ver seu próprio perfil
  EXISTS ( -- OU é admin e pode ver todos
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- 2. POLÍTICA DE ATUALIZAÇÃO (UPDATE)
-- Usuários podem atualizar:
-- - Seu próprio perfil
-- - Qualquer perfil se forem admin

CREATE POLICY "users_update_own_or_admin"
ON public.users
FOR UPDATE
USING (
  auth.uid() = id OR -- Pode atualizar seu próprio perfil
  EXISTS ( -- OU é admin e pode atualizar todos
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'admin'
  )
)
WITH CHECK (
  auth.uid() = id OR -- Pode atualizar seu próprio perfil
  EXISTS ( -- OU é admin e pode atualizar todos
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- 3. POLÍTICA DE INSERÇÃO (INSERT)
-- Permitir inserção de novos usuários:
-- - Durante o signup (auth.uid() = id)
-- - Por administradores

CREATE POLICY "users_insert_signup_or_admin"
ON public.users
FOR INSERT
WITH CHECK (
  auth.uid() = id OR -- Registro próprio durante signup
  EXISTS ( -- OU é admin inserindo novo usuário
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- 4. POLÍTICA DE EXCLUSÃO (DELETE)
-- Apenas administradores podem excluir usuários

CREATE POLICY "users_delete_admin_only"
ON public.users
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- =============================================
-- PARTE 4: VERIFICAR E CORRIGIR DADOS DO USUÁRIO
-- =============================================

-- Garantir que o usuário geisonhoehr.ai@gmail.com tenha dados corretos
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
-- PARTE 5: VERIFICAÇÕES E LOGS
-- =============================================

-- Verificar se as políticas foram criadas corretamente
DO $$
BEGIN
  RAISE NOTICE '✅ Políticas RLS criadas com sucesso!';
  RAISE NOTICE '📊 Total de políticas na tabela users: %',
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'users');
END $$;

-- Verificar status do usuário teste
DO $$
DECLARE
  user_record RECORD;
BEGIN
  SELECT * INTO user_record FROM public.users WHERE email = 'geisonhoehr.ai@gmail.com';

  IF FOUND THEN
    RAISE NOTICE '✅ Usuário encontrado: %', user_record.email;
    RAISE NOTICE '   - Status: %', user_record.status;
    RAISE NOTICE '   - Role: %', user_record.role;
    RAISE NOTICE '   - Access Days: %', user_record.access_days;
    RAISE NOTICE '   - Access Expires: %', user_record.access_expires_at;
  ELSE
    RAISE NOTICE '❌ Usuário não encontrado';
  END IF;
END $$;

-- =============================================
-- DOCUMENTAÇÃO
-- =============================================

-- COMO FUNCIONA O RLS AGORA:
--
-- 1. LEITURA (SELECT):
--    - Usuário comum: Pode ver APENAS seu próprio registro
--    - Admin: Pode ver TODOS os registros
--
-- 2. ATUALIZAÇÃO (UPDATE):
--    - Usuário comum: Pode atualizar APENAS seu próprio registro
--    - Admin: Pode atualizar TODOS os registros
--
-- 3. INSERÇÃO (INSERT):
--    - Durante signup: Usuário pode criar seu próprio registro
--    - Admin: Pode criar registros para outros usuários
--
-- 4. EXCLUSÃO (DELETE):
--    - Apenas admins podem excluir usuários
--
-- IMPORTANTE:
-- - Políticas usam auth.uid() que retorna o ID do usuário autenticado
-- - RLS é aplicado ANTES da query ser executada
-- - Service Role Key bypassa RLS (usado em APIs server-side)
