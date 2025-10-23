import { NextResponse } from 'next/server'
import { supabaseAdmin, supabase } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('Teste: Verificando conexão com Supabase')
    
    const client = supabaseAdmin || supabase
    
    if (!client) {
      return NextResponse.json({ 
        error: 'Supabase client not configured',
        supabaseAdmin: !!supabaseAdmin,
        supabase: !!supabase
      }, { status: 500 })
    }

    // Testar busca de todos os cursos
    const { data: courses, error } = await client
      .from('courses')
      .select('id, title, slug')
      .limit(5)

    if (error) {
      console.error('Erro ao buscar cursos:', error)
      return NextResponse.json({ 
        error: 'Erro ao buscar cursos',
        details: error.message 
      }, { status: 500 })
    }

    // Testar busca de um curso específico
    if (courses && courses.length > 0) {
      const firstCourse = courses[0]
      console.log('Testando busca do curso:', firstCourse.id)
      
      const { data: course, error: courseError } = await client
        .from('courses')
        .select(`
          *,
          course_pdfs (
            id,
            volume,
            title,
            url,
            pages,
            reading_time_minutes,
            text_content,
            use_auto_conversion,
            display_order
          )
        `)
        .eq('id', firstCourse.id)
        .single()

      if (courseError) {
        console.error('Erro ao buscar curso específico:', courseError)
        return NextResponse.json({ 
          error: 'Erro ao buscar curso específico',
          details: courseError.message,
          courseId: firstCourse.id
        }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true,
        totalCourses: courses.length,
        courses: courses,
        testCourse: course,
        message: 'API funcionando corretamente'
      })
    }

    return NextResponse.json({ 
      success: true,
      courses: courses,
      message: 'Nenhum curso encontrado'
    })

  } catch (error) {
    console.error('Erro no teste da API:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
