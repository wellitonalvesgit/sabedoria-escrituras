-- =====================================================
-- SISTEMA DE 3 CATEGORIAS + COMPRAS INDIVIDUAIS
-- Data: 2025-01-05
-- =====================================================

-- ====================================
-- 1. CRIAR/ATUALIZAR CATEGORIAS
-- ====================================

-- Inserir ou atualizar as 3 categorias principais
INSERT INTO categories (name, slug, color, description, display_order)
VALUES
  ('As Cartas de Paulo', 'cartas-de-paulo', 'oklch(0.75 0.12 85)', 'Curso principal sobre as cartas paulinas', 1),
  ('Bônus', 'bonus', 'oklch(0.65 0.15 140)', 'Cursos extras incluídos no plano Premium', 2),
  ('Arsenal Espiritual', 'arsenal-espiritual', 'oklch(0.6 0.2 30)', 'E-books vendidos separadamente', 3)
ON CONFLICT (slug)
DO UPDATE SET
  name = EXCLUDED.name,
  color = EXCLUDED.color,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order;

-- ====================================
-- 2. TABELA DE COMPRAS INDIVIDUAIS
-- ====================================

-- Criar tabela para rastrear compras individuais de cursos
CREATE TABLE IF NOT EXISTS user_course_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  purchase_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payment_status TEXT NOT NULL DEFAULT 'completed' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_id TEXT, -- ID da transação (Corvex, Stripe, etc)
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'BRL',
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ, -- NULL = vitalício
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Um usuário não pode comprar o mesmo curso duas vezes (ativo)
  UNIQUE(user_id, course_id, is_active)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_course_purchases_user_id ON user_course_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_user_course_purchases_course_id ON user_course_purchases(course_id);
CREATE INDEX IF NOT EXISTS idx_user_course_purchases_active ON user_course_purchases(user_id, is_active) WHERE is_active = true;

-- Comentários
COMMENT ON TABLE user_course_purchases IS 'Rastreia compras individuais de cursos (especialmente Arsenal Espiritual)';
COMMENT ON COLUMN user_course_purchases.expires_at IS 'NULL = vitalício. Usado para cursos com prazo de acesso';

-- ====================================
-- 3. ATUALIZAR SUBSCRIPTION_PLANS
-- ====================================

-- Adicionar campo para identificar o tipo de plano
ALTER TABLE subscription_plans
ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'premium' CHECK (plan_type IN ('basic', 'premium'));

-- Adicionar duração em dias (NULL = vitalício)
ALTER TABLE subscription_plans
ADD COLUMN IF NOT EXISTS duration_days INTEGER;

-- Comentários
COMMENT ON COLUMN subscription_plans.plan_type IS 'Tipo do plano: basic (2 meses) ou premium (vitalício)';
COMMENT ON COLUMN subscription_plans.duration_days IS 'Duração do plano em dias. NULL = vitalício';

-- Atualizar planos existentes
UPDATE subscription_plans
SET plan_type = 'basic', duration_days = 60
WHERE name ILIKE '%básico%' OR name ILIKE '%basic%';

UPDATE subscription_plans
SET plan_type = 'premium', duration_days = NULL
WHERE name ILIKE '%premium%';

-- ====================================
-- 4. ATUALIZAR SUBSCRIPTIONS
-- ====================================

-- Adicionar data de expiração baseada no plano
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ;

COMMENT ON COLUMN subscriptions.plan_expires_at IS 'Data de expiração do plano (para Básico). NULL = vitalício (Premium)';

-- ====================================
-- 5. FUNÇÃO PARA VERIFICAR ACESSO
-- ====================================

