-- Script para corrigir conflitos nas políticas RLS
-- Este script remove políticas conflitantes e garante que apenas as políticas corretas existam

-- 1. Verificar políticas atuais
DO $$
BEGIN
    RAISE NOTICE '🔍 Verificando políticas RLS atuais na tabela users...';
END $$;

-- 2. Desativar RLS temporariamente para fazer as alterações
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 3. Remover políticas conflitantes
DROP POLICY IF EXISTS "Users can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- 4. Verificar se as políticas corretas existem, se não, criá-las
DO $$
BEGIN
    -- Verificar política de visualização
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' AND policyname = 'users_can_view_own'
    ) THEN
        RAISE NOTICE 'Criando política users_can_view_own...';
        
        EXECUTE 'CREATE POLICY "users_can_view_own" 
                ON public.users 
                FOR SELECT 
                USING (auth.uid() = id)';
    END IF;
    
    -- Verificar política de atualização
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' AND policyname = 'users_can_update_own'
    ) THEN
        RAISE NOTICE 'Criando política users_can_update_own...';
        
        EXECUTE 'CREATE POLICY "users_can_update_own" 
                ON public.users 
                FOR UPDATE 
                USING (auth.uid() = id) 
                WITH CHECK (auth.uid() = id)';
    END IF;
    
    -- Verificar política de inserção
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' AND policyname = 'users_can_insert_own'
    ) THEN
        RAISE NOTICE 'Criando política users_can_insert_own...';
        
        EXECUTE 'CREATE POLICY "users_can_insert_own" 
                ON public.users 
                FOR INSERT 
                WITH CHECK (auth.uid() = id)';
    END IF;
END $$;

-- 5. Reativar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 6. Verificar políticas após as alterações
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    RAISE NOTICE '✅ Políticas RLS atualizadas com sucesso!';
    RAISE NOTICE 'Políticas atuais na tabela users:';
    
    FOR policy_record IN 
        SELECT policyname, cmd, qual
        FROM pg_policies
        WHERE tablename = 'users'
        ORDER BY policyname
    LOOP
        RAISE NOTICE '- %: % (%)', 
            policy_record.policyname, 
            policy_record.cmd, 
            policy_record.qual;
    END LOOP;
END $$;

-- 7. Verificar acesso do usuário
DO $$
DECLARE
    user_id TEXT;
    user_email TEXT;
    user_role TEXT;
    user_status TEXT;
    allowed_courses_count INTEGER;
BEGIN
    -- Buscar dados do usuário
    SELECT 
        id, email, role, status, array_length(allowed_courses, 1)
    INTO 
        user_id, user_email, user_role, user_status, allowed_courses_count
    FROM public.users
    WHERE email = 'geisonhoehr.ai@gmail.com';
    
    IF user_id IS NULL THEN
        RAISE NOTICE '❌ Usuário não encontrado na tabela public.users';
    ELSE
        RAISE NOTICE '✅ Usuário encontrado: ID=%, Email=%, Role=%, Status=%, Cursos permitidos=%',
            user_id, user_email, user_role, user_status, allowed_courses_count;
    END IF;
END $$;
