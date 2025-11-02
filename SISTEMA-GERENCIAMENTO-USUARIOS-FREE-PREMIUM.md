# 🎯 Sistema de Gerenciamento de Usuários Free vs Premium

**Data:** 2025-10-28
**Status:** ✅ Sistema já existe - Necessário melhorar visualização

---

## 📊 ESTRUTURA ATUAL DO SISTEMA

### Tabelas no Banco de Dados

#### 1. `users` (Dados do usuário)
```sql
- id: UUID
- name: TEXT
- email: TEXT
- role: TEXT (admin, moderator, student)
- status: TEXT (active, inactive)
- access_days: INTEGER (dias de acesso)
- access_expires_at: TIMESTAMP
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 2. `subscriptions` (Assinaturas dos usuários)
```sql
- id: UUID
- user_id: UUID (FK -> users.id)
- plan_id: UUID (FK -> subscription_plans.id)
- status: TEXT (trial, active, past_due, canceled, expired)
- trial_ends_at: TIMESTAMP
- current_period_start: TIMESTAMP
- current_period_end: TIMESTAMP
- canceled_at: TIMESTAMP
- auto_renew: BOOLEAN
- asaas_customer_id: TEXT
- asaas_subscription_id: TEXT
```

#### 3. `subscription_plans` (Planos disponíveis)
```sql
- id: UUID
- name: TEXT (free, premium-monthly, premium-yearly)
- price: NUMERIC
- duration_days: INTEGER
- features: JSONB
```

---

## 🎯 REGRA DE NEGÓCIO: TRIAL DE 7 DIAS

### Quando um usuário se cadastra:

1. **Criação do usuário:**
   ```sql
   INSERT INTO users (name, email, role, status)
   VALUES ('Nome', 'email@email.com', 'student', 'active')
   ```

2. **Criação automática da subscription em trial:**
   ```sql
   INSERT INTO subscriptions (user_id, plan_id, status, trial_ends_at)
   VALUES (
     user_id,
     (SELECT id FROM subscription_plans WHERE name = 'free'),
     'trial',
     NOW() + INTERVAL '7 days'
   )
   ```

3. **Acesso do usuário:**
   - Durante 7 dias: **Acesso total a todos os cursos**
   - Após 7 dias: **Bloqueado** até fazer upgrade

---

## 📋 TIPOS DE USUÁRIOS E SEUS STATUS

### 1. FREE TRIAL (7 dias) 🆓
```
subscriptions.status = 'trial'
subscriptions.trial_ends_at > NOW()
```
**Acesso:** Total
**Exibição:** Badge amarelo "Trial - X dias restantes"

### 2. FREE TRIAL EXPIRADO ⚠️
```
subscriptions.status = 'expired' ou 'trial'
subscriptions.trial_ends_at < NOW()
```
**Acesso:** Bloqueado
**Exibição:** Badge vermelho "Trial Expirado"
**Ação:** Mostrar botão "Fazer Upgrade"

### 3. PREMIUM ATIVO 💎
```
subscriptions.status = 'active'
subscriptions.current_period_end > NOW()
```
**Acesso:** Total
**Exibição:** Badge verde "Premium"

### 4. PREMIUM PAGAMENTO ATRASADO ⏰
```
subscriptions.status = 'past_due'
```
**Acesso:** Total (grace period)
**Exibição:** Badge laranja "Pagamento Pendente"

### 5. PREMIUM CANCELADO ❌
```
subscriptions.status = 'canceled'
subscriptions.canceled_at IS NOT NULL
```
**Acesso:** Até o fim do período pago
**Exibição:** Badge cinza "Cancelado - Expira em DD/MM"

---

## 🛠️ MODIFICAÇÕES NECESSÁRIAS NA PÁGINA ADMIN

### 1. Interface atualizada do User
```typescript
interface SubscriptionPlan {
  id: string
  name: string
  price: number
  duration_days: number
}

interface Subscription {
  id: string
  plan_id: string
  status: 'trial' | 'active' | 'past_due' | 'canceled' | 'expired'
  trial_ends_at?: string
  current_period_end: string
  canceled_at?: string
  subscription_plans: SubscriptionPlan
}

interface User {
  id: string
  name: string
  email: string
  role: string
  status: string
  // ... outros campos
  subscriptions?: Subscription[]  // ← NOVO
}
```

### 2. API /api/users atualizada
```typescript
let query = client
  .from('users')
  .select(`
    *,
    subscriptions (
      id,
      plan_id,
      status,
      trial_ends_at,
      current_period_end,
      canceled_at,
      subscription_plans (
        id,
        name,
        price,
        duration_days
      )
    )
  `)
```

### 3. Novos Filtros
```typescript
const [planFilter, setPlanFilter] = useState("all")

// Opções:
- all: Todos os planos
- trial: Free Trial (7 dias)
- trial-expired: Trial Expirado
- active: Premium Ativo
- past_due: Pagamento Atrasado
- canceled: Cancelado
```

### 4. Novo Card de Estatísticas
```typescript
<Card>
  <CardHeader>
    <CardTitle>Em Trial (7 dias)</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-3xl font-bold">
      {users.filter(u =>
        u.subscriptions?.[0]?.status === 'trial' &&
        new Date(u.subscriptions[0].trial_ends_at) > new Date()
      ).length}
    </div>
    <p className="text-xs text-muted-foreground">
      Testando gratuitamente
    </p>
  </CardContent>
</Card>

<Card>
  <CardHeader>
    <CardTitle>Premium Ativos</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-3xl font-bold text-green-500">
      {users.filter(u =>
        u.subscriptions?.[0]?.status === 'active'
      ).length}
    </div>
    <p className="text-xs text-muted-foreground">
      Pagando mensalmente/anualmente
    </p>
  </CardContent>
