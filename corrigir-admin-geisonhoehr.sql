-- =============================================
-- CORREÇÃO URGENTE: Restaurar Admin geisonhoehr@gmail.com
-- Data: 2025-10-27
-- Problema: Usuário perdeu role de admin
-- =============================================

-- Verificar estado atual do usuário
SELECT
  id,
  email,
  name,
  role,
  status,
  access_expires_at,
  allowed_courses,
  created_at,
  updated_at
FROM public.users
WHERE email = 'geisonhoehr@gmail.com';

-- =============================================
-- CORREÇÃO 1: Restaurar role admin e status
-- =============================================

UPDATE public.users
SET
  role = 'admin',
  status = 'active',
  access_expires_at = NOW() + INTERVAL '10 years',
  access_days = 3650,
  updated_at = NOW()
WHERE email = 'geisonhoehr@gmail.com';

-- =============================================
-- VERIFICAÇÃO FINAL
-- =============================================

SELECT
  id,
  email,
  name,
  role,
  status,
  access_expires_at,
  'ADMIN RESTAURADO' as resultado
FROM public.users
WHERE email = 'geisonhoehr@gmail.com';

-- =============================================
-- RESULTADO ESPERADO:
-- =============================================
-- role: admin
-- status: active
-- access_expires_at: 2035-10-27 (10 anos)
-- =============================================
