# Correção das Operações Administrativas

## 🚨 Problema Identificado

### Sintomas
- Admins não conseguiam **editar** cursos
- Admins não conseguiam **salvar** alterações em cursos
- Admins não conseguiam **deletar** cursos ou PDFs
- Operações falhavam silenciosamente ou retornavam erros de permissão

### Causa Raiz
A página administrativa [app/admin/courses/[id]/page.tsx](app/admin/courses/[id]/page.tsx) estava acessando o Supabase **diretamente no client-side** usando `getSupabaseClient()` que usa **ANON_KEY**, não SERVICE_ROLE_KEY.

**Problemas dessa abordagem:**
1. ❌ Operações sujeitas às políticas RLS (Row Level Security)
2. ❌ Políticas RLS usavam EXISTS com subqueries na tabela `users` (potencial recursão infinita)
3. ❌ **Inseguro**: operações administrativas expostas no client-side
4. ❌ Cache do cliente podia estar desatualizado

---

## ✅ Solução Implementada

### 1. Criadas APIs Server-Side Seguras

Todas as APIs usam **SERVICE_ROLE_KEY** que bypassa RLS:

#### **Cursos**
- `PUT /api/courses/[id]` - Atualizar curso completo
- `DELETE /api/courses/[id]` - Deletar curso (+ PDFs + categorias)

#### **PDFs**
- `POST /api/courses/[id]/pdfs` - Adicionar novo PDF
- `PUT /api/courses/[id]/pdfs/[pdfId]` - Atualizar PDF
- `DELETE /api/courses/[id]/pdfs/[pdfId]` - Deletar PDF

### 2. Verificação de Permissão

Todas as APIs incluem função `isAdmin()`:

```typescript
async function isAdmin(request: NextRequest): Promise<boolean> {
  // Usa SERVICE_ROLE_KEY para buscar role do usuário
  // Retorna true apenas se role === 'admin'
}
```

Se não for admin, retorna **403 Forbidden**.

### 3. Página Admin Modificada

Todas as funções agora usam as APIs em vez de acessar Supabase diretamente:

| Função Anterior | Agora |
|----------------|-------|
| `supabase.from('courses').update()` | `fetch('/api/courses/[id]', { method: 'PUT' })` |
| `supabase.from('course_pdfs').insert()` | `fetch('/api/courses/[id]/pdfs', { method: 'POST' })` |
| `supabase.from('course_pdfs').update()` | `fetch('/api/courses/[id]/pdfs/[pdfId]', { method: 'PUT' })` |
| `supabase.from('course_pdfs').delete()` | `fetch('/api/courses/[id]/pdfs/[pdfId]', { method: 'DELETE' })` |

---

## 🧪 Como Testar

### Pré-requisitos
1. Estar logado como **admin**
2. Se não for admin, veja [RESTAURAR-ADMINS-URGENTE.sql](RESTAURAR-ADMINS-URGENTE.sql)

### Teste 1: Editar Curso

1. Acesse: `http://localhost:3000/admin/courses`
2. Clique em **"Editar"** em qualquer curso
3. Modifique o título, descrição, autor, etc.
4. Clique em **"Salvar Curso"**
5. ✅ **Esperado**: "Curso salvo com sucesso!"
6. ✅ **Esperado**: Alterações persistem ao recarregar a página

**Se falhar:**
- Abra DevTools (F12) → Console
- Verifique se há erro 403 (não é admin) ou 500 (erro de servidor)

---

### Teste 2: Adicionar PDF a um Curso

1. Na página de edição de curso (`/admin/courses/[id]`)
2. Role até **"Adicionar Novo PDF"**
3. Preencha os campos:
   - Volume: `VOL-TESTE`
   - Título: `PDF de Teste`
   - URL: `https://drive.google.com/file/d/XXXXX/preview`
4. Clique em **"Adicionar PDF"**
5. ✅ **Esperado**: "PDF adicionado com sucesso!"
6. ✅ **Esperado**: PDF aparece na lista abaixo

---

### Teste 3: Editar PDF Existente

