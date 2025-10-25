# 💰 CHECKLIST SaaS - Sabedoria das Escrituras

**Pré-requisito:** ✅ MVP lançado e validado (100+ usuários ativos)
**Tempo Total Estimado:** 190 horas (6-8 semanas full-time)
**Objetivo:** Transformar MVP em SaaS com assinaturas

---

## ⚠️ IMPORTANTE: Quando Começar o SaaS?

**NÃO comece SaaS antes de:**
- [ ] MVP lançado há pelo menos 1 mês
- [ ] 100+ usuários cadastrados
- [ ] 50+ usuários ativos (usam semanalmente)
- [ ] NPS (Net Promoter Score) > 40
- [ ] Taxa de retenção D7 > 20%
- [ ] Feedback positivo dos usuários
- [ ] Problema claramente validado

**Se não atingir essas métricas:** Foque em melhorar o produto core, não em monetização.

---

## 💳 FASE 1: SISTEMA DE PAGAMENTOS (40 horas)

### 1. Integração Stripe ⏱️ 20h

**Setup Inicial:**
- [ ] Criar conta Stripe (https://stripe.com)
- [ ] Configurar conta em modo teste
- [ ] Obter API keys (test e production)
- [ ] Instalar SDK: `pnpm add stripe @stripe/stripe-js`

**Backend:**
```typescript
// lib/stripe.ts
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-10-28'
})
```

**Checklist Backend:**
- [ ] Criar `lib/stripe.ts`
- [ ] API `/api/checkout/session` (criar sessão de pagamento)
- [ ] API `/api/webhooks/stripe` (receber eventos)
- [ ] Verificar assinatura do webhook
- [ ] Processar eventos: `checkout.session.completed`
- [ ] Processar eventos: `invoice.payment_succeeded`
- [ ] Processar eventos: `invoice.payment_failed`
- [ ] Processar eventos: `customer.subscription.deleted`

**Frontend:**
```typescript
// components/checkout-button.tsx
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
```

**Checklist Frontend:**
- [ ] Criar `components/checkout-button.tsx`
- [ ] Criar página de checkout
- [ ] Criar página de sucesso
- [ ] Criar página de cancelamento
- [ ] Adicionar loading states
- [ ] Adicionar error handling

**Testes:**
- [ ] Testar com cartão de teste: `4242 4242 4242 4242`
- [ ] Testar pagamento bem-sucedido
- [ ] Testar pagamento falhado
- [ ] Testar cancelamento
- [ ] Verificar webhooks sendo recebidos

---

### 2. Webhooks de Pagamento ⏱️ 15h

**Eventos Principais:**
```typescript
// app/api/webhooks/stripe/route.ts

switch (event.type) {
  case 'checkout.session.completed':
    // Criar assinatura no banco
    break

  case 'invoice.payment_succeeded':
    // Renovar assinatura
    break

  case 'invoice.payment_failed':
    // Marcar como inadimplente
    break

  case 'customer.subscription.deleted':
    // Cancelar assinatura
    break

  case 'customer.subscription.updated':
    // Atualizar plano
    break
}
```

**Checklist:**
- [ ] Configurar webhook endpoint no Stripe Dashboard
- [ ] Validar assinatura do webhook (security)
- [ ] Criar função `handleCheckoutCompleted()`
- [ ] Criar função `handlePaymentSucceeded()`
- [ ] Criar função `handlePaymentFailed()`
- [ ] Criar função `handleSubscriptionCanceled()`
- [ ] Logging de todos os eventos
- [ ] Retry automático em caso de erro
- [ ] Notificar usuário por email

---

### 3. UI de Checkout ⏱️ 5h

**Componentes:**
- [ ] `components/pricing-table.tsx` - Tabela de preços
- [ ] `components/checkout-button.tsx` - Botão de compra
- [ ] `components/payment-form.tsx` - Formulário de pagamento
- [ ] `app/checkout/page.tsx` - Página de checkout
- [ ] `app/checkout/success/page.tsx` - Página de sucesso
- [ ] `app/checkout/canceled/page.tsx` - Página de cancelamento

**Features:**
- [ ] Mostrar planos disponíveis
- [ ] Comparação de planos
- [ ] Destaque do plano mais popular
- [ ] FAQ de pagamento
- [ ] Selos de segurança (SSL, Stripe)
- [ ] Garantia de 7 dias

---

## 📦 FASE 2: PLANOS E ASSINATURAS (30 horas)

### 4. Estrutura de Planos ⏱️ 10h

**Tabela de Banco:**
```sql
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL, -- 'Free', 'Pro', 'Enterprise'
  slug TEXT UNIQUE NOT NULL,
  price_monthly DECIMAL(10,2),
  price_yearly DECIMAL(10,2),
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  features JSONB, -- Lista de features
  limits JSONB, -- {courses: 5, highlights: 100}
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT, -- 'active', 'canceled', 'past_due', 'trialing'
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Checklist:**
- [ ] Criar migration SQL
- [ ] Executar no Supabase
- [ ] Seed com 3 planos iniciais
- [ ] Criar tipos TypeScript
- [ ] Criar funções helper em `lib/subscriptions.ts`

**Planos Sugeridos:**
```json
{
  "free": {
    "name": "Gratuito",
    "price_monthly": 0,
    "features": [
      "5 cursos grátis",
      "Marcações ilimitadas",
      "Modo Kindle",
      "Gamificação básica"
    ],
    "limits": {
      "courses_access": 5,
      "highlights": -1,
      "summaries": 10
    }
  },
  "pro": {
    "name": "Pro",
    "price_monthly": 29.90,
    "price_yearly": 299.00,
    "features": [
      "Todos os cursos",
      "Marcações e resumos ilimitados",
      "Certificados",
      "Sem anúncios",
      "Suporte prioritário"
    ],
    "limits": {
      "courses_access": -1,
      "highlights": -1,
      "summaries": -1,
      "certificates": true
    }
  },
  "enterprise": {
    "name": "Enterprise",
    "price_monthly": 99.90,
    "features": [
      "Tudo do Pro",
      "White-label",
      "API access",
      "Custom domain",
      "Múltiplos usuários"
    ],
    "limits": {
      "users": 50,
      "white_label": true,
      "api_access": true
    }
  }
}
```

---

### 5. Lógica de Controle de Acesso ⏱️ 15h

**Middleware de Verificação:**
```typescript
// middleware/check-subscription.ts

export async function checkSubscription(userId: string) {
  const subscription = await getActiveSubscription(userId)

  if (!subscription) {
    return { plan: 'free', limits: FREE_LIMITS }
  }

  if (subscription.status !== 'active') {
    return { plan: 'free', limits: FREE_LIMITS }
  }

  const plan = await getPlan(subscription.plan_id)
  return { plan: plan.slug, limits: plan.limits }
}

export async function hasAccess(userId: string, feature: string) {
  const { plan, limits } = await checkSubscription(userId)

  // Verificar se o plano tem acesso à feature
  // Verificar se não atingiu limite de uso

  return { hasAccess: boolean, reason?: string }
}
```

**Checklist:**
- [ ] Criar `lib/subscription-utils.ts`
- [ ] Função `getActiveSubscription(userId)`
- [ ] Função `hasAccess(userId, feature)`
- [ ] Função `getRemainingUsage(userId, resource)`
- [ ] Middleware para proteger rotas premium
- [ ] Componente `<UpgradePrompt />` para features pagas
- [ ] Testes de controle de acesso

**Aplicar Controle:**
- [ ] Limite de cursos acessíveis (Free: 5, Pro: todos)
- [ ] Limite de resumos (Free: 10, Pro: ilimitado)
- [ ] Acesso a certificados (apenas Pro+)
- [ ] Remoção de anúncios (apenas Pro+)

---

### 6. Upgrade/Downgrade ⏱️ 5h

**Funcionalidades:**
```typescript
// Upgrade de Free para Pro
async function upgradeSubscription(userId: string, newPlanId: string) {
  // 1. Criar checkout session no Stripe
  // 2. Redirecionar para Stripe Checkout
  // 3. Webhook processa pagamento
  // 4. Atualizar assinatura no banco
}

// Downgrade de Pro para Free
async function downgradeSubscription(userId: string) {
  // 1. Cancelar no Stripe
  // 2. Marcar cancel_at_period_end = true
  // 3. Usuário continua com Pro até fim do período
  // 4. Webhook processa cancelamento
  // 5. Atualizar status para 'free'
}

// Alterar de mensal para anual
async function changeBillingPeriod(userId: string, period: 'monthly' | 'yearly') {
  // 1. Criar nova subscription no Stripe
  // 2. Cancelar antiga
  // 3. Aplicar crédito proporcional
}
```

**Checklist:**
- [ ] API `/api/subscriptions/upgrade`
- [ ] API `/api/subscriptions/downgrade`
- [ ] API `/api/subscriptions/change-period`
- [ ] Página de gerenciamento de assinatura
- [ ] Confirmação antes de downgrade
- [ ] Explicar o que acontece ao downgrade
- [ ] Testar upgrade → downgrade → upgrade

---

## 🏢 FASE 3: MULTI-TENANCY (50 horas)

### 7. Arquitetura Multi-tenant ⏱️ 20h

**Conceito:**
- Cada **organização** tem seus próprios dados
- Usuários podem pertencer a múltiplas organizações
- Dados isolados por `organization_id`

**Schema:**
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  custom_domain TEXT,
  plan_id UUID REFERENCES subscription_plans(id),
  owner_id UUID REFERENCES users(id),
  settings JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'owner', 'admin', 'member'
  invited_by UUID REFERENCES users(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Adicionar organization_id em todas as tabelas
ALTER TABLE courses ADD COLUMN organization_id UUID REFERENCES organizations(id);
ALTER TABLE highlights ADD COLUMN organization_id UUID REFERENCES organizations(id);
-- ... etc
```

**Checklist:**
- [ ] Criar tabelas de organizações
- [ ] Migrar dados existentes (criar org padrão)
- [ ] Adicionar `organization_id` em todas as tabelas
- [ ] Atualizar RLS policies para filtrar por org
- [ ] Criar função `getCurrentOrganization()`
- [ ] Middleware para setar contexto de org
- [ ] Testar isolamento de dados

---

### 8. Gerenciamento de Equipe ⏱️ 15h

**Features:**
- [ ] Convites por email
- [ ] Aceitar/rejeitar convites
- [ ] Listar membros da equipe
- [ ] Alterar roles (owner → admin → member)
- [ ] Remover membros
- [ ] Transferir ownership

**APIs:**
- [ ] POST `/api/organizations/[id]/invite` - Enviar convite
- [ ] GET `/api/organizations/[id]/invites` - Listar convites pendentes
- [ ] POST `/api/invites/[id]/accept` - Aceitar convite
- [ ] DELETE `/api/invites/[id]` - Rejeitar/cancelar
- [ ] GET `/api/organizations/[id]/members` - Listar membros
- [ ] PUT `/api/organizations/[id]/members/[userId]` - Alterar role
- [ ] DELETE `/api/organizations/[id]/members/[userId]` - Remover

**UI:**
- [ ] Página de gerenciamento de equipe
- [ ] Modal de convidar membro
- [ ] Lista de convites pendentes
- [ ] Lista de membros ativos
- [ ] Controle de permissões por role

---

### 9. Seletor de Organização ⏱️ 15h

**Features:**
- [ ] Dropdown para trocar entre organizações
- [ ] Criar nova organização
- [ ] Contexto global de organização atual
- [ ] Persistir organização selecionada (localStorage)

**Componentes:**
```tsx
// components/organization-switcher.tsx
<Select value={currentOrg} onChange={switchOrg}>
  {organizations.map(org => (
    <Option value={org.id}>{org.name}</Option>
  ))}
  <Separator />
  <Option onClick={createNewOrg}>+ Nova Organização</Option>
</Select>
```

**Checklist:**
- [ ] Criar `components/organization-switcher.tsx`
- [ ] Context `OrganizationContext`
- [ ] Hook `useCurrentOrganization()`
- [ ] Adicionar no header/sidebar
- [ ] Atualizar todas as queries para usar org_id
- [ ] Testar troca de organização

---

## 🎨 FASE 4: WHITE-LABEL (25 horas)

### 10. Customização de Marca ⏱️ 15h

**Features Customizáveis:**
- [ ] Logo (header, favicon)
- [ ] Cores primárias e secundárias
- [ ] Fontes
- [ ] Imagens de fundo
- [ ] Texto de boas-vindas
- [ ] Email templates
- [ ] Footer customizado

**Schema:**
```sql
ALTER TABLE organizations ADD COLUMN branding JSONB;

-- Estrutura do JSONB:
{
  "logo_url": "...",
  "favicon_url": "...",
  "primary_color": "#1E40AF",
  "secondary_color": "#F59E0B",
  "font_family": "Inter",
  "welcome_message": "Bem-vindo!",
  "footer_text": "© 2025 Minha Empresa"
}
```

**Checklist:**
- [ ] Criar `app/admin/branding/page.tsx`
- [ ] Form de customização de marca
- [ ] Preview em tempo real
- [ ] Upload de logo/favicon
- [ ] Color picker para cores
- [ ] Font selector
- [ ] Salvar em `organizations.branding`
- [ ] Aplicar branding em toda a aplicação

**Aplicação:**
```tsx
// lib/branding.ts
export function useBranding() {
  const org = useCurrentOrganization()
  return org.branding || DEFAULT_BRANDING
}

// Em qualquer componente:
const branding = useBranding()
<div style={{ color: branding.primary_color }}>...</div>
```

---

### 11. Domínio Customizado ⏱️ 10h

**Features:**
- [ ] Configurar domínio customizado
- [ ] Validar propriedade do domínio (DNS)
- [ ] SSL automático
- [ ] Redirecionar de subdomínio para domínio custom

**Vercel:**
- [ ] Adicionar domínio no Vercel Dashboard
- [ ] Configurar DNS (CNAME ou A record)
- [ ] Aguardar propagação
- [ ] Verificar SSL

**Middleware:**
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host')

  // Se é domínio customizado
  if (hostname !== 'seuapp.com') {
    // Buscar organização por custom_domain
    const org = await getOrgByDomain(hostname)

    // Setar contexto de organização
    request.headers.set('x-organization-id', org.id)
  }

  return NextResponse.next()
}
```

**Checklist:**
- [ ] Campo `custom_domain` em `organizations`
- [ ] API para configurar domínio
- [ ] Validação de propriedade (TXT record)
- [ ] Middleware para detectar domínio
- [ ] Aplicar branding da org
- [ ] Documentação para clientes

---

## 📊 FASE 5: ANALYTICS AVANÇADO (25 horas)

### 12. Dashboard de Analytics ⏱️ 15h

**Métricas para Admin/Org:**
- [ ] Total de usuários
- [ ] Usuários ativos (DAU, WAU, MAU)
- [ ] Taxa de retenção (D1, D7, D30)
- [ ] Cursos mais acessados
- [ ] Tempo médio de leitura
- [ ] Taxa de conclusão de cursos
- [ ] Marcações criadas por dia
- [ ] Resumos criados por dia
- [ ] Churn rate (cancelamentos)
- [ ] MRR (Monthly Recurring Revenue)
- [ ] LTV (Lifetime Value)

**Implementação:**
```typescript
// lib/analytics.ts

