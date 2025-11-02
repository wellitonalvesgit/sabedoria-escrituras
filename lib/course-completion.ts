import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

interface CourseCompletionData {
  courseId: string
  courseTitle: string
  totalPages: number
  pagesRead: number
  totalMinutes: number
  minutesRead: number
  completionPercentage: number
  isCompleted: boolean
}

/**
 * Verifica se um usuário completou um curso baseado no progresso
 */
export async function checkCourseCompletion(
  userId: string, 
  courseId: string
): Promise<CourseCompletionData | null> {
  try {
    // Buscar dados do curso
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title, pages, reading_time_minutes')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      console.error('Erro ao buscar curso:', courseError)
      return null
    }

    // Buscar PDFs do curso
    const { data: pdfs, error: pdfsError } = await supabase
      .from('course_pdfs')
      .select('id, pages, reading_time_minutes')
      .eq('course_id', courseId)
      .order('display_order')

    if (pdfsError || !pdfs) {
      console.error('Erro ao buscar PDFs:', pdfsError)
      return null
    }

    // Calcular total de páginas e minutos
    const totalPages = pdfs.reduce((sum, pdf) => sum + (pdf.pages || 0), 0)
    const totalMinutes = pdfs.reduce((sum, pdf) => sum + (pdf.reading_time_minutes || 0), 0)

    // Buscar progresso do usuário
    const { data: progress, error: progressError } = await supabase
      .from('user_course_progress')
      .select('progress_percentage, total_reading_minutes, status')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single()

    if (progressError) {
      console.error('Erro ao buscar progresso:', progressError)
      return null
    }

    // Buscar sessões de leitura para calcular páginas lidas
    const { data: sessions, error: sessionsError } = await supabase
      .from('reading_sessions')
      .select('pages_read, duration_seconds')
      .eq('user_id', userId)
      .eq('course_id', courseId)

    if (sessionsError) {
      console.error('Erro ao buscar sessões:', sessionsError)
      return null
    }

    // Calcular páginas e minutos lidos
    const pagesRead = sessions.reduce((sum, session) => sum + (session.pages_read || 0), 0)
    const minutesRead = sessions.reduce((sum, session) => sum + Math.round(session.duration_seconds / 60), 0)

    // Calcular porcentagem de conclusão
    const completionPercentage = totalPages > 0 ? (pagesRead / totalPages) * 100 : 0

    // Critério de conclusão: 80% das páginas lidas OU 80% do tempo de leitura
    const isCompleted = completionPercentage >= 80 || (totalMinutes > 0 && (minutesRead / totalMinutes) >= 0.8)

    return {
      courseId,
      courseTitle: course.title,
      totalPages,
      pagesRead,
      totalMinutes,
      minutesRead,
      completionPercentage,
      isCompleted
    }

  } catch (error) {
    console.error('Erro ao verificar conclusão do curso:', error)
    return null
  }
}

/**
 * Marca um curso como concluído no banco de dados
 */
export async function markCourseAsCompleted(
  userId: string, 
  courseId: string
): Promise<boolean> {
  try {
    // Atualizar progresso do curso
    const { error: progressError } = await supabase
      .from('user_course_progress')
      .upsert({
        user_id: userId,
        course_id: courseId,
        status: 'completed',
        progress_percentage: 100,
        completed_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString()
      })

    if (progressError) {
      console.error('Erro ao atualizar progresso:', progressError)
      return false
    }

    // Atualizar estatísticas do usuário
    const { error: userError } = await supabase.rpc('increment_courses_completed', {
      user_id: userId
    })

    if (userError) {
      console.error('Erro ao atualizar estatísticas do usuário:', userError)
      // Não falha a operação, apenas loga o erro
    }

    return true

  } catch (error) {
    console.error('Erro ao marcar curso como concluído:', error)
    return false
  }
}

/**
 * Verifica se o usuário já foi parabenizado por este curso
 */
export async function hasUserBeenCongratulated(
  userId: string, 
  courseId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_course_progress')
      .select('completed_at')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('status', 'completed')
      .single()

    if (error || !data) {
      return false
    }

    // Se foi concluído há mais de 1 hora, considera que já foi parabenizado
    const completedAt = new Date(data.completed_at)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    
    return completedAt < oneHourAgo

  } catch (error) {
    console.error('Erro ao verificar se foi parabenizado:', error)
    return false
  }
}

/**
 * Gera mensagem personalizada de parabéns
 */
export function generateCongratulationsMessage(
  courseTitle: string,
  completionData: CourseCompletionData
): { title: string; message: string; emoji: string } {
  
  const { pagesRead, totalPages, minutesRead, completionPercentage } = completionData
  
  // Mensagens baseadas na porcentagem de conclusão
  if (completionPercentage >= 100) {
    return {
      title: "🎉 Parabéns! Curso Concluído!",
      message: `Você leu completamente "${courseTitle}"! ${pagesRead} páginas em ${Math.round(minutesRead)} minutos de estudo. Sua dedicação é inspiradora!`,
      emoji: "🎓"
    }
  } else if (completionPercentage >= 90) {
    return {
      title: "🌟 Quase lá!",
      message: `Você está muito próximo de concluir "${courseTitle}"! Já leu ${pagesRead} de ${totalPages} páginas (${Math.round(completionPercentage)}%). Continue assim!`,
      emoji: "📚"
    }
  } else {
    return {
      title: "🎯 Excelente Progresso!",
      message: `Parabéns pelo seu progresso em "${courseTitle}"! Você já leu ${pagesRead} de ${totalPages} páginas (${Math.round(completionPercentage)}%). Mantenha o foco!`,
      emoji: "🔥"
    }
  }
}
