# Sistema de Permissões de Acesso

Este documento explica como funciona o sistema de permissões para controlar o acesso de alunos a cursos e categorias.

## Visão Geral

O sistema possui dois níveis de controle de acesso:

1. **Categorias** - Controla acesso a grupos de cursos
2. **Cursos** - Controla acesso a cursos específicos

Cada nível tem duas listas:
- **Permitidos** (`allowed_*`) - Lista branca de acesso
- **Bloqueados** (`blocked_*`) - Lista negra de acesso

## Como Funcionam as Permissões

### 1. Regra de Prioridade

A ordem de verificação de acesso é:

```
1. Curso bloqueado? → NEGAR ACESSO
2. Curso permitido (e tem lista de permitidos)? → PERMITIR ACESSO
3. Categoria do curso bloqueada? → NEGAR ACESSO
4. Categoria do curso permitida (e tem lista de permitidas)? → PERMITIR ACESSO
5. Sem restrições? → PERMITIR ACESSO
```

**Bloqueios sempre têm prioridade sobre permissões!**

### 2. Categorias Permitidas (`allowed_categories`)

**Comportamento:**
- Se a lista estiver **vazia** → Aluno tem acesso a TODAS as categorias (exceto bloqueadas)
- Se a lista tiver itens → Aluno SOMENTE pode acessar categorias nesta lista

**Exemplo:**
```
allowed_categories: ["cat-panorama", "cat-teologia"]
blocked_categories: []

Resultado: Aluno vê SOMENTE cursos dessas 2 categorias
```

### 3. Categorias Bloqueadas (`blocked_categories`)

**Comportamento:**
- Sempre bloqueia acesso às categorias listadas
- Tem prioridade sobre `allowed_categories`

**Exemplo:**
```
allowed_categories: [] (vazio)
blocked_categories: ["cat-avancado"]

Resultado: Aluno vê TODAS as categorias EXCETO "cat-avancado"
```

### 4. Cursos Permitidos (`allowed_courses`)

**Comportamento:**
- Se a lista estiver **vazia** → Aluno tem acesso a todos os cursos (baseado em categorias)
- Se a lista tiver itens → Aluno SOMENTE pode acessar esses cursos específicos

**Exemplo:**
```
allowed_courses: ["curso-123", "curso-456"]
allowed_categories: [] (vazio)

Resultado: Aluno vê SOMENTE esses 2 cursos, independente de categoria
```

### 5. Cursos Bloqueados (`blocked_courses`)

**Comportamento:**
- Sempre bloqueia acesso aos cursos listados
- Tem prioridade sobre `allowed_courses` e categorias

**Exemplo:**
```
allowed_categories: ["cat-panorama"]
blocked_courses: ["curso-parabolas"]

Resultado: Aluno vê TODOS os cursos de "cat-panorama" EXCETO "curso-parabolas"
```

## Cenários Comuns de Uso

### Cenário 1: Acesso Total

**Objetivo:** Aluno premium com acesso a tudo

**Configuração:**
```
allowed_categories: [] (vazio)
blocked_categories: [] (vazio)
allowed_courses: [] (vazio)
blocked_courses: [] (vazio)
```

**Resultado:** Acesso a TODOS os cursos e categorias

---

### Cenário 2: Acesso a Categoria Específica

**Objetivo:** Aluno que comprou apenas "Panorama Bíblico"

**Configuração:**
```
allowed_categories: ["cat-panorama"]
blocked_categories: []
allowed_courses: []
blocked_courses: []
```

**Resultado:** Acesso a TODOS os cursos da categoria "Panorama Bíblico"

---

### Cenário 3: Bloquear Conteúdo Avançado

**Objetivo:** Aluno iniciante, sem acesso a conteúdo avançado

**Configuração:**
```
allowed_categories: []
blocked_categories: ["cat-avancado", "cat-mestrado"]
allowed_courses: []
blocked_courses: []
```

**Resultado:** Acesso a TODAS as categorias EXCETO avançado e mestrado

---

### Cenário 4: Acesso a Cursos Específicos

**Objetivo:** Aluno que comprou 3 cursos individuais

**Configuração:**
```
allowed_categories: []
blocked_categories: []
allowed_courses: ["curso-1", "curso-2", "curso-3"]
blocked_courses: []
```

**Resultado:** Acesso SOMENTE aos 3 cursos listados

---

### Cenário 5: Categoria com Exceção

**Objetivo:** Acesso a "Teologia" mas sem o curso de "Teologia Sistemática"

**Configuração:**
```
allowed_categories: ["cat-teologia"]
blocked_categories: []
allowed_courses: []
blocked_courses: ["curso-sistematica"]
```

**Resultado:** Todos os cursos de "Teologia" EXCETO "Teologia Sistemática"

---

### Cenário 6: Período de Teste (Trial)

**Objetivo:** Aluno em trial de 7 dias, com acesso limitado

**Configuração:**
```
allowed_categories: []
blocked_categories: []
allowed_courses: ["curso-intro-1", "curso-intro-2"]
blocked_courses: []
access_expires_at: "2025-11-01T23:59:59Z"
```

**Resultado:** Acesso SOMENTE aos 2 cursos introdutórios por 7 dias

## Implementação Técnica

### Estrutura do Banco de Dados

