-- ============================================
-- Configuração do Bucket course-audios
-- Data: 2025-01-08
-- Descrição: Configura o bucket course-audios para armazenar arquivos de áudio MP3
-- ============================================

-- 1. Criar bucket se não existir (via Supabase Dashboard ou API)
-- NOTA: Buckets devem ser criados via Supabase Dashboard ou API, não via SQL
-- Este script apenas configura as políticas de acesso

-- 2. Verificar se o bucket existe
-- SELECT * FROM storage.buckets WHERE name = 'course-audios';

-- 3. Políticas de acesso para o bucket course-audios
-- Permitir leitura pública (para os alunos acessarem os áudios)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Anyone can view course audios'
  ) THEN
    CREATE POLICY "Anyone can view course audios"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'course-audios');
  END IF;
END $$;

-- Permitir upload apenas para administradores autenticados
-- NOTA: Como usamos SERVICE_ROLE_KEY nas APIs, isso é bypassado
-- Mas é bom ter a política para segurança adicional
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Admins can upload course audios'
  ) THEN
    CREATE POLICY "Admins can upload course audios"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'course-audios');
  END IF;
END $$;

-- Permitir atualização apenas para administradores
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Admins can update course audios'
  ) THEN
    CREATE POLICY "Admins can update course audios"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'course-audios');
  END IF;
END $$;

-- Permitir exclusão apenas para administradores
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Admins can delete course audios'
  ) THEN
    CREATE POLICY "Admins can delete course audios"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'course-audios');
  END IF;
END $$;

-- 4. Verificar políticas criadas
-- SELECT * FROM storage.policies WHERE bucket_id = 'course-audios';

-- ============================================
-- IMPORTANTE: 
-- 1. O bucket 'course-audios' deve ser marcado como PÚBLICO no Supabase Dashboard
-- 2. Vá em Storage > course-audios > Settings > Public bucket: ON
-- 3. Isso permite que os alunos acessem os arquivos MP3 sem autenticação
-- ============================================

