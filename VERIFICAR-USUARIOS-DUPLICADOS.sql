-- =============================================
-- VERIFICAR USUÁRIOS DUPLICADOS - Geison Hoehr
-- Data: 2025-10-27
-- =============================================

-- Ver todos os usuários com nome parecido
SELECT
  id,
  email,
  name,
  role,
  status,
  created_at,
  updated_at,
  CASE
    WHEN role = 'admin' THEN '✅ ADMIN'
    ELSE '❌ STUDENT'
  END as tipo
FROM public.users
WHERE name ILIKE '%Geison%' OR email ILIKE '%geison%'
ORDER BY role DESC, created_at ASC;

-- =============================================
-- ANÁLISE:
-- =============================================
-- Se houver 2 usuários:
-- 1. Identifique qual email você usa para login
-- 2. Esse email DEVE ter role = 'admin'
-- 3. Se o email errado tem admin, corrija!
-- =============================================

-- =============================================
-- CORREÇÃO SE NECESSÁRIO:
-- =============================================
-- Descomente e execute apenas a linha correta:

-- Opção A: Se geisonhoehr@gmail.com deve ser admin:
-- UPDATE public.users SET role = 'admin' WHERE email = 'geisonhoehr@gmail.com';

-- Opção B: Se geisonhoehr.ai@gmail.com deve ser admin:
-- UPDATE public.users SET role = 'admin' WHERE email = 'geisonhoehr.ai@gmail.com';

-- =============================================
-- VERIFICAÇÃO FINAL:
-- =============================================
SELECT
  email,
  role,
  status,
  '✅ CORRIGIDO' as resultado
FROM public.users
WHERE name ILIKE '%Geison%'
ORDER BY role DESC;
