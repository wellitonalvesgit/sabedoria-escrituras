-- ============================================
-- REMOÇÃO: Sistema de Bloqueio por Categoria
-- Data: 2025-01-08
-- Descrição: Remove campos e lógica de bloqueio por categoria
-- ============================================

-- 1. Remover campos de categoria da tabela users
ALTER TABLE public.users 
DROP COLUMN IF EXISTS allowed_categories,
DROP COLUMN IF EXISTS blocked_categories;

-- 2. Remover índices relacionados
DROP INDEX IF EXISTS idx_users_allowed_categories;
DROP INDEX IF EXISTS idx_users_blocked_categories;

-- 3. Remover comentários dos campos
COMMENT ON COLUMN public.users.allowed_courses IS 'IDs dos cursos que o usuário pode acessar (vazio = todos)';
COMMENT ON COLUMN public.users.blocked_courses IS 'IDs dos cursos bloqueados para o usuário';

-- 4. Verificar se há dados para migrar (opcional)
-- Se houver usuários com allowed_categories ou blocked_categories,
-- você pode migrar para allowed_courses/blocked_courses se necessário

-- 5. Atualizar usuários existentes (se necessário)
-- UPDATE public.users 
-- SET allowed_courses = ARRAY[]::TEXT[],
--     blocked_courses = ARRAY[]::TEXT[]
-- WHERE allowed_courses IS NULL OR blocked_courses IS NULL;

-- ============================================
-- VERIFICAÇÃO PÓS-REMOÇÃO
-- ============================================

-- Verificar estrutura da tabela users
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar índices restantes
SELECT indexname, indexdef
FROM pg_indexes 
WHERE tablename = 'users' 
AND schemaname = 'public';

-- ============================================
-- FIM DA REMOÇÃO
-- ============================================
