# 🎨📹🎵 Corrigir Capas, Áudio e Vídeo dos Volumes

## 🐛 Problemas Identificados

1. **Capas não salvam**: Campo `cover_url` pode não existir no banco de dados
2. **Áudio MP3 não aparece**: Campo `audio_url` não existe
3. **Vídeo do YouTube não aparece**: Campo `youtube_url` pode não existir

## ✅ Solução Completa

### 1️⃣ **Executar SQL no Supabase** (OBRIGATÓRIO)

Acesse o **Supabase SQL Editor** e execute:

```bash
scripts/fix-volume-media-fields.sql
```

Este script adiciona 3 campos à tabela `course_pdfs`:
- `cover_url` - URL da capa do volume
- `youtube_url` - URL do vídeo do YouTube
- `audio_url` - URL do arquivo MP3 (narração)

### 2️⃣ **Verificar se os campos foram criados**

No Supabase SQL Editor, execute:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'course_pdfs'
AND column_name IN ('cover_url', 'youtube_url', 'audio_url');
```

Você deve ver os 3 campos listados.

---

## 🎨 Como Adicionar Capa a um Volume

### Opção 1: Via Admin (Interface Visual)

1. Acesse `/admin/courses/[course-id]`
2. Role até a seção de volumes
3. Clique em "Upload de Capa" para o volume desejado
4. Selecione uma imagem (máximo 5MB)
5. A capa será salva automaticamente

### Opção 2: Via SQL (Direto)

```sql
UPDATE course_pdfs
SET cover_url = 'https://sua-url-da-imagem.jpg'
WHERE id = 'uuid-do-volume';
```

### Opção 3: Via API

```javascript
const formData = new FormData()
formData.append('file', imageFile)
formData.append('volumeId', 'uuid-do-volume')
formData.append('courseId', 'uuid-do-curso')

const response = await fetch('/api/upload/volume-cover', {
  method: 'POST',
  body: formData
})
```

---

## 🎵 Como Adicionar Áudio (MP3) a um Volume

### 1. Fazer Upload do MP3

Opções:
- **Supabase Storage**: Upload via dashboard do Supabase
- **Google Drive**: Upload e pegar link público
- **Outro serviço**: Qualquer URL pública de MP3

### 2. Adicionar URL no Banco

```sql
UPDATE course_pdfs
SET audio_url = 'https://url-do-seu-audio.mp3'
WHERE id = 'uuid-do-volume';
```

### 3. Verificar Resultado

O player de áudio aparecerá automaticamente para o aluno quando ele selecionar o volume.

---

## 📹 Como Adicionar Vídeo (YouTube) a um Volume

### 1. Obter URL do YouTube

Copie a URL completa do vídeo no YouTube:
```
https://www.youtube.com/watch?v=VIDEO_ID
```

### 2. Adicionar URL no Banco

```sql
UPDATE course_pdfs
SET youtube_url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
WHERE id = 'uuid-do-volume';
```

### 3. Verificar Resultado

O player do YouTube aparecerá automaticamente para o aluno quando ele selecionar o volume.

---

## 🎯 Como o Aluno Vê

### Antes da Correção:
- ❌ Sem capa personalizada
- ❌ Sem player de áudio
- ❌ Sem player de vídeo

### Depois da Correção:
```
┌─────────────────────────────────┐
│    [CAPA DO VOLUME]             │ ← Capa personalizada
│    📦 Volume I                   │
│    Título do Volume              │
│    [Abrir Volume]                │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ 🔊 Escutar Áudio                 │ ← Player de MP3
│ ▶️ ━━━━●──── 12:34              │
│ Volume I - Narração              │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ 📹 Assistir Vídeo                │ ← Player do YouTube
│ [YouTube Player Embed]           │
│ Volume I - Explicação            │
└─────────────────────────────────┘
```

---

## 📊 Estatísticas dos Volumes

Ver quantos volumes têm cada tipo de mídia:

```sql
SELECT
  COUNT(*) as total_volumes,
  COUNT(cover_url) as com_capa,
  COUNT(youtube_url) as com_video,
  COUNT(audio_url) as com_audio,
  COUNT(*) FILTER (
    WHERE cover_url IS NOT NULL
    AND youtube_url IS NOT NULL
    AND audio_url IS NOT NULL
  ) as volumes_completos
FROM course_pdfs;
```

---

## 🔧 Troubleshooting

### Problema: "Capas não aparecem após upload"

**Solução:**
1. Verifique se o SQL foi executado: `SELECT cover_url FROM course_pdfs LIMIT 1;`
2. Se retornar erro "column does not exist", execute o SQL migration
3. Limpe o cache do navegador (Ctrl+Shift+R)

### Problema: "Player de áudio não aparece"

**Solução:**
1. Verifique se a URL do áudio é pública e acessível
2. Teste a URL diretamente no navegador
3. Verifique se o campo `audio_url` foi populado:
   ```sql
   SELECT audio_url FROM course_pdfs WHERE id = 'uuid-do-volume';
   ```

### Problema: "Vídeo do YouTube não carrega"

**Solução:**
1. Verifique se a URL está no formato correto: `https://www.youtube.com/watch?v=VIDEO_ID`
2. Teste se o vídeo é público (não unlisted ou private)
3. Verifique se o campo `youtube_url` foi populado:
   ```sql
   SELECT youtube_url FROM course_pdfs WHERE id = 'uuid-do-volume';
   ```

---

## 📝 Checklist de Implementação

- [ ] ✅ Executar SQL migration (`scripts/fix-volume-media-fields.sql`)
- [ ] ✅ Verificar se campos foram criados
- [ ] ✅ Fazer upload de capas dos volumes
- [ ] ✅ Adicionar URLs de áudio (MP3) aos volumes
- [ ] ✅ Adicionar URLs de vídeo (YouTube) aos volumes
- [ ] ✅ Testar na área do aluno
- [ ] ✅ Verificar se players aparecem corretamente

---

## 🚀 Próximos Passos

Depois de corrigir:
1. Todos os volumes podem ter capas personalizadas
2. Alunos podem escutar narrações em MP3
3. Alunos podem assistir vídeos explicativos do YouTube
4. Interface mais rica e profissional

---

## 📍 Arquivos Modificados

- `scripts/fix-volume-media-fields.sql` - SQL migration
- `lib/courses-data.ts` - Interface TypeScript atualizada
- `app/api/courses/[id]/route.ts` - API retornando audio_url
- `components/pdf-volume-selector.tsx` - Player de áudio adicionado

---

✅ **Tudo pronto para funcionar!**

Execute o SQL e comece a adicionar capas, áudios e vídeos aos seus volumes! 🎉
