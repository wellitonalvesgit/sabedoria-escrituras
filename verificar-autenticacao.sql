-- Script para verificar e diagnosticar problemas de autenticação
-- Este script verifica todas as partes do sistema de autenticação e acesso aos cursos

-- 1. Verificar se o usuário existe nas tabelas auth.users e public.users
DO $$
DECLARE
    auth_user_id TEXT;
    auth_user_email TEXT;
    auth_user_role TEXT;
    public_user_id TEXT;
    public_user_email TEXT;
    public_user_status TEXT;
    public_user_role TEXT;
    public_user_access_expires_at TIMESTAMP WITH TIME ZONE;
    public_user_allowed_courses TEXT[];
    public_user_blocked_courses TEXT[];
BEGIN
    -- Verificar na tabela auth.users
    SELECT id, email, role INTO auth_user_id, auth_user_email, auth_user_role
    FROM auth.users
    WHERE email = 'geisonhoehr.ai@gmail.com';
    
    IF auth_user_id IS NULL THEN
        RAISE NOTICE '❌ Usuário não encontrado na tabela auth.users';
    ELSE
        RAISE NOTICE '✅ Usuário encontrado na auth.users: ID=%, Email=%, Role=%', auth_user_id, auth_user_email, auth_user_role;
        
        -- Verificar na tabela public.users
        SELECT 
            id, email, status, role, access_expires_at, allowed_courses, blocked_courses 
        INTO 
            public_user_id, public_user_email, public_user_status, public_user_role, 
            public_user_access_expires_at, public_user_allowed_courses, public_user_blocked_courses
        FROM public.users
        WHERE id = auth_user_id;
        
        IF public_user_id IS NULL THEN
            RAISE NOTICE '❌ Usuário não encontrado na tabela public.users';
            
            -- Criar usuário na tabela public.users
            RAISE NOTICE '🔧 Criando usuário na tabela public.users...';
            
            INSERT INTO public.users (
                id, email, name, status, role, 
                total_points, total_reading_minutes, 
                courses_enrolled, courses_completed, 
                current_level, access_expires_at,
                created_at, updated_at
            ) VALUES (
                auth_user_id, 
                auth_user_email, 
                auth_user_email, 
                'active', 
                'student', 
                0, 0, 0, 0, 1, 
                NOW() + INTERVAL '365 days',
                NOW(), NOW()
            );
            
            RAISE NOTICE '✅ Usuário criado na tabela public.users';
            
            -- Buscar dados do usuário recém-criado
            SELECT 
                id, email, status, role, access_expires_at, allowed_courses, blocked_courses 
            INTO 
                public_user_id, public_user_email, public_user_status, public_user_role, 
                public_user_access_expires_at, public_user_allowed_courses, public_user_blocked_courses
            FROM public.users
            WHERE id = auth_user_id;
        ELSE
            RAISE NOTICE '✅ Usuário encontrado na public.users: ID=%, Email=%, Status=%, Role=%', 
                public_user_id, public_user_email, public_user_status, public_user_role;
        END IF;
        
        -- Verificar status do usuário
        IF public_user_status != 'active' THEN
            RAISE NOTICE '❌ Status do usuário não é active: %', public_user_status;
            
            -- Atualizar status
            UPDATE public.users
            SET status = 'active', updated_at = NOW()
            WHERE id = public_user_id;
            
            RAISE NOTICE '✅ Status atualizado para active';
        ELSE
            RAISE NOTICE '✅ Status do usuário está correto: %', public_user_status;
        END IF;
        
        -- Verificar data de expiração
        IF public_user_access_expires_at IS NULL OR public_user_access_expires_at < NOW() THEN
            RAISE NOTICE '❌ Acesso expirado ou não definido: %', public_user_access_expires_at;
            
            -- Atualizar data de expiração
            UPDATE public.users
            SET access_expires_at = NOW() + INTERVAL '365 days', updated_at = NOW()
            WHERE id = public_user_id;
            
            RAISE NOTICE '✅ Data de expiração atualizada para 365 dias a partir de agora';
        ELSE
            RAISE NOTICE '✅ Data de expiração válida: %', public_user_access_expires_at;
        END IF;
        
        -- Verificar cursos permitidos
        IF public_user_allowed_courses IS NULL OR array_length(public_user_allowed_courses, 1) IS NULL THEN
            RAISE NOTICE '❌ Usuário não tem cursos permitidos';
            
            -- Atualizar cursos permitidos
            UPDATE public.users
            SET allowed_courses = (
                SELECT array_agg(id::text)
                FROM courses
                WHERE status = 'published'
            ),
            blocked_courses = ARRAY[]::text[],
            updated_at = NOW()
            WHERE id = public_user_id;
            
            RAISE NOTICE '✅ Lista de cursos permitidos atualizada';
        ELSE
            RAISE NOTICE '✅ Usuário tem % cursos permitidos', array_length(public_user_allowed_courses, 1);
            
            -- Verificar se todos os cursos publicados estão na lista
            DECLARE
                published_courses_count INTEGER;
                allowed_courses_count INTEGER;
            BEGIN
                SELECT COUNT(*) INTO published_courses_count
                FROM courses
                WHERE status = 'published';
                
                allowed_courses_count := array_length(public_user_allowed_courses, 1);
                
                IF allowed_courses_count < published_courses_count THEN
                    RAISE NOTICE '❌ Usuário não tem acesso a todos os cursos publicados (% vs %)', 
                        allowed_courses_count, published_courses_count;
                    
                    -- Atualizar cursos permitidos
                    UPDATE public.users
                    SET allowed_courses = (
                        SELECT array_agg(id::text)
                        FROM courses
                        WHERE status = 'published'
                    ),
                    updated_at = NOW()
                    WHERE id = public_user_id;
                    
                    RAISE NOTICE '✅ Lista de cursos permitidos atualizada para incluir todos os cursos publicados';
                ELSE
                    RAISE NOTICE '✅ Usuário tem acesso a todos os cursos publicados';
                END IF;
            END;
        END IF;
        
        -- Verificar se o usuário tem assinatura
        DECLARE
            subscription_id TEXT;
            subscription_status TEXT;
            subscription_end TIMESTAMP WITH TIME ZONE;
        BEGIN
            SELECT s.id, s.status, s.current_period_end
            INTO subscription_id, subscription_status, subscription_end
            FROM subscriptions s
            WHERE s.user_id = public_user_id
            ORDER BY s.created_at DESC
            LIMIT 1;
            
            IF subscription_id IS NULL THEN
                RAISE NOTICE '❌ Usuário não tem assinatura';
                
                -- Criar assinatura
                INSERT INTO subscriptions (
                    user_id,
                    status,
                    price_id,
                    subscription_id,
                    current_period_start,
                    current_period_end,
                    cancel_at_period_end,
                    created_at,
                    updated_at
                ) VALUES (
                    public_user_id,
                    'active',
                    'price_premium_annual',
                    'sub_' || public_user_id,
                    NOW(),
                    NOW() + INTERVAL '365 days',
                    false,
                    NOW(),
                    NOW()
                );
                
                RAISE NOTICE '✅ Assinatura criada para o usuário';
            ELSE
                RAISE NOTICE '✅ Usuário tem assinatura: ID=%, Status=%', subscription_id, subscription_status;
                
                -- Verificar status e data de expiração
                IF subscription_status != 'active' OR subscription_end < NOW() THEN
                    RAISE NOTICE '❌ Assinatura inativa ou expirada: Status=%, Expira=%', 
                        subscription_status, subscription_end;
                    
                    -- Atualizar assinatura
                    UPDATE subscriptions
                    SET 
                        status = 'active',
                        current_period_start = NOW(),
                        current_period_end = NOW() + INTERVAL '365 days',
                        updated_at = NOW()
                    WHERE id = subscription_id;
                    
                    RAISE NOTICE '✅ Assinatura atualizada para active';
                ELSE
                    RAISE NOTICE '✅ Assinatura está ativa e válida até %', subscription_end;
                END IF;
            END IF;
        END;
    END IF;
