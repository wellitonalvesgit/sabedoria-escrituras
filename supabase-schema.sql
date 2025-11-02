-- ============================================
-- SCHEMA: Sabedoria das Escrituras
-- Descrição: Tabelas para cursos bíblicos com gamificação
-- Data: 2025-10-22
-- ============================================

-- Habilitar extensão UUID (se não estiver habilitada)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. TABELA: users (usuários do sistema)
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT DEFAULT 'student' CHECK (role IN ('admin', 'moderator', 'student')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  total_points INTEGER DEFAULT 0,
  total_reading_minutes INTEGER DEFAULT 0,
  courses_enrolled INTEGER DEFAULT 0,
  courses_completed INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para users
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);

-- ============================================
-- 2. TABELA: courses (cursos)
-- ============================================
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  author TEXT,
  category TEXT,
  pages INTEGER,
  reading_time_minutes INTEGER,
  cover_url TEXT,
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para courses
CREATE INDEX IF NOT EXISTS idx_courses_slug ON public.courses(slug);
CREATE INDEX IF NOT EXISTS idx_courses_category ON public.courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_status ON public.courses(status);

-- ============================================
-- 3. TABELA: course_pdfs (PDFs dos cursos)
-- ============================================
CREATE TABLE IF NOT EXISTS public.course_pdfs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  volume TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  pages INTEGER,
  reading_time_minutes INTEGER,
  -- ⭐ NOVOS CAMPOS PARA MODO KINDLE
  text_content TEXT,
  use_auto_conversion BOOLEAN DEFAULT true,
  -- Fim dos novos campos
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para course_pdfs
CREATE INDEX IF NOT EXISTS idx_course_pdfs_course_id ON public.course_pdfs(course_id);
CREATE INDEX IF NOT EXISTS idx_course_pdfs_display_order ON public.course_pdfs(course_id, display_order);

-- ============================================
-- 4. TABELA: user_course_progress (progresso dos usuários)
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_course_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  progress_percentage DECIMAL(5,2) DEFAULT 0.00,
  total_reading_minutes INTEGER DEFAULT 0,
  last_page_read INTEGER DEFAULT 0,
  current_pdf_id UUID REFERENCES public.course_pdfs(id),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- Índices para user_course_progress
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_course_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_course_id ON public.user_course_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_status ON public.user_course_progress(status);

-- ============================================
-- 5. TABELA: reading_sessions (sessões de leitura)
-- ============================================
CREATE TABLE IF NOT EXISTS public.reading_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  pdf_id UUID REFERENCES public.course_pdfs(id) ON DELETE CASCADE NOT NULL,
  reading_mode TEXT CHECK (reading_mode IN ('original', 'digital-magazine', 'kindle')),
  duration_seconds INTEGER DEFAULT 0,
  pages_read INTEGER DEFAULT 0,
  start_page INTEGER,
  end_page INTEGER,
  points_earned INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para reading_sessions
CREATE INDEX IF NOT EXISTS idx_reading_sessions_user_id ON public.reading_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_course_id ON public.reading_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_started_at ON public.reading_sessions(started_at);

-- ============================================
-- 6. TABELA: achievements (conquistas/badges)
-- ============================================
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  category TEXT CHECK (category IN ('reading', 'consistency', 'mastery', 'social', 'special')),
  points INTEGER DEFAULT 0,
  requirement_type TEXT CHECK (requirement_type IN ('minutes_read', 'courses_completed', 'days_streak', 'pages_read')),
  requirement_value INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para achievements
CREATE INDEX IF NOT EXISTS idx_achievements_category ON public.achievements(category);

-- ============================================
-- 7. TABELA: user_achievements (conquistas dos usuários)
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Índices para user_achievements
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_earned_at ON public.user_achievements(earned_at);

