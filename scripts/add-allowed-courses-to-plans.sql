-- Adicionar coluna allowed_courses na tabela subscription_plans
-- Esta coluna define quais cursos específicos este plano permite acessar
-- Se NULL = acesso a todos os cursos
-- Se array vazio [] = sem acesso a nenhum curso
-- Se array com IDs = acesso apenas aos cursos listados

ALTER TABLE subscription_plans
ADD COLUMN IF NOT EXISTS allowed_courses UUID[] DEFAULT NULL;

COMMENT ON COLUMN subscription_plans.allowed_courses IS
'Array de IDs de cursos que este plano permite acessar. NULL = todos os cursos, [] = nenhum curso, [id1, id2] = apenas cursos específicos';

-- Configurar plano Premium com acesso total (NULL)
UPDATE subscription_plans
SET allowed_courses = NULL
WHERE name = 'premium';

-- Configurar plano Básico (inicialmente vazio, você poderá adicionar via admin)
UPDATE subscription_plans
SET allowed_courses = ARRAY[]::UUID[]
WHERE name = 'basico';
