# 🗄️ Setup do Supabase - Sabedoria das Escrituras

## ✅ Credenciais Configuradas

O arquivo `.env` já está configurado com as credenciais do seu projeto Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://aqvqpkmjdtzeoclndwhj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📋 Passo 1: Criar as Tabelas no Supabase

### Opção A: Via Dashboard do Supabase (Recomendado)

1. **Acesse o SQL Editor do Supabase**:
   ```
   https://supabase.com/dashboard/project/aqvqpkmjdtzeoclndwhj/sql
   ```

2. **Clique em "New Query"**

3. **Copie todo o conteúdo do arquivo `supabase-schema.sql`**
   - Abra o arquivo `supabase-schema.sql` na raiz do projeto
   - Selecione todo o conteúdo (Ctrl+A)
   - Copie (Ctrl+C)

4. **Cole no editor SQL do Supabase**
   - Cole no editor (Ctrl+V)

5. **Execute o SQL**:
   - Clique em "Run" ou pressione Ctrl+Enter
   - Aguarde a execução (pode demorar alguns segundos)
   - Você verá mensagens de sucesso para cada tabela criada

### Opção B: Via Supabase CLI (Avançado)

```bash
# Instalar Supabase CLI (se não tiver)
npm install -g supabase

# Login no Supabase
supabase login

# Link ao projeto
supabase link --project-ref aqvqpkmjdtzeoclndwhj

# Executar o schema
supabase db push
```

---

## 🗂️ Tabelas Criadas

Após executar o SQL, você terá as seguintes tabelas:

### 1. **users** - Usuários do sistema
- `id` (UUID, PK)
- `email` (TEXT, UNIQUE)
- `name` (TEXT)
- `role` (admin | moderator | student)
- `total_points` (INTEGER)
- `total_reading_minutes` (INTEGER)
- Etc...

### 2. **courses** - Cursos bíblicos
- `id` (UUID, PK)
- `slug` (TEXT, UNIQUE)
- `title` (TEXT)
- `description` (TEXT)
- `category` (TEXT)
- `pages`, `reading_time_minutes`
- Etc...

### 3. **course_pdfs** ⭐ PRINCIPAL
- `id` (UUID, PK)
- `course_id` (UUID, FK → courses)
- `volume`, `title`, `url`
- **`text_content`** ← Texto para modo Kindle
- **`use_auto_conversion`** ← Flag de conversão automática
- Etc...

### 4. **user_course_progress** - Progresso dos usuários
- `user_id` (UUID, FK → users)
- `course_id` (UUID, FK → courses)
- `progress_percentage` (DECIMAL)
- `total_reading_minutes` (INTEGER)
- Etc...

### 5. **reading_sessions** - Sessões de leitura (gamificação)
- `user_id`, `course_id`, `pdf_id`
- `duration_seconds`, `pages_read`
- `points_earned`
- Etc...

### 6. **achievements** - Conquistas/Badges
- Conquistas pré-cadastradas:
  - 🌱 Primeiro Passo (10 pontos)
  - 📖 Leitor Dedicado (50 pontos)
  - 🎓 Estudioso (100 pontos)
  - 🔥 Consistência (150 pontos)
  - Etc...

### 7. **user_achievements** - Conquistas desbloqueadas
- Vínculo entre usuários e achievements

### 8. **bookmarks** - Marcadores de página
- Marcadores de leitura dos usuários

---

## 🔐 Row Level Security (RLS)

O schema já configura RLS para todas as tabelas:

### Políticas Importantes:

#### **courses** e **course_pdfs**:
- ✅ Qualquer pessoa pode **ler** cursos publicados
- ✅ Apenas **admins/moderators** podem criar/editar/deletar

#### **user_course_progress**, **reading_sessions**, **bookmarks**:
- ✅ Usuários só veem/editam **seus próprios dados**
- ✅ Não podem acessar dados de outros usuários

#### **achievements**:
- ✅ Todos podem **ler** as conquistas disponíveis
- ✅ Apenas sistema pode criar novas conquistas

---

## 🧪 Passo 2: Verificar se as Tabelas foram Criadas

