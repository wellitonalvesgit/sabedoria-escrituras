-- Script para corrigir políticas RLS e acesso aos cursos
-- Este script atualiza as políticas RLS para permitir que usuários autenticados
-- vejam os cursos que estão em sua lista de allowed_courses

-- 1. Verificar políticas RLS atuais
DO $$
BEGIN
    RAISE NOTICE 'Verificando políticas RLS atuais...';
END $$;

-- 2. Desativar RLS temporariamente para fazer as alterações
ALTER TABLE public.courses DISABLE ROW LEVEL SECURITY;

-- 3. Remover políticas existentes
DROP POLICY IF EXISTS "Anyone can view published courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can manage courses" ON public.courses;
DROP POLICY IF EXISTS "Users can view allowed courses" ON public.courses;

-- 4. Criar novas políticas
-- Política 1: Administradores podem gerenciar todos os cursos
CREATE POLICY "Admins can manage courses"
ON public.courses
FOR ALL
TO public
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'moderator')
    )
);

-- Política 2: Qualquer usuário pode ver cursos publicados (básico)
CREATE POLICY "Anyone can view published courses"
ON public.courses
FOR SELECT
TO public
USING (
    status = 'published'
);

-- Política 3 (NOVA): Usuários podem ver cursos que estão em sua lista de allowed_courses
CREATE POLICY "Users can view allowed courses"
ON public.courses
FOR SELECT
TO public
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND courses.id::text = ANY(users.allowed_courses)
    )
);

-- 5. Reativar RLS
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- 6. Verificar políticas RLS após as alterações
DO $$
BEGIN
    RAISE NOTICE 'Políticas RLS atualizadas com sucesso!';
END $$;

-- 7. Fazer o mesmo para a tabela course_pdfs
ALTER TABLE public.course_pdfs DISABLE ROW LEVEL SECURITY;

-- Remover políticas existentes
DROP POLICY IF EXISTS "Anyone can view PDFs of published courses" ON public.course_pdfs;
DROP POLICY IF EXISTS "Admins can manage PDFs" ON public.course_pdfs;
DROP POLICY IF EXISTS "Users can view PDFs of allowed courses" ON public.course_pdfs;

-- Criar novas políticas
-- Política 1: Administradores podem gerenciar todos os PDFs
CREATE POLICY "Admins can manage PDFs"
ON public.course_pdfs
FOR ALL
TO public
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'moderator')
    )
);

-- Política 2: Qualquer usuário pode ver PDFs de cursos publicados (básico)
CREATE POLICY "Anyone can view PDFs of published courses"
ON public.course_pdfs
FOR SELECT
TO public
USING (
    EXISTS (
        SELECT 1 FROM courses
        WHERE courses.id = course_pdfs.course_id
        AND courses.status = 'published'
    )
);

-- Política 3 (NOVA): Usuários podem ver PDFs de cursos que estão em sua lista de allowed_courses
CREATE POLICY "Users can view PDFs of allowed courses"
ON public.course_pdfs
FOR SELECT
TO public
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND course_pdfs.course_id::text = ANY(users.allowed_courses)
    )
);

-- Reativar RLS
ALTER TABLE public.course_pdfs ENABLE ROW LEVEL SECURITY;

-- 8. Verificar se o usuário tem acesso aos cursos
DO $$
DECLARE
    user_id TEXT;
    user_email TEXT;
    allowed_courses_count INTEGER;
BEGIN
    -- Buscar ID do usuário
    SELECT id, email INTO user_id, user_email
    FROM auth.users
    WHERE email = 'geisonhoehr.ai@gmail.com';
    
    IF user_id IS NULL THEN
        RAISE NOTICE 'Usuário não encontrado na tabela auth.users';
        RETURN;
    END IF;
    
    -- Verificar cursos permitidos
    SELECT array_length(allowed_courses, 1) INTO allowed_courses_count
    FROM users
    WHERE id = user_id;
    
    RAISE NOTICE 'Usuário: %, ID: %, Cursos permitidos: %', user_email, user_id, allowed_courses_count;
    
    -- Verificar se o usuário tem acesso a todos os cursos publicados
    IF allowed_courses_count IS NULL OR allowed_courses_count = 0 THEN
        RAISE NOTICE 'Usuário não tem cursos permitidos. Atualizando...';
        
        -- Atualizar allowed_courses para incluir todos os cursos publicados
        UPDATE users
        SET allowed_courses = (
            SELECT array_agg(id::text)
            FROM courses
            WHERE status = 'published'
        ),
        blocked_courses = ARRAY[]::text[],
        updated_at = NOW()
        WHERE id = user_id;
        
        RAISE NOTICE 'Cursos permitidos atualizados para o usuário %', user_email;
    ELSE
        RAISE NOTICE 'Usuário já tem % cursos permitidos', allowed_courses_count;
    END IF;
END $$;
