-- Correção de RLS (Row Level Security) para tabela users

-- Primeiro, remover políticas existentes (se houver)
DROP POLICY IF EXISTS "Usuários só podem ver seus próprios dados" ON public.users;
DROP POLICY IF EXISTS "Usuários só podem editar seus próprios dados" ON public.users;
DROP POLICY IF EXISTS "Administradores podem ver todos os usuários" ON public.users;
DROP POLICY IF EXISTS "Administradores podem editar todos os usuários" ON public.users;

-- Garantir que RLS está habilitado na tabela users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Criar política para usuários verem apenas seus próprios dados
CREATE POLICY "Usuários só podem ver seus próprios dados"
ON public.users
FOR SELECT
USING (auth.uid() = id);

-- Criar política para usuários editarem apenas seus próprios dados
CREATE POLICY "Usuários só podem editar seus próprios dados"
ON public.users
FOR UPDATE
USING (auth.uid() = id);

-- Criar política para administradores verem todos os usuários
CREATE POLICY "Administradores podem ver todos os usuários"
ON public.users
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Criar política para administradores editarem todos os usuários
CREATE POLICY "Administradores podem editar todos os usuários"
ON public.users
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Criar política para administradores inserirem novos usuários
CREATE POLICY "Administradores podem inserir usuários"
ON public.users
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Criar política para administradores excluírem usuários
CREATE POLICY "Administradores podem excluir usuários"
ON public.users
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Verificar se o serviço de autenticação pode inserir novos usuários
CREATE POLICY "Serviço de autenticação pode inserir usuários"
ON public.users
FOR INSERT
WITH CHECK (auth.uid() = id);
