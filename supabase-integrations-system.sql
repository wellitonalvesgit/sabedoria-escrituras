-- ============================================
-- MIGRATION: Sistema de Integrações
-- Data: 2025-10-25
-- Descrição: Sistema completo para gerenciar integrações externas
-- ============================================

-- Tabela de integrações disponíveis
CREATE TABLE IF NOT EXISTS public.integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('payment', 'storage', 'email', 'analytics', 'other')),
  icon TEXT,
  is_enabled BOOLEAN DEFAULT false,
  config JSONB DEFAULT '{}',
  credentials_encrypted TEXT, -- Armazena credenciais criptografadas
  last_test_at TIMESTAMP WITH TIME ZONE,
  last_test_status TEXT CHECK (last_test_status IN ('success', 'failed', 'pending')),
  last_test_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de logs de integrações
CREATE TABLE IF NOT EXISTS public.integration_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  integration_id UUID NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'test', 'payment_created', 'file_uploaded', etc
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
  request_data JSONB,
  response_data JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_integrations_category ON public.integrations(category);
CREATE INDEX IF NOT EXISTS idx_integrations_enabled ON public.integrations(is_enabled);
CREATE INDEX IF NOT EXISTS idx_integration_logs_integration ON public.integration_logs(integration_id);
CREATE INDEX IF NOT EXISTS idx_integration_logs_created ON public.integration_logs(created_at DESC);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_integrations_updated_at
BEFORE UPDATE ON public.integrations
FOR EACH ROW
EXECUTE FUNCTION update_integrations_updated_at();

-- RLS Policies (apenas admins podem gerenciar integrações)
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_logs ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem visualizar integrações
CREATE POLICY "Only admins can view integrations"
ON public.integrations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Apenas admins podem inserir integrações
CREATE POLICY "Only admins can insert integrations"
ON public.integrations
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Apenas admins podem atualizar integrações
CREATE POLICY "Only admins can update integrations"
ON public.integrations
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

-- Apenas admins podem deletar integrações
CREATE POLICY "Only admins can delete integrations"
ON public.integrations
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Policies para logs (apenas admins)
CREATE POLICY "Only admins can view integration logs"
ON public.integration_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

CREATE POLICY "System can insert integration logs"
ON public.integration_logs
FOR INSERT
TO authenticated
WITH CHECK (true); -- Permite que o sistema insira logs

-- Seed: Integrações pré-configuradas
INSERT INTO public.integrations (name, display_name, description, category, icon, config) VALUES
  ('asaas', 'Asaas', 'Plataforma de pagamentos brasileira com PIX, Boleto e Cartão', 'payment', '💳', '{"api_url": "https://api.asaas.com/v3", "sandbox": true}'),
  ('stripe', 'Stripe', 'Gateway de pagamento internacional', 'payment', '💰', '{"api_url": "https://api.stripe.com/v1"}'),
  ('mercadopago', 'Mercado Pago', 'Solução de pagamentos da América Latina', 'payment', '🛒', '{"api_url": "https://api.mercadopago.com"}'),
  ('pagseguro', 'PagSeguro', 'Plataforma de pagamentos do UOL', 'payment', '🔐', '{"api_url": "https://ws.pagseguro.uol.com.br"}'),
  ('google-drive', 'Google Drive', 'Armazenamento e compartilhamento de arquivos', 'storage', '📁', '{"api_url": "https://www.googleapis.com/drive/v3"}'),
  ('aws-s3', 'Amazon S3', 'Armazenamento em nuvem da AWS', 'storage', '☁️', '{"region": "us-east-1"}'),
  ('sendgrid', 'SendGrid', 'Serviço de envio de e-mails transacionais', 'email', '📧', '{"api_url": "https://api.sendgrid.com/v3"}'),
  ('mailgun', 'Mailgun', 'API de e-mail para desenvolvedores', 'email', '✉️', '{"api_url": "https://api.mailgun.net/v3"}'),
  ('google-analytics', 'Google Analytics', 'Análise de tráfego e comportamento', 'analytics', '📊', '{}'),
  ('hotjar', 'Hotjar', 'Heatmaps e gravação de sessões', 'analytics', '🔥', '{}')
ON CONFLICT (name) DO NOTHING;

-- Comentários
COMMENT ON TABLE public.integrations IS 'Gerenciamento centralizado de integrações externas';
COMMENT ON TABLE public.integration_logs IS 'Logs de ações realizadas pelas integrações';
COMMENT ON COLUMN public.integrations.credentials_encrypted IS 'API keys e secrets criptografados';
COMMENT ON COLUMN public.integrations.config IS 'Configurações específicas da integração (JSON)';

-- ============================================
-- FIM DA MIGRATION
-- ============================================
