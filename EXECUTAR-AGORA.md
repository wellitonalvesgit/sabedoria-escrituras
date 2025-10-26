# 🚀 EXECUTAR CORREÇÕES AGORA

## ⚡ Método Mais Simples e Garantido

### Passo 1: Acessar Supabase SQL Editor

Clique neste link direto:
👉 **https://app.supabase.com/project/aqvqpkmjdtzeoclndwhj/sql/new**

### Passo 2: Copiar o SQL

1. Abra o arquivo: `fix-authentication-rls-complete.sql`
2. Selecione TODO o conteúdo (Ctrl+A)
3. Copie (Ctrl+C)

### Passo 3: Colar e Executar

1. No SQL Editor que abriu no navegador
2. Cole o SQL (Ctrl+V)
3. Clique em **RUN** (canto inferior direito)
4. Ou pressione: **Ctrl + Enter**

### Passo 4: Verificar Resultado

Você deve ver na aba "Results":
```
✅ Políticas RLS criadas com sucesso!
📊 Total de políticas na tabela users: 4
✅ Usuário encontrado: geisonhoehr.ai@gmail.com
   - Status: active
   - Role: student
   - Access Days: 30
   - Access Expires: [data futura]
```

---

## ✅ Após Executar o SQL

### 1. Reiniciar o Servidor
```bash
# No terminal, pressione Ctrl+C para parar
# Depois execute:
npm run dev
```

### 2. Testar Login
- URL: http://localhost:3000/login
- Email: `geisonhoehr.ai@gmail.com`
- Senha: `123456`

### 3. Testar Páginas
✅ http://localhost:3000/dashboard
✅ http://localhost:3000/profile
✅ http://localhost:3000/settings

---

## 🔍 Verificação Adicional (Opcional)

Se quiser verificar se as políticas foram criadas corretamente, execute este SQL no mesmo editor:

```sql
-- Ver políticas criadas
SELECT
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- Ver dados do usuário teste
SELECT
  email,
  status,
  role,
  access_days,
  access_expires_at,
  allowed_courses,
  blocked_courses
FROM users
WHERE email = 'geisonhoehr.ai@gmail.com';
```

Deve retornar:
- **4 políticas** (select, update, insert, delete)
- **Usuário** com status 'active' e data de expiração futura

---

## ❌ Se Der Erro

### "Permission denied" ou "RLS policy violation"
→ Certifique-se de estar usando o link correto acima
→ Você deve estar logado no Supabase com a conta correta

### "relation does not exist"
→ O banco de dados pode não ter a estrutura esperada
→ Verifique se está no projeto correto: `aqvqpkmjdtzeoclndwhj`

### Qualquer outro erro
1. Copie a mensagem de erro
2. Consulte o arquivo: `GUIA-CORRECAO-AUTENTICACAO.md`
3. Seção "Troubleshooting"

---

## 📞 Informações do Projeto

- **Project Ref**: `aqvqpkmjdtzeoclndwhj`
- **URL**: https://aqvqpkmjdtzeoclndwhj.supabase.co
- **Dashboard**: https://app.supabase.com/project/aqvqpkmjdtzeoclndwhj

---

## 🎯 Resumo Rápido

1. ✅ Abrir: https://app.supabase.com/project/aqvqpkmjdtzeoclndwhj/sql/new
2. ✅ Copiar conteúdo de: `fix-authentication-rls-complete.sql`
3. ✅ Colar no SQL Editor
4. ✅ Clicar em RUN
5. ✅ Reiniciar servidor: `npm run dev`
6. ✅ Testar login

**Tempo estimado**: 2 minutos

---

**Criado em**: 26/10/2025
