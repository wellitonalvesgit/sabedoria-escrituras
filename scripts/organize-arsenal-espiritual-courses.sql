-- =====================================================
-- ORGANIZAR CURSOS DO ARSENAL ESPIRITUAL
-- Data: 2025-01-05
-- Descrição: Consolida os 4 cursos corretos:
--           1. Pregador Premium
--           2. Unção do Leão
--           3. Mulher Cristã
--           4. Estudo do Apocalipse
-- =====================================================

-- ====================================
-- 1. CRIAR/RENOMEAR CURSO "MULHER CRISTÃ"
-- ====================================

-- Usar o curso "Kit da Mulher Cristã - EBOOK 1" como base e renomear
UPDATE courses
SET 
  title = 'Mulher Cristã',
  slug = 'mulher-crista',
  description = 'Curso completo para mulheres cristãs com estudos bíblicos, planner e devocionais mensais',
  price = 9.97
WHERE id = '742aba61-0125-4fb8-8a63-d7bf500fc445';

-- Mover volumes do "Kit da Mulher Cristã - EBOOK 2" para o curso principal
-- Ajustar display_order para continuar após os volumes do EBOOK 1
UPDATE course_pdfs
SET 
  course_id = '742aba61-0125-4fb8-8a63-d7bf500fc445',
  display_order = display_order + 4
WHERE course_id = 'f52b364a-7f76-4cac-807f-888b85929b5d';

-- Remover categoria do curso antigo "Kit da Mulher Cristã - EBOOK 2"
DELETE FROM course_categories
WHERE course_id = 'f52b364a-7f76-4cac-807f-888b85929b5d';

-- Arquivar o curso antigo
UPDATE courses
SET status = 'archived'
WHERE id = 'f52b364a-7f76-4cac-807f-888b85929b5d';

-- ====================================
-- 2. CRIAR/RENOMEAR CURSO "PREGADOR PREMIUM"
-- ====================================

-- Usar o curso "Kit do Pregador Premium - EBOOK" como base
UPDATE courses
SET 
  title = 'Pregador Premium',
  slug = 'pregador-premium',
  description = 'Curso completo para pregadores com estratégias de comunicação, exegese e desenvolvimento espiritual',
  price = 9.97
WHERE id = 'afa265fa-2600-48ca-9bd8-ff9aed8c5bcb';

-- Verificar se WORKS são volumes adicionais ou os mesmos volumes
-- Se forem volumes adicionais, mover para o curso principal
-- Se forem os mesmos volumes em formato diferente, podemos manter como está ou arquivar

-- Por enquanto, vamos mover os volumes do WORKS para o curso principal
-- Ajustar display_order para continuar após os volumes do EBOOK
UPDATE course_pdfs
SET 
  course_id = 'afa265fa-2600-48ca-9bd8-ff9aed8c5bcb',
  display_order = display_order + 7
WHERE course_id = '60e8a44f-3341-41b5-b826-a25aab57be15'
  AND volume NOT IN (
    SELECT volume FROM course_pdfs 
    WHERE course_id = 'afa265fa-2600-48ca-9bd8-ff9aed8c5bcb'
  );

-- Remover categoria do curso antigo "Kit do Pregador Premium - WORKS"
DELETE FROM course_categories
WHERE course_id = '60e8a44f-3341-41b5-b826-a25aab57be15';

-- Arquivar o curso antigo
UPDATE courses
SET status = 'archived'
WHERE id = '60e8a44f-3341-41b5-b826-a25aab57be15';

-- ====================================
-- 3. CRIAR/RENOMEAR CURSO "ESTUDO DO APOCALIPSE"
-- ====================================

-- Usar o curso "Ebooks Apocalipse Revelado - EBOOK" como base
UPDATE courses
SET 
  title = 'Estudo do Apocalipse',
  slug = 'estudo-do-apocalipse',
  description = 'Estudo completo do livro de Apocalipse com análises detalhadas e explicações',
  price = 9.97
WHERE id = '3d65d963-d3b8-4d42-a312-e82a73a1f563';

-- Remover categoria do curso "Ebooks Apocalipse Revelado - SLIDES"
DELETE FROM course_categories
WHERE course_id = '834bd26e-606f-46e5-b6e0-5ef7e0a06ff9';

-- Arquivar o curso de SLIDES (ou pode ser mantido como material adicional)
UPDATE courses
SET status = 'archived'
WHERE id = '834bd26e-606f-46e5-b6e0-5ef7e0a06ff9';

-- ====================================
-- 4. VERIFICAR E AJUSTAR "UNÇÃO DO LEÃO"
-- ====================================

-- Garantir que "Unção do Leão" está com preço correto
UPDATE courses
SET price = 9.97
WHERE id = '189a4f75-5aa6-4d6c-a74e-cede5cd47862';

-- ====================================
-- 5. CORRIGIR NUMERAÇÃO DOS VOLUMES DO MULHER CRISTÃ
-- ====================================

-- Renumerar volumes baseado no display_order para evitar duplicatas
UPDATE course_pdfs
SET volume = CASE display_order
  WHEN 0 THEN 'VOL-I'
  WHEN 1 THEN 'VOL-II'
  WHEN 2 THEN 'VOL-III'
  WHEN 3 THEN 'VOL-IV'
  WHEN 4 THEN 'VOL-V'
  WHEN 5 THEN 'VOL-VI'
  WHEN 6 THEN 'VOL-VII'
  WHEN 7 THEN 'VOL-VIII'
  WHEN 8 THEN 'VOL-IX'
  WHEN 9 THEN 'VOL-X'
  WHEN 10 THEN 'VOL-XI'
  WHEN 11 THEN 'VOL-XII'
  WHEN 12 THEN 'VOL-XIII'
  WHEN 13 THEN 'VOL-XIV'
  WHEN 14 THEN 'VOL-XV'
  WHEN 15 THEN 'VOL-XVI'
  ELSE volume
END
WHERE course_id = '742aba61-0125-4fb8-8a63-d7bf500fc445'
  AND display_order BETWEEN 0 AND 15;

-- ====================================
-- 6. REMOVER VOLUMES DUPLICADOS DO PREGADOR PREMIUM
-- ====================================

-- Remover volumes duplicados (manter apenas os primeiros)
DELETE FROM course_pdfs
WHERE id IN (
  SELECT cp2.id
  FROM course_pdfs cp1
  JOIN course_pdfs cp2 ON cp2.volume = cp1.volume 
    AND cp2.course_id = cp1.course_id
    AND cp2.title = cp1.title
  WHERE cp1.course_id = 'afa265fa-2600-48ca-9bd8-ff9aed8c5bcb'
    AND cp2.id > cp1.id
);

-- ====================================
-- 7. VERIFICAÇÃO FINAL
-- ====================================

-- Listar os 4 cursos do Arsenal Espiritual
SELECT 
  c.id,
  c.title,
  c.slug,
  c.price,
  COUNT(cp.id) AS total_volumes
FROM courses c
JOIN course_categories cc ON cc.course_id = c.id
JOIN categories cat ON cat.id = cc.category_id
LEFT JOIN course_pdfs cp ON cp.course_id = c.id
WHERE cat.slug = 'arsenal-espiritual'
  AND c.status = 'published'
GROUP BY c.id, c.title, c.slug, c.price
ORDER BY c.title;

