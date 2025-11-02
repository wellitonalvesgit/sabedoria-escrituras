-- ============================================
-- VINCULAR CURSOS ÀS CATEGORIAS
-- Data: 2025-01-08
-- Descrição: Vincular cursos às suas categorias específicas
-- ============================================

-- 1. Primeiro, vamos ver os cursos existentes
-- SELECT id, title, slug FROM public.courses ORDER BY title;

-- 2. Buscar IDs das categorias
-- SELECT id, name, slug FROM public.categories ORDER BY display_order;

-- 3. Vincular cursos às categorias baseado na similaridade

-- ============================================
-- PANORAMA BÍBLICO
-- ============================================
-- Cursos de visão geral ou introdução bíblica
INSERT INTO public.course_categories (course_id, category_id)
SELECT 
  c.id AS course_id,
  cat.id AS category_id
FROM public.courses c
CROSS JOIN public.categories cat
WHERE cat.slug = 'panorama-biblico'
  AND (
    c.title ILIKE '%panorama%' OR
    c.title ILIKE '%introdução%' OR
    c.title ILIKE '%visão geral%' OR
    c.title ILIKE '%bíblia completa%'
  )
ON CONFLICT DO NOTHING;

-- ============================================
-- NOVO TESTAMENTO
-- ============================================
-- Cursos sobre livros do Novo Testamento
INSERT INTO public.course_categories (course_id, category_id)
SELECT 
  c.id AS course_id,
  cat.id AS category_id
FROM public.courses c
CROSS JOIN public.categories cat
WHERE cat.slug = 'novo-testamento'
  AND (
    c.title ILIKE '%romanos%' OR
    c.title ILIKE '%coríntios%' OR
    c.title ILIKE '%gálatas%' OR
    c.title ILIKE '%efésios%' OR
    c.title ILIKE '%filipenses%' OR
    c.title ILIKE '%colossenses%' OR
    c.title ILIKE '%tessalonicenses%' OR
    c.title ILIKE '%timóteo%' OR
    c.title ILIKE '%tito%' OR
    c.title ILIKE '%filemom%' OR
    c.title ILIKE '%hebreus%' OR
    c.title ILIKE '%tiago%' OR
    c.title ILIKE '%pedro%' OR
    c.title ILIKE '%joão%' OR
    c.title ILIKE '%judas%' OR
    c.title ILIKE '%apocalipse%' OR
    c.title ILIKE '%carta%' OR
    c.title ILIKE '%epístola%'
  )
  AND c.title NOT ILIKE '%evangelho%'  -- Evitar duplicação
  AND c.title NOT ILIKE '%parábola%'   -- Evitar duplicação
ON CONFLICT DO NOTHING;

-- ============================================
-- ANTIGO TESTAMENTO
-- ============================================
-- Cursos sobre livros do Antigo Testamento
INSERT INTO public.course_categories (course_id, category_id)
SELECT 
  c.id AS course_id,
  cat.id AS category_id
FROM public.courses c
CROSS JOIN public.categories cat
WHERE cat.slug = 'antigo-testamento'
  AND (
    c.title ILIKE '%gênesis%' OR
    c.title ILIKE '%êxodo%' OR
    c.title ILIKE '%levítico%' OR
    c.title ILIKE '%números%' OR
    c.title ILIKE '%deuteronômio%' OR
    c.title ILIKE '%josué%' OR
    c.title ILIKE '%juízes%' OR
    c.title ILIKE '%rute%' OR
    c.title ILIKE '%samuel%' OR
    c.title ILIKE '%reis%' OR
    c.title ILIKE '%crônicas%' OR
    c.title ILIKE '%esdras%' OR
    c.title ILIKE '%neemias%' OR
    c.title ILIKE '%ester%' OR
    c.title ILIKE '%pentateuco%' OR
    c.title ILIKE '%torah%'
  )
ON CONFLICT DO NOTHING;

-- ============================================
-- PARÁBOLAS
-- ============================================
-- Cursos sobre parábolas de Jesus
INSERT INTO public.course_categories (course_id, category_id)
SELECT 
  c.id AS course_id,
  cat.id AS category_id
FROM public.courses c
CROSS JOIN public.categories cat
WHERE cat.slug = 'parabolas'
  AND (
    c.title ILIKE '%parábola%' OR
    c.title ILIKE '%parabola%' OR
    c.title ILIKE '%semente%' OR
    c.title ILIKE '%trigo%' OR
    c.title ILIKE '%joio%' OR
    c.title ILIKE '%joio%' OR
    c.title ILIKE '%tesouro%' OR
    c.title ILIKE '%pérola%' OR
    c.title ILIKE '%rede%' OR
    c.title ILIKE '%fermento%' OR
    c.title ILIKE '%grão%' OR
    c.title ILIKE '%perdido%' OR
    c.title ILIKE '%joio%' OR
    c.title ILIKE '%filho%' OR
    c.title ILIKE '%emprestado%' OR
    c.title ILIKE '%patrão%' OR
    c.title ILIKE '%bom samaritano%' OR
    c.title ILIKE '%rico%' OR
    c.title ILIKE '%lázaro%' OR
    c.title ILIKE '%dois filhos%' OR
    c.title ILIKE '%10 virgens%' OR
    c.title ILIKE '%talento%'
  )
