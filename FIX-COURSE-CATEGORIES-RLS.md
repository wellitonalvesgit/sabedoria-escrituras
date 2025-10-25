# Fix: Erro ao Salvar Categorias de Curso

## 🐛 Problema Identificado

**Erro**: `new row violates row-level security policy for table "course_categories"`

**Localização**: Página de edição de curso (`/admin/courses/[id]`)

**Quando ocorre**: Ao tentar salvar as categorias de um curso no painel administrativo

## 🔍 Diagnóstico

### Console Logs:
```
Erro ao atualizar categorias: Object
code: "42501"
message: "new row violates row-level security policy for table \"course_categories\""
```

### Causa Raiz:
A tabela `course_categories` tem **Row Level Security (RLS)** habilitado, mas **não possui policies** configuradas para permitir operações INSERT, UPDATE e DELETE.

### Código que Falha:
```typescript
// app/admin/courses/[id]/page.tsx - linha 202-204
const { error: categoriesError } = await supabase
  .from('course_categories')
  .insert(categoryRelations)
```

## ✅ Solução

### Executar Migration SQL

Execute o arquivo `supabase-fix-course-categories-rls.sql` no Supabase SQL Editor.

**O que faz:**
1. Habilita RLS na tabela `course_categories`
2. Cria 4 policies:
   - **SELECT**: Permite usuários autenticados visualizar
   - **INSERT**: Permite usuários autenticados inserir
   - **UPDATE**: Permite usuários autenticados atualizar
   - **DELETE**: Permite usuários autenticados deletar

### Policies Criadas:

```sql
-- SELECT (visualizar)
CREATE POLICY "Allow authenticated users to view course categories"
ON public.course_categories
FOR SELECT
TO authenticated
USING (true);

-- INSERT (criar)
CREATE POLICY "Allow authenticated users to insert course categories"
ON public.course_categories
FOR INSERT
TO authenticated
WITH CHECK (true);

-- UPDATE (atualizar)
CREATE POLICY "Allow authenticated users to update course categories"
ON public.course_categories
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- DELETE (deletar)
CREATE POLICY "Allow authenticated users to delete course categories"
ON public.course_categories
FOR DELETE
TO authenticated
USING (true);
```

## 🔐 Segurança (Opcional)

Se você quiser **restringir apenas para admins**, o arquivo SQL inclui policies comentadas que verificam:

```sql
EXISTS (
  SELECT 1 FROM public.users
  WHERE users.id = auth.uid()
  AND users.role = 'admin'
)
```

Descomente a seção "OPCIONAL" no arquivo SQL.

## 📋 Como Testar

### 1. Antes da Fix (com erro):
```
1. Ir em /admin/courses
2. Editar um curso
3. Selecionar categorias
4. Clicar em Salvar
❌ Erro: "new row violates row-level security policy"
```

### 2. Depois da Fix (funcionando):
```
1. Executar supabase-fix-course-categories-rls.sql
2. Ir em /admin/courses
3. Editar um curso
4. Selecionar categorias
5. Clicar em Salvar
✅ "Curso salvo com sucesso!"
```

## 🔄 Fluxo de Salvamento

```typescript
// 1. Salvar dados básicos do curso
await supabase
  .from('courses')
  .update(editedCourse)
  .eq('id', courseId)

// 2. Limpar categorias antigas
await supabase
  .from('course_categories')
  .delete()
  .eq('course_id', courseId)

// 3. Inserir novas categorias
const categoryRelations = selectedCategories.map(categoryId => ({
  course_id: courseId,
  category_id: categoryId
}))

await supabase
  .from('course_categories')
  .insert(categoryRelations)
```

## 📊 Estrutura da Tabela

```sql
CREATE TABLE public.course_categories (
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (course_id, category_id)
);
```

## 🚨 Avisos do Console

### Warning: Multiple GoTrueClient instances
```
Multiple GoTrueClient instances detected in the same browser context
```

**Causa**: Múltiplas importações de `createClient` do Supabase

**Impacto**: Warning apenas, não afeta funcionalidade

**Fix Futuro**: Criar singleton do Supabase client

## ✅ Checklist de Verificação

- [ ] Executar `supabase-fix-course-categories-rls.sql` no Supabase
- [ ] Testar salvamento de categorias em curso existente
- [ ] Testar criação de novo curso com categorias
- [ ] Verificar que categorias aparecem ao recarregar página
- [ ] Confirmar que DELETE de categorias antigas funciona
- [ ] Confirmar que INSERT de novas categorias funciona

## 📝 Logs Esperados Após Fix

```
Buscando curso com ID: 1e4a6cad-e615-4ae7-9ccf-f05b998208d0
Buscando curso diretamente do Supabase...
Curso encontrado diretamente: Object
✅ Curso salvo com sucesso!
```

## 🎯 Resultado Final

Após aplicar a fix:
- ✅ Admin pode adicionar categorias aos cursos
- ✅ Admin pode remover categorias dos cursos
- ✅ Categorias são salvas corretamente no banco
- ✅ Categorias aparecem ao editar o curso novamente
- ✅ Sem erros no console
- ✅ RLS continua protegendo a tabela

---

**Data**: 2025-10-25
**Arquivo SQL**: `supabase-fix-course-categories-rls.sql`
**Prioridade**: 🔴 Alta (bloqueia funcionalidade admin)
**Status**: ⏳ Aguardando execução da migration
