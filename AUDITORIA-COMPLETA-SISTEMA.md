# 🔍 Auditoria Completa do Sistema - Sabedoria das Escrituras
**Data:** 23/10/2025

---

## 📊 RESUMO EXECUTIVO

Sistema revisado em profundidade com análise de:
- ✅ Painel administrativo completo
- ✅ CRUD de cursos e usuários
- ✅ Sistema de autenticação e recuperação de senha
- ✅ Perfil do usuário e configurações
- ✅ Modo Kindle (Digital Magazine Viewer)
- ✅ Categorias e controle de acesso

---

## 🎯 STATUS GERAL

| Módulo | Status | Problemas | Melhorias Sugeridas |
|--------|--------|-----------|---------------------|
| Admin Dashboard | ✅ Funcional | 2 | 5 |
| CRUD Cursos | ⚠️ Parcial | 4 | 8 |
| CRUD Usuários | ✅ Funcional | 1 | 3 |
| Autenticação | ⚠️ Mock | 5 | 10 |
| Perfil/Settings | ⚠️ Mock | 3 | 7 |
| Modo Kindle | ⚠️ Limitado | 6 | 12 |
| Categorias | ❌ Ausente | 1 | 5 |

**Legenda:**
- ✅ Funcional: Implementado e funcionando
- ⚠️ Parcial/Mock: Implementado mas com dados mockados ou incompleto
- ❌ Ausente: Não implementado

---

## 🔴 PROBLEMAS CRÍTICOS

### 1. **Autenticação Totalmente Mockada**
**Localização:** `app/settings/page.tsx:86-109`

```typescript
// Atual: Dados mockados
const mockUser: UserProfile = {
  id: "current-user",
  name: "Usuário Teste",
  email: "usuario@teste.com",
  // ...
}
```

**Problema:**
- Não usa autenticação real do Supabase
- Todos usuários veem o mesmo perfil mock
- Sem validação de sessão real

**Solução:**
```typescript
// Usar getCurrentUser() do lib/auth.ts
const user = await getCurrentUser()
if (!user) {
  redirect('/landing')
}
```

---

### 2. **Hardcoded Anon Key Inválida**
**Localização:** Múltiplos arquivos (88, 173, 249, etc.)

```typescript
// ❌ PROBLEMA CRÍTICO
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGci...QrJvQrJvQ'
//                                                                    ^^^ Key inválida/truncada
```

**Impacto:**
- Todas as operações diretas no Supabase falham
- Admin de cursos não funciona corretamente
- Edição de PDFs quebrada

**Solução Imediata:**
```typescript
// Usar apenas a chave do .env, sem fallback
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!supabaseKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY não configurada')
}
```

---

### 3. **CRUD de Cursos sem Funções Create/Delete**
**Localização:** `app/admin/courses/page.tsx`

**Problemas:**
- Botão "Novo Curso" não faz nada (linha 123-126, 198-201)
- Função `handleDeleteCourse` definida (linha 62) mas nunca chamada na UI
- Não há rota `/admin/courses/new`

**Melhorias Necessárias:**
1. Criar rota `/admin/courses/new/page.tsx`
2. Implementar formulário de criação de curso
3. Conectar botão delete aos cards dos cursos

---

### 4. **Sistema de Categorias Ausente**
**Localização:** Ausente

**O que falta:**
- CRUD completo de categorias
- Tabela `categories` no banco
- Filtro por categoria funcional
- Relacionamento many-to-many com cursos