</Card>

<Card>
  <CardHeader>
    <CardTitle>Trial Expirado</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-3xl font-bold text-red-500">
      {users.filter(u =>
        u.subscriptions?.[0]?.status === 'trial' &&
        new Date(u.subscriptions[0].trial_ends_at) < new Date()
      ).length}
    </div>
    <p className="text-xs text-muted-foreground">
      Precisam fazer upgrade
    </p>
  </CardContent>
</Card>
```

### 5. Nova Coluna "Plano" na Tabela
```typescript
<th className="px-6 py-3 text-left font-medium">Plano</th>

// No corpo:
<td className="px-6 py-4">{getSubscriptionBadge(user)}</td>

const getSubscriptionBadge = (user: User) => {
  const subscription = user.subscriptions?.[0]

  if (!subscription) {
    return <Badge variant="outline" className="bg-gray-500/10">Sem Plano</Badge>
  }

  switch (subscription.status) {
    case 'trial':
      const trialEnds = new Date(subscription.trial_ends_at!)
      const now = new Date()
      const daysLeft = Math.ceil((trialEnds.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      if (daysLeft > 0) {
        return (
          <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
            Trial - {daysLeft} dias
          </Badge>
        )
      } else {
        return (
          <Badge className="bg-red-500/10 text-red-600 border-red-500/20">
            Trial Expirado
          </Badge>
        )
      }

    case 'active':
      return (
        <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
          💎 Premium
        </Badge>
      )

    case 'past_due':
      return (
        <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20">
          Pagamento Pendente
        </Badge>
      )

    case 'canceled':
      const periodEnd = new Date(subscription.current_period_end)
      return (
        <Badge className="bg-gray-500/10 text-gray-600 border-gray-500/20">
          Cancelado - {periodEnd.toLocaleDateString('pt-BR')}
        </Badge>
      )

    default:
      return <Badge variant="outline">Desconhecido</Badge>
  }
}
```

---

## 🔄 FLUXO DE UPGRADE (Trial → Premium)

### 1. Usuário em Trial clica em "Fazer Upgrade"
```typescript
// Na página /pricing ou modal
<Button onClick={() => handleUpgrade('premium-monthly')}>
  Upgrade para Premium
</Button>
```

### 2. Processamento via API
```typescript
// POST /api/subscriptions/create
{
  user_id,
  plan_id: 'premium-monthly',
  payment_method: 'credit_card',
  // Dados de pagamento da Asaas
}
```

### 3. Atualização da Subscription
```sql
UPDATE subscriptions
SET
  status = 'active',
  plan_id = 'premium-monthly',
  current_period_start = NOW(),
  current_period_end = NOW() + INTERVAL '30 days',
  trial_ends_at = NULL
WHERE user_id = ?
```

### 4. Usuário ganha acesso Premium
- Trial expira imediatamente
- Acesso continua garantido
- Próxima cobrança em 30 dias

---

## 🎨 LAYOUT SUGERIDO DA TELA ADMIN

```
┌─────────────────────────────────────────────────────────┐
│ GERENCIAR USUÁRIOS                 [Adicionar Usuário]  │
├─────────────────────────────────────────────────────────┤
│ ESTATÍSTICAS                                            │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│ │ Total   │ │ Trial   │ │ Premium │ │ Expirado│       │
│ │  150    │ │   25    │ │   80    │ │   15    │       │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘       │
├─────────────────────────────────────────────────────────┤
│ FILTROS                                                 │
│ [Buscar...] [Role▼] [Status▼] [Plano▼]                │
├─────────────────────────────────────────────────────────┤
│ USUÁRIOS (150)                                          │
│ ┌──────────┬──────┬────────┬──────────┬────────┬───┐  │
│ │ Usuário  │ Role │ Status │  Plano   │ Pontos │...│  │
│ ├──────────┼──────┼────────┼──────────┼────────┼───┤  │
│ │ João     │ Aluno│ Ativo  │Trial 5d  │  120   │...│  │
│ │ Maria    │ Aluno│ Ativo  │💎Premium │  450   │...│  │
│ │ José     │ Aluno│ Ativo  │Expirado  │   80   │...│  │
│ └──────────┴──────┴────────┴──────────┴────────┴───┘  │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

- [x] API `/api/users` retorna dados de subscription
- [ ] Atualizar interface `User` com campo `subscriptions`
- [ ] Criar função `getSubscriptionBadge()`
- [ ] Adicionar card "Trial Ativo"
- [ ] Adicionar card "Premium Ativo"
- [ ] Adicionar card "Trial Expirado"
- [ ] Adicionar filtro de planos
- [ ] Adicionar coluna "Plano" na tabela
- [ ] Testar filtros combinados
- [ ] Documentar para equipe

---

## 📝 EXEMPLO DE USO

### Cenário 1: Ver todos em trial
```
Filtro de Plano = "trial"
Resultado: 25 usuários
- João Silva - Trial 5 dias restantes
- Maria Santos - Trial 3 dias restantes
- ...
```

### Cenário 2: Ver trials expirados
```
Filtro de Plano = "trial-expired"
Resultado: 15 usuários
- José Oliveira - Trial Expirado (3 dias atrás)
- Ana Costa - Trial Expirado (1 dia atrás)
...
```

### Cenário 3: Ver pagantes ativos
```
Filtro de Plano = "active"
Resultado: 80 usuários
- Carlos Almeida - 💎 Premium (mensal)
- Paula Ferreira - 💎 Premium (anual)
...
```

---

**Por:** Claude Code Assistant
**Data:** 2025-10-28
**Commits relacionados:** Pendente
