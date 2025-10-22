# 🚀 Próximos Passos - Integração Supabase

## ✅ O que já está pronto:

1. ✅ **Arquivo `.env`** configurado com credenciais do Supabase
2. ✅ **Schema SQL completo** (`supabase-schema.sql`) com 8 tabelas
3. ✅ **Cliente Supabase** criado (`lib/supabase.ts`)
4. ✅ **Interface Admin** para configurar texto Kindle (visual pronto)
5. ✅ **Documentação completa** (SUPABASE-SETUP.md, ADMIN-TEXT-CONFIG.md)
6. 🔄 **Instalando** `@supabase/supabase-js` (em andamento)

---

## 📝 Checklist de Execução

### 1. ⚡ Criar Tabelas no Supabase (URGENTE!)

**Acesse**: https://supabase.com/dashboard/project/aqvqpkmjdtzeoclndwhj/sql

1. Clique em **"New Query"**
2. Abra o arquivo `supabase-schema.sql`
3. Copie **TODO** o conteúdo
4. Cole no editor SQL
5. Clique em **"Run"** (ou Ctrl+Enter)
6. Aguarde sucesso ✅

**Resultado esperado**:
```
✅ CREATE TABLE users
✅ CREATE TABLE courses
✅ CREATE TABLE course_pdfs ⭐
✅ CREATE TABLE user_course_progress
✅ CREATE TABLE reading_sessions
✅ CREATE TABLE achievements
✅ CREATE TABLE user_achievements
✅ CREATE TABLE bookmarks
✅ Triggers criados
✅ Políticas RLS aplicadas
✅ Conquistas seed inseridas
```

---

### 2. ✅ Verificar Instalação do Supabase

Após a instalação terminar, reinicie o servidor:

```bash
# Pressione Ctrl+C no terminal do dev server
# Depois rode novamente:
npm run dev
```

---

### 3. 📊 Verificar se Tabelas Foram Criadas

**Acesse**: https://supabase.com/dashboard/project/aqvqpkmjdtzeoclndwhj/editor

Você deve ver **8 tabelas** no painel esquerdo:
- achievements
- bookmarks
- **course_pdfs** ⭐
- **courses** ⭐
- reading_sessions
- user_achievements
- user_course_progress
- users

---

### 4. 🧪 Testar Conexão com Supabase

Crie um arquivo de teste `test-supabase.ts` na raiz:

```typescript
import { supabase } from './lib/supabase'

async function testConnection() {
  // Testar listagem de cursos
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .limit(5)

  if (error) {
    console.error('❌ Erro ao conectar:', error)
  } else {
    console.log('✅ Conexão OK! Cursos encontrados:', data?.length || 0)
    console.log(data)
  }
}

testConnection()
```

Execute:
```bash
npx tsx test-supabase.ts
```

---

## 🔧 Próximas Implementações

### Fase 1: Migrar Cursos para Supabase

**Arquivo**: `lib/migrate-courses.ts`

Criar script para migrar os dados mockados de `lib/courses-data.ts` para o Supabase:

```typescript
import { supabaseAdmin } from './lib/supabase'
import { courses } from './lib/courses-data'

async function migrateCourses() {
  for (const course of courses) {
    // 1. Inserir curso
    const { data: courseData, error: courseError } = await supabaseAdmin
      .from('courses')
      .insert({
        slug: course.slug,
        title: course.title,
        description: course.description,
        author: course.author,
        category: course.category,
        pages: course.pages,
        reading_time_minutes: course.readingTimeMinutes,
        cover_url: course.coverUrl,
        status: 'published'
      })
      .select()
      .single()

    if (courseError) {
      console.error('Erro ao inserir curso:', course.title, courseError)
      continue
    }

    // 2. Inserir PDFs do curso
    for (let i = 0; i < course.pdfs.length; i++) {
      const pdf = course.pdfs[i]

      await supabaseAdmin
        .from('course_pdfs')
        .insert({
          course_id: courseData.id,
          volume: pdf.volume,
          title: pdf.title,
          url: pdf.url,
          pages: pdf.pages,
          reading_time_minutes: pdf.readingTimeMinutes,
          text_content: null,
          use_auto_conversion: true,
          display_order: i
        })
    }

    console.log('✅ Migrado:', course.title)
  }

  console.log('🎉 Migração completa!')
}

migrateCourses()
```