1. Na lista de PDFs, clique no ícone **"Editar"** (lápis)
2. Modifique o título ou URL
3. Clique em **"Salvar"** (ícone check verde)
4. ✅ **Esperado**: "PDF atualizado com sucesso!"
5. ✅ **Esperado**: Alterações visíveis imediatamente

---

### Teste 4: Deletar PDF

1. Na lista de PDFs, clique no ícone **"Deletar"** (lixeira vermelha)
2. Confirme a exclusão no popup
3. ✅ **Esperado**: "PDF removido com sucesso!"
4. ✅ **Esperado**: PDF desaparece da lista

---

### Teste 5: Reordenar PDFs

1. Na lista de PDFs, clique nas setas **↑ ↓** para mover PDFs
2. ✅ **Esperado**: PDFs mudam de posição
3. ✅ **Esperado**: Ao recarregar, ordem persiste

---

### Teste 6: Duplicar PDF

1. Clique no ícone **"Duplicar"** (ícone copy)
2. ✅ **Esperado**: "PDF duplicado com sucesso!"
3. ✅ **Esperado**: Novo PDF aparece com "-COPY" no nome

---

### Teste 7: Deletar Curso Completo

1. Volte para `/admin/courses`
2. Clique no ícone **"Deletar"** (lixeira) em um curso
3. Confirme a exclusão no popup
4. ✅ **Esperado**: Curso desaparece da lista
5. ✅ **Esperado**: Todos os PDFs associados também são deletados

---

## 🔧 Troubleshooting

### Erro 403: "Acesso negado"

**Causa**: Usuário não é admin.

**Solução**:
1. Abra Supabase Dashboard → SQL Editor
2. Execute:
   ```sql
   SELECT id, email, role FROM public.users WHERE email = 'seu-email@exemplo.com';
   ```
3. Se `role` não for `'admin'`, execute:
   ```sql
   UPDATE public.users SET role = 'admin' WHERE email = 'seu-email@exemplo.com';
   ```
4. Reinicie o servidor: `Ctrl+C` e `npm run dev`
5. Acesse: `http://localhost:3000/verificar-e-corrigir-admins.html`
6. Siga as instruções para limpar cache

---

### Erro 500: "Erro interno do servidor"

**Causa**: SERVICE_ROLE_KEY não configurada ou erro no banco.

**Solução**:
1. Verifique `.env.local`:
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
2. Reinicie o servidor: `Ctrl+C` e `npm run dev`
3. Verifique logs no terminal para mais detalhes

---

### Alterações não salvam

**Causa**: Cache desatualizado.

**Solução**:
1. Limpe cache do navegador: DevTools → Application → Clear site data
2. Acesse: `http://localhost:3000/forcar-refresh-admin.html`
3. Execute todos os botões de refresh
4. Recarregue a página

---

## 📊 Arquivos Modificados

1. [app/api/courses/[id]/route.ts](app/api/courses/[id]/route.ts)
   - Adicionado: `PUT` para atualizar curso
   - Adicionado: `DELETE` para deletar curso
   - Adicionado: função `isAdmin()`

2. [app/api/courses/[id]/pdfs/route.ts](app/api/courses/[id]/pdfs/route.ts) (NOVO)
   - Adicionado: `POST` para adicionar PDF

3. [app/api/courses/[id]/pdfs/[pdfId]/route.ts](app/api/courses/[id]/pdfs/[pdfId]/route.ts) (NOVO)
   - Adicionado: `PUT` para atualizar PDF
   - Adicionado: `DELETE` para deletar PDF

4. [app/admin/courses/[id]/page.tsx](app/admin/courses/[id]/page.tsx)
   - Modificado: `handleSave()` usa API
   - Modificado: `handleAddPDF()` usa API
   - Modificado: `handleSavePDF()` usa API
   - Modificado: `handleDeletePDF()` usa API
   - Modificado: `handleMovePDF()` usa API
   - Modificado: `handleDuplicatePDF()` usa API

---

## ✅ Status

- ✅ APIs criadas e testadas no build
- ✅ Verificação de permissão implementada
- ✅ Página admin modificada para usar APIs
- ✅ Build compila sem erros
- ✅ Código commitado e enviado ao repositório

**Próximo passo**: Testar na prática com usuário admin real! 🎯
