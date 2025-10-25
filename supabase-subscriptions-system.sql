-- ============================================
-- MIGRATION: Sistema de Assinaturas com Asaas
-- Data: 2025-10-25
-- Descrição: Sistema completo de assinaturas, planos e pagamentos
-- ============================================

-- 1. Adicionar campo is_free aos cursos
ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.courses.is_free IS
  'Se true, o curso é gratuito para todos. Se false, requer assinatura premium.';

CREATE INDEX IF NOT EXISTS idx_courses_is_free ON public.courses(is_free);

-- 2. Tabela de planos de assinatura
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
  price_yearly DECIMAL(10,2) NOT NULL DEFAULT 0,
  trial_days INTEGER DEFAULT 30,
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de assinaturas dos usuários
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),

  -- Status da assinatura
  status TEXT NOT NULL DEFAULT 'trial' CHECK (
    status IN ('trial', 'active', 'past_due', 'canceled', 'expired')
  ),

  -- Dados de pagamento (Asaas)
  asaas_customer_id TEXT,
  asaas_subscription_id TEXT,
  payment_method TEXT CHECK (payment_method IN ('credit_card', 'boleto', 'pix')),

  -- Datas importantes
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  canceled_at TIMESTAMP WITH TIME ZONE,

  -- Controle
  auto_renew BOOLEAN DEFAULT true,
  cancel_at_period_end BOOLEAN DEFAULT false,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id) -- Um usuário só pode ter uma assinatura ativa
);

-- 4. Tabela de histórico de pagamentos
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Dados do pagamento
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'BRL',
  status TEXT NOT NULL CHECK (
    status IN ('pending', 'confirmed', 'received', 'overdue', 'refunded', 'canceled')
  ),
  payment_method TEXT,

  -- IDs externos (Asaas)
  asaas_payment_id TEXT UNIQUE,
  asaas_invoice_url TEXT,
  boleto_url TEXT,
  pix_qrcode TEXT,
  pix_copy_paste TEXT,

  -- Datas
  due_date DATE,
  paid_at TIMESTAMP WITH TIME ZONE,

  -- Metadados
  description TEXT,
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Índices para performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_asaas_customer ON public.subscriptions(asaas_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_asaas_subscription ON public.subscriptions(asaas_subscription_id);

CREATE INDEX IF NOT EXISTS idx_payments_subscription ON public.payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_asaas ON public.payments(asaas_payment_id);

-- 6. Triggers para updated_at
CREATE OR REPLACE FUNCTION update_subscription_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_subscription_plans_updated_at
BEFORE UPDATE ON public.subscription_plans
FOR EACH ROW
EXECUTE FUNCTION update_subscription_plans_updated_at();

CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_subscriptions_updated_at();

CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION update_payments_updated_at();

-- 7. RLS Policies

-- Subscription Plans (todos podem ver)
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active plans"
ON public.subscription_plans
FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Only admins can manage plans"
ON public.subscription_plans
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Subscriptions (usuário vê apenas a própria)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
ON public.subscriptions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own subscription"
ON public.subscriptions
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can update subscriptions"
ON public.subscriptions
FOR UPDATE
TO authenticated
USING (true) -- Webhook precisa atualizar
WITH CHECK (true);

CREATE POLICY "Admins can view all subscriptions"
ON public.subscriptions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Payments (usuário vê apenas os próprios)
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments"
ON public.payments
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "System can insert payments"
ON public.payments
FOR INSERT
TO authenticated
WITH CHECK (true); -- API precisa criar pagamentos

CREATE POLICY "System can update payments"
ON public.payments
FOR UPDATE
TO authenticated
USING (true) -- Webhook precisa atualizar
WITH CHECK (true);

CREATE POLICY "Admins can view all payments"
ON public.payments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- 8. Seed: Planos de assinatura
INSERT INTO public.subscription_plans (
  name, display_name, description,
  price_monthly, price_yearly,
  trial_days, features, sort_order
) VALUES
  (
    'free',
    'Gratuito',
    'Acesso aos cursos gratuitos por 30 dias',
    0.00,
    0.00,
    30,
    '["Cursos gratuitos", "Trial de 30 dias", "Suporte por email"]'::jsonb,
    1
  ),
  (
    'premium-monthly',
    'Premium Mensal',
    'Acesso completo a todos os cursos',
    29.90,
    0.00,
    30,
    '["Todos os cursos", "Trial de 30 dias", "Suporte prioritário", "Certificados", "Downloads ilimitados"]'::jsonb,
    2
  ),
  (
    'premium-yearly',
    'Premium Anual',
    'Acesso completo com desconto anual',
    0.00,
    297.00,
    30,
    '["Todos os cursos", "Trial de 30 dias", "Suporte prioritário", "Certificados", "Downloads ilimitados", "2 meses grátis"]'::jsonb,
    3
  )
ON CONFLICT (name) DO NOTHING;

-- 9. Função helper: Verificar se usuário tem acesso premium
CREATE OR REPLACE FUNCTION user_has_premium_access(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_subscription RECORD;
  v_is_trial BOOLEAN;
  v_is_active BOOLEAN;
BEGIN
  -- Buscar assinatura do usuário
  SELECT * INTO v_subscription
  FROM public.subscriptions
  WHERE user_id = p_user_id
  LIMIT 1;

  -- Se não tem assinatura, não tem acesso
  IF v_subscription IS NULL THEN
    RETURN false;
  END IF;

  -- Verificar se está no período de trial
  v_is_trial := (
    v_subscription.status = 'trial'
    AND v_subscription.trial_ends_at > NOW()
  );

  -- Verificar se assinatura está ativa
  v_is_active := (
    v_subscription.status = 'active'
    AND v_subscription.current_period_end > NOW()
  );

  RETURN v_is_trial OR v_is_active;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Função helper: Criar trial para novo usuário
CREATE OR REPLACE FUNCTION create_trial_subscription(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_plan_id UUID;
  v_subscription_id UUID;
BEGIN
  -- Buscar plano gratuito
  SELECT id INTO v_plan_id
  FROM public.subscription_plans
  WHERE name = 'free'
  LIMIT 1;

  -- Criar assinatura trial
  INSERT INTO public.subscriptions (
    user_id,
    plan_id,
    status,
    trial_ends_at,
    current_period_start,
    current_period_end
  ) VALUES (
    p_user_id,
    v_plan_id,
    'trial',
    NOW() + INTERVAL '30 days',
    NOW(),
    NOW() + INTERVAL '30 days'
  )
  RETURNING id INTO v_subscription_id;

  RETURN v_subscription_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Trigger: Criar trial automático ao criar usuário
CREATE OR REPLACE FUNCTION trigger_create_trial_on_user_insert()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_trial_subscription(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comentar trigger antigo se existir
-- DROP TRIGGER IF EXISTS trigger_create_trial_subscription ON public.users;

-- Criar novo trigger
CREATE TRIGGER trigger_create_trial_subscription
AFTER INSERT ON public.users
FOR EACH ROW
EXECUTE FUNCTION trigger_create_trial_on_user_insert();

-- ============================================
-- VERIFICAÇÕES
-- ============================================

-- Ver planos criados
SELECT * FROM public.subscription_plans ORDER BY sort_order;

-- Ver função de verificação de acesso
SELECT user_has_premium_access('00000000-0000-0000-0000-000000000000');

-- ============================================
-- FIM DA MIGRATION
-- ============================================