**Estrutura Sugerida:**
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  display_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE course_categories (
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (course_id, category_id)
);
```

---

### 5. **Modo Kindle Usa Texto Mockado**
**Localização:** `components/digital-magazine-viewer.tsx:93-150`

```typescript
// Texto mockado hardcoded
const mockText = [
  "PANORAMA BÍBLICO - DESVENDANDO AS PARÁBOLAS DE JESUS",
  // ... mais texto mock
]
```

**Problema:**
- Ignora `pdfData.text_content` do banco
- Sempre mostra o mesmo texto para todos os PDFs
- Não há extração real de PDF

**Solução:**
```typescript
useEffect(() => {
  const loadText = async () => {
    // 1. Verificar se há text_content no pdfData
    if (pdfData?.text_content) {
      setExtractedText(pdfData.text_content.split('\n\n'))
      setTotalPages(Math.ceil(pdfData.text_content.length / 2000))
    }
    // 2. Se use_auto_conversion, tentar extrair do PDF
    else if (pdfData?.use_auto_conversion) {
      const text = await extractTextFromPDF(pdfUrl)
      setExtractedText(text)
    }
    // 3. Fallback: mostrar mensagem
    else {
      setExtractedText(['Texto não disponível para este PDF.'])
    }
  }
  loadText()
}, [pdfData, pdfUrl])
```

---

### 6. **Recuperação de Senha Não Implementada**
**Localização:** `app/settings/page.tsx:178-192`

```typescript
// Apenas simula envio
await new Promise(resolve => setTimeout(resolve, 1000))
setSuccess("Email de recuperação enviado! Verifique sua caixa de entrada.")
```

**Problema:**
- Não usa Supabase Auth `resetPasswordForEmail()`
- Não há rota de reset password
- Magic link também não funciona

**Implementação Necessária:**

1. **Criar arquivo:** `lib/auth.ts` - adicionar funções:
```typescript
export async function requestPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  return { error }
}

export async function sendMagicLink(email: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    }
  })
  return { error }
}
```

2. **Criar rota:** `app/reset-password/page.tsx`
3. **Criar rota:** `app/auth/callback/route.ts`

---

## ⚠️ PROBLEMAS MÉDIOS

### 7. **Edição de Usuários Incompleta**
**Localização:** `app/admin/users/page.tsx:341-345`

- Link para `/admin/users/[id]` existe
- Rota existe: `app/admin/users/[id]/page.tsx`
- Mas não há implementação de edição real

**Melhorias:**
- Implementar formulário de edição
- Permitir alterar role, status, dias de acesso
- Gerenciar categorias/cursos permitidos/bloqueados

---

### 8. **Upload de Imagens/PDFs Via API Não Testado**
**Localização:** `app/admin/courses/[id]/page.tsx:442-494`

```typescript
const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData,
})
```

**Problema:**
- Rota `/api/upload/route.ts` existe
- Mas não foi testada
- Pode haver problemas com Supabase Storage

**Checklist de Teste:**
- [ ] Upload de imagem de capa
- [ ] Upload de PDF
- [ ] Upload de arquivo TXT
- [ ] Limites de tamanho
- [ ] Tipos de arquivo permitidos

---

### 9. **Campos de Perfil Não Salvam**
**Localização:** `app/settings/page.tsx:131-145`

**Campos presentes mas não salvos:**
- CPF, telefone, endereço, cidade, estado, CEP
- Data de nascimento, biografia
- Preferências (tema, idioma, timezone)
- Configurações de notificação

**Solução:**
1. Criar tabela `user_profiles` ou adicionar campos em `users`
2. Implementar API routes para salvar
3. Conectar aos inputs

---

## 🟡 MELHORIAS SUGERIDAS

### MODO KINDLE - 12 Melhorias

#### 1. **Extração Real de Texto de PDF**
```typescript
// Usar biblioteca como pdf.js
import { getDocument } from 'pdfjs-dist'