Execute UMA VEZ:
```bash
npx tsx lib/migrate-courses.ts
```

---

### Fase 2: Criar API Routes

#### **GET /api/courses**
Listar todos os cursos publicados

```typescript
// app/api/courses/route.ts
import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  const { data, error } = await supabase
    .from('courses')
    .select(`
      *,
      pdfs:course_pdfs(*)
    `)
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ courses: data })
}
```

#### **GET /api/courses/[slug]**
Buscar curso específico por slug

```typescript
// app/api/courses/[slug]/route.ts
import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const { data, error } = await supabase
    .from('courses')
    .select(`
      *,
      pdfs:course_pdfs(*)
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error) {
    return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 })
  }

  return NextResponse.json({ course: data })
}
```

#### **POST /api/admin/courses/[courseId]/pdfs/[pdfId]/text** ⭐
Atualizar configuração de texto Kindle (ADMIN ONLY)

```typescript
// app/api/admin/courses/[courseId]/pdfs/[pdfId]/text/route.ts
import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ courseId: string; pdfId: string }> }
) {
  const { courseId, pdfId } = await params
  const { textContent, useAutoConversion } = await request.json()

  // TODO: Verificar se usuário é admin

  const { data, error } = await supabaseAdmin
    .from('course_pdfs')
    .update({
      text_content: textContent,
      use_auto_conversion: useAutoConversion
    })
    .eq('id', pdfId)
    .eq('course_id', courseId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ pdf: data })
}
```

---

### Fase 3: Conectar Interface Admin

#### Atualizar `app/admin/courses/[id]/page.tsx`:

```typescript
// Adicionar no topo
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'

// Substituir getCourseById por:
const [course, setCourse] = useState(null)

useEffect(() => {
  async function loadCourse() {
    const { data } = await supabase
      .from('courses')
      .select(`
        *,
        pdfs:course_pdfs(*)
      `)
      .eq('id', courseId)
      .single()

    setCourse(data)
  }
  loadCourse()
}, [courseId])

// Atualizar handleSaveTextConfig:
const handleSaveTextConfig = async (pdfId: string, textContent: string, useAutoConversion: boolean) => {
  const response = await fetch(`/api/admin/courses/${courseId}/pdfs/${pdfId}/text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ textContent, useAutoConversion })
  })

  if (response.ok) {
    alert('Texto salvo com sucesso!')
    // Recarregar curso
  }
}
```

---

### Fase 4: Atualizar Página do Curso

#### `app/course/[id]/page.tsx`:

```typescript
// Substituir getCourseById por chamada ao Supabase
const { data: course } = await supabase
  .from('courses')
  .select(`
    *,
    pdfs:course_pdfs(*)
  `)
  .eq('slug', courseId)
  .eq('status', 'published')
  .single()
```

---

## 🎯 Ordem de Execução Recomendada

1. ✅ **AGORA**: Executar SQL no Supabase Dashboard
2. ⏳ **Aguardar**: Instalação do `@supabase/supabase-js` terminar
3. 🔄 **Reiniciar**: Servidor dev (`npm run dev`)
4. 🧪 **Testar**: Conexão com `test-supabase.ts`
5. 📦 **Migrar**: Cursos mockados com `migrate-courses.ts`
6. 🛠️ **Criar**: API routes (courses, admin/text)
7. 🔌 **Conectar**: Interface admin ao backend
8. 🎨 **Atualizar**: Página de visualização do curso
9. ✅ **Testar**: Fluxo completo (admin configura → usuário visualiza)

---

## 📚 Arquivos Importantes

- ✅ `supabase-schema.sql` - Schema completo
- ✅ `SUPABASE-SETUP.md` - Guia de setup
- ✅ `ADMIN-TEXT-CONFIG.md` - Documentação da feature
- ✅ `.env` - Credenciais configuradas
- ✅ `lib/supabase.ts` - Cliente criado
- 🔜 `lib/migrate-courses.ts` - Script de migração
- 🔜 `app/api/courses/route.ts` - API de cursos
- 🔜 `app/api/admin/courses/[courseId]/pdfs/[pdfId]/text/route.ts` - API admin

---

**Status Atual**: ⚙️ Aguardando instalação do Supabase
**Próximo Passo**: Executar SQL no Dashboard
**Tempo estimado**: 15-30 minutos para setup completo

🎉 Está quase tudo pronto! Só falta executar o SQL e conectar os pontos!
