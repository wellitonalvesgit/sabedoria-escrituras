# 🎯 Sistema de Gerenciamento de Planos - Admin

## 📋 Visão Geral

Sistema completo para gerenciar planos de assinatura através do painel administrativo, permitindo configurar:
- ✅ Preços mensais e anuais
- ✅ Duração do plano (dias ou ilimitado)
- ✅ Período de trial
- ✅ Ativar/desativar planos
- ✅ Recursos (features) de cada plano

## 🚀 Estrutura Criada

### 1. **Página de Gerenciamento** (`/admin/plans`)
- Interface visual para editar planos
- Edição inline de todos os campos
- Visual cards com informações claras
- Botões de salvar/cancelar

### 2. **API de Planos** (`/api/admin/plans`)
- `GET` - Listar todos os planos
- `PUT` - Atualizar plano existente
- `POST` - Criar novo plano (futuro)
- Proteção: apenas admins podem acessar

### 3. **Link no Dashboard Admin**
- Card "Planos de Assinatura" no dashboard principal
- Acesso rápido via `/admin/plans`

## 💳 Os 3 Planos de Assinatura

### 1. 🆓 **Free Trial** (7 dias)
```typescript
{
  name: 'free-trial',
  display_name: '🆓 Free Trial',
  price_monthly: 0,
  price_yearly: 0,
  trial_days: 7,
  duration_days: 7,  // 7 dias de acesso
  features: [
    '✅ 7 dias de acesso',
    '✅ Cursos gratuitos apenas',
    '✅ Sistema de gamificação',
    '✅ Suporte por email'
  ]
}
```

### 2. 📦 **Básico** (2 meses = 60 dias)
```typescript
{
  name: 'basico',
  display_name: '📦 Básico',
  price_monthly: 49.90,
  price_yearly: 0,
  trial_days: 0,
  duration_days: 60,  // 2 meses de acesso
  features: [
    '✅ 60 dias de acesso (2 meses)',
    '✅ TODOS os cursos',
    '✅ Sistema de marcação (Kindle)',
    '✅ Sistema de gamificação',
    '✅ Certificados de conclusão',
    '✅ Suporte prioritário'
  ]
}
```

### 3. 💎 **Premium** (Ilimitado)
```typescript
{
  name: 'premium',
  display_name: '💎 Premium',
  price_monthly: 29.90,
  price_yearly: 297.00,  // ~R$ 24,75/mês (17% desconto)
  trial_days: 0,
  duration_days: null,  // null = ILIMITADO
  features: [
    '✅ Acesso ILIMITADO vitalício',
    '✅ TODOS os cursos',
    '✅ Novos cursos todo mês',
    '✅ Sistema de marcação (Kindle)',
    '✅ Sistema de gamificação',
    '✅ Certificados de conclusão',
    '✅ Downloads ilimitados',
    '✅ Suporte prioritário',
    '💰 Pague mensal ou anual (17% desconto)'
  ]
}
```

## 🛠️ **IMPORTANTE: Setup Inicial**

### Passo 1: Adicionar coluna `duration_days` no Supabase

Execute no **SQL Editor do Supabase:**

```sql
-- Adicionar coluna duration_days
ALTER TABLE subscription_plans
ADD COLUMN IF NOT EXISTS duration_days INTEGER;

-- Adicionar comentário
COMMENT ON COLUMN subscription_plans.duration_days IS 'Duração do plano em dias. NULL = ilimitado';
```

**OU** use o arquivo SQL criado:
```bash
# Ver conteúdo do SQL
cat scripts/add-duration-days-column.sql

# Copiar e executar no Supabase SQL Editor
```

### Passo 2: (Opcional) Recriar planos com script

Se quiser recriar os 3 planos do zero:

```bash
node scripts/setup-3-plans.js
```

**⚠️ ATENÇÃO:** Este script deleta os planos existentes! Se já tem usuários com planos, NÃO execute!

## 📊 Como Usar no Admin

