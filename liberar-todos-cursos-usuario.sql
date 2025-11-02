-- =============================================
-- LIBERAR TODOS OS CURSOS PARA USUÁRIO
-- =============================================

-- Este script adiciona TODOS os cursos ao array allowed_courses
-- do usuário geisonhoehr.ai@gmail.com

-- PASSO 1: Ver cursos atuais do usuário
SELECT
  email,
  array_length(allowed_courses, 1) as total_permitidos,
  array_length(blocked_courses, 1) as total_bloqueados
FROM users
WHERE email = 'geisonhoehr.ai@gmail.com';

-- PASSO 2: Atualizar usuário para ter acesso a TODOS os cursos
UPDATE users
SET
  allowed_courses = (
    SELECT array_agg(id::text)
    FROM courses
    WHERE status = 'published'
  ),
  blocked_courses = ARRAY[]::text[],
  updated_at = NOW()
WHERE email = 'geisonhoehr.ai@gmail.com';

-- PASSO 3: Verificar resultado
SELECT
  email,
  array_length(allowed_courses, 1) as total_permitidos,
  array_length(blocked_courses, 1) as total_bloqueados,
  status,
  access_expires_at
FROM users
WHERE email = 'geisonhoehr.ai@gmail.com';

-- PASSO 4: Ver lista de cursos liberados
WITH user_courses AS (
  SELECT unnest(allowed_courses) as course_id
  FROM users
  WHERE email = 'geisonhoehr.ai@gmail.com'
)
SELECT
  c.title,
  c.id::text as course_id,
  CASE
    WHEN EXISTS(SELECT 1 FROM user_courses uc WHERE uc.course_id = c.id::text)
    THEN '✅ LIBERADO'
    ELSE '🔒 BLOQUEADO'
  END as status_acesso
FROM courses c
WHERE c.status = 'published'
ORDER BY c.title;

-- =============================================
-- RESULTADO ESPERADO:
-- =============================================
-- O usuário deverá ter:
-- - total_permitidos: 22 (todos os cursos publicados)
-- - total_bloqueados: 0 (nenhum bloqueio)
-- - Todos os cursos com status "✅ LIBERADO"
