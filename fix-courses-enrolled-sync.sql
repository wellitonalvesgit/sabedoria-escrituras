-- Script para sincronizar courses_enrolled com allowed_courses
-- Este script resolve o problema onde cursos liberados não aparecem como "inscritos"

-- 1. Atualizar todos os usuários existentes
UPDATE users 
SET 
  courses_enrolled = CASE 
    WHEN allowed_courses IS NULL OR array_length(allowed_courses, 1) IS NULL THEN 0
    ELSE array_length(allowed_courses, 1)
  END,
  updated_at = NOW()
WHERE allowed_courses IS NOT NULL;

-- 2. Criar função para sincronizar automaticamente
CREATE OR REPLACE FUNCTION sync_courses_enrolled()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar courses_enrolled baseado no array allowed_courses
  NEW.courses_enrolled = CASE 
    WHEN NEW.allowed_courses IS NULL OR array_length(NEW.allowed_courses, 1) IS NULL THEN 0
    ELSE array_length(NEW.allowed_courses, 1)
  END;
  
  -- Atualizar timestamp
  NEW.updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Criar trigger para executar automaticamente
DROP TRIGGER IF EXISTS trigger_sync_courses_enrolled ON users;
CREATE TRIGGER trigger_sync_courses_enrolled
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION sync_courses_enrolled();

-- 4. Verificar resultado
SELECT 
  id,
  email,
  name,
  role,
  status,
  array_length(allowed_courses, 1) as allowed_courses_count,
  courses_enrolled,
  courses_completed,
  updated_at
FROM users 
WHERE email = 'geisonhoehr.ai@gmail.com';