export async function getAnalytics(orgId: string, period: 'day' | 'week' | 'month') {
  // Queries agregadas no Supabase
  const [users, active, retention, revenue] = await Promise.all([
    getTotalUsers(orgId),
    getActiveUsers(orgId, period),
    getRetention(orgId),
    getMRR(orgId)
  ])

  return { users, active, retention, revenue }
}
```

**Checklist:**
- [ ] Criar `app/admin/analytics/page.tsx`
- [ ] Gráficos com Recharts ou Chart.js
- [ ] Filtros por período
- [ ] Export para CSV/PDF
- [ ] Comparação com período anterior
- [ ] Dashboards diferentes para roles

---

### 13. Tracking de Eventos ⏱️ 10h

**Eventos para Rastrear:**
- [ ] Cadastro completo
- [ ] Login
- [ ] Curso acessado
- [ ] PDF aberto
- [ ] Marcação criada
- [ ] Resumo criado
- [ ] Conquista desbloqueada
- [ ] Upgrade de plano
- [ ] Cancelamento

**Implementação:**
```typescript
// lib/tracking.ts

export async function trackEvent(
  userId: string,
  event: string,
  properties?: Record<string, any>
) {
  await supabase.from('events').insert({
    user_id: userId,
    event_name: event,
    properties: properties,
    created_at: new Date()
  })

  // Opcional: Enviar também para serviço externo
  // analytics.track(event, properties)
}

