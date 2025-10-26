# 🔍 Diagnóstico: Sessão Perdida ao Navegar

## 🚨 Problema Identificado

Quando o usuário faz login e clica no ícone de perfil:
- ✅ Login funciona
- ❌ Sessão é perdida ao navegar
- ❌ localStorage está vazio
- ❌ Todos os cursos aparecem como bloqueados

## 📊 Logs do Console

```javascript
📊 Dados da sessão: {
  hasSession: false,
  hasUser: false,
  error: undefined
}
❌ Nenhuma sessão ativa encontrada
🔍 Chaves do Supabase no localStorage: Array(0)  // ← PROBLEMA!
```

## 🔍 Causas Possíveis

### 1. **Múltiplas Instâncias do Supabase Client**
```
Multiple GoTrueClient instances detected in the same browser context
```
Isso significa que o cliente Supabase está sendo criado múltiplas vezes, causando conflitos de sessão.

### 2. **LocalStorage Sendo Limpo**
O localStorage pode estar sendo limpo por:
- Service Workers
- Configurações do navegador
- Outro código limpando o storage

### 3. **Problema de SSR (Server-Side Rendering)**
Next.js pode estar criando instâncias diferentes do cliente no servidor e no cliente.

## ✅ Solução

### Correção 1: Garantir Single Instance do Supabase

Precisamos garantir que existe apenas **UMA** instância do cliente Supabase em todo o app.

**Arquivo: `lib/supabase.ts`**

```typescript
// Criar instância singleton
let supabaseInstance: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storageKey: 'sb-auth-token', // Chave única e consistente
        storage: typeof window !== 'undefined' ? window.localStorage : undefined
      }
    })
  }
  return supabaseInstance
}

export const supabase = getSupabaseClient()
```

### Correção 2: Verificar SessionManager

O `SessionManager` em `lib/session.ts` pode estar criando sua própria instância.

### Correção 3: Limpar Cache e Cookies

1. Abra DevTools (F12)
2. Application tab
3. Clear storage:
   - Local Storage
   - Session Storage
   - Cookies
4. Faça login novamente

## 🧪 Teste de Diagnóstico

Execute no Console do navegador (F12):

```javascript
// 1. Verificar localStorage
console.log('LocalStorage keys:', Object.keys(localStorage))

// 2. Verificar sessão do Supabase
const { createClient } = await import('@supabase/supabase-js')
const supabase = createClient(
  'https://aqvqpkmjdtzeoclndwhj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxdnFwa21qZHR6ZW9jbG5kd2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwOTI2ODYsImV4cCI6MjA3NjY2ODY4Nn0.ZStT6hrlRhT3bigKWc3i6An_lL09R_t5gdZ4WIyyYyY'
)
const { data, error } = await supabase.auth.getSession()
console.log('Sessão:', data, error)

// 3. Verificar cookies
console.log('Cookies:', document.cookie)
```

## 🔧 Correção Imediata

### Passo 1: Limpar Storage Completamente

1. F12 → Application → Storage
2. Click em "Clear site data"
3. Recarregar página (Ctrl+Shift+R)

### Passo 2: Fazer Login Novamente

1. Ir para /login
2. Email: geisonhoehr.ai@gmail.com
3. Senha: 123456

### Passo 3: Verificar LocalStorage

Após login, verificar se localStorage tem chaves do Supabase:
- `sb-auth-token`
- `sb-aqvqpkmjdtzeoclndwhj-auth-token`

## 🎯 Correção no Código

Vou implementar a correção agora...