```sql
-- Tabela users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  name TEXT,
  email TEXT,
  allowed_categories TEXT[], -- Array de IDs de categorias
  blocked_categories TEXT[], -- Array de IDs de categorias
  allowed_courses TEXT[],    -- Array de IDs de cursos
  blocked_courses TEXT[],    -- Array de IDs de cursos
  access_expires_at TIMESTAMP
);

-- Tabela course_categories (relacionamento N:N)
CREATE TABLE course_categories (
  course_id UUID REFERENCES courses(id),
  category_id UUID REFERENCES categories(id),
  PRIMARY KEY (course_id, category_id)
);
```

### Lógica de Filtragem (JavaScript)

```javascript
// app/dashboard/page.tsx

const filteredCourses = courses.filter((course) => {
  // 1. Verificar se curso está bloqueado
  if (user.blocked_courses?.includes(course.id)) {
    return false
  }

  // 2. Se há lista de cursos permitidos, verificar se está nela
  if (user.allowed_courses?.length > 0) {
    return user.allowed_courses.includes(course.id)
  }

  // 3. Verificar categorias do curso
  if (course.course_categories && course.course_categories.length > 0) {
    const categoryIds = course.course_categories.map(cc => cc.category_id)

    // 3a. Verificar se alguma categoria está bloqueada
    if (user.blocked_categories?.some(bc => categoryIds.includes(bc))) {
      return false
    }

    // 3b. Se há lista de categorias permitidas, verificar se está nela
    if (user.allowed_categories?.length > 0) {
      return user.allowed_categories.some(ac => categoryIds.includes(ac))
    }
  }

  // 4. Sem restrições - permitir acesso
  return true
})
```

## Interface do Admin

### Editar Usuário

Em [/admin/users/[id]](app/admin/users/[id]/page.tsx), o admin pode:

1. **Categorias Permitidas**
   - Usa `<CategorySelector>` para selecionar visualmente
   - Mostra badges coloridos das categorias selecionadas
   - Descrição: "Se nenhuma categoria for selecionada, o aluno terá acesso a todas"

2. **Categorias Bloqueadas**
   - Mesmo componente visual
   - Descrição: "Essas categorias serão sempre bloqueadas"

3. **Cursos Permitidos**
   - Select dropdown com lista de todos os cursos
   - Mostra cursos já adicionados em cards verdes
   - Descrição: "Se nenhum curso for selecionado, o aluno terá acesso baseado em categorias"

4. **Cursos Bloqueados**
   - Select dropdown com lista de todos os cursos
   - Mostra cursos bloqueados em cards vermelhos
   - Descrição: "Sempre bloqueados, mesmo se categorias estiverem permitidas"

## Dicas Importantes

### ✅ Boas Práticas

1. **Use categorias para controle em massa**
   - Mais fácil de gerenciar
   - Escalável quando há muitos cursos

2. **Use cursos específicos para exceções**
   - Bloquear 1 curso de uma categoria permitida
   - Permitir 1 curso de uma categoria bloqueada

3. **Sempre teste as permissões**
   - Faça login como o aluno
   - Verifique se os cursos corretos aparecem

4. **Documente decisões de acesso**
   - Anote o motivo de bloqueios específicos
   - Facilita suporte e troubleshooting

### ❌ Evite

1. **Listas conflitantes**
   ```
   ❌ allowed_categories: ["cat-A"]
   ❌ allowed_courses: ["curso-da-categoria-B"]

   Neste caso, o aluno verá SOMENTE o curso específico,
   ignorando a categoria permitida
   ```

2. **Bloquear e permitir a mesma coisa**
   ```
   ❌ blocked_courses: ["curso-123"]
   ❌ allowed_courses: ["curso-123"]

   Bloqueio tem prioridade - curso será bloqueado
   ```

3. **Esquecer de configurar data de expiração**
   ```
   ✅ Sempre configure access_expires_at para acessos temporários
   ```

## Troubleshooting

### Problema: Aluno não vê nenhum curso

**Possíveis causas:**
1. `access_expires_at` já passou (acesso expirado)
2. `allowed_courses` tem IDs mas nenhum é válido
3. `allowed_categories` tem IDs mas nenhum curso tem essas categorias
4. Todos os cursos estão em `blocked_courses`

**Solução:**
- Verificar data de expiração
- Limpar `allowed_courses` e `allowed_categories`
- Verificar logs no console do navegador

---

### Problema: Aluno vê cursos que não deveria

**Possíveis causas:**
1. `blocked_courses` não foi salvo corretamente
2. Curso não tem `course_categories` associadas
3. Cache do navegador mostrando dados antigos

**Solução:**
- Verificar banco de dados se os bloqueios foram salvos
- Adicionar categorias aos cursos
- Limpar cache (Ctrl+Shift+R)

---

### Problema: Categorias não aparecem/não salvam

**Possíveis causas:**
1. Usando strings ao invés de IDs
2. Tabela `course_categories` vazia
3. RLS (Row Level Security) bloqueando

**Solução:**
- Usar `CategorySelector` que trabalha com IDs
- Executar migration: `supabase-fix-course-categories-rls.sql`
- Associar cursos a categorias em `/admin/courses/[id]`

## Roadmap Futuro

Melhorias planejadas:

- [ ] Tags/etiquetas para organizar permissões
- [ ] Templates de permissão (Iniciante, Intermediário, Avançado)
- [ ] Histórico de mudanças de permissões
- [ ] Permissões baseadas em grupos/turmas
- [ ] Dashboard de analytics de acesso
- [ ] Notificações quando acesso expira

---

**Última atualização:** 2025-01-25
**Versão do sistema:** 1.0.0