### Acessar a página:
1. Login como **admin**
2. Ir para `/admin`
3. Clicar em **"Planos de Assinatura"**
4. Ou acessar diretamente `/admin/plans`

### Editar um plano:
1. Clicar no ícone de **editar** (lápis) no card do plano
2. Modificar os campos desejados:
   - **Display Name**: Nome exibido para usuários
   - **Descrição**: Texto descritivo do plano
   - **Preço Mensal**: Valor em R$ (ex: 29.90)
   - **Preço Anual**: Valor em R$ (deixe 0 se não tiver opção anual)
   - **Duração**: Dias de acesso (deixe vazio para ILIMITADO)
   - **Trial**: Dias de teste gratuito
   - **Ativo**: Ligar/desligar o plano
3. Clicar em **"Salvar"**

### Campos Importantes:

**`duration_days`:**
- `null` ou vazio = **ILIMITADO** ♾️
- `7` = 7 dias de acesso
- `30` = 30 dias (1 mês)
- `60` = 60 dias (2 meses)
- `365` = 365 dias (1 ano)

**`trial_days`:**
- `0` = Sem trial
- `7` = 7 dias de trial
- `30` = 30 dias de trial

**`is_active`:**
- `true` = Plano aparece no `/pricing`
- `false` = Plano oculto (não aparece para usuários)

## 🔐 Segurança

### Proteção da API:
```typescript
// 1. Autenticação com ANON_KEY
const { data: { user } } = await supabaseAnon.auth.getUser()

// 2. Verificação de role admin
const { data: userData } = await supabase
  .from('users')
  .select('role')
  .eq('id', user.id)
  .single()

if (userData?.role !== 'admin') {
  return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
}

// 3. Operations com SERVICE_ROLE_KEY
const { data: plans } = await supabase.from('subscription_plans').select('*')
```

### Proteção da Rota:
- Middleware verifica role admin antes de permitir acesso a `/admin/*`
- Se não for admin, redireciona para `/dashboard?error=unauthorized`

## 📁 Arquivos Criados

```
app/
├── admin/
│   ├── plans/
│   │   └── page.tsx          # Página de gerenciamento de planos
│   └── page.tsx              # Dashboard admin (atualizado com link)
└── api/
    └── admin/
        └── plans/
            └── route.ts      # API: GET, PUT, POST planos

scripts/
├── setup-3-plans.js          # Script para criar os 3 planos
└── add-duration-days-column.sql  # SQL para adicionar coluna

GERENCIAMENTO-PLANOS-ADMIN.md # Esta documentação
```

## 🎯 Próximos Passos

1. ✅ **Executar SQL** para adicionar `duration_days`
2. ✅ **Acessar `/admin/plans`** e configurar os planos
3. ⏳ Atualizar página `/pricing` para mostrar os 3 planos
4. ⏳ Atualizar lógica de `subscription-helper.ts` para considerar `duration_days`
5. ⏳ Implementar expiração automática de planos com `duration_days`

## 💡 Dicas

### Sugestões de Preços:
- **Free Trial**: R$ 0 (7 dias)
- **Básico**: R$ 49,90 (2 meses)
- **Premium Mensal**: R$ 29,90/mês
- **Premium Anual**: R$ 297/ano (~R$ 24,75/mês, economiza 17%)

### Sugestões de Durações:
- **Trial**: 7 dias (para conhecer a plataforma)
- **Básico**: 60 dias (tempo suficiente para 1-2 cursos)
- **Premium**: `null` (ilimitado = melhor valor)

### Estratégia de Conversão:
1. Usuário se cadastra → **Free Trial** (7 dias, apenas cursos free)
2. Trial expira → Incentivo forte para upgrade
3. Usuário escolhe:
   - **Básico**: Quer estudar cursos específicos por 2 meses
   - **Premium**: Quer acesso ilimitado para estudar continuamente

---

**Data de criação:** 2025-10-28
**Autor:** Sistema de gerenciamento de planos
**Status:** ✅ Pronto para uso (após executar SQL)