async function extractTextFromPDF(url: string): Promise<string[]> {
  const pdf = await getDocument(url).promise
  const pages: string[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    const text = textContent.items
      .map((item: any) => item.str)
      .join(' ')
    pages.push(text)
  }

  return pages
}
```

#### 2. **Paginação Inteligente**
- Quebrar texto em páginas baseado em:
  - Número de caracteres (1500-2000 por página)
  - Parágrafos completos
  - Capítulos/seções

#### 3. **Marcadores Persistentes**
```typescript
// Salvar no Supabase
const saveBookmark = async (page: number) => {
  await supabase
    .from('bookmarks')
    .insert({
      user_id: user.id,
      course_id: courseId,
      pdf_id: pdfData.id,
      page_number: page,
      note: null
    })
}
```

#### 4. **Auto-scroll Aprimorado**
- Velocidade ajustável (lenta, média, rápida)
- Pausar ao detectar scroll manual
- Indicador visual de progresso

#### 5. **Temas Adicionais**
Adicionar mais temperaturas de leitura:
- **Amber:** Tons alaranjados para leitura vespertina
- **Gray:** Tons de cinza para foco
- **Blue Light Filter:** Reduz luz azul

#### 6. **Busca no Texto**
```typescript
const [searchTerm, setSearchTerm] = useState('')
const [searchResults, setSearchResults] = useState<number[]>([])

const searchInText = (term: string) => {
  const results: number[] = []
  extractedText.forEach((page, index) => {
    if (page.toLowerCase().includes(term.toLowerCase())) {
      results.push(index + 1)
    }
  })
  setSearchResults(results)
}
```

#### 7. **Notas e Highlights**
- Permitir selecionar texto
- Adicionar nota/comentário
- Salvar no banco
- Visualizar highlights em outra página

#### 8. **Estatísticas de Leitura**
- Tempo de leitura por sessão
- Páginas lidas por dia
- Velocidade de leitura (palavras/min)
- Progresso por curso

#### 9. **Sincronização de Posição**
- Salvar última página lida
- Retomar de onde parou
- Sincronizar entre dispositivos

#### 10. **Controles de Acessibilidade**
- Atalhos de teclado (← → para navegar)
- Suporte a leitores de tela
- Alto contraste
- Modo dislexia (fonte OpenDyslexic)

#### 11. **Preview de Páginas**
- Thumbnail das próximas/anteriores
- Jump to page
- Índice navegável

#### 12. **Exportação e Compartilhamento**
- Exportar notas em PDF/TXT
- Compartilhar highlights
- Gerar citações formatadas (ABNT, APA)

---

### ADMIN - 8 Melhorias

#### 1. **Dashboard com Métricas Reais**
Atualmente mostra "0" para usuários ativos. Implementar:
```typescript
const [stats, setStats] = useState({
  totalUsers: 0,
  activeUsers: 0,
  totalCourses: 0,
  totalReadingMinutes: 0,
  weeklyActiveUsers: 0,
  coursesCompleted: 0
})

useEffect(() => {
  const fetchStats = async () => {
    const { data: users } = await supabase
      .from('users')
      .select('status, total_reading_minutes, courses_completed')

    setStats({
      totalUsers: users.length,
      activeUsers: users.filter(u => u.status === 'active').length,
      // ... etc
    })
  }
  fetchStats()
}, [])
```

#### 2. **Logs de Atividade**
- Criar tabela `activity_logs`
- Registrar: logins, cursos iniciados, PDFs lidos, etc.
- Exibir timeline no admin

#### 3. **Relatórios Exportáveis**
- Relatório de usuários (CSV/Excel)
- Relatório de cursos (PDF)
- Estatísticas de engajamento (gráficos)

#### 4. **Gerenciamento em Massa**
- Selecionar múltiplos usuários
- Ações em lote: ativar/desativar, alterar role
- Filtros avançados

#### 5. **Aprovação de Cadastros**
- Se o sistema exigir aprovação manual
- Fila de aprovação
- Notificar usuário por email

#### 6. **Auditoria de Mudanças**
- Registrar quem editou o quê e quando
- Histórico de versões de cursos
- Recuperar versões antigas

#### 7. **Permissões Granulares**
- Moderadores só podem editar, não deletar
- Permissões por módulo
- Roles customizáveis

#### 8. **Preview Antes de Publicar**
- Ver como curso aparece para alunos
- Modo preview sem publicar
- Validação antes de salvar

---

### AUTENTICAÇÃO - 10 Melhorias

#### 1. **Login Social**
```typescript
// Google
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
})

