-- Migration: Adicionar campos de mídia aos volumes (capas, áudio e vídeo)
-- Data: 2025-11-04
-- Descrição: Corrige campos faltantes para capas, áudio (MP3) e vídeo (YouTube) nos volumes

-- 1. Adicionar coluna cover_url (se não existir)
ALTER TABLE public.course_pdfs
ADD COLUMN IF NOT EXISTS cover_url TEXT;

COMMENT ON COLUMN public.course_pdfs.cover_url IS
  'URL da imagem de capa do volume. Pode ser do Supabase Storage ou URL externa.';

-- 2. Adicionar coluna youtube_url (se não existir)
ALTER TABLE public.course_pdfs
ADD COLUMN IF NOT EXISTS youtube_url TEXT;

COMMENT ON COLUMN public.course_pdfs.youtube_url IS
  'URL do vídeo do YouTube relacionado ao volume. Formato: https://www.youtube.com/watch?v=VIDEO_ID';

-- 3. Adicionar coluna audio_url (NOVO - para MP3)
ALTER TABLE public.course_pdfs
ADD COLUMN IF NOT EXISTS audio_url TEXT;

COMMENT ON COLUMN public.course_pdfs.audio_url IS
  'URL do arquivo de áudio MP3 do volume. Pode ser do Supabase Storage ou URL externa. Para narração ou áudiobook do conteúdo.';

-- 4. Criar índices para queries otimizadas
CREATE INDEX IF NOT EXISTS idx_course_pdfs_with_cover
ON public.course_pdfs(cover_url)
WHERE cover_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_course_pdfs_with_youtube
ON public.course_pdfs(youtube_url)
WHERE youtube_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_course_pdfs_with_audio
ON public.course_pdfs(audio_url)
WHERE audio_url IS NOT NULL;

-- 5. Verificar resultado
SELECT
  id,
  title,
  volume,
  CASE
    WHEN cover_url IS NOT NULL THEN '✅ Com capa'
    ELSE '⚠️ Sem capa'
  END as status_capa,
  CASE
    WHEN youtube_url IS NOT NULL THEN '✅ Com vídeo'
    ELSE '⚠️ Sem vídeo'
  END as status_video,
  CASE
    WHEN audio_url IS NOT NULL THEN '✅ Com áudio'
    ELSE '⚠️ Sem áudio'
  END as status_audio
FROM public.course_pdfs
ORDER BY created_at DESC
LIMIT 10;

-- 6. Estatísticas
SELECT
  COUNT(*) as total_volumes,
  COUNT(*) FILTER (WHERE cover_url IS NOT NULL) as volumes_com_capa,
  COUNT(*) FILTER (WHERE youtube_url IS NOT NULL) as volumes_com_video,
  COUNT(*) FILTER (WHERE audio_url IS NOT NULL) as volumes_com_audio,
  COUNT(*) FILTER (WHERE cover_url IS NOT NULL AND youtube_url IS NOT NULL AND audio_url IS NOT NULL) as volumes_completos
FROM public.course_pdfs;

-- ✅ PRONTO! Agora você pode:
-- - Fazer upload de capas via /api/upload/volume-cover
-- - Adicionar URLs de YouTube no admin
-- - Fazer upload de MP3 e adicionar URLs de áudio
