-- =====================================================
-- MIGRATION: Sistema de Marcações e Resumos (Modo Kindle)
-- Autor: Sistema Sabedoria das Escrituras
-- Data: 2025-01-25
-- Descrição: Cria tabelas para highlights e summaries
-- =====================================================

-- Habilitar extensão UUID (se ainda não estiver habilitada)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABELA: highlights
-- Armazena marcações de texto feitas pelos usuários
-- =====================================================
CREATE TABLE IF NOT EXISTS public.highlights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  pdf_id UUID NOT NULL REFERENCES public.course_pdfs(id) ON DELETE CASCADE,

  -- Informações da marcação
  page_number INTEGER NOT NULL,
  text_content TEXT NOT NULL,
  start_position INTEGER,
  end_position INTEGER,

  -- Estilo da marcação
  highlight_color TEXT NOT NULL DEFAULT 'yellow'
    CHECK (highlight_color IN ('yellow', 'green', 'blue', 'pink', 'orange', 'purple')),

  -- Nota opcional associada à marcação
  note TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_highlights_user_id ON public.highlights(user_id);
CREATE INDEX IF NOT EXISTS idx_highlights_course_id ON public.highlights(course_id);
CREATE INDEX IF NOT EXISTS idx_highlights_pdf_id ON public.highlights(pdf_id);
CREATE INDEX IF NOT EXISTS idx_highlights_page ON public.highlights(page_number);
CREATE INDEX IF NOT EXISTS idx_highlights_created ON public.highlights(created_at DESC);

-- =====================================================
-- TABELA: summaries
-- Armazena resumos criados pelos usuários
-- =====================================================
CREATE TABLE IF NOT EXISTS public.summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  pdf_id UUID NOT NULL REFERENCES public.course_pdfs(id) ON DELETE CASCADE,

  -- Conteúdo do resumo
  title TEXT NOT NULL,
  content TEXT NOT NULL,

  -- IDs dos highlights incluídos no resumo
  highlight_ids UUID[] DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_summaries_user_id ON public.summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_summaries_course_id ON public.summaries(course_id);
CREATE INDEX IF NOT EXISTS idx_summaries_pdf_id ON public.summaries(pdf_id);
CREATE INDEX IF NOT EXISTS idx_summaries_created ON public.summaries(created_at DESC);

-- =====================================================
-- TRIGGERS: Atualizar updated_at automaticamente
-- =====================================================

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para highlights
DROP TRIGGER IF EXISTS update_highlights_updated_at ON public.highlights;
CREATE TRIGGER update_highlights_updated_at
    BEFORE UPDATE ON public.highlights
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para summaries
DROP TRIGGER IF EXISTS update_summaries_updated_at ON public.summaries;
CREATE TRIGGER update_summaries_updated_at
    BEFORE UPDATE ON public.summaries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS nas tabelas
ALTER TABLE public.highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.summaries ENABLE ROW LEVEL SECURITY;

-- Políticas para highlights
DROP POLICY IF EXISTS "Usuários podem ver seus próprios highlights" ON public.highlights;
CREATE POLICY "Usuários podem ver seus próprios highlights"
    ON public.highlights
    FOR SELECT
    USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Usuários podem criar seus próprios highlights" ON public.highlights;
CREATE POLICY "Usuários podem criar seus próprios highlights"
    ON public.highlights
    FOR INSERT
    WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios highlights" ON public.highlights;
CREATE POLICY "Usuários podem atualizar seus próprios highlights"
    ON public.highlights
    FOR UPDATE
    USING (auth.uid()::text = user_id::text)
    WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Usuários podem deletar seus próprios highlights" ON public.highlights;
CREATE POLICY "Usuários podem deletar seus próprios highlights"
    ON public.highlights
    FOR DELETE
    USING (auth.uid()::text = user_id::text);

-- Políticas para summaries
DROP POLICY IF EXISTS "Usuários podem ver seus próprios resumos" ON public.summaries;
CREATE POLICY "Usuários podem ver seus próprios resumos"
    ON public.summaries
    FOR SELECT
    USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Usuários podem criar seus próprios resumos" ON public.summaries;
CREATE POLICY "Usuários podem criar seus próprios resumos"
    ON public.summaries
    FOR INSERT
    WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios resumos" ON public.summaries;
CREATE POLICY "Usuários podem atualizar seus próprios resumos"
    ON public.summaries
    FOR UPDATE
    USING (auth.uid()::text = user_id::text)
    WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Usuários podem deletar seus próprios resumos" ON public.summaries;
CREATE POLICY "Usuários podem deletar seus próprios resumos"
    ON public.summaries
    FOR DELETE
    USING (auth.uid()::text = user_id::text);

-- =====================================================
-- GRANTS: Permissões de acesso
-- =====================================================

-- Garantir que usuários autenticados possam acessar as tabelas
GRANT SELECT, INSERT, UPDATE, DELETE ON public.highlights TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.summaries TO authenticated;

-- Permitir uso das sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- COMENTÁRIOS (Documentação)
-- =====================================================

COMMENT ON TABLE public.highlights IS 'Armazena marcações de texto estilo Kindle feitas pelos usuários durante a leitura';
COMMENT ON TABLE public.summaries IS 'Armazena resumos criados pelos usuários com base em suas marcações';

COMMENT ON COLUMN public.highlights.highlight_color IS 'Cor da marcação: yellow, green, blue, pink, orange ou purple';
COMMENT ON COLUMN public.highlights.text_content IS 'Texto marcado pelo usuário';
COMMENT ON COLUMN public.highlights.note IS 'Nota opcional adicionada à marcação';
COMMENT ON COLUMN public.summaries.highlight_ids IS 'Array de UUIDs das marcações incluídas no resumo';

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