ON CONFLICT DO NOTHING;

-- ============================================
-- EPÍSTOLAS
-- ============================================
-- Cursos sobre cartas apostólicas (mais específico)
INSERT INTO public.course_categories (course_id, category_id)
SELECT 
  c.id AS course_id,
  cat.id AS category_id
FROM public.courses c
CROSS JOIN public.categories cat
WHERE cat.slug = 'epistolas'
  AND (
    c.title ILIKE '%epístola aos%' OR
    c.title ILIKE '%carta aos%' OR
    c.title ILIKE '%cartas paulinas%' OR
    c.title ILIKE '%cartas gerais%' OR
    c.title ILIKE '%primeira carta%' OR
    c.title ILIKE '%segunda carta%' OR
    c.title ILIKE '%terceira carta%'
  )
ON CONFLICT DO NOTHING;

-- ============================================
-- PROFETAS
-- ============================================
-- Cursos sobre livros proféticos
INSERT INTO public.course_categories (course_id, category_id)
SELECT 
  c.id AS course_id,
  cat.id AS category_id
FROM public.courses c
CROSS JOIN public.categories cat
WHERE cat.slug = 'profetas'
  AND (
    c.title ILIKE '%isaías%' OR
    c.title ILIKE '%jeremias%' OR
    c.title ILIKE '%lamentações%' OR
    c.title ILIKE '%ezequiel%' OR
    c.title ILIKE '%daniel%' OR
    c.title ILIKE '%oséias%' OR
    c.title ILIKE '%joel%' OR
    c.title ILIKE '%amos%' OR
    c.title ILIKE '%obadias%' OR
    c.title ILIKE '%jonas%' OR
    c.title ILIKE '%miqueias%' OR
    c.title ILIKE '%naum%' OR
    c.title ILIKE '%habacuque%' OR
    c.title ILIKE '%sofonias%' OR
    c.title ILIKE '%ageu%' OR
    c.title ILIKE '%zacarias%' OR
    c.title ILIKE '%malaquias%' OR
    c.title ILIKE '%profeta%' OR
    c.title ILIKE '%profecia%'
  )
ON CONFLICT DO NOTHING;

-- ============================================
-- SALMOS E SABEDORIA
-- ============================================
-- Cursos sobre literatura sapiencial
INSERT INTO public.course_categories (course_id, category_id)
SELECT 
  c.id AS course_id,
  cat.id AS category_id
FROM public.courses c
CROSS JOIN public.categories cat
WHERE cat.slug = 'salmos-sabedoria'
  AND (
    c.title ILIKE '%salmos%' OR
    c.title ILIKE '%salmo%' OR
    c.title ILIKE '%provérbios%' OR
    c.title ILIKE '%eclesiastes%' OR
    c.title ILIKE '%cantares%' OR
    c.title ILIKE '%cantar%' OR
    c.title ILIKE '%jó%' OR
    c.title ILIKE '%sabedoria%' OR
    c.title ILIKE '%sapiência%' OR
    c.title ILIKE '%poesia%' OR
    c.title ILIKE '%literatura sapiencial%'
  )
ON CONFLICT DO NOTHING;

-- ============================================
-- EVANGELHOS
-- ============================================
-- Cursos sobre os evangelhos e vida de Jesus
INSERT INTO public.course_categories (course_id, category_id)
SELECT 
  c.id AS course_id,
  cat.id AS category_id
FROM public.courses c
CROSS JOIN public.categories cat
WHERE cat.slug = 'evangelhos'
  AND (
    c.title ILIKE '%mateus%' OR
    c.title ILIKE '%marcos%' OR
    c.title ILIKE '%lucas%' OR
    c.title ILIKE '%joão%' OR
    c.title ILIKE '%evangelho%' OR
    c.title ILIKE '%jesus%' OR
    c.title ILIKE '%cristo%' OR
    c.title ILIKE '%nascimento%' OR
    c.title ILIKE '%ministério%' OR
    c.title ILIKE '%crucificação%' OR
    c.title ILIKE '%ressurreição%' OR
    c.title ILIKE '%vida de jesus%' OR
    c.title ILIKE '%história de jesus%'
  )
  AND c.title NOT ILIKE '%epístola%'  -- Evitar duplicação
  AND c.title NOT ILIKE '%carta%'     -- Evitar duplicação
ON CONFLICT DO NOTHING;

-- ============================================
-- VERIFICAÇÃO
-- ============================================
-- Verificar cursos vinculados às categorias
SELECT 
  cat.name AS categoria,
  cat.slug,
  COUNT(cc.course_id) AS total_cursos,
  STRING_AGG(c.title, ', ' ORDER BY c.title) AS cursos
FROM public.categories cat
LEFT JOIN public.course_categories cc ON cat.id = cc.category_id
LEFT JOIN public.courses c ON cc.course_id = c.id
GROUP BY cat.id, cat.name, cat.slug
ORDER BY cat.display_order;

-- ============================================
-- LIMPAR VÍNCULOS ANTIGOS (SE NECESSÁRIO)
-- ============================================
-- Para limpar todos os vínculos e recomeçar:
-- TRUNCATE TABLE public.course_categories;

-- ============================================
-- FIM
-- ============================================
