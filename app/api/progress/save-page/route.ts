import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCurrentUser } from '@/lib/auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

/**
 * Salva a página atual do usuário em um curso/PDF
 * POST /api/progress/save-page
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    const { courseId, pdfId, currentPage, totalPages } = await request.json()

    if (!courseId || !currentPage) {
      return NextResponse.json({ 
        error: 'Dados obrigatórios: courseId e currentPage' 
      }, { status: 400 })
    }

    // Calcular porcentagem de progresso
    const progressPercentage = totalPages > 0 
      ? Math.min((currentPage / totalPages) * 100, 100) 
      : 0

    // Upsert no user_course_progress (criar ou atualizar)
    const { data: progressData, error: progressError } = await supabaseAdmin
      .from('user_course_progress')
      .upsert({
        user_id: user.id,
        course_id: courseId,
        last_page_read: currentPage,
        current_pdf_id: pdfId || null,
        progress_percentage: progressPercentage,
        last_activity_at: new Date().toISOString(),
        status: progressPercentage >= 80 ? 'completed' : 'in_progress'
      }, {
        onConflict: 'user_id,course_id'
      })
      .select()

    if (progressError) {
      console.error('Erro ao salvar progresso:', progressError)
      return NextResponse.json({ 
        error: 'Erro ao salvar progresso da página' 
      }, { status: 500 })
    }

    console.log(`✅ Progresso salvo: Usuário ${user.id}, Curso ${courseId}, Página ${currentPage}`)

    return NextResponse.json({ 
      success: true,
      message: 'Página atual salva com sucesso',
      data: {
        courseId,
        pdfId,
        currentPage,
        progressPercentage: Math.round(progressPercentage * 100) / 100
      }
    })

  } catch (error) {
    console.error('Erro na API de salvar página:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}

/**
 * Busca a última página lida do usuário em um curso
 * GET /api/progress/save-page?courseId=xxx&pdfId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    const pdfId = searchParams.get('pdfId')

    if (!courseId) {
      return NextResponse.json({ 
        error: 'courseId é obrigatório' 
      }, { status: 400 })
    }

    // Buscar progresso do usuário no curso
    const { data: progress, error } = await supabaseAdmin
      .from('user_course_progress')
      .select('last_page_read, current_pdf_id, progress_percentage, status')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('Erro ao buscar progresso:', error)
      return NextResponse.json({ 
        error: 'Erro ao buscar progresso' 
      }, { status: 500 })
    }

    // Se não há progresso, retornar página 1
    if (!progress) {
      return NextResponse.json({
        success: true,
        data: {
          currentPage: 1,
          pdfId: pdfId || null,
          progressPercentage: 0,
          status: 'not_started'
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        currentPage: progress.last_page_read || 1,
        pdfId: progress.current_pdf_id || pdfId || null,
        progressPercentage: progress.progress_percentage || 0,
        status: progress.status || 'in_progress'
      }
    })

  } catch (error) {
    console.error('Erro na API de buscar página:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}
