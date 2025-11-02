# 🔧 SOLUÇÃO: Problema de Cache no Acesso Admin

## ❌ Problema Identificado

Usuários administradores aparecem como usuários normais mesmo tendo `role='admin'` no banco de dados e no Auth metadata.

## 🎯 Causa Raiz

O sistema tem **3 camadas de cache** que armazenam as permissões do usuário:

### 1. **Middleware Cache** (30 segundos)
- Arquivo: `middleware.ts` linha 9
- TTL: 30 segundos
- Armazena: `userData` com role

### 2. **SessionManager Cache** (5 minutos)
- Arquivo: `lib/session.ts` linha 27
- TTL: 5 minutos
- Armazena: dados completos do usuário

### 3. **PremiumAccessGate Cache** (5 minutos)
- Arquivo: `components/premium-access-gate.tsx` linha 34
- TTL: 5 minutos
- Armazena: resultado de verificação de acesso

## ✅ SOLUÇÃO IMEDIATA

### Para o Usuário Admin:

**OBRIGATÓRIO: Fazer LOGOUT e LOGIN novamente!**

1. Clicar em **Logout** no painel
2. Aguardar **5 segundos**
3. Fazer **Login** novamente com as credenciais
4. Agora o acesso admin estará funcionando

### Por que funciona?

- Logout **invalida a sessão** do Supabase Auth
- Todos os caches são baseados em `user.id` + timestamp
- Login cria uma **nova sessão** com dados frescos
- Caches são recriados com role='admin' correto

## 🔍 Como Diagnosticar

Execute o script de diagnóstico:

```bash
node scripts/diagnose-admin-access.js
```

**Resultado esperado:**
```
✅ TUDO CORRETO - Role é "admin" em ambos

💡 SOLUÇÃO:
   O problema é CACHE! O usuário precisa:
   1. Fazer LOGOUT completo
   2. Fazer LOGIN novamente
```

## 📊 Verificação Manual

### 1. Verificar Database:
```sql
SELECT id, email, role, status FROM users WHERE email = 'geisonhoehr@gmail.com';
```

**Esperado:** `role = 'admin'`

### 2. Verificar Auth Metadata:
```bash
node scripts/check-user.js
```

**Esperado:** `Metadata: { role: "admin" }`

### 3. Verificar Middleware:
- Middleware verifica na linha 133: `userData.role !== 'admin'`
- Se role estiver no cache antigo como 'student', bloqueia acesso

## ⚙️ Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────┐
│ 1. USUÁRIO TENTA ACESSAR /admin                    │
└─────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│ 2. MIDDLEWARE (middleware.ts)                       │
│    - Verifica sessão com ANON_KEY                   │
│    - Busca userData do CACHE (30s) ou DATABASE      │
│    - Verifica: if (userData.role !== 'admin')       │
│    - BLOQUEIA se não for admin                      │
└─────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│ 3. PÁGINA ADMIN (/admin/page.tsx)                  │
│    - Renderiza painel administrativo                │
└─────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│ 4. AO CLICAR EM CURSO (/course/[id])               │
│    - PremiumAccessGate verifica acesso              │
│    - CACHE de 5 minutos                             │
│    - Chama API /api/courses/[id]/access             │
└─────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│ 5. API DE ACESSO                                    │
│    - Verifica role no DATABASE                      │
│    - Se admin: libera acesso total                  │
└─────────────────────────────────────────────────────┘
```

## 🐛 Por que o Cache Causa Problema?

**Cenário:**

1. Usuário faz login como **student** → Cache armazena role='student'
2. Admin altera role para **admin** no database e Auth
3. Usuário continua navegando → **Cache ainda tem role='student'**
4. Middleware bloqueia acesso ao /admin
5. PremiumAccessGate bloqueia acesso aos cursos

**Duração do problema:**
- Middleware: até 30 segundos
- SessionManager: até 5 minutos
- PremiumAccessGate: até 5 minutos

**Tempo máximo para resolver sozinho:** 5 minutos (aguardar cache expirar)

**Tempo mínimo com logout/login:** 5 segundos

## 🔐 Verificação de Acesso Admin

O sistema verifica admin em 3 lugares:

### 1. Middleware (Proteção de Rota)
```typescript
// middleware.ts linha 133
if (pathname.startsWith('/admin') && userData.role !== 'admin') {
  return NextResponse.redirect(new URL('/dashboard?error=unauthorized', request.url))
}
```

### 2. API de Acesso (Proteção de Conteúdo)
```typescript
// app/api/courses/[id]/access/route.ts linha 62-76
const { data: userData } = await supabase
  .from('users')
  .select('id, role')
  .eq('id', user.id)
  .single()

if (userData?.role === 'admin') {
  return NextResponse.json({
    canAccess: true,
    reason: 'admin_access',
    message: 'Acesso administrativo concedido'
  })
}
```

### 3. PremiumAccessGate (UI)
```typescript
// Mostra badge de admin
{accessResult.reason === 'admin_access' && (
  <Badge className="bg-purple-500/10">
    👑 Acesso Administrativo
  </Badge>
)}
```

## 📝 Resumo

- ✅ **Database**: role='admin' → OK
- ✅ **Auth Metadata**: role='admin' → OK
- ❌ **Cache**: role='student' (antigo) → PROBLEMA
- ✅ **Solução**: LOGOUT + LOGIN → Limpa cache

## 🎯 Prevenção Futura

**Opção 1 - Reduzir TTL do Cache:**
```typescript
// middleware.ts linha 9
const CACHE_TTL = 10 * 1000 // 10 segundos (ao invés de 30)
```

**Opção 2 - Invalidar Cache ao Mudar Role:**
Quando admin altera role de um usuário, força logout desse usuário.

**Opção 3 - Usar Redis:**
Cache distribuído com invalidação manual por chave.

---

**Data do diagnóstico:** 2025-10-28
**Scripts criados:**
- `scripts/diagnose-admin-access.js` - Diagnóstico completo
- `scripts/check-user.js` - Verificação rápida de usuário