END $$;

-- 2. Verificar políticas RLS
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    RAISE NOTICE '🔍 Verificando políticas RLS...';
    
    FOR policy_record IN 
        SELECT tablename, policyname, cmd, qual
        FROM pg_policies
        WHERE tablename IN ('users', 'courses', 'course_pdfs')
        ORDER BY tablename, policyname
    LOOP
        RAISE NOTICE 'Tabela: %, Política: %, Comando: %, Condição: %',
            policy_record.tablename,
            policy_record.policyname,
            policy_record.cmd,
            policy_record.qual;
    END LOOP;
END $$;

-- 3. Verificar cursos e acesso
DO $$
DECLARE
    course_record RECORD;
    user_id TEXT;
    allowed_courses TEXT[];
BEGIN
    -- Buscar ID e cursos permitidos do usuário
    SELECT id, allowed_courses INTO user_id, allowed_courses
    FROM public.users
    WHERE email = 'geisonhoehr.ai@gmail.com';
    
    IF user_id IS NULL THEN
        RAISE NOTICE '❌ Usuário não encontrado';
        RETURN;
    END IF;
    
    RAISE NOTICE '🔍 Verificando acesso aos cursos para o usuário ID=%...', user_id;
    
    FOR course_record IN 
        SELECT id, title, status
        FROM courses
        WHERE status = 'published'
        ORDER BY title
    LOOP
        IF allowed_courses IS NULL THEN
            RAISE NOTICE 'Curso: % (ID: %) - Status: % - Acesso: ❌ (allowed_courses é NULL)',
                course_record.title, course_record.id, course_record.status;
        ELSIF course_record.id::text = ANY(allowed_courses) THEN
            RAISE NOTICE 'Curso: % (ID: %) - Status: % - Acesso: ✅',
                course_record.title, course_record.id, course_record.status;
        ELSE
            RAISE NOTICE 'Curso: % (ID: %) - Status: % - Acesso: ❌',
                course_record.title, course_record.id, course_record.status;
        END IF;
    END LOOP;
END $$;

-- 4. Verificar variáveis de ambiente (isso só pode ser feito no código, não no SQL)
-- Mas podemos verificar se o SERVICE_ROLE_KEY está sendo usado corretamente
DO $$
BEGIN
    RAISE NOTICE '⚠️ Importante: Verifique se as seguintes variáveis de ambiente estão configuradas corretamente:';
    RAISE NOTICE '- NEXT_PUBLIC_SUPABASE_URL';
    RAISE NOTICE '- NEXT_PUBLIC_SUPABASE_ANON_KEY';
    RAISE NOTICE '- SUPABASE_SERVICE_ROLE_KEY';
END $$;
