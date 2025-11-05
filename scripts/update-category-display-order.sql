-- =====================================================
-- ATUALIZAR ORDEM DE EXIBIÇÃO DAS CATEGORIAS
-- Data: 2025-01-05
-- Descrição: Definir ordem no dashboard:
--           1. Arsenal Espiritual (primeiro)
--           2. As Cartas de Paulo (segundo)
--           3. Bônus (terceiro)
-- =====================================================

-- Arsenal Espiritual: display_order = 1
UPDATE categories
SET display_order = 1
WHERE slug = 'arsenal-espiritual';

-- As Cartas de Paulo: display_order = 2
UPDATE categories
SET display_order = 2
WHERE slug = 'cartas-de-paulo';

-- Bônus: display_order = 3
UPDATE categories
SET display_order = 3
WHERE slug = 'bonus';

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Listar categorias na ordem final
SELECT 
  id,
  name,
  slug,
  display_order,
  color
FROM categories
WHERE slug IN ('arsenal-espiritual', 'cartas-de-paulo', 'bonus')
ORDER BY display_order;