// Facebook
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'facebook',
})
```

#### 2. **2FA (Autenticação de Dois Fatores)**
- Via email
- Via SMS
- Via app autenticador (Google Authenticator)

#### 3. **Sessões Múltiplas**
- Ver dispositivos logados
- Deslogar de outros dispositivos
- Notificar login em novo dispositivo

#### 4. **Política de Senhas**
- Mínimo 8 caracteres
- Letra maiúscula + minúscula + número + símbolo
- Não permitir senhas comuns
- Força da senha em tempo real

#### 5. **Bloqueio Temporário**
- Após 5 tentativas falhas
- Bloqueio por 15 minutos
- CAPTCHA após 3 tentativas

#### 6. **Email de Confirmação**
- Enviar email ao criar conta
- Bloquear até confirmar
- Reenviar email de confirmação

#### 7. **Verificação de Email em Mudança**
- Confirmar novo email antes de alterar
- Notificar email antigo

#### 8. **Token de API**
- Permitir usuários gerarem tokens
- Para integrações externas
- Com permissões limitadas

#### 9. **SSO (Single Sign-On)**
- Para empresas/igrejas
- Integração com LDAP/Active Directory
- SAML 2.0

#### 10. **Logs de Segurança**
- Registrar tentativas de login
- IPs, devices, localização
- Alertar atividade suspeita

---

### CATEGORIAS - 5 Funcionalidades

#### 1. **CRUD Completo**
```typescript
// app/admin/categories/page.tsx
- Listar categorias
- Criar nova categoria
- Editar categoria
- Deletar categoria (se sem cursos associados)
- Reordenar categorias (drag-and-drop)
```

#### 2. **Ícones e Cores**
- Biblioteca de ícones (Lucide)
- Picker de cores
- Preview em tempo real

#### 3. **Hierarquia de Categorias**
```sql
-- Adicionar parent_id
ALTER TABLE categories
ADD COLUMN parent_id UUID REFERENCES categories(id);

-- Permitir subcategorias
- Novo Testamento
  - Evangelhos
  - Epístolas Paulinas
  - Epístolas Gerais
```

#### 4. **Filtros na Home**
- Filtrar cursos por categoria
- Múltiplas categorias selecionadas
- Badge visual com cor da categoria

#### 5. **Estatísticas por Categoria**
- Cursos por categoria
- Usuários que acessam cada categoria
- Tempo médio de leitura

---

## 📁 ESTRUTURA DE ARQUIVOS SUGERIDA

### Criar:
```
app/
├── admin/
│   ├── categories/
│   │   ├── page.tsx (lista)
│   │   ├── new/page.tsx (criar)
│   │   └── [id]/page.tsx (editar)
│   ├── courses/
│   │   └── new/page.tsx (FALTANDO!)
│   ├── reports/
│   │   └── page.tsx (relatórios)
│   └── logs/
│       └── page.tsx (atividades)
├── reset-password/
│   └── page.tsx (FALTANDO!)
└── auth/
    └── callback/
        └── route.ts (FALTANDO!)

lib/
├── pdf-extractor.ts (CRIAR)
├── validators.ts (CRIAR)
└── email-templates.ts (CRIAR)

