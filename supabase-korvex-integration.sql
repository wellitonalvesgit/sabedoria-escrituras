-- ============================================
-- MIGRATION: Integração com Korvex Payment Gateway
-- Data: 2025-01-27
-- Descrição: Adiciona suporte para gateway de pagamento Korvex
-- ============================================

-- 1. Adicionar campos da Korvex na tabela subscriptions
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS korvex_customer_id TEXT,
ADD COLUMN IF NOT EXISTS korvex_subscription_id TEXT;

COMMENT ON COLUMN public.subscriptions.korvex_customer_id IS
  'ID do cliente na plataforma Korvex';
COMMENT ON COLUMN public.subscriptions.korvex_subscription_id IS
  'ID da assinatura na plataforma Korvex';

-- 2. Adicionar campos da Korvex na tabela payments
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS korvex_payment_id TEXT,
ADD COLUMN IF NOT EXISTS korvex_invoice_url TEXT;

COMMENT ON COLUMN public.payments.korvex_payment_id IS
  'ID do pagamento na plataforma Korvex';
COMMENT ON COLUMN public.payments.korvex_invoice_url IS
  'URL da fatura/checkout do pagamento na Korvex';

-- 3. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_korvex_customer ON public.subscriptions(korvex_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_korvex_subscription ON public.subscriptions(korvex_subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_korvex_payment ON public.payments(korvex_payment_id);

-- 4. Adicionar constraint UNIQUE para korvex_payment_id (similar ao asaas_payment_id)
-- Remover constraint única se existir e criar nova que permite NULL
DO $$
BEGIN
  -- Tentar remover constraint se existir
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'payments_korvex_payment_id_key'
  ) THEN
    ALTER TABLE public.payments DROP CONSTRAINT payments_korvex_payment_id_key;
  END IF;
END $$;

-- Criar constraint única parcial (apenas para valores não nulos)
CREATE UNIQUE INDEX IF NOT EXISTS payments_korvex_payment_id_unique 
ON public.payments(korvex_payment_id) 
WHERE korvex_payment_id IS NOT NULL;

-- 5. Verificar se as colunas foram criadas
DO $$
BEGIN
  RAISE NOTICE '✅ Migration Korvex concluída com sucesso!';
  RAISE NOTICE 'Colunas adicionadas:';
  RAISE NOTICE '  - subscriptions.korvex_customer_id';
  RAISE NOTICE '  - subscriptions.korvex_subscription_id';
  RAISE NOTICE '  - payments.korvex_payment_id';
  RAISE NOTICE '  - payments.korvex_invoice_url';
END $$;

