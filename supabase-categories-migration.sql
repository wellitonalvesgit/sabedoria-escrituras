-- ============================================
-- MIGRATION: Sistema de Categorias
-- Data: 2025-10-23
-- Descrição: Cria tabelas de categorias e relacionamento com cursos
-- ============================================

-- 1. Criar tabela de categorias
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'BookOpen',
  color TEXT DEFAULT '#F3C77A',
  display_order INTEGER DEFAULT 0,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Criar tabela de relacionamento many-to-many
CREATE TABLE IF NOT EXISTS public.course_categories (
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  PRIMARY KEY (course_id, category_id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Criar índices
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_order ON public.categories(display_order);
CREATE INDEX IF NOT EXISTS idx_course_categories_course ON public.course_categories(course_id);
CREATE INDEX IF NOT EXISTS idx_course_categories_category ON public.course_categories(category_id);

-- 4. Adicionar RLS (Row Level Security)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_categories ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de acesso para categories
CREATE POLICY "Qualquer um pode ver categorias"
  ON public.categories FOR SELECT
  USING (true);

CREATE POLICY "Apenas admins podem criar categorias"
  ON public.categories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id::text = auth.uid()::text
      AND role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Apenas admins podem atualizar categorias"
  ON public.categories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id::text = auth.uid()::text
      AND role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Apenas admins podem deletar categorias"
  ON public.categories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id::text = auth.uid()::text
      AND role = 'admin'
    )
  );

-- 6. Políticas de acesso para course_categories
CREATE POLICY "Qualquer um pode ver relacionamentos de categorias"
  ON public.course_categories FOR SELECT
  USING (true);

CREATE POLICY "Apenas admins podem criar relacionamentos"
  ON public.course_categories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id::text = auth.uid()::text
      AND role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Apenas admins podem deletar relacionamentos"
  ON public.course_categories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id::text = auth.uid()::text
      AND role IN ('admin', 'moderator')
    )
  );

-- 7. Inserir categorias padrão
INSERT INTO public.categories (name, slug, description, icon, color, display_order) VALUES
  ('Panorama Bíblico', 'panorama-biblico', 'Visão geral das Escrituras', 'BookOpen', '#8B4513', 1),
  ('Novo Testamento', 'novo-testamento', 'Estudos do Novo Testamento', 'Cross', '#4169E1', 2),
  ('Antigo Testamento', 'antigo-testamento', 'Estudos do Antigo Testamento', 'Scroll', '#DAA520', 3),
  ('Parábolas', 'parabolas', 'Parábolas de Jesus', 'Lightbulb', '#32CD32', 4),
  ('Epístolas', 'epistolas', 'Cartas Apostólicas', 'Mail', '#9370DB', 5),
  ('Profetas', 'profetas', 'Livros Proféticos', 'Flame', '#FF6347', 6),
  ('Salmos e Sabedoria', 'salmos-sabedoria', 'Literatura Sapiencial', 'Music', '#FFD700', 7),
  ('Evangelhos', 'evangelhos', 'Vida e Ministério de Jesus', 'Heart', '#FF1493', 8)
ON CONFLICT (slug) DO NOTHING;

-- 8. Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 10. Comentários nas tabelas
COMMENT ON TABLE public.categories IS 'Categorias de cursos do sistema';
COMMENT ON COLUMN public.categories.name IS 'Nome da categoria';
COMMENT ON COLUMN public.categories.slug IS 'Slug único para URLs';
COMMENT ON COLUMN public.categories.description IS 'Descrição da categoria';
COMMENT ON COLUMN public.categories.icon IS 'Ícone Lucide para exibição';
COMMENT ON COLUMN public.categories.color IS 'Cor hexadecimal da categoria';
COMMENT ON COLUMN public.categories.display_order IS 'Ordem de exibição';
COMMENT ON COLUMN public.categories.parent_id IS 'Categoria pai (para hierarquia)';

COMMENT ON TABLE public.course_categories IS 'Relacionamento many-to-many entre cursos e categorias';

-- ============================================
-- FIM DA MIGRATION
-- ============================================