components/
├── category-picker.tsx (CRIAR)
├── text-highlighter.tsx (CRIAR)
└── reading-stats.tsx (CRIAR)
```

---

## 🛠️ PLANO DE IMPLEMENTAÇÃO

### Fase 1: Crítico (1-2 semanas)
1. ✅ Corrigir hardcoded anon keys
2. ✅ Implementar autenticação real (não mock)
3. ✅ Criar sistema de categorias
4. ✅ Recuperação de senha funcional
5. ✅ Modo Kindle ler texto real do banco

### Fase 2: Alta Prioridade (2-3 semanas)
1. CRUD completo de cursos (create/delete)
2. Edição de usuários funcional
3. Extração de texto de PDF
4. Marcadores persistentes
5. Upload de arquivos testado

### Fase 3: Melhorias (3-4 semanas)
1. Dashboard com métricas reais
2. Busca no texto
3. Notas e highlights
4. Estatísticas de leitura
5. Temas adicionais de leitura

### Fase 4: Avançado (4-6 semanas)
1. Login social
2. 2FA
3. Hierarquia de categorias
4. Relatórios exportáveis
5. Permissões granulares

---

## 📊 TESTES NECESSÁRIOS

### Checklist de Testes

#### Autenticação
- [ ] Criar conta
- [ ] Login com email/senha
- [ ] Logout
- [ ] Esqueci minha senha
- [ ] Reset de senha via email
- [ ] Magic link
- [ ] Sessão expirada
- [ ] Tentativas de login falhas

#### Admin - Cursos
- [ ] Listar cursos
- [ ] Criar novo curso
- [ ] Editar curso existente
- [ ] Deletar curso
- [ ] Upload de capa
- [ ] Adicionar PDF
- [ ] Editar PDF
- [ ] Deletar PDF
- [ ] Reordenar PDFs
- [ ] Duplicar PDF
- [ ] Configurar texto Kindle

#### Admin - Usuários
- [ ] Listar usuários
- [ ] Filtrar por role/status
- [ ] Buscar usuário
- [ ] Editar usuário
- [ ] Deletar usuário
- [ ] Alterar permissões

#### Modo Kindle
- [ ] Navegar páginas
- [ ] Mudar temperatura
- [ ] Ajustar font size
- [ ] Auto-scroll
- [ ] Adicionar marcador
- [ ] Ver marcadores
- [ ] Buscar texto
- [ ] Compartilhar

#### Perfil
- [ ] Visualizar perfil
- [ ] Editar informações
- [ ] Alterar senha
- [ ] Upload de avatar
- [ ] Salvar preferências
- [ ] Configurar notificações

---

## 🚀 PRÓXIMOS PASSOS IMEDIATOS

### Para Você Executar AGORA:

1. **Corrigir hardcoded keys:**
```bash
# Buscar todas as ocorrências
grep -r "eyJhbGci" app/
# Substituir por uso apenas do .env
```

2. **Testar autenticação:**
```bash
npm run dev
# Tentar criar conta real
# Tentar fazer login
# Verificar se sessão persiste
```

3. **Executar migration de categorias:**
```sql
-- Execute no Supabase SQL Editor
-- Criar arquivo: supabase-categories-migration.sql
```

4. **Testar upload de arquivos:**
```bash
# Criar usuário admin
# Fazer upload de imagem de capa
# Fazer upload de PDF
# Verificar Supabase Storage
```

5. **Revisar modo Kindle:**
```typescript
// Testar com PDF real que tem text_content
// Verificar se mostra texto correto
// Navegar entre páginas
```

---

## 📈 MÉTRICAS DE SUCESSO

Após implementar todas as correções:

- ✅ 0 erros críticos de autenticação
- ✅ 100% das funcionalidades admin funcionando
- ✅ Modo Kindle mostrando texto real
- ✅ Upload de arquivos funcionando
- ✅ Categorias criadas e filtrando
- ✅ Recovery de senha funcionando
- ✅ Perfil salvando corretamente

---

**FIM DA AUDITORIA**

Total de problemas identificados: **27**
Total de melhorias sugeridas: **52**
Tempo estimado de implementação completa: **6-8 semanas**

---

**Priorize a Fase 1 (Crítico) para ter um sistema funcional!**
