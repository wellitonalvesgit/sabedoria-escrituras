-- =====================================================
-- ADICIONAR CAMPO PRICE NA TABELA COURSES
-- Data: 2025-01-05
-- Descrição: Permite definir preço para cursos vendidos individualmente
-- =====================================================

-- Adicionar coluna price
ALTER TABLE courses
ADD COLUMN IF NOT EXISTS price DECIMAL(10,2);

-- Comentar a coluna
COMMENT ON COLUMN courses.price IS 'Preço do curso para venda individual (Arsenal Espiritual). NULL = não vendido separadamente';

-- Verificar se foi adicionado corretamente
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'courses' AND column_name = 'price';

