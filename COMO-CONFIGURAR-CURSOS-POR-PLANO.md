# 📚 Como Configurar Cursos por Plano

## 🎯 Visão Geral

Agora você pode configurar quais cursos específicos estarão disponíveis em cada plano de assinatura.

### Planos Disponíveis:

- **📦 Básico (R$ 9,97)**: Acesso a cursos específicos por 2 meses
- **💎 Premium (R$ 19,97)**: Acesso a TODOS os cursos vitalício

---

## 🚀 Passo a Passo

### 1️⃣ Executar SQL no Supabase

Primeiro, você precisa adicionar a coluna `allowed_courses` na tabela `subscription_plans`:

1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Execute o arquivo: `scripts/add-allowed-courses-to-plans.sql`

```sql
ALTER TABLE subscription_plans
ADD COLUMN IF NOT EXISTS allowed_courses UUID[] DEFAULT NULL;

-- Premium tem acesso a TODOS os cursos (NULL)
UPDATE subscription_plans
SET allowed_courses = NULL
WHERE name = 'premium';

-- Básico inicialmente vazio (você configura via admin)
UPDATE subscription_plans
SET allowed_courses = ARRAY[]::UUID[]
WHERE name = 'basico';
```

### 2️⃣ Acessar o Painel Admin

1. Faça login como **admin**
2. Acesse: **`/admin/plans/courses`**

### 3️⃣ Configurar Cursos do Plano Básico

1. Na sidebar, selecione o plano **"📦 Básico"**
2. Marque os checkboxes dos cursos que deseja liberar
3. Clique em **"Salvar"**

**Exemplo:**
- ✅ Romanos
- ✅ Coríntios I
- ✅ Gálatas
- ❌ Efésios (não selecionado)
- ❌ Filipenses (não selecionado)

### 4️⃣ Verificar Plano Premium

O plano Premium **sempre** tem acesso a TODOS os cursos automaticamente (`allowed_courses = NULL`).

Você não precisa configurar nada para o Premium.

---

## 📖 Como Funciona

### Lógica de Acesso:

```javascript
// Plano Premium
allowed_courses: null  // ✅ Acesso a TODOS os cursos

// Plano Básico (exemplo)
allowed_courses: ["id-curso-1", "id-curso-2", "id-curso-3"]  // ✅ Apenas esses 3 cursos

// Plano sem cursos
allowed_courses: []  // ❌ Sem acesso a nenhum curso
```

### Quando o usuário assina:

1. **Plano Básico**: Sistema verifica se o curso está na lista `allowed_courses`
   - Se SIM → Acesso permitido ✅
   - Se NÃO → Mensagem: "Este curso não está incluído no seu plano"

2. **Plano Premium**: Acesso total a todos os cursos ✅

---

## 🔧 Manutenção

### Adicionar novo curso ao Básico:
1. Acesse `/admin/plans/courses`
2. Selecione "Básico"
3. Marque o novo curso
4. Salvar

### Remover curso do Básico:
1. Acesse `/admin/plans/courses`
2. Selecione "Básico"
3. Desmarque o curso
4. Salvar

### Ver cursos de um plano via SQL:
```sql
SELECT
  name,
  display_name,
  allowed_courses
FROM subscription_plans
WHERE name = 'basico';
```

---

## ⚠️ Importante

- **Premium sempre tem acesso total** (não configure cursos para ele)
- **Básico precisa ter cursos configurados** senão usuários não terão acesso a nada
- Mudanças nos cursos **afetam novas assinaturas** e **assinaturas existentes**

---

## 📍 URLs Úteis

- **Configurar Cursos**: `/admin/plans/courses`
- **Gerenciar Planos**: `/admin/plans`
- **Dashboard Admin**: `/admin`

---

## 🐛 Troubleshooting

**Problema**: Plano Básico não tem acesso a nenhum curso

**Solução**:
1. Verifique se `allowed_courses` foi configurado
2. Acesse `/admin/plans/courses` e selecione os cursos
3. Salve as alterações

**Problema**: Premium não tem acesso a todos os cursos

**Solução**:
```sql
UPDATE subscription_plans
SET allowed_courses = NULL
WHERE name = 'premium';
```

---

✅ **Pronto!** Agora você pode configurar facilmente quais cursos cada plano oferece.
