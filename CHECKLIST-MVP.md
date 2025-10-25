# ✅ CHECKLIST MVP - Sabedoria das Escrituras

**Objetivo:** Sistema pronto para lançamento em **2-3 semanas**
**Tempo Total Estimado:** 35 horas
**Prioridade:** Corrigir gaps críticos primeiro

---

## 🔴 URGENTE - Fazer PRIMEIRO (Dia 1)

### 1. Remover Credenciais Hardcoded ⏱️ 1h
**Arquivo:** `lib/supabase.ts`

**Problema Atual:**
```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://aqvqpkmjdtzeoclndwhj.supabase.co'
```

**Solução:**
```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis Supabase não configuradas')
}
```

**Checklist:**
- [ ] Remover fallback em `lib/supabase.ts`
- [ ] Adicionar validação de variáveis obrigatórias
- [ ] Verificar se `.env.local` está configurado
- [ ] Testar build local
- [ ] Commit: "Remover credenciais hardcoded - segurança"

---

### 2. Remover Credenciais dos Scripts ⏱️ 30min
**Arquivo:** `scripts/seed-database.js`

**Problema Atual:**
```javascript
const supabaseUrl = 'https://aqvqpkmjdtzeoclndwhj.supabase.co'
const supabaseKey = 'eyJhbGc...'
```

**Solução:**
```javascript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Configure variáveis de ambiente')
}
```

**Checklist:**
- [ ] Atualizar `scripts/seed-database.js`
- [ ] Atualizar `scripts/migrate-courses-to-supabase.js`
- [ ] Documentar variáveis necessárias no README
- [ ] Testar execução dos scripts
- [ ] Commit: "Scripts usando variáveis de ambiente"

---

## 🔴 CRÍTICO - Fazer em Seguida (Dia 2-3)

### 3. Criar Página "Novo Curso" ⏱️ 3h
**Arquivo:** `app/admin/courses/new/page.tsx` (criar)

**O que precisa:**
```tsx
// Formulário com:
- Título do curso
- Descrição
- Slug (auto-gerado do título)
- Categoria
- Upload de capa
- Autor
- Tempo estimado de leitura
- Nível (iniciante/intermediário/avançado)
- Tags

// Funcionalidades:
- Validação com Zod
- Preview da capa
- Geração automática de slug
- Submit para API POST /api/courses
- Redirect para /admin/courses/[id] após criar
```

**Checklist:**
- [ ] Criar arquivo `app/admin/courses/new/page.tsx`
- [ ] Copiar estrutura de `app/admin/courses/[id]/page.tsx`
- [ ] Adaptar para modo "criação" (sem dados pré-carregados)
- [ ] Testar criação de curso completo
- [ ] Testar upload de capa
- [ ] Verificar se redireciona após criar
- [ ] Commit: "Implementar página de criação de curso"

**Referência:** Usar como base `app/admin/courses/[id]/page.tsx`

---

### 4. Completar Gerenciamento de Categorias ⏱️ 4h
**Arquivo:** `app/admin/categories/page.tsx` (completar)

**O que falta:**
```tsx
// CRUD Completo:
- [x] Listar categorias (já tem)
- [ ] Criar nova categoria
- [ ] Editar categoria
- [ ] Deletar categoria
- [ ] Ordenar categorias
- [ ] Definir categoria pai (subcategorias)
```

**Checklist:**
- [ ] Adicionar modal/form para criar categoria
- [ ] API POST /api/categories (criar se não existe)
- [ ] Adicionar botão de editar por categoria
- [ ] API PUT /api/categories/[id]
- [ ] Adicionar confirmação de deletar
- [ ] API DELETE /api/categories/[id]
- [ ] Testar fluxo completo
- [ ] Commit: "CRUD completo de categorias"

---

## 🟠 IMPORTANTE - Melhorias (Dia 4-5)

### 5. Adicionar Validações de Entrada ⏱️ 4h
**Arquivos:** Todas as APIs

