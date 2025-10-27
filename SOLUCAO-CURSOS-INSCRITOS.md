# 🔧 Problema Resolvido: Cursos Liberados vs Cursos Inscritos

## ❌ Problema Identificado

O usuário `geisonhoehr.ai@gmail.com` tinha **22 cursos liberados** no array `allowed_courses`, mas na página de usuários aparecia **"0 inscritos"** e **"0 concluídos"**.

### Causa Raiz
- **`allowed_courses`**: Array com IDs dos cursos que o usuário **pode** acessar (permissões)
- **`courses_enrolled`**: Campo numérico que deveria mostrar quantos cursos o usuário **está** inscrito
- **Inconsistência**: Os campos não estavam sincronizados

## ✅ Solução Implementada

### 1. **Sincronização Imediata**
```sql
-- Atualizar todos os usuários existentes
UPDATE users 
SET 
  courses_enrolled = CASE 
    WHEN allowed_courses IS NULL OR array_length(allowed_courses, 1) IS NULL THEN 0
    ELSE array_length(allowed_courses, 1)
  END,
  updated_at = NOW()
WHERE allowed_courses IS NOT NULL;
```

### 2. **Trigger Automático**
```sql
-- Função para sincronizar automaticamente
CREATE OR REPLACE FUNCTION sync_courses_enrolled()
RETURNS TRIGGER AS $$
BEGIN
  NEW.courses_enrolled = CASE 
    WHEN NEW.allowed_courses IS NULL OR array_length(NEW.allowed_courses, 1) IS NULL THEN 0
    ELSE array_length(NEW.allowed_courses, 1)
  END;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para executar automaticamente
CREATE TRIGGER trigger_sync_courses_enrolled
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION sync_courses_enrolled();
```

## 🎯 Resultado

### Antes:
- **Cursos Liberados**: 22 cursos no array `allowed_courses`
- **Cursos Inscritos**: 0 (campo `courses_enrolled`)
- **Página de Usuários**: Mostrava "0 inscritos"

### Depois:
- **Cursos Liberados**: 22 cursos no array `allowed_courses`
- **Cursos Inscritos**: 22 (campo `courses_enrolled` sincronizado)
- **Página de Usuários**: Mostra "22 inscritos" ✅

## 🔄 Funcionamento Automático

Agora, sempre que um curso for:
- **Adicionado** ao array `allowed_courses` → `courses_enrolled` aumenta automaticamente
- **Removido** do array `allowed_courses` → `courses_enrolled` diminui automaticamente
- **Array limpo** → `courses_enrolled` volta para 0

## 📊 Verificação

```sql
-- Verificar status atual
SELECT 
  email,
  array_length(allowed_courses, 1) as allowed_courses_count,
  courses_enrolled,
  courses_completed
FROM users 
WHERE email = 'geisonhoehr.ai@gmail.com';
```

**Resultado:**
- `allowed_courses_count`: 22
- `courses_enrolled`: 22 ✅
- `courses_completed`: 0 (correto, pois não há progresso registrado)

## 🚀 Benefícios

1. **Consistência**: Dados sempre sincronizados
2. **Automático**: Não precisa de intervenção manual
3. **Tempo Real**: Atualizações instantâneas
4. **Confiável**: Trigger garante integridade dos dados

## 📝 Arquivos Criados

- `fix-courses-enrolled-sync.sql` - Script completo da solução
- Trigger automático no banco de dados
- Função de sincronização

---

**✅ Problema resolvido! O usuário agora mostra corretamente "22 inscritos" na página de usuários.**
