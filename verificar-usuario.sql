-- Script para verificar e corrigir o usuário geisonhoehr.ai@gmail.com
-- Este script verifica se o usuário existe nas tabelas auth.users e public.users
-- e corrige possíveis problemas

-- Verificar se o usuário existe na tabela auth.users
DO $$
DECLARE
    auth_user_count INTEGER;
    auth_user_id TEXT;
    auth_user_email TEXT;
    public_user_count INTEGER;
    public_user_id TEXT;
    public_user_email TEXT;
    public_user_status TEXT;
    public_user_role TEXT;
    public_user_access_expires_at TIMESTAMP WITH TIME ZONE;
    public_user_allowed_courses TEXT[];
    public_user_blocked_courses TEXT[];
    course_count INTEGER;
BEGIN
    -- Verificar na tabela auth.users
    SELECT COUNT(*) INTO auth_user_count FROM auth.users WHERE email = 'geisonhoehr.ai@gmail.com';
    
    IF auth_user_count = 0 THEN
        RAISE NOTICE 'Usuário não encontrado na tabela auth.users';
    ELSE
        SELECT id, email INTO auth_user_id, auth_user_email FROM auth.users WHERE email = 'geisonhoehr.ai@gmail.com';
        RAISE NOTICE 'Usuário encontrado na auth.users: ID=%, Email=%', auth_user_id, auth_user_email;
        
        -- Verificar na tabela public.users
        SELECT COUNT(*) INTO public_user_count FROM public.users WHERE email = 'geisonhoehr.ai@gmail.com';
        
        IF public_user_count = 0 THEN
            RAISE NOTICE 'Usuário não encontrado na tabela public.users. Criando...';
            
            -- Criar usuário na tabela public.users
            INSERT INTO public.users (
                id, email, name, status, role, 
                total_points, total_reading_minutes, 
                courses_enrolled, courses_completed, 
                current_level, access_expires_at
            ) VALUES (
                auth_user_id, 
                'geisonhoehr.ai@gmail.com', 
                'Geison Hoehr', 
                'active', 
                'student', 
                0, 0, 0, 0, 1, 
                NOW() + INTERVAL '365 days'
            );
            
            RAISE NOTICE 'Usuário criado na tabela public.users';
        ELSE
            -- Buscar dados do usuário na tabela public.users
            SELECT 
                id, email, status, role, access_expires_at, 
                allowed_courses, blocked_courses
            INTO 
                public_user_id, public_user_email, public_user_status, 
                public_user_role, public_user_access_expires_at,
                public_user_allowed_courses, public_user_blocked_courses
            FROM public.users 
            WHERE email = 'geisonhoehr.ai@gmail.com';
            
            RAISE NOTICE 'Usuário encontrado na public.users: ID=%, Email=%, Status=%, Role=%, Acesso expira em=%', 
                public_user_id, public_user_email, public_user_status, public_user_role, public_user_access_expires_at;
            
            -- Verificar se o ID é o mesmo nas duas tabelas
            IF auth_user_id != public_user_id THEN
                RAISE NOTICE 'IDs diferentes entre auth.users e public.users. Corrigindo...';
                
                -- Atualizar ID na tabela public.users
                UPDATE public.users 
                SET id = auth_user_id 
                WHERE email = 'geisonhoehr.ai@gmail.com';
                
                RAISE NOTICE 'ID corrigido na tabela public.users';
            END IF;
            
            -- Verificar se o status é 'active'
            IF public_user_status != 'active' THEN
                RAISE NOTICE 'Status não é active. Corrigindo...';
                
                -- Atualizar status na tabela public.users
                UPDATE public.users 
                SET status = 'active' 
                WHERE email = 'geisonhoehr.ai@gmail.com';
                
                RAISE NOTICE 'Status corrigido para active';
            END IF;
            
            -- Verificar se o acesso não expirou
            IF public_user_access_expires_at < NOW() THEN
                RAISE NOTICE 'Acesso expirado. Corrigindo...';
                
                -- Atualizar data de expiração
                UPDATE public.users 
                SET access_expires_at = NOW() + INTERVAL '365 days' 
                WHERE email = 'geisonhoehr.ai@gmail.com';
                
                RAISE NOTICE 'Data de expiração atualizada para 365 dias a partir de agora';
            END IF;
            
            -- Verificar cursos permitidos
            SELECT COUNT(*) INTO course_count FROM courses WHERE status = 'published';
            
            RAISE NOTICE 'Total de cursos publicados: %', course_count;
            RAISE NOTICE 'Cursos permitidos para o usuário: %', 
                CASE WHEN public_user_allowed_courses IS NULL THEN 0 ELSE array_length(public_user_allowed_courses, 1) END;
            
            -- Verificar se o usuário tem acesso a todos os cursos
            IF public_user_allowed_courses IS NULL OR array_length(public_user_allowed_courses, 1) < course_count THEN
                RAISE NOTICE 'Usuário não tem acesso a todos os cursos. Corrigindo...';
                
                -- Atualizar cursos permitidos
                UPDATE public.users
                SET allowed_courses = (
                    SELECT array_agg(id::text)
                    FROM courses
                    WHERE status = 'published'
                ),
                blocked_courses = ARRAY[]::text[],
                updated_at = NOW()
                WHERE email = 'geisonhoehr.ai@gmail.com';
                
                RAISE NOTICE 'Acesso aos cursos atualizado';
            END IF;
        END IF;
    END IF;
END $$;