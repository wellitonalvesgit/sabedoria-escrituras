# 🔍 DEBUG: Testar Admin Access

**Data:** 27/10/2025
**Email Admin:** geisonhoehr@gmail.com

---

## 🧪 **TESTE 1: Verificar no Console do Navegador**

1. Faça login com `geisonhoehr@gmail.com`
2. Abra o **Console do Navegador** (F12)
3. Cole este código:

```javascript
// Verificar sessão atual
const session = sessionManager.getSession()
console.log('=== DEBUG SESSÃO ===')
console.log('User:', session.user)
console.log('Email:', session.user?.email)
console.log('Role:', session.user?.role)
console.log('Loading:', session.loading)
console.log('===================')
```

4. Veja o resultado - deve mostrar:
   - `Email: geisonhoehr@gmail.com`
   - `Role: admin` ✅

---

## 🧪 **TESTE 2: Verificar API /users/me**

No console do navegador, cole:

```javascript
// Buscar dados do usuário via API
fetch('/api/users/me', {
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include'
})
.then(r => r.json())
.then(data => {
  console.log('=== API /users/me ===')
  console.log('Email:', data.email)
  console.log('Role:', data.role)
  console.log('Status:', data.status)
  console.log('====================')
})
```

Deve retornar:
- `Role: admin` ✅

---

## 🧪 **TESTE 3: Verificar Middleware**

1. Tente acessar: `http://localhost:3000/admin`
2. Veja no console do navegador se há erros
3. Verifique no Network tab (F12 → Network):
   - Veja se há redirect para `/login`
   - Veja se há erro 401 ou 403

---

## 🎯 **RESULTADOS ESPERADOS:**

### ✅ **Se tudo estiver correto:**
- SessionManager mostra `role: admin`
- API /users/me retorna `role: admin`
- Página /admin carrega normalmente

### ❌ **Se houver problema:**

**Problema A: SessionManager mostra `role: student`**
- Solução: Limpar cache, logout/login

**Problema B: API retorna `role: student`**
- Solução: Verificar banco de dados (mas você já confirmou que está admin)

**Problema C: Redirect para /login mesmo sendo admin**
- Solução: Verificar middleware.ts

---

## 🔧 **SOLUÇÃO RÁPIDA:**

Se os testes acima mostrarem que o role está correto mas ainda não funciona:

1. **Invalidar cache do SessionManager:**

```javascript
// No console do navegador
sessionManager.invalidateCache()
window.location.reload()
```

2. **Fazer logout/login programático:**

```javascript
// No console
await fetch('/api/auth/signout', { method: 'POST' })
window.location.href = '/login'
```

---

## 📊 **CHECKLIST DE VERIFICAÇÃO:**

- [ ] Banco de dados: `geisonhoehr@gmail.com` tem `role = admin`
- [ ] SessionManager: retorna `role: admin`
- [ ] API /users/me: retorna `role: admin`
- [ ] Middleware: não bloqueia admin
- [ ] Cache limpo
- [ ] Logout/login feito

---

**Execute os 3 testes acima e me diga os resultados!** 🔍
