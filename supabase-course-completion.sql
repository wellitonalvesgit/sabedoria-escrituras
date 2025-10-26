-- Função para incrementar cursos concluídos
-- Execute este SQL no Supabase Dashboard

CREATE OR REPLACE FUNCTION increment_courses_completed(user_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.users 
  SET 
    courses_completed = courses_completed + 1,
    updated_at = NOW()
  WHERE id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar conclusão de curso
CREATE OR REPLACE FUNCTION check_course_completion_status(
  user_id_param UUID,
  course_id_param UUID
)
RETURNS TABLE(
  is_completed BOOLEAN,
  completion_percentage DECIMAL,
  pages_read INTEGER,
  total_pages INTEGER,
  minutes_read INTEGER,
  total_minutes INTEGER
) AS $$
DECLARE
  course_pages INTEGER;
  course_minutes INTEGER;
  user_pages INTEGER;
  user_minutes INTEGER;
  completion_pct DECIMAL;
  completed BOOLEAN;
BEGIN
  -- Buscar total de páginas e minutos do curso
  SELECT 
    COALESCE(SUM(cp.pages), 0),
    COALESCE(SUM(cp.reading_time_minutes), 0)
  INTO course_pages, course_minutes
  FROM public.course_pdfs cp
  WHERE cp.course_id = course_id_param;

  -- Buscar páginas e minutos lidos pelo usuário
  SELECT 
    COALESCE(SUM(rs.pages_read), 0),
    COALESCE(SUM(EXTRACT(EPOCH FROM (rs.ended_at - rs.started_at)) / 60), 0)
  INTO user_pages, user_minutes
  FROM public.reading_sessions rs
  WHERE rs.user_id = user_id_param 
    AND rs.course_id = course_id_param;

  -- Calcular porcentagem de conclusão
  completion_pct := CASE 
    WHEN course_pages > 0 THEN (user_pages::DECIMAL / course_pages::DECIMAL) * 100
    ELSE 0
  END;

  -- Determinar se está concluído (80% das páginas OU 80% do tempo)
  completed := (completion_pct >= 80) OR (course_minutes > 0 AND (user_minutes / course_minutes) >= 0.8);

  RETURN QUERY SELECT 
    completed,
    completion_pct,
    user_pages,
    course_pages,
    user_minutes::INTEGER,
    course_minutes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para atualizar estatísticas automaticamente
CREATE OR REPLACE FUNCTION update_user_stats_on_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o status mudou para 'completed'
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Incrementar contador de cursos concluídos
    UPDATE public.users 
    SET 
      courses_completed = courses_completed + 1,
      updated_at = NOW()
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_update_user_stats ON public.user_course_progress;
CREATE TRIGGER trigger_update_user_stats
  AFTER UPDATE ON public.user_course_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats_on_completion();

-- Política para permitir que usuários executem essas funções
CREATE POLICY "Users can execute completion functions" ON public.user_course_progress
  FOR ALL USING (auth.uid()::text = user_id::text);