// Uso:
trackEvent(user.id, 'course_accessed', {
  course_id: courseId,
  course_title: course.title
})
```

**Checklist:**
- [ ] Criar tabela `events`
- [ ] Função `trackEvent()`
- [ ] Adicionar tracking em pontos-chave
- [ ] Dashboard de eventos
- [ ] Funnel analysis

---

## 🆘 FASE 6: SISTEMA DE SUPORTE (20 horas)

### 14. Chat/Tickets ⏱️ 12h

**Opção 1: Integração com Serviço Externo**
- [ ] Intercom
- [ ] Crisp
- [ ] Tawk.to
- [ ] LiveChat

**Opção 2: Sistema Próprio**
```sql
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  subject TEXT NOT NULL,
  description TEXT,
  status TEXT, -- 'open', 'in_progress', 'resolved', 'closed'
  priority TEXT, -- 'low', 'medium', 'high', 'urgent'
  assigned_to UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ticket_messages (
  id UUID PRIMARY KEY,
  ticket_id UUID REFERENCES support_tickets(id),
  user_id UUID REFERENCES users(id),
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Checklist:**
- [ ] Criar schema de tickets
- [ ] API CRUD de tickets
- [ ] Página de criar ticket
- [ ] Página de visualizar ticket
- [ ] Sistema de mensagens no ticket
- [ ] Notificações de novos tickets (email)
- [ ] Dashboard de suporte para admin

---

### 15. Base de Conhecimento (FAQ) ⏱️ 8h

**Estrutura:**
```sql
CREATE TABLE kb_categories (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  icon TEXT,
  order_index INTEGER
);

CREATE TABLE kb_articles (
  id UUID PRIMARY KEY,
  category_id UUID REFERENCES kb_categories(id),
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  content TEXT,
  views INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Checklist:**
- [ ] Criar schema
- [ ] Admin para gerenciar artigos
- [ ] Página pública de FAQ
- [ ] Busca em artigos
- [ ] Votação "Foi útil?"
- [ ] Artigos relacionados
- [ ] SEO otimizado

---

## 🧪 FASE 7: TESTES E QUALIDADE (Contínuo)

### 16. Testes Automatizados

**Unit Tests (Jest):**
- [ ] Testes de funções utils
- [ ] Testes de validações
- [ ] Testes de cálculos (pricing, limits)

**Integration Tests:**
- [ ] Testes de APIs
- [ ] Testes de webhooks Stripe
- [ ] Testes de autenticação

**E2E Tests (Playwright/Cypress):**
- [ ] Fluxo completo de checkout
- [ ] Fluxo de upgrade/downgrade
- [ ] Fluxo de convite de equipe
- [ ] Fluxo de criação de conteúdo

---

## 📊 MÉTRICAS DE SUCESSO - SaaS

### Métricas Financeiras
- **MRR** (Monthly Recurring Revenue) > $10,000
- **Churn Rate** < 5%
- **LTV/CAC** > 3:1
- **Gross Margin** > 80%

### Métricas de Produto
- **Free → Pro Conversion** > 5%
- **Trial → Paid Conversion** > 20%
- **NPS** > 50
- **Daily Active Users** > 500

### Métricas de Suporte
- **First Response Time** < 2 horas
- **Resolution Time** < 24 horas
- **Customer Satisfaction** > 4.5/5

---

## ⏱️ TIMELINE TOTAL - SaaS

### Mês 1: Pagamentos (70h)
- Semana 1-2: Integração Stripe
- Semana 3-4: Planos e assinaturas

### Mês 2: Multi-tenant + White-label (70h)
- Semana 5-6: Arquitetura multi-tenant
- Semana 7-8: White-label básico

### Mês 3: Analytics + Suporte (50h)
- Semana 9-10: Dashboard analytics
- Semana 11: Sistema de suporte
- Semana 12: Testes e polish

**Total:** 190 horas = **3 meses** full-time ou **6 meses** part-time

---

## 💡 DICAS PARA SUCESSO DO SaaS

### Pricing
- ✅ Comece com preços mais altos, depois ajuste
- ✅ Ofereça desconto anual (20-30%)
- ✅ Trial de 14 dias aumenta conversão
- ✅ Não tenha medo de cobrar

### Produto
- ✅ Foque em resolver problema real
- ✅ Não adicione features que ninguém pediu
- ✅ Pergunte "por que" 5 vezes antes de construir
- ✅ Ship rápido, itere baseado em dados

### Marketing
- ✅ Content marketing é chave
- ✅ SEO leva tempo mas compensa
- ✅ Email marketing tem alto ROI
- ✅ Referrals são ouro

### Suporte
- ✅ Responda rápido (mesmo que seja "vou verificar")
- ✅ Trate cada cliente como único
- ✅ Use feedback para melhorar produto
- ✅ Surpreenda positivamente

---

## 📚 RECURSOS ÚTEIS

### Stripe
- Documentação: https://stripe.com/docs
- Testing: https://stripe.com/docs/testing
- Webhooks: https://stripe.com/docs/webhooks

### SaaS Metrics
- SaaS Metrics Guide: https://www.forentrepreneurs.com/saas-metrics-2/
- Churn Calculator: https://baremetrics.com/calculator/churn

### Multi-tenancy
- Multi-tenant Architecture: https://docs.microsoft.com/en-us/azure/architecture/guide/multitenant/overview

---

## ✅ CHECKLIST FINAL - SaaS Pronto

### Pagamentos
- [ ] Stripe integrado e testado
- [ ] Webhooks processando corretamente
- [ ] Planos configurados
- [ ] Checkout funcionando
- [ ] Emails de confirmação enviando

### Assinaturas
- [ ] Controle de acesso por plano
- [ ] Upgrade/downgrade funciona
- [ ] Cancelamento funciona
- [ ] Renovação automática

### Multi-tenant
- [ ] Dados isolados por organização
- [ ] Convites de equipe funcionam
- [ ] Seletor de organização
- [ ] RLS policies corretas

### White-label
- [ ] Customização de marca funciona
- [ ] Preview em tempo real
- [ ] Domínio customizado (opcional)

### Analytics
- [ ] Dashboard implementado
- [ ] Métricas principais rastreadas
- [ ] Export de dados

### Suporte
- [ ] Sistema de tickets ou integração
- [ ] FAQ/Base de conhecimento
- [ ] Emails automáticos

### Testes
- [ ] Unit tests > 70% coverage
- [ ] E2E tests de fluxos críticos
- [ ] Testes de pagamento em staging

### Legal
- [ ] Termos de Serviço atualizados
- [ ] Política de reembolso
- [ ] Privacy policy (LGPD/GDPR)

---

**Criado em:** 25 de Outubro de 2025
**Responsável:** Equipe de Desenvolvimento
**Prazo Estimado:** 3-6 meses após MVP validado

---

**Lembre-se:** SaaS é uma maratona, não uma corrida de 100 metros. 🏃‍♂️

**Foque em:** Resolver problema real > Adicionar features > Monetizar

**Boa sorte! 💰🚀**