-- Função que verifica se usuário tem acesso a um curso específico
CREATE OR REPLACE FUNCTION check_user_course_access(
  p_user_id UUID,
  p_course_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_course_category_slug TEXT;
  v_has_subscription BOOLEAN := false;
  v_subscription_plan_type TEXT;
  v_subscription_expires_at TIMESTAMPTZ;
  v_has_individual_purchase BOOLEAN := false;
BEGIN
  -- 1. Buscar categoria do curso
  SELECT c.slug INTO v_course_category_slug
  FROM courses co
  JOIN course_categories cc ON cc.course_id = co.id
  JOIN categories c ON c.id = cc.category_id
  WHERE co.id = p_course_id
  LIMIT 1;

  -- Se não encontrou categoria, negar acesso
  IF v_course_category_slug IS NULL THEN
    RETURN false;
  END IF;

  -- 2. Verificar se tem assinatura ativa
  SELECT
    sp.plan_type,
    CASE
      WHEN sp.duration_days IS NULL THEN NULL -- Vitalício
      ELSE s.created_at + (sp.duration_days || ' days')::INTERVAL
    END
  INTO v_subscription_plan_type, v_subscription_expires_at
  FROM subscriptions s
  JOIN subscription_plans sp ON sp.id = s.plan_id
  WHERE s.user_id = p_user_id
    AND s.status IN ('active', 'trial')
  ORDER BY s.created_at DESC
  LIMIT 1;

  -- Se tem assinatura válida
  IF v_subscription_plan_type IS NOT NULL THEN
    -- Verificar se não expirou (para Básico)
    IF v_subscription_expires_at IS NULL OR v_subscription_expires_at > NOW() THEN
      v_has_subscription := true;
    END IF;
  END IF;

  -- 3. Verificar compra individual do curso
  SELECT EXISTS (
    SELECT 1 FROM user_course_purchases
    WHERE user_id = p_user_id
      AND course_id = p_course_id
      AND is_active = true
      AND payment_status = 'completed'
      AND (expires_at IS NULL OR expires_at > NOW())
  ) INTO v_has_individual_purchase;

  -- 4. LÓGICA DE ACESSO POR CATEGORIA

  -- Arsenal Espiritual: APENAS compra individual
  IF v_course_category_slug = 'arsenal-espiritual' THEN
    RETURN v_has_individual_purchase;
  END IF;

  -- Cartas de Paulo: Básico OU Premium
  IF v_course_category_slug = 'cartas-de-paulo' THEN
    RETURN v_has_subscription OR v_has_individual_purchase;
  END IF;

  -- Bônus: APENAS Premium
  IF v_course_category_slug = 'bonus' THEN
    IF v_subscription_plan_type = 'premium' AND v_has_subscription THEN
      RETURN true;
    END IF;
    RETURN v_has_individual_purchase;
  END IF;

  -- Fallback: negar acesso
  RETURN false;
END;
$$;

COMMENT ON FUNCTION check_user_course_access IS 'Verifica se usuário tem acesso a um curso baseado em plano e compras individuais';

-- ====================================
-- 6. RLS (Row Level Security)
-- ====================================

-- Habilitar RLS na tabela user_course_purchases
ALTER TABLE user_course_purchases ENABLE ROW LEVEL SECURITY;

-- Política: Usuários só veem suas próprias compras
CREATE POLICY "Users can view own purchases"
  ON user_course_purchases
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Admin vê tudo
CREATE POLICY "Admins can view all purchases"
  ON user_course_purchases
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- ====================================
-- 7. TRIGGER PARA ATUALIZAR updated_at
-- ====================================

CREATE OR REPLACE FUNCTION update_user_course_purchases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_course_purchases_updated_at
  BEFORE UPDATE ON user_course_purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_user_course_purchases_updated_at();

-- ====================================
-- 8. VERIFICAÇÃO FINAL
-- ====================================

-- Listar categorias criadas
SELECT id, name, slug, color, display_order
FROM categories
WHERE slug IN ('cartas-de-paulo', 'bonus', 'arsenal-espiritual')
ORDER BY display_order;

-- Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_course_purchases'
ORDER BY ordinal_position;

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Sistema de 3 categorias + compras individuais configurado com sucesso!';
  RAISE NOTICE '📚 Categorias: Cartas de Paulo, Bônus, Arsenal Espiritual';
  RAISE NOTICE '💳 Tabela user_course_purchases criada';
  RAISE NOTICE '🔒 Função check_user_course_access() disponível';
END $$;
