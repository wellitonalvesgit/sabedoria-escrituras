-- Script para criar um usuário específico (geisonhoehr.ai@gmail.com)
-- Este script cria o usuário nas tabelas auth.users e public.users
-- e configura acesso a todos os cursos

-- 1. Verificar se o usuário já existe
DO $$
DECLARE
    user_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM auth.users WHERE email = 'geisonhoehr.ai@gmail.com'
    ) INTO user_exists;
    
    IF user_exists THEN
        RAISE NOTICE '⚠️ Usuário geisonhoehr.ai@gmail.com já existe. Excluindo para recriar...';
        
        -- Excluir usuário existente
        DELETE FROM public.users WHERE email = 'geisonhoehr.ai@gmail.com';
        DELETE FROM auth.users WHERE email = 'geisonhoehr.ai@gmail.com';
    END IF;
END $$;

-- 2. Criar usuário na tabela auth.users
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'geisonhoehr.ai@gmail.com',
    crypt('123456', gen_salt('bf')),
    now(),
    NULL,
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Geison Hoehr"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
);

-- 3. Criar usuário na tabela public.users
INSERT INTO public.users (
    id,
    email,
    name,
    avatar_url,
    role,
    status,
    total_points,
    total_reading_minutes,
    courses_enrolled,
    courses_completed,
    current_level,
    access_days,
    access_expires_at,
    allowed_categories,
    blocked_categories,
    allowed_courses,
    blocked_courses,
    created_at,
    updated_at,
    last_active_at
) VALUES (
    (SELECT id FROM auth.users WHERE email = 'geisonhoehr.ai@gmail.com'),
    'geisonhoehr.ai@gmail.com',
    'Geison Hoehr',
    NULL,
    'student',
    'active',
    0,
    0,
    0,
    0,
    1,
    365,
    now() + interval '365 days',
    NULL,
    NULL,
    (SELECT array_agg(id::text) FROM courses WHERE status = 'published'),
    NULL,
    now(),
    now(),
    now()
);

-- 4. Criar assinatura para o usuário
INSERT INTO subscriptions (
    user_id,
    status,
    subscription_id,
    current_period_start,
    current_period_end,
    cancel_at_period_end,
    created_at,
    updated_at
) VALUES (
    (SELECT id FROM auth.users WHERE email = 'geisonhoehr.ai@gmail.com'),
    'active',
    'sub_' || (SELECT id FROM auth.users WHERE email = 'geisonhoehr.ai@gmail.com'),
    now(),
    now() + interval '365 days',
    false,
    now(),
    now()
);

-- 5. Verificar usuário criado
DO $$
DECLARE
    user_id TEXT;
    user_email TEXT;
    allowed_courses_count INTEGER;
    has_subscription BOOLEAN;
BEGIN
    -- Verificar usuário
    SELECT id, email INTO user_id, user_email
    FROM auth.users
    WHERE email = 'geisonhoehr.ai@gmail.com';
    
    IF user_id IS NULL THEN
        RAISE NOTICE '❌ Usuário não foi criado corretamente';
    ELSE
        RAISE NOTICE '✅ Usuário criado: ID=%, Email=%', user_id, user_email;
        
        -- Verificar cursos permitidos
        SELECT array_length(allowed_courses, 1) INTO allowed_courses_count
        FROM public.users
        WHERE email = 'geisonhoehr.ai@gmail.com';
        
        RAISE NOTICE '✅ Usuário tem acesso a % cursos', allowed_courses_count;
        
        -- Verificar assinatura
        SELECT EXISTS (
            SELECT 1 FROM subscriptions WHERE user_id = user_id
        ) INTO has_subscription;
        
        IF has_subscription THEN
            RAISE NOTICE '✅ Assinatura criada com sucesso';
        ELSE
            RAISE NOTICE '❌ Assinatura não foi criada';
        END IF;
    END IF;
END $$;