**O que precisa:**
```typescript
// Em cada API:
import { z } from 'zod'

const schema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  email: z.string().email(),
  // ... outros campos
})

// Validar antes de usar:
const result = schema.safeParse(body)
if (!result.success) {
  return NextResponse.json({
    error: 'Dados inválidos',
    details: result.error.issues
  }, { status: 400 })
}
```

**APIs Prioritárias:**
- [ ] `/api/courses` (POST/PUT)
- [ ] `/api/users` (POST/PUT)
- [ ] `/api/highlights` (POST)
- [ ] `/api/summaries` (POST)
- [ ] `/api/categories` (POST/PUT)

**Checklist:**
- [ ] Instalar zod (se não tiver): `pnpm add zod`
- [ ] Criar schemas de validação em `lib/validations/`
- [ ] Adicionar validação em cada API
- [ ] Testar com dados inválidos
- [ ] Commit: "Adicionar validações Zod nas APIs"

---

### 6. Implementar Cálculo de Streak ⏱️ 2h
**Arquivo:** `app/api/gamification/route.ts`

**Lógica:**
```typescript
// Calcular streak baseado em last_active_at
function calculateStreak(lastActiveDates: Date[]): number {
  // Ordenar datas
  // Contar dias consecutivos
  // Retornar número de dias
}

// Salvar no campo user.current_streak
```

**Checklist:**
- [ ] Criar função `calculateStreak()` em `lib/utils/gamification.ts`
- [ ] Adicionar campo `current_streak` na tabela users (se não existe)
- [ ] Adicionar campo `longest_streak` para histórico
- [ ] Atualizar streak em cada login/atividade
- [ ] Mostrar streak no ranking corretamente
- [ ] Testar com diferentes cenários
- [ ] Commit: "Implementar cálculo de streak diário"

---

### 7. Salvar Campos de Perfil ⏱️ 3h
**Arquivo:** `app/settings/page.tsx` e `app/api/user/profile/route.ts`

**Campos que não salvam:**
- CPF
- Telefone
- Bio
- Data de nascimento
- Endereço

**Checklist:**
- [ ] Adicionar campos faltantes na tabela `users` (SQL)
- [ ] Atualizar schema TypeScript em `types/`
- [ ] Adicionar campos no formulário de perfil
- [ ] Atualizar API PUT `/api/user/profile`
- [ ] Testar salvamento
- [ ] Verificar se persiste após reload
- [ ] Commit: "Adicionar campos completos de perfil"