-- ============================================
-- 8. TABELA: bookmarks (marcadores de leitura)
-- ============================================
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  pdf_id UUID REFERENCES public.course_pdfs(id) ON DELETE CASCADE NOT NULL,
  page_number INTEGER NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para bookmarks
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_course_id ON public.bookmarks(course_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_pdf_id ON public.bookmarks(pdf_id);

-- ============================================
-- FUNÇÕES E TRIGGERS
-- ============================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_pdfs_updated_at BEFORE UPDATE ON public.course_pdfs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON public.user_course_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookmarks_updated_at BEFORE UPDATE ON public.bookmarks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_pdfs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- Políticas para users
CREATE POLICY "Users can view all users" ON public.users
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Políticas para courses (todos podem ler)
CREATE POLICY "Anyone can view published courses" ON public.courses
    FOR SELECT USING (status = 'published');

CREATE POLICY "Admins can manage courses" ON public.courses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id::text = auth.uid()::text
            AND role IN ('admin', 'moderator')
        )
    );

-- Políticas para course_pdfs (todos podem ler PDFs de cursos publicados)
CREATE POLICY "Anyone can view PDFs of published courses" ON public.course_pdfs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.courses
            WHERE id = course_pdfs.course_id
            AND status = 'published'
        )
    );

CREATE POLICY "Admins can manage PDFs" ON public.course_pdfs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id::text = auth.uid()::text
            AND role IN ('admin', 'moderator')
        )
    );

-- Políticas para user_course_progress (usuários só veem seu próprio progresso)
CREATE POLICY "Users can view own progress" ON public.user_course_progress
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own progress" ON public.user_course_progress
    FOR ALL USING (auth.uid()::text = user_id::text);

-- Políticas para reading_sessions
CREATE POLICY "Users can view own sessions" ON public.reading_sessions
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create own sessions" ON public.reading_sessions
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Políticas para achievements (todos podem ler)
CREATE POLICY "Anyone can view achievements" ON public.achievements
    FOR SELECT USING (true);

-- Políticas para user_achievements
CREATE POLICY "Users can view own achievements" ON public.user_achievements
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Políticas para bookmarks
CREATE POLICY "Users can manage own bookmarks" ON public.bookmarks
    FOR ALL USING (auth.uid()::text = user_id::text);

-- ============================================
-- DADOS INICIAIS (SEED DATA)
-- ============================================

-- Inserir conquistas padrão
INSERT INTO public.achievements (name, description, icon, category, points, requirement_type, requirement_value) VALUES
  ('Primeiro Passo', 'Complete sua primeira sessão de leitura', '🌱', 'reading', 10, 'minutes_read', 1),
  ('Leitor Dedicado', 'Leia por 60 minutos', '📖', 'reading', 50, 'minutes_read', 60),
  ('Maratonista Bíblico', 'Leia por 300 minutos', '🏃', 'reading', 200, 'minutes_read', 300),
  ('Estudioso', 'Complete seu primeiro curso', '🎓', 'mastery', 100, 'courses_completed', 1),
  ('Mestre das Escrituras', 'Complete 5 cursos', '👑', 'mastery', 500, 'courses_completed', 5),
  ('Consistência', 'Leia por 7 dias seguidos', '🔥', 'consistency', 150, 'days_streak', 7),
  ('Incansável', 'Leia por 30 dias seguidos', '⭐', 'consistency', 500, 'days_streak', 30)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- COMENTÁRIOS NAS TABELAS
-- ============================================

COMMENT ON TABLE public.courses IS 'Armazena informações dos cursos bíblicos disponíveis';
COMMENT ON TABLE public.course_pdfs IS 'Armazena os PDFs de cada curso com configuração de texto para modo Kindle';
COMMENT ON COLUMN public.course_pdfs.text_content IS 'Texto pré-carregado pelo admin para exibição no modo Kindle';
COMMENT ON COLUMN public.course_pdfs.use_auto_conversion IS 'Se true, tenta conversão automática; se false, usa text_content';
COMMENT ON TABLE public.user_course_progress IS 'Rastreia o progresso de cada usuário em cada curso';
COMMENT ON TABLE public.reading_sessions IS 'Registra cada sessão de leitura para gamificação';
COMMENT ON TABLE public.achievements IS 'Define as conquistas/badges disponíveis no sistema';
COMMENT ON TABLE public.user_achievements IS 'Conquistas desbloqueadas por cada usuário';
COMMENT ON TABLE public.bookmarks IS 'Marcadores de página dos usuários';

-- ============================================
-- FIM DO SCHEMA
-- ============================================
