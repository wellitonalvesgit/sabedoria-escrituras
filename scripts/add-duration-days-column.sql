-- Adicionar coluna duration_days na tabela subscription_plans
-- null = ilimitado
-- número = dias de duração do plano

ALTER TABLE subscription_plans
ADD COLUMN IF NOT EXISTS duration_days INTEGER;

COMMENT ON COLUMN subscription_plans.duration_days IS 'Duração do plano em dias. NULL = ilimitado';
