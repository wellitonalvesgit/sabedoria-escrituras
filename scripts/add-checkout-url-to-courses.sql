-- Migration: Adicionar campo checkout_url na tabela courses
-- Data: 2025-01-05
-- Descrição: Permite que o admin configure uma URL de checkout (Corvex ou outra plataforma)
--            para quando o aluno quiser comprar o curso ou fazer upgrade de plano

-- Adicionar coluna checkout_url
ALTER TABLE courses
ADD COLUMN IF NOT EXISTS checkout_url TEXT;

-- Comentar a coluna
COMMENT ON COLUMN courses.checkout_url IS 'URL de checkout para compra do curso (Corvex, Stripe, etc)';

-- Verificar se foi adicionado corretamente
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'courses' AND column_name = 'checkout_url';
