# 🚨 CORREÇÃO URGENTE: Restaurar Admin geisonhoehr@gmail.com

**Data:** 27/10/2025
**Problema:** Usuário admin perdeu permissões de administrador
**Causa:** Script `fix-rls-DEFINITIVO.sql` linha 48 usou `COALESCE(role, 'student')`

---

## 🔍 **DIAGNÓSTICO:**

### **O que aconteceu:**

No arquivo `fix-rls-DEFINITIVO.sql`, linha 48:
```sql
role = COALESCE(role, 'student')
```

Essa linha pode ter **substituído** o role de 'admin' para 'student' se houve algum problema.

### **Emails afetados:**
- `geisonhoehr@gmail.com` ❌
- `geisonhoehr.ai@gmail.com` (mencionado no script)

---

## ✅ **SOLUÇÃO RÁPIDA:**

### **Opção 1: Via Supabase Dashboard (MAIS RÁPIDO - 2 minutos)**

1. Acesse: https://aqvqpkmjdtzeoclndwhj.supabase.co
2. Vá em: **Table Editor** → **users**
3. Procure por email: `geisonhoehr@gmail.com`
4. Edite a linha:
   - **role:** `admin`
   - **status:** `active`
   - **access_expires_at:** `2035-10-27` (10 anos)
5. Salve

✅ **PRONTO! Admin restaurado**

---

### **Opção 2: Via SQL Editor (3 minutos)**

1. Acesse: https://aqvqpkmjdtzeoclndwhj.supabase.co
2. Vá em: **SQL Editor**
3. Cole e execute este script:

```sql
-- Restaurar admin geisonhoehr@gmail.com
UPDATE public.users
SET
  role = 'admin',
  status = 'active',
  access_expires_at = NOW() + INTERVAL '10 years',
  access_days = 3650,
  updated_at = NOW()
WHERE email = 'geisonhoehr@gmail.com';

-- Verificar resultado
SELECT
  email,
  role,
  status,
  access_expires_at
FROM public.users
WHERE email = 'geisonhoehr@gmail.com';
```

4. Clique em **Run**
5. Verifique o resultado: deve mostrar `role = admin`

✅ **PRONTO! Admin restaurado**

---

## 🔍 **VERIFICAÇÃO:**

Após executar uma das opções acima, faça login com:
- Email: `geisonhoehr@gmail.com`
- Senha: (sua senha)

Você deve ter acesso ao **painel admin** em: `/admin`

---

## 📊 **VALORES CORRETOS:**

| Campo | Valor Correto |
|-------|---------------|
| **email** | geisonhoehr@gmail.com |
| **role** | admin |
| **status** | active |
| **access_expires_at** | 2035-10-27 (ou 10 anos) |
| **access_days** | 3650 |

---

## ⚠️ **PREVENÇÃO FUTURA:**

Para evitar que isso aconteça novamente, **NUNCA** use:
```sql
role = COALESCE(role, 'student')  ❌ ERRADO
```

**SEMPRE** use:
```sql
-- Para admin específico
UPDATE users SET role = 'admin' WHERE email = 'geisonhoehr@gmail.com';

-- Para preservar role existente
UPDATE users SET
  role = CASE
    WHEN email = 'geisonhoehr@gmail.com' THEN 'admin'
    ELSE COALESCE(role, 'student')
  END
WHERE ...;
```

---

## 🎯 **SCRIPT SEGURO PARA EXECUTAR AGORA:**

Arquivo criado: `corrigir-admin-geisonhoehr.sql`

Execute no Supabase SQL Editor:
```bash
1. Abra: https://aqvqpkmjdtzeoclndwhj.supabase.co
2. SQL Editor
3. Cole o conteúdo de: corrigir-admin-geisonhoehr.sql
4. Execute
```

---

## ✅ **CHECKLIST:**

- [ ] Executar correção (Opção 1 ou 2)
- [ ] Verificar role = 'admin'
- [ ] Fazer logout
- [ ] Fazer login novamente
- [ ] Acessar /admin (deve funcionar)
- [ ] Confirmar que tem acesso total

---

## 📞 **SE AINDA NÃO FUNCIONAR:**

1. **Limpe o cache do navegador**
2. **Faça logout completo**
3. **Feche todas as abas**
4. **Abra novamente e faça login**
5. **Verifique se o SessionManager está pegando o role atualizado**

---

**Status:** ⚠️ **AGUARDANDO CORREÇÃO NO SUPABASE**

**Tempo estimado:** 2-3 minutos
