-- =====================================================
-- REMOVER CATEGORIAS SEM CURSOS
-- Data: 2025-01-05
-- Descrição: Excluir categorias que não têm cursos associados
-- =====================================================

-- Remover categorias vazias identificadas:
-- 1. Salmos e Sabedoria
-- 2. Epístolas
-- 3. Parábolas

DELETE FROM categories
WHERE id IN (
  'e11191b8-e1a5-44a3-8fc6-ca7e4cb058e1', -- Salmos e Sabedoria
  '2e4c535e-0dac-4632-a438-a206500579ea', -- Epístolas
  'd427c965-ca53-4fd1-9f41-a41586fc0e0f'  -- Parábolas
);

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Listar categorias restantes com quantidade de cursos
SELECT 
  c.id,
  c.name,
  c.slug,
  c.display_order,
  COUNT(cc.course_id) AS total_cursos
FROM categories c
LEFT JOIN course_categories cc ON cc.category_id = c.id
GROUP BY c.id, c.name, c.slug, c.display_order
ORDER BY c.display_order, c.name;

