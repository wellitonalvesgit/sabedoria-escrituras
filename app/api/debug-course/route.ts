import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('=== DEBUG COURSE API ===')
    console.log('SupabaseAdmin disponível:', !!supabaseAdmin)
    console.log('Supabase disponível:', !!supabase)
    
    const client = supabaseAdmin || supabase
    
    if (!client) {
      return NextResponse.json({ 
        error: 'Nenhum cliente Supabase disponível',
        supabaseAdmin: !!supabaseAdmin,
        supabase: !!supabase
      }, { status: 500 })
    }

    console.log('Usando cliente:', supabaseAdmin ? 'Admin' : 'Público')

    // Teste 1: Buscar todos os cursos
    console.log('Teste 1: Buscando todos os cursos...')
    const { data: allCourses, error: allCoursesError } = await client
      .from('courses')
      .select('id, title, slug')
      .limit(3)

    if (allCoursesError) {
      console.error('Erro ao buscar todos os cursos:', allCoursesError)
      return NextResponse.json({ 
        error: 'Erro ao buscar cursos',
        details: allCoursesError.message,
        code: allCoursesError.code
      }, { status: 500 })
    }

    console.log('Cursos encontrados:', allCourses?.length || 0)

    // Teste 2: Buscar curso específico
    if (allCourses && allCourses.length > 0) {
      const testCourseId = allCourses[0].id
      console.log('Teste 2: Buscando curso específico:', testCourseId)
      
      const { data: specificCourse, error: specificError } = await client
        .from('courses')
        .select('*')
        .eq('id', testCourseId)
        .single()

      if (specificError) {
        console.error('Erro ao buscar curso específico:', specificError)
        return NextResponse.json({ 
          error: 'Erro ao buscar curso específico',
          details: specificError.message,
          code: specificError.code,
          courseId: testCourseId
        }, { status: 500 })
      }

      console.log('Curso específico encontrado:', !!specificCourse)

      // Teste 3: Buscar com PDFs
      console.log('Teste 3: Buscando curso com PDFs...')
      const { data: courseWithPDFs, error: pdfsError } = await client
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
        .eq('id', testCourseId)
        .single()

      if (pdfsError) {
        console.error('Erro ao buscar curso com PDFs:', pdfsError)
        return NextResponse.json({ 
          error: 'Erro ao buscar curso com PDFs',
          details: pdfsError.message,
          code: pdfsError.code,
          courseId: testCourseId
        }, { status: 500 })
      }

      console.log('Curso com PDFs encontrado:', !!courseWithPDFs)
      console.log('PDFs encontrados:', courseWithPDFs?.course_pdfs?.length || 0)

      return NextResponse.json({ 
        success: true,
        tests: {
          allCourses: allCourses?.length || 0,
          specificCourse: !!specificCourse,
          courseWithPDFs: !!courseWithPDFs,
          pdfsCount: courseWithPDFs?.course_pdfs?.length || 0
        },
        data: {
          allCourses: allCourses,
          specificCourse: specificCourse,
          courseWithPDFs: courseWithPDFs
        },
        message: 'Todos os testes passaram'
      })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Nenhum curso encontrado para teste',
      allCourses: allCourses
    })

  } catch (error) {
    console.error('Erro no debug da API:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
