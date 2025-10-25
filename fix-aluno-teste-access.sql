-- Atualizar acesso do usuário aluno@teste.com
-- Data: 2025-01-25
-- Descrição: Renovar acesso do usuário de teste por mais 1 ano

-- Atualizar data de expiração para 1 ano no futuro
UPDATE public.users
SET
  access_expires_at = NOW() + INTERVAL '1 year',
  access_days = 365,
  status = 'active',
  updated_at = NOW()
WHERE email = 'aluno@teste.com';

-- Verificar resultado
SELECT
  id,
  name,
  email,
  status,
  access_days,
  access_expires_at,
  allowed_categories,
  blocked_categories,
  allowed_courses,
  blocked_courses
FROM public.users
WHERE email = 'aluno@teste.com';
