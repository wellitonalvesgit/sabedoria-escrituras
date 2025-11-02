# 🔍 Problemas Encontrados nas APIs

## ❌ APIs que Usam ANON_KEY (Client-Side)

### 1. API de Criar Assinatura
**Arquivo:** `app/api/subscriptions/create/route.ts`
**Linha:** 11
**Problema:**
```typescript
const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,  // ❌ ANON_KEY
  // ...
)
```

**Impacto:**
- Operações sujeitas às políticas RLS
- Pode falhar se RLS tiver subqueries recursivas
- Menos seguro

**Solução:** Usar `SERVICE_ROLE_KEY`

---

### 2. API de Gamificação
**Arquivo:** `app/api/gamification/route.ts`
**Linha:** 2
**Problema:**
```typescript
import { supabase } from '@/lib/supabase'  // ❌ Usa ANON_KEY
import { getCurrentUser } from '@/lib/auth'  // ❌ Client-side
```

**Impacto:**
- GET e POST usam ANON_KEY
- Operações sujeitas às políticas RLS
- Uso de lib/auth (client-side) em server-side

**Solução:** Usar `SERVICE_ROLE_KEY` e autenticação via cookies

---

### 3. API de Ranking
**Arquivo:** `app/api/ranking/route.ts`
**Linha:** 2
**Problema:**
```typescript
import { supabase } from '@/lib/supabase'  // ❌ Usa ANON_KEY
```

**Impacto:**
- Busca de ranking sujeita às políticas RLS
- Pode não retornar todos os dados necessários

**Solução:** Usar `SERVICE_ROLE_KEY` (ranking é público, pode usar ANON mas melhor usar SERVICE)

---

## ✅ APIs que Já Usam SERVICE_ROLE_KEY Corretamente

### 1. API de Buscar Assinatura Atual
**Arquivo:** `app/api/subscriptions/current/route.ts`
**Status:** ✅ CORRETO
- Usa ANON_KEY apenas para autenticação
- Usa SERVICE_ROLE_KEY para buscar dados

### 2. API de Cancelar Assinatura
**Arquivo:** `app/api/subscriptions/cancel/route.ts`
**Status:** ✅ CORRETO
- Usa SERVICE_ROLE_KEY desde o início

### 3. API de Pagamentos
**Arquivo:** `app/api/subscriptions/payments/route.ts`
**Status:** ⚠️ NÃO VERIFICADO (assumindo OK)

---

## 📊 Resumo

| API | Status | Prioridade |
|-----|--------|-----------|
| `/api/subscriptions/create` | ❌ ANON_KEY | 🔴 ALTA |
| `/api/gamification` (GET/POST) | ❌ ANON_KEY | 🟡 MÉDIA |
| `/api/ranking` | ❌ ANON_KEY | 🟢 BAIXA |
| `/api/subscriptions/current` | ✅ OK | - |
| `/api/subscriptions/cancel` | ✅ OK | - |

---

## 🎯 Plano de Correção

### Prioridade ALTA
1. Corrigir `/api/subscriptions/create` - É crítico para pagamentos

### Prioridade MÉDIA
2. Corrigir `/api/gamification` - Afeta experiência do usuário

### Prioridade BAIXA
3. Corrigir `/api/ranking` - Ranking é público, menos crítico

---

## 📧 Sistema de Emails

**Status:** ⚠️ 60% CONFIGURADO

- ✅ Resend API configurada
- ✅ Templates em português prontos
- ❌ **FALTA:** Configurar templates no Supabase Dashboard (ação manual)

**Documentação:** Ver `RELATORIO-CONFIGURACAO-EMAILS.md`
