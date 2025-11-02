-- Migration: Adicionar capas para volumes de PDF
-- Data: 2025-10-25
-- Descrição: Adiciona campo cover_url para permitir capas personalizadas nos volumes

-- Adicionar coluna cover_url
ALTER TABLE public.course_pdfs
ADD COLUMN IF NOT EXISTS cover_url TEXT;

-- Comentário explicativo
COMMENT ON COLUMN public.course_pdfs.cover_url IS
  'URL da imagem de capa do volume. Pode ser do Supabase Storage ou URL externa. Melhora a apresentação visual dos cards de volume.';

-- Índice para queries que buscam PDFs com capa
CREATE INDEX IF NOT EXISTS idx_course_pdfs_with_cover
ON public.course_pdfs(cover_url)
WHERE cover_url IS NOT NULL;

-- Exemplos de uso:
--
-- 1. Adicionar capa a um volume existente:
-- UPDATE public.course_pdfs
-- SET cover_url = 'https://aqvqpkmjdtzeoclndwhj.supabase.co/storage/v1/object/public/pdf-covers/genesis-capa.jpg'
-- WHERE id = 'uuid-do-pdf';
--
-- 2. Buscar volumes com capa:
-- SELECT * FROM public.course_pdfs WHERE cover_url IS NOT NULL;
--
-- 3. Contar volumes com/sem capa:
-- SELECT
--   COUNT(*) FILTER (WHERE cover_url IS NOT NULL) as com_capa,
--   COUNT(*) FILTER (WHERE cover_url IS NULL) as sem_capa
-- FROM public.course_pdfs;

-- Verificar resultado
SELECT
  id,
  title,
  volume,
  cover_url,
  CASE
    WHEN cover_url IS NOT NULL THEN '✅ Com capa'
    ELSE '⚠️ Sem capa'
  END as status_capa
FROM public.course_pdfs
ORDER BY created_at DESC
LIMIT 10;
