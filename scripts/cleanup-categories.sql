-- =====================================================
-- LIMPAR E ORGANIZAR CATEGORIAS
-- Data: 2025-01-05
-- Descrição: Migra todos os cursos para as 3 categorias principais
--            e remove categorias antigas
-- =====================================================

-- ====================================
-- 1. CORRIGIR CURSO DUPLICADO
-- ====================================
-- Remover "Estudos Bíblicos: Romanos, Coríntios, Apocalipse, Atos" do Arsenal Espiritual
-- (deve ficar apenas em "As Cartas de Paulo")

DELETE FROM course_categories
WHERE course_id = '1f237279-01e9-423e-a99e-16603f49ab7d'
  AND category_id = (
    SELECT id FROM categories WHERE slug = 'arsenal-espiritual'
  );

-- Atualizar o preço deste curso para NULL (não é vendido separadamente)
UPDATE courses
SET price = NULL
WHERE id = '1f237279-01e9-423e-a99e-16603f49ab7d';

-- ====================================
-- 2. MIGRAR CURSOS DAS CATEGORIAS ANTIGAS
-- ====================================

-- Mover cursos de "Panorama Bíblico" para "Bônus"
INSERT INTO course_categories (course_id, category_id)
SELECT 
  cc.course_id,
  (SELECT id FROM categories WHERE slug = 'bonus')
FROM course_categories cc
JOIN categories cat ON cat.id = cc.category_id
WHERE cat.slug = 'panorama-biblico'
  AND NOT EXISTS (
    SELECT 1 FROM course_categories cc2
    JOIN categories cat2 ON cat2.id = cc2.category_id
    WHERE cc2.course_id = cc.course_id
      AND cat2.slug = 'bonus'
  );

-- Mover cursos de "Novo Testamento" para "Bônus"
INSERT INTO course_categories (course_id, category_id)
SELECT 
  cc.course_id,
  (SELECT id FROM categories WHERE slug = 'bonus')
FROM course_categories cc
JOIN categories cat ON cat.id = cc.category_id
WHERE cat.slug = 'novo-testamento'
  AND NOT EXISTS (
    SELECT 1 FROM course_categories cc2
    JOIN categories cat2 ON cat2.id = cc2.category_id
    WHERE cc2.course_id = cc.course_id
      AND cat2.slug IN ('bonus', 'cartas-de-paulo', 'arsenal-espiritual')
  );

-- Mover cursos de "Antigo Testamento" para "Bônus"
INSERT INTO course_categories (course_id, category_id)
SELECT 
  cc.course_id,
  (SELECT id FROM categories WHERE slug = 'bonus')
FROM course_categories cc
JOIN categories cat ON cat.id = cc.category_id
WHERE cat.slug = 'antigo-testamento'
  AND NOT EXISTS (
    SELECT 1 FROM course_categories cc2
    JOIN categories cat2 ON cat2.id = cc2.category_id
    WHERE cc2.course_id = cc.course_id
      AND cat2.slug IN ('bonus', 'cartas-de-paulo', 'arsenal-espiritual')
  );

-- Mover cursos de "Parábolas" para "Bônus"
INSERT INTO course_categories (course_id, category_id)
SELECT 
  cc.course_id,
  (SELECT id FROM categories WHERE slug = 'bonus')
FROM course_categories cc
JOIN categories cat ON cat.id = cc.category_id
WHERE cat.slug = 'parabolas'
  AND NOT EXISTS (
    SELECT 1 FROM course_categories cc2
    JOIN categories cat2 ON cat2.id = cc2.category_id
    WHERE cc2.course_id = cc.course_id
      AND cat2.slug IN ('bonus', 'cartas-de-paulo', 'arsenal-espiritual')
  );

-- Mover cursos de "Epístolas" para "Bônus" (ou "Cartas de Paulo" se for sobre Paulo)
INSERT INTO course_categories (course_id, category_id)
SELECT 
  cc.course_id,
  CASE 
    WHEN c.title ILIKE '%paulo%' OR c.title ILIKE '%cartas%' THEN
      (SELECT id FROM categories WHERE slug = 'cartas-de-paulo')
    ELSE
      (SELECT id FROM categories WHERE slug = 'bonus')
  END
FROM course_categories cc
JOIN categories cat ON cat.id = cc.category_id
JOIN courses c ON c.id = cc.course_id
WHERE cat.slug = 'epistolas'
  AND NOT EXISTS (
    SELECT 1 FROM course_categories cc2
    JOIN categories cat2 ON cat2.id = cc2.category_id
    WHERE cc2.course_id = cc.course_id
      AND cat2.slug IN ('bonus', 'cartas-de-paulo', 'arsenal-espiritual')
  );

-- Mover cursos de "Salmos e Sabedoria" para "Bônus"
INSERT INTO course_categories (course_id, category_id)
SELECT 
  cc.course_id,
  (SELECT id FROM categories WHERE slug = 'bonus')
FROM course_categories cc
JOIN categories cat ON cat.id = cc.category_id
WHERE cat.slug = 'salmos-sabedoria'
  AND NOT EXISTS (
    SELECT 1 FROM course_categories cc2
    JOIN categories cat2 ON cat2.id = cc2.category_id
    WHERE cc2.course_id = cc.course_id
      AND cat2.slug IN ('bonus', 'cartas-de-paulo', 'arsenal-espiritual')
  );

-- Mover cursos de "Evangelhos" para "Bônus"
INSERT INTO course_categories (course_id, category_id)
SELECT 
  cc.course_id,
  (SELECT id FROM categories WHERE slug = 'bonus')
FROM course_categories cc
JOIN categories cat ON cat.id = cc.category_id
WHERE cat.slug = 'evangelhos'
  AND NOT EXISTS (
    SELECT 1 FROM course_categories cc2
    JOIN categories cat2 ON cat2.id = cc2.category_id
    WHERE cc2.course_id = cc.course_id
      AND cat2.slug IN ('bonus', 'cartas-de-paulo', 'arsenal-espiritual')
  );

-- ====================================
-- 3. REMOVER CATEGORIZAÇÕES ANTIGAS
-- ====================================

DELETE FROM course_categories
WHERE category_id IN (
  SELECT id FROM categories 
  WHERE slug NOT IN ('cartas-de-paulo', 'bonus', 'arsenal-espiritual')
);

-- ====================================
-- 4. VERIFICAÇÃO FINAL
-- ====================================

-- Listar cursos por categoria (apenas as 3 principais)
SELECT 
  cat.name AS categoria,
  cat.slug,
  COUNT(DISTINCT c.id) AS total_cursos,
  STRING_AGG(c.title, ' | ' ORDER BY c.title) AS cursos
FROM categories cat
LEFT JOIN course_categories cc ON cc.category_id = cat.id
LEFT JOIN courses c ON c.id = cc.course_id
WHERE cat.slug IN ('cartas-de-paulo', 'arsenal-espiritual', 'bonus')
  AND c.status = 'published'
GROUP BY cat.id, cat.name, cat.slug, cat.display_order
ORDER BY cat.display_order;

-- Verificar se há cursos sem categoria
SELECT 
  c.id,
  c.title,
  c.slug
FROM courses c
WHERE c.status = 'published'
  AND c.id NOT IN (
    SELECT DISTINCT course_id 
    FROM course_categories
    WHERE course_id IS NOT NULL
  )
ORDER BY c.title;