### Via Dashboard:

1. Acesse: https://supabase.com/dashboard/project/aqvqpkmjdtzeoclndwhj/editor

2. Você deve ver as 8 tabelas no painel esquerdo:
   ```
   📊 public
   ├── achievements
   ├── bookmarks
   ├── course_pdfs ⭐
   ├── courses ⭐
   ├── reading_sessions
   ├── user_achievements
   ├── user_course_progress
   └── users
   ```

3. Clique em cada tabela para ver sua estrutura

### Via SQL:

Execute no SQL Editor:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Você deve ver 8 tabelas listadas.

---

## 📦 Passo 3: Popular com Dados de Teste (Opcional)

### Inserir curso de exemplo:

```sql
-- 1. Criar um curso
INSERT INTO public.courses (slug, title, description, author, category, pages, reading_time_minutes, cover_url, status)
VALUES (
  'panorama-parabolas-jesus',
  'Panorama das Parábolas de Jesus',
  'Análise completa das parábolas de Jesus Cristo',
  'Pr. Welliton Alves Dos Santos',
  'Panorama Bíblico',
  120,
  180,
  '/bible-study-books-parabolas.jpg',
  'published'
)
RETURNING id;

-- 2. Copie o ID retornado e insira um PDF (substitua <COURSE_ID>)
INSERT INTO public.course_pdfs (course_id, volume, title, url, pages, reading_time_minutes, text_content, use_auto_conversion)
VALUES (
  '<COURSE_ID>',
  'VOL-I',
  'Panorama Bíblico - Desvendando as Parábolas de Jesus - Parte 01',
  'https://drive.google.com/file/d/1EbjfK--R591qRxg06HddKjr095qEZO6p/preview',
  20,
  30,
  NULL, -- Sem texto pré-configurado
  true  -- Tenta conversão automática
);
```

---

## 🔧 Passo 4: Instalar o Supabase Client no Next.js

Precisamos instalar a biblioteca do Supabase:

```bash
npm install @supabase/supabase-js
```

Ou se estiver usando pnpm:

```bash
pnpm add @supabase/supabase-js
```

---

## 📁 Passo 5: Criar o Cliente Supabase

Crie o arquivo `lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Para operações admin (server-side only)
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
```

---

## 🎯 Próximos Passos

Após criar as tabelas:

1. ✅ **Verificar estrutura** no Dashboard
2. ✅ **Instalar** `@supabase/supabase-js`
3. ✅ **Criar** `lib/supabase.ts`
4. 🔜 **Migrar** dados mockados para Supabase
5. 🔜 **Criar** API routes para CRUD
6. 🔜 **Conectar** interface admin ao backend

---

## 📚 Recursos

- 📖 [Documentação Supabase](https://supabase.com/docs)
- 🎥 [Tutorial Supabase + Next.js](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- 🔐 [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- 🔍 [SQL Editor](https://supabase.com/dashboard/project/aqvqpkmjdtzeoclndwhj/sql)

---

## ❓ Troubleshooting

### Erro: "relation already exists"
Se você já rodou o script antes e quer recriar:

```sql
-- Dropar todas as tabelas (CUIDADO!)
DROP TABLE IF EXISTS public.bookmarks CASCADE;
DROP TABLE IF EXISTS public.user_achievements CASCADE;
DROP TABLE IF EXISTS public.reading_sessions CASCADE;
DROP TABLE IF EXISTS public.user_course_progress CASCADE;
DROP TABLE IF EXISTS public.course_pdfs CASCADE;
DROP TABLE IF EXISTS public.courses CASCADE;
DROP TABLE IF EXISTS public.achievements CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Depois rode o script novamente
```

### Erro: "permission denied"
Certifique-se de estar usando o SQL Editor como proprietário do projeto.

### Erro ao conectar do Next.js
Verifique se as variáveis de ambiente estão corretas no `.env` e reinicie o servidor:

```bash
npm run dev
```

---

**Status**: ✅ Schema pronto para execução
**Última atualização**: 22/10/2025 01:20 AM
**Próximo**: Executar SQL no Supabase Dashboard
