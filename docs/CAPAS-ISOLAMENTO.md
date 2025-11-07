# 🖼️ Isolamento de Capas - Curso, Volume e Subvolume

## 📊 Estrutura do Banco de Dados

### Tabela `courses` (Cursos)
```sql
CREATE TABLE courses (
  id UUID PRIMARY KEY,
  title TEXT,
  cover_url TEXT,  -- ← Capa do CURSO
  ...
)
```

### Tabela `course_pdfs` (Volumes e Subvolumes)
```sql
CREATE TABLE course_pdfs (
  id UUID PRIMARY KEY,
  course_id UUID REFERENCES courses(id),
  volume TEXT,
  title TEXT,
  cover_url TEXT,  -- ← Capa do VOLUME/SUBVOLUME
  parent_volume_id UUID REFERENCES course_pdfs(id),  -- ← NULL = volume raiz, UUID = subvolume
  ...
)
```

---

## ✅ Como Funciona o Isolamento

### Cada entidade tem sua própria capa INDEPENDENTE:

```
CURSO (courses)
├─ id: "curso-123"
├─ cover_url: "https://.../curso-capa.jpg"  ← Capa do CURSO
│
└─ VOLUME 1 (course_pdfs)
   ├─ id: "vol-1"
   ├─ parent_volume_id: NULL  (é um volume raiz)
   ├─ cover_url: "https://.../volume1-capa.jpg"  ← Capa do VOLUME 1
   │
   ├─ SUBVOLUME 1.1 (course_pdfs)
   │  ├─ id: "subvol-1-1"
   │  ├─ parent_volume_id: "vol-1"  (é filho do VOLUME 1)
   │  ├─ cover_url: "https://.../subvolume1-1-capa.jpg"  ← Capa do SUBVOLUME 1.1
   │
   └─ SUBVOLUME 1.2 (course_pdfs)
      ├─ id: "subvol-1-2"
      ├─ parent_volume_id: "vol-1"  (é filho do VOLUME 1)
      ├─ cover_url: "https://.../subvolume1-2-capa.jpg"  ← Capa do SUBVOLUME 1.2
```

---

## 🔒 Garantia de Isolamento

### API: `/api/upload` (Capa do CURSO)
```typescript
// Atualiza APENAS a tabela courses
await supabaseAdmin
  .from('courses')  // ← Tabela COURSES
  .update({ cover_url: urlData.publicUrl })
  .eq('id', courseId)  // ← Filtra pelo ID do CURSO
```

**Resultado:** Atualiza apenas `courses.cover_url`

---

### API: `/api/upload/volume-cover` (Capa do VOLUME/SUBVOLUME)
```typescript
// Atualiza APENAS o registro específico em course_pdfs
await supabaseAdmin
  .from('course_pdfs')  // ← Tabela COURSE_PDFS
  .update({ cover_url: urlData.publicUrl })
  .eq('id', volumeId)  // ← Filtra pelo ID do VOLUME/SUBVOLUME
  .eq('course_id', courseId)  // ← Segurança adicional
```

**Resultado:** Atualiza apenas `course_pdfs[volumeId].cover_url`

---

## 🎯 Cenários de Teste

### Cenário 1: Upload de capa do CURSO
```
Ação: Admin faz upload de capa para o curso "Cartas de Paulo"
Endpoint: /api/upload (type: 'cover')
Atualiza: courses.cover_url

✅ Capa do curso mudou
❌ Capas dos volumes NÃO mudaram
❌ Capas dos subvolumes NÃO mudaram
```

### Cenário 2: Upload de capa do VOLUME
```
Ação: Admin faz upload de capa para "VOL-I"
Endpoint: /api/upload/volume-cover (volumeId: vol-1)
Atualiza: course_pdfs[vol-1].cover_url

❌ Capa do curso NÃO mudou
✅ Capa do volume VOL-I mudou
❌ Capas dos subvolumes do VOL-I NÃO mudaram
❌ Outros volumes NÃO mudaram
```

### Cenário 3: Upload de capa do SUBVOLUME
```
Ação: Admin faz upload de capa para "Subvolume 1.1"
Endpoint: /api/upload/volume-cover (volumeId: subvol-1-1)
Atualiza: course_pdfs[subvol-1-1].cover_url

❌ Capa do curso NÃO mudou
❌ Capa do volume pai (VOL-I) NÃO mudou
✅ Capa do subvolume 1.1 mudou
❌ Outros subvolumes NÃO mudaram
```

---

## 🔍 Verificação no Código

### 1. Endpoint de Volume/Subvolume
**Arquivo:** `/app/api/upload/volume-cover/route.ts`

**Linhas 56-60:**
```typescript
const { error: updateError } = await supabaseAdmin
  .from('course_pdfs')  // ← Tabela correta
  .update({ cover_url: urlData.publicUrl })
  .eq('id', volumeId)  // ← ID ESPECÍFICO do volume/subvolume
  .eq('course_id', courseId)  // ← Validação de segurança
```

**Garantias:**
- ✅ Usa `.eq('id', volumeId)` - Atualiza APENAS o registro com aquele ID
- ✅ Não importa se é volume ou subvolume, atualiza apenas aquele registro
- ✅ Cada registro tem seu próprio `cover_url`

### 2. Endpoint de Curso
**Arquivo:** `/app/api/upload/route.ts`

**Linha 38:**
```typescript
const bucketName = type === 'cover' ? 'course-covers' : 'course-pdfs'
```

**Problema anterior (CORRIGIDO):**
- ❌ `volume-modal.tsx` usava `/api/upload` (endpoint de curso)
- ✅ Agora usa `/api/upload/volume-cover` (endpoint correto)

---

## 📋 Resumo Técnico

| Entidade | Tabela | Campo | Endpoint | Interferência |
|----------|--------|-------|----------|---------------|
| **Curso** | `courses` | `cover_url` | `/api/upload` | ❌ Não afeta volumes |
| **Volume Raiz** | `course_pdfs` | `cover_url` | `/api/upload/volume-cover` | ❌ Não afeta curso nem subvolumes |
| **Subvolume** | `course_pdfs` | `cover_url` | `/api/upload/volume-cover` | ❌ Não afeta curso, volume pai, nem outros subvolumes |

---

## ✅ Conclusão

**Isolamento COMPLETO garantido:**

1. ✅ Cada curso tem sua própria capa (`courses.cover_url`)
2. ✅ Cada volume tem sua própria capa (`course_pdfs.cover_url`)
3. ✅ Cada subvolume tem sua própria capa (`course_pdfs.cover_url`)
4. ✅ Não há interferência entre eles
5. ✅ O banco de dados usa IDs únicos para garantir isolamento
6. ✅ As queries usam `.eq('id', ...)` para atualizar apenas o registro específico

**Você pode ter:**
- 📚 1 capa para o curso
- 📖 1 capa diferente para cada volume
- 📑 1 capa diferente para cada subvolume

**Tudo funcionando de forma isolada e independente!** 🎉

---

**Última atualização:** 2025-11-06
**Versão:** 1.0
**Status:** Verificado e Garantido ✅
