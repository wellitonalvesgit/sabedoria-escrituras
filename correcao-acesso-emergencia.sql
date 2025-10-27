-- SCRIPT DE CORREÇÃO DE EMERGÊNCIA
-- Este script força o acesso aos cursos diretamente, ignorando as políticas RLS

-- 1. Primeiro, vamos verificar se o usuário existe
DO $$
DECLARE
    auth_user_id TEXT;
    auth_user_email TEXT;
BEGIN
    -- Verificar na tabela auth.users
    SELECT id, email INTO auth_user_id, auth_user_email
    FROM auth.users
    WHERE email = 'geisonhoehr.ai@gmail.com';
    
    IF auth_user_id IS NULL THEN
        RAISE NOTICE 'Usuário não encontrado na tabela auth.users';
        RETURN;
    ELSE
        RAISE NOTICE 'Usuário encontrado: ID=%, Email=%', auth_user_id, auth_user_email;
    END IF;
END $$;

-- 2. Desativar completamente as RLS para todas as tabelas relevantes
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_pdfs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions DISABLE ROW LEVEL SECURITY;

-- 3. Criar um usuário administrador para garantir acesso total
UPDATE public.users
SET 
    role = 'admin',
    status = 'active',
    access_expires_at = NOW() + INTERVAL '365 days',
    allowed_courses = (
        SELECT array_agg(id::text)
        FROM courses
        WHERE status = 'published'
    ),
    blocked_courses = ARRAY[]::text[],
    updated_at = NOW()
WHERE email = 'geisonhoehr.ai@gmail.com';

-- 4. Verificar se a atualização foi bem-sucedida
DO $$
DECLARE
    user_role TEXT;
    user_status TEXT;
    allowed_courses_count INTEGER;
BEGIN
    SELECT 
        role, 
        status, 
        array_length(allowed_courses, 1) 
    INTO 
        user_role, 
        user_status, 
        allowed_courses_count
    FROM public.users
    WHERE email = 'geisonhoehr.ai@gmail.com';
    
    RAISE NOTICE 'Usuário atualizado: Role=%, Status=%, Cursos permitidos=%', 
        user_role, user_status, allowed_courses_count;
END $$;

-- 5. Criar uma assinatura ativa para o usuário
DO $$
DECLARE
    user_id TEXT;
BEGIN
    SELECT id INTO user_id
    FROM public.users
    WHERE email = 'geisonhoehr.ai@gmail.com';
    
    -- Verificar se já existe uma assinatura
    IF EXISTS (SELECT 1 FROM subscriptions WHERE user_id = user_id) THEN
        -- Atualizar assinatura existente
        UPDATE subscriptions
        SET 
            status = 'active',
            current_period_start = NOW(),
            current_period_end = NOW() + INTERVAL '365 days',
            updated_at = NOW()
        WHERE user_id = user_id;
        
        RAISE NOTICE 'Assinatura existente atualizada';
    ELSE
        -- Criar nova assinatura
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
            user_id,
            'active',
            'price_premium_annual',
            'sub_emergency_' || user_id,
            NOW(),
            NOW() + INTERVAL '365 days',
            false,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Nova assinatura criada';
    END IF;
END $$;

-- IMPORTANTE: Este script desativa as RLS para facilitar o acesso em caso de emergência.
-- Para restaurar a segurança, execute o script abaixo após resolver o problema:

/*
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_pdfs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
*/
