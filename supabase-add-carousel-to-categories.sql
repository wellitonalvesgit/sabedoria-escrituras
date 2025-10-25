-- Migration: Adicionar visualização em carrossel para categorias
-- Data: 2025-10-25
-- Descrição: Adiciona campo display_as_carousel para permitir que o admin
--            escolha exibir os cursos de uma categoria em formato carrossel

-- Adicionar coluna display_as_carousel
ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS display_as_carousel BOOLEAN NOT NULL DEFAULT false;

-- Comentário explicativo
COMMENT ON COLUMN public.categories.display_as_carousel IS
  'Quando true, os cursos desta categoria serão exibidos em carrossel na página pública. Ideal para categorias com muitos cursos.';

-- Índice para melhorar performance de queries que filtram por este campo
CREATE INDEX IF NOT EXISTS idx_categories_display_as_carousel
ON public.categories(display_as_carousel)
WHERE display_as_carousel = true;

-- Exemplo de uso: Marcar categoria "Antigo Testamento" para exibir em carrossel
-- UPDATE public.categories
-- SET display_as_carousel = true
-- WHERE slug = 'antigo-testamento';
