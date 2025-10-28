# 📚 Instruções: Vincular Cursos às Categorias

**Data:** 2025-01-08  
**Sistema:** Sabedoria das Escrituras

---

## 🎯 **OBJETIVO**

Vincular os cursos existentes às categorias apropriadas para melhor organização no dashboard.

---

## 📊 **CATEGORIAS EXISTENTES**

As seguintes categorias já foram criadas no banco:

1. **Panorama Bíblico** (slug: `panorama-biblico`)
   - Visão geral das Escrituras

2. **Novo Testamento** (slug: `novo-testamento`)
   - Estudos do Novo Testamento

3. **Antigo Testamento** (slug: `antigo-testamento`)
   - Estudos do Antigo Testamento

4. **Parábolas** (slug: `parabolas`)
   - Parábolas de Jesus

5. **Epístolas** (slug: `epistolas`)
   - Cartas Apostólicas

6. **Profetas** (slug: `profetas`)
   - Livros Proféticos

7. **Salmos e Sabedoria** (slug: `salmos-sabedoria`)
   - Literatura Sapiencial

8. **Evangelhos** (slug: `evangelhos`)
   - Vida e Ministério de Jesus

---

## 🔍 **COMO O SCRIPT FUNCIONA**

O script `vincular-cursos-categorias.sql` automaticamente:

1. **Busca padrões** no título dos cursos
2. **Vincula** cursos às categorias correspondentes
3. **Evita duplicações** usando `ON CONFLICT DO NOTHING`

### 📝 **Padrões de Busca**

#### Panorama Bíblico
- `panorama`, `introdução`, `visão geral`, `bíblia completa`

#### Novo Testamento
- Livros: `romanos`, `coríntios`, `gálatas`, `efésios`, etc.
- Cartas: `carta`, `epístola`

#### Antigo Testamento
- Livros: `gênesis`, `êxodo`, `josué`, `reis`, `crônicas`, etc.
- Pentateuco: `pentateuco`, `torah`

#### Parábolas
- Padrões: `parábola`, `semente`, `trigo`, `joio`, `tesouro`, etc.
- Específicas: `bom samaritano`, `rico e lázaro`, `10 virgens`

#### Epístolas
- `epístola aos`, `carta aos`, `cartas paulinas`

#### Profetas
- Profetas maiores: `isaías`, `jeremias`, `ezequiel`, `daniel`
- Profetas menores: `oséias`, `joel`, `amos`, etc.

#### Salmos e Sabedoria
- `salmos`, `provérbios`, `eclesiastes`, `cantares`, `jó`

#### Evangelhos
- `mateus`, `marcos`, `lucas`, `joão`, `evangelho`, `jesus`, `cristo`

---

## 🚀 **COMO EXECUTAR**

### **Método 1: Via Supabase Dashboard (Recomendado)**

1. Acesse: https://app.supabase.com/project/aqvqpkmjdtzeoclndwhj/sql/new
2. Copie o conteúdo do arquivo `vincular-cursos-categorias.sql`
3. Cole no editor SQL
4. Clique em "Run" ou pressione `Ctrl+Enter`
5. Aguarde a execução

### **Método 2: Via MCP Supabase**

```typescript
// Exemplo de uso (se necessário)
```

---

## ✅ **VERIFICAÇÕES**

Após executar o script, verifique:

### 1. **Ver cursos por categoria**
```sql
SELECT 
  cat.name AS categoria,
  COUNT(cc.course_id) AS total_cursos,
  STRING_AGG(c.title, ', ') AS cursos
FROM public.categories cat
LEFT JOIN public.course_categories cc ON cat.id = cc.category_id
LEFT JOIN public.courses c ON cc.course_id = c.id
GROUP BY cat.id, cat.name
ORDER BY cat.display_order;
```

### 2. **Ver cursos sem categoria**
```sql
SELECT c.id, c.title, c.slug
FROM public.courses c
WHERE NOT EXISTS (
  SELECT 1 FROM public.course_categories cc
  WHERE cc.course_id = c.id
);
```

### 3. **Ver cursos em múltiplas categorias**
```sql
SELECT c.title, COUNT(cc.category_id) AS categorias
FROM public.courses c
JOIN public.course_categories cc ON c.id = cc.course_id
GROUP BY c.id, c.title
HAVING COUNT(cc.category_id) > 1;
```

---

## 🎨 **AJUSTES MANUAIS**

Se houver cursos que não foram vinculados automaticamente, você pode:

### **Vincular manualmente**
```sql
INSERT INTO public.course_categories (course_id, category_id)
VALUES (
  'ID_DO_CURSO',
  'ID_DA_CATEGORIA'
);
```

### **Desvincular**
```sql
DELETE FROM public.course_categories
WHERE course_id = 'ID_DO_CURSO'
  AND category_id = 'ID_DA_CATEGORIA';
```

### **Buscar IDs**
```sql
-- IDs das categorias
SELECT id, name FROM public.categories ORDER BY display_order;

-- IDs dos cursos
SELECT id, title FROM public.courses ORDER BY title;
```

---

## 📋 **PRÓXIMOS PASSOS**

Após executar o script:

1. ✅ Verificar se todos os cursos foram vinculados
2. ✅ Ajustar manualmente se necessário
3. ✅ Testar o dashboard para ver categorias organizadas
4. ✅ Verificar se os cursos aparecem corretamente

---

## 🎯 **RESULTADO ESPERADO**

No dashboard, você verá:

```
📂 Evangelhos
   📊 4 cursos
   
   [Cards dos cursos de Evangelhos]
   
════════════════════════
   
📂 Epístolas
   📊 3 cursos
   
   [Cards dos cursos de Epístolas]
```

---

**🎉 Pronto! Execute o script e seus cursos estarão organizados por categoria!**

