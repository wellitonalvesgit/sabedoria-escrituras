-- ============================================
-- MIGRATION: Adicionar campos de controle de acesso
-- Data: 2025-10-23
-- Descrição: Adiciona campos para controlar acesso dos usuários
-- ============================================

-- Adicionar novos campos na tabela users
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS access_days INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS access_expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
ADD COLUMN IF NOT EXISTS allowed_categories TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS blocked_categories TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS allowed_courses TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS blocked_courses TEXT[] DEFAULT '{}';

-- Criar índices para os novos campos
CREATE INDEX IF NOT EXISTS idx_users_access_expires_at ON public.users(access_expires_at);
CREATE INDEX IF NOT EXISTS idx_users_allowed_categories ON public.users USING GIN(allowed_categories);
CREATE INDEX IF NOT EXISTS idx_users_blocked_categories ON public.users USING GIN(blocked_categories);
CREATE INDEX IF NOT EXISTS idx_users_allowed_courses ON public.users USING GIN(allowed_courses);
CREATE INDEX IF NOT EXISTS idx_users_blocked_courses ON public.users USING GIN(blocked_courses);

-- Atualizar usuários existentes com valores padrão
UPDATE public.users
SET
  access_days = COALESCE(access_days, 30),
  access_expires_at = COALESCE(access_expires_at, NOW() + INTERVAL '30 days'),
  allowed_categories = COALESCE(allowed_categories, '{}'),
  blocked_categories = COALESCE(blocked_categories, '{}'),
  allowed_courses = COALESCE(allowed_courses, '{}'),
  blocked_courses = COALESCE(blocked_courses, '{}')
WHERE access_days IS NULL OR access_expires_at IS NULL;

-- Adicionar comentários
COMMENT ON COLUMN public.users.access_days IS 'Número de dias de acesso concedido ao usuário';
COMMENT ON COLUMN public.users.access_expires_at IS 'Data/hora de expiração do acesso do usuário';
COMMENT ON COLUMN public.users.allowed_categories IS 'Categorias que o usuário pode acessar (vazio = todas)';
COMMENT ON COLUMN public.users.blocked_categories IS 'Categorias bloqueadas para o usuário';
COMMENT ON COLUMN public.users.allowed_courses IS 'IDs dos cursos que o usuário pode acessar (vazio = todos)';
COMMENT ON COLUMN public.users.blocked_courses IS 'IDs dos cursos bloqueados para o usuário';

-- ============================================
-- FIM DA MIGRATION
-- ============================================
