-- Fix RLS Policies for course_categories table
-- Data: 2025-10-25
-- Descrição: Adiciona policies para permitir operações CRUD na tabela course_categories

-- Verificar se RLS está habilitado
ALTER TABLE public.course_categories ENABLE ROW LEVEL SECURITY;

-- Drop policies existentes (se houver) para recriar do zero
DROP POLICY IF EXISTS "Allow authenticated users to view course categories" ON public.course_categories;
DROP POLICY IF EXISTS "Allow authenticated users to insert course categories" ON public.course_categories;
DROP POLICY IF EXISTS "Allow authenticated users to update course categories" ON public.course_categories;
DROP POLICY IF EXISTS "Allow authenticated users to delete course categories" ON public.course_categories;

-- Policy para SELECT (qualquer usuário autenticado pode ver)
CREATE POLICY "Allow authenticated users to view course categories"
ON public.course_categories
FOR SELECT
TO authenticated
USING (true);

-- Policy para INSERT (qualquer usuário autenticado pode inserir)
-- Em produção, você pode restringir para apenas admins
CREATE POLICY "Allow authenticated users to insert course categories"
ON public.course_categories
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy para UPDATE (qualquer usuário autenticado pode atualizar)
-- Em produção, você pode restringir para apenas admins
CREATE POLICY "Allow authenticated users to update course categories"
ON public.course_categories
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy para DELETE (qualquer usuário autenticado pode deletar)
-- Em produção, você pode restringir para apenas admins
CREATE POLICY "Allow authenticated users to delete course categories"
ON public.course_categories
FOR DELETE
TO authenticated
USING (true);

-- OPCIONAL: Se você quiser restringir apenas para admins, use estas policies:
/*
-- Drop as policies acima e crie estas:

DROP POLICY IF EXISTS "Allow authenticated users to view course categories" ON public.course_categories;
DROP POLICY IF EXISTS "Allow authenticated users to insert course categories" ON public.course_categories;
DROP POLICY IF EXISTS "Allow authenticated users to update course categories" ON public.course_categories;
DROP POLICY IF EXISTS "Allow authenticated users to delete course categories" ON public.course_categories;

-- SELECT: Todos podem ver
CREATE POLICY "Anyone can view course categories"
ON public.course_categories
FOR SELECT
TO authenticated
USING (true);

-- INSERT/UPDATE/DELETE: Apenas admins
CREATE POLICY "Only admins can insert course categories"
ON public.course_categories
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

CREATE POLICY "Only admins can update course categories"
ON public.course_categories
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

CREATE POLICY "Only admins can delete course categories"
ON public.course_categories
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);
*/

-- Verificar policies criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'course_categories'
ORDER BY policyname;