**SQL para adicionar campos:**
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS cpf TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS address JSONB;
```

---

## 🟡 TESTES E QUALIDADE (Dia 6-7)

### 8. Testes Manuais Completos ⏱️ 8h

**Fluxo de Usuário:**
- [ ] Cadastro → Confirmação de email → Login
- [ ] Completar perfil com todos os campos
- [ ] Navegar pelo dashboard
- [ ] Abrir um curso
- [ ] Ler no modo PDF
- [ ] Ler no modo Kindle
- [ ] Criar marcações (highlights)
- [ ] Adicionar notas às marcações
- [ ] Criar resumo
- [ ] Editar resumo
- [ ] Deletar resumo
- [ ] Verificar pontos e nível
- [ ] Verificar ranking
- [ ] Testar em mobile (responsive)
- [ ] Testar dark mode

**Fluxo de Admin:**
- [ ] Login como admin
- [ ] Criar novo curso
- [ ] Upload de capa
- [ ] Adicionar PDFs ao curso
- [ ] Editar curso existente
- [ ] Criar categoria
- [ ] Editar categoria
- [ ] Deletar categoria
- [ ] Visualizar estatísticas
- [ ] Gerenciar usuários
- [ ] Promover usuário a admin
- [ ] Deletar usuário

**Testes de Edge Cases:**
- [ ] Upload de arquivo muito grande
- [ ] Título de curso vazio
- [ ] Email inválido no cadastro
- [ ] Senha fraca
- [ ] Logout e tentar acessar área protegida
- [ ] Criar curso sem imagem
- [ ] Deletar curso com PDFs associados

**Bugs Encontrados:**
- [ ] Documentar todos os bugs em issues do GitHub
- [ ] Priorizar por severidade
- [ ] Corrigir bugs críticos

---

## 🚀 DEPLOY E INFRAESTRUTURA (Dia 8-9)

### 9. Configurar Ambiente de Produção ⏱️ 5h

**Vercel:**
- [ ] Criar projeto no Vercel (se não existe)
- [ ] Conectar repositório GitHub
- [ ] Configurar variáveis de ambiente:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - Outras variáveis necessárias
- [ ] Configurar domínio customizado (se tiver)
- [ ] Ativar SSL/HTTPS
- [ ] Configurar redirects (se necessário)

**Supabase:**
- [ ] Verificar se projeto está em plano adequado
- [ ] Configurar backup automático
- [ ] Revisar RLS policies
- [ ] Verificar limites de requisições
- [ ] Configurar alertas de uso

**Domínio:**
- [ ] Registrar domínio (se não tiver)
- [ ] Configurar DNS para apontar ao Vercel
- [ ] Aguardar propagação (24-48h)
- [ ] Testar acesso pelo domínio

**Monitoramento:**
- [ ] Ativar Vercel Analytics
- [ ] Configurar alertas de erro
- [ ] Configurar alertas de performance

---

### 10. Deploy Staging e Testes ⏱️ 3h

**Staging:**
- [ ] Criar branch `staging`
- [ ] Deploy no Vercel (ambiente staging)
- [ ] URL de staging: `staging.seudominio.com`
- [ ] Testar em staging com dados de teste
- [ ] Convidar 5-10 beta testers
- [ ] Coletar feedback
- [ ] Corrigir bugs encontrados

**Checklist de Staging:**
- [ ] Build passa sem erros
- [ ] Todas as páginas carregam
- [ ] Login/logout funciona
- [ ] Upload de arquivos funciona
- [ ] Gamificação atualiza
- [ ] Email de confirmação chega
- [ ] Sem erros no console

---

## 📚 DOCUMENTAÇÃO (Dia 10)

### 11. Documentação de Usuário ⏱️ 5h

**README.md:**
- [ ] Atualizar descrição do projeto
- [ ] Adicionar screenshots
- [ ] Listar features principais
- [ ] Adicionar badges (build status, etc)

**Guia de Instalação:**
- [ ] Pré-requisitos
- [ ] Configuração do .env
- [ ] Comandos de instalação
- [ ] Comandos de desenvolvimento
- [ ] Comandos de build
- [ ] Solução de problemas comuns

**FAQ para Usuários:**
- [ ] Como criar conta?
- [ ] Como resetar senha?
- [ ] Como funciona a gamificação?
- [ ] Como criar marcações?
- [ ] Como criar resumos?

**Termos Legais:**
- [ ] Termos de Uso (básico)
- [ ] Política de Privacidade (LGPD)
- [ ] Sobre cookies

---

## 🎯 LANÇAMENTO (Dia 11-12)

### 12. Deploy em Produção ⏱️ 2h

**Pré-Deploy:**
- [ ] Merge staging → main
- [ ] Tag de versão: `v1.0.0-mvp`
- [ ] Changelog atualizado

**Deploy:**
- [ ] Push para main
- [ ] Aguardar deploy automático no Vercel
- [ ] Verificar build success
- [ ] Testar URL de produção

**Pós-Deploy:**
- [ ] Fazer smoke test completo
- [ ] Verificar analytics funcionando
- [ ] Verificar logs sem erros
- [ ] Backup do banco antes do lançamento

---

### 13. Monitoramento Pós-Lançamento ⏱️ 1h/dia

**Primeiros 7 Dias:**
- [ ] Verificar logs diariamente
- [ ] Responder feedback de usuários
- [ ] Corrigir bugs urgentes
- [ ] Monitorar performance
- [ ] Monitorar uso de recursos

**Métricas para Acompanhar:**
- Usuários cadastrados
- Usuários ativos (DAU)
- Tempo médio de leitura
- Taxa de retenção D1, D7
- Cursos mais acessados
- Features mais usadas
- Bugs reportados

---

## 📊 RESUMO DO TIMELINE

### Semana 1: Correções Críticas (15h)
```
Dia 1-2: Segurança (credenciais)
Dia 2-3: Criar curso e categorias
Dia 4-5: Validações e melhorias
```

### Semana 2: Testes e Deploy (12h)
```
Dia 6-7: Testes manuais completos
Dia 8-9: Deploy staging
Dia 10: Documentação
```

### Semana 3: Lançamento (8h)
```
Dia 11: Deploy produção
Dia 12-14: Monitoramento
```

**Total:** 35 horas = **2-3 semanas** part-time

---

## ✅ CHECKLIST FINAL PRÉ-LANÇAMENTO

### Segurança
- [ ] Sem credenciais hardcoded
- [ ] Variáveis de ambiente configuradas
- [ ] HTTPS ativo
- [ ] RLS ativo no Supabase
- [ ] Validações de entrada implementadas

### Funcionalidades
- [ ] Criar curso funciona
- [ ] Editar curso funciona
- [ ] CRUD de categorias funciona
- [ ] Sistema de leitura funciona (PDF e Kindle)
- [ ] Marcações e resumos funcionam
- [ ] Gamificação atualiza corretamente
- [ ] Ranking mostra dados reais

### Performance
- [ ] Build sem erros
- [ ] Lighthouse score > 80
- [ ] Tempo de carregamento < 3s
- [ ] Responsivo em mobile

### Conteúdo
- [ ] Pelo menos 5 cursos cadastrados
- [ ] Imagens de capa de qualidade
- [ ] PDFs funcionando
- [ ] Descrições completas

### Legal
- [ ] Termos de Uso publicados
- [ ] Política de Privacidade publicada
- [ ] LGPD compliance básico

---

## 🎯 CRITÉRIO DE SUCESSO

### MVP Está Pronto Quando:
✅ Usuário consegue criar conta
✅ Usuário consegue fazer login
✅ Usuário consegue acessar cursos
✅ Usuário consegue ler conteúdo (PDF ou Kindle)
✅ Usuário consegue criar marcações
✅ Usuário consegue criar resumos
✅ Gamificação atualiza automaticamente
✅ Admin consegue criar novos cursos
✅ Admin consegue gerenciar categorias
✅ Sistema está em produção com HTTPS
✅ Sem bugs críticos conhecidos

---

## 📞 PRÓXIMOS PASSOS AMANHÃ

**Começar por aqui:**

1. **09:00 - 10:00** → Remover credenciais hardcoded
2. **10:00 - 10:30** → Remover credenciais dos scripts
3. **10:30 - 11:00** → Coffee break + git commit
4. **11:00 - 14:00** → Criar página "Novo Curso"
5. **14:00 - 15:00** → Almoço
6. **15:00 - 19:00** → Completar gerenciamento de categorias
7. **19:00** → Review do dia + commit

**Objetivo do Dia 1:** Completar 2 gaps críticos de segurança + 1 gap de funcionalidade

---

**Criado em:** 25 de Outubro de 2025
**Última atualização:** 25 de Outubro de 2025
**Responsável:** Equipe de Desenvolvimento
**Prazo:** 15 de Novembro de 2025 (3 semanas)

---

## 💡 DICAS

- ✅ **Commite frequentemente** - Pequenos commits são mais fáceis de revisar
- ✅ **Teste cada feature** - Não acumule bugs para o final
- ✅ **Peça feedback cedo** - Beta testers são valiosos
- ✅ **Documente enquanto faz** - Não deixe para depois
- ✅ **Celebre pequenas vitórias** - Cada checkbox marcado é progresso

**Lembre-se:** Shipping > Perfeição

**Bom trabalho! 🚀**
