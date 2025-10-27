-- Script para excluir todos os usuários e criar novos
-- ATENÇÃO: Este script é destrutivo e vai remover todos os usuários existentes
-- Use apenas em ambiente de desenvolvimento ou quando absolutamente necessário

-- 1. Fazer backup dos dados importantes (opcional)
DO $$
BEGIN
    RAISE NOTICE '⚠️ ATENÇÃO: Este script vai excluir todos os usuários. Pressione Ctrl+C para cancelar se não tiver certeza.';
END $$;

-- 2. Desativar restrições de chave estrangeira temporariamente
SET session_replication_role = 'replica';

-- 3. Limpar tabelas relacionadas
TRUNCATE subscriptions CASCADE;
TRUNCATE user_course_progress CASCADE;
TRUNCATE user_notes CASCADE;
TRUNCATE user_highlights CASCADE;
TRUNCATE user_bookmarks CASCADE;
TRUNCATE user_achievements CASCADE;
TRUNCATE user_points CASCADE;

-- 4. Excluir usuários da tabela public.users
DELETE FROM public.users;

-- 5. Excluir usuários da tabela auth.users
DELETE FROM auth.users;

-- 6. Criar novo usuário administrador
-- Primeiro na tabela auth.users
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
    'admin@example.com',
    crypt('admin123', gen_salt('bf')),
    now(),
    NULL,
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Admin User"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
);

-- 7. Criar usuário administrador na tabela public.users
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
    (SELECT id FROM auth.users WHERE email = 'admin@example.com'),
    'admin@example.com',
    'Admin User',
    NULL,
    'admin',
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

-- 8. Criar usuário normal de teste
-- Primeiro na tabela auth.users
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
    'teste@example.com',
    crypt('teste123', gen_salt('bf')),
    now(),
    NULL,
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Usuário de Teste"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
);

-- 9. Criar usuário normal na tabela public.users
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
    (SELECT id FROM auth.users WHERE email = 'teste@example.com'),
    'teste@example.com',
    'Usuário de Teste',
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

-- 10. Criar assinatura para o usuário de teste
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
    (SELECT id FROM auth.users WHERE email = 'teste@example.com'),
    'active',
    'sub_' || (SELECT id FROM auth.users WHERE email = 'teste@example.com'),
    now(),
    now() + interval '365 days',
    false,
    now(),
    now()
);

-- 11. Reativar restrições de chave estrangeira
SET session_replication_role = 'origin';

-- 12. Verificar usuários criados
DO $$
DECLARE
    admin_id TEXT;
    admin_email TEXT;
    test_id TEXT;
    test_email TEXT;
    allowed_courses_count INTEGER;
BEGIN
    -- Verificar admin
    SELECT id, email INTO admin_id, admin_email
    FROM auth.users
    WHERE email = 'admin@example.com';
    
    IF admin_id IS NULL THEN
        RAISE NOTICE '❌ Usuário admin não foi criado corretamente';
    ELSE
        RAISE NOTICE '✅ Usuário admin criado: ID=%, Email=%', admin_id, admin_email;
        
        -- Verificar cursos permitidos
        SELECT array_length(allowed_courses, 1) INTO allowed_courses_count
        FROM public.users
        WHERE email = 'admin@example.com';
        
        RAISE NOTICE '✅ Admin tem acesso a % cursos', allowed_courses_count;
    END IF;
    
    -- Verificar usuário de teste
    SELECT id, email INTO test_id, test_email
    FROM auth.users
    WHERE email = 'teste@example.com';
    
    IF test_id IS NULL THEN
        RAISE NOTICE '❌ Usuário de teste não foi criado corretamente';
    ELSE
        RAISE NOTICE '✅ Usuário de teste criado: ID=%, Email=%', test_id, test_email;
        
        -- Verificar cursos permitidos
        SELECT array_length(allowed_courses, 1) INTO allowed_courses_count
        FROM public.users
        WHERE email = 'teste@example.com';
        
        RAISE NOTICE '✅ Usuário de teste tem acesso a % cursos', allowed_courses_count;
    END IF;
END $$;
