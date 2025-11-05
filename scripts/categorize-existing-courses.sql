-- =====================================================
-- CATEGORIZAR CURSOS EXISTENTES
-- =====================================================
-- Execute este SQL no Supabase para categorizar os cursos

-- Primeiro, limpar categorizações antigas (se existirem)
-- DELETE FROM course_categories WHERE course_id IN (SELECT id FROM courses);

-- ====================================
-- CATEGORIA: CARTAS DE PAULO (Curso principal/carro-chefe)
-- ====================================
-- Cursos sobre cartas paulinas

-- Exemplo: Mapas Mentais: Cartas Paulinas
INSERT INTO course_categories (course_id, category_id)
SELECT
  c.id,
  cat.id
FROM courses c
CROSS JOIN categories cat
WHERE cat.slug = 'cartas-de-paulo'
  AND (
    c.title ILIKE '%cartas paulinas%'
    OR c.title ILIKE '%paulo%'
    OR c.title ILIKE '%romanos%'
    OR c.title ILIKE '%coríntios%'
    OR c.title ILIKE '%filipenses%'
    OR c.title ILIKE '%efésios%'
    OR c.title ILIKE '%colossenses%'
    OR c.title ILIKE '%tessalonicenses%'
    OR c.title ILIKE '%timóteo%'
    OR c.title ILIKE '%tito%'
    OR c.title ILIKE '%filemom%'
  )
  AND NOT EXISTS (
    SELECT 1 FROM course_categories cc
    WHERE cc.course_id = c.id AND cc.category_id = cat.id
  );

-- ====================================
-- CATEGORIA: ARSENAL ESPIRITUAL (E-books vendidos separadamente)
-- ====================================
-- Os 4 cursos que são vendidos individualmente (order bumps):
-- 1. Pregador Premium
-- 2. Unção do Leão
-- 3. Mulher Cristã
-- 4. Estudo do Apocalipse

INSERT INTO course_categories (course_id, category_id)
SELECT
  c.id,
  cat.id
FROM courses c
CROSS JOIN categories cat
WHERE cat.slug = 'arsenal-espiritual'
  AND (
    c.title ILIKE '%pregador premium%'
    OR c.title ILIKE '%unção do leão%'
    OR c.title ILIKE '%mulher cristã%'
    OR c.title ILIKE '%estudo do apocalipse%'
    OR c.title ILIKE '%apocalipse%' -- Pode ser "Estudos Bíblicos: ... Apocalipse"
  )
  AND NOT EXISTS (
    SELECT 1 FROM course_categories cc
    WHERE cc.course_id = c.id AND cc.category_id = cat.id
  );

-- ====================================
-- CATEGORIA: BÔNUS (Todos os outros cursos)
-- ====================================
-- Cursos que não são "Cartas de Paulo" nem "Arsenal Espiritual"

INSERT INTO course_categories (course_id, category_id)
SELECT
  c.id,
  cat.id
FROM courses c
CROSS JOIN categories cat
WHERE cat.slug = 'bonus'
  AND c.id NOT IN (
    -- Excluir cursos já categorizados
    SELECT course_id FROM course_categories
  )
  AND NOT EXISTS (
    SELECT 1 FROM course_categories cc
    WHERE cc.course_id = c.id AND cc.category_id = cat.id
  );

-- ====================================
-- VERIFICAÇÃO: Listar cursos por categoria
-- ====================================

SELECT
  cat.name AS categoria,
  cat.slug,
  COUNT(DISTINCT c.id) AS total_cursos,
  STRING_AGG(c.title, ' | ' ORDER BY c.title) AS cursos
FROM categories cat
LEFT JOIN course_categories cc ON cc.category_id = cat.id
LEFT JOIN courses c ON c.id = cc.course_id
WHERE cat.slug IN ('cartas-de-paulo', 'arsenal-espiritual', 'bonus')
GROUP BY cat.id, cat.name, cat.slug, cat.display_order
ORDER BY cat.display_order;

-- ====================================
-- LISTAR CURSOS SEM CATEGORIA (para revisão manual)
-- ====================================

SELECT
  c.id,
  c.title,
  c.slug
FROM courses c
WHERE c.id NOT IN (
  SELECT DISTINCT course_id FROM course_categories
)
ORDER BY c.title;

-- ====================================
-- MENSAGEM FINAL
-- ====================================

DO $$
BEGIN
  RAISE NOTICE '✅ Categorização concluída!';
  RAISE NOTICE '📚 Verifique os resultados acima';
  RAISE NOTICE '⚠️ Cursos sem categoria devem ser categorizados manualmente';
END $$;
