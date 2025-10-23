import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG API ===')
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('Supabase Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Present' : 'Missing')
    
    // Teste 1: Contar cursos
    const { count, error: countError } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')
    
    console.log('Count result:', { count, error: countError })
    
    // Teste 2: Buscar alguns cursos
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select(`
        id,
        title,
        status,
        category
      `)
      .eq('status', 'published')
      .limit(3)
    
    console.log('Courses result:', { courses, error: coursesError })
    
    // Teste 3: Buscar com PDFs
    const { data: coursesWithPdfs, error: pdfsError } = await supabase
      .from('courses')
      .select(`
        id,
        title,
        status,
        category,
        course_pdfs (
          id,
          volume,
          title
        )
      `)
      .eq('status', 'published')
      .limit(2)
    
    console.log('Courses with PDFs result:', { coursesWithPdfs, error: pdfsError })
    
    return NextResponse.json({
      success: true,
      environment: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      },
      tests: {
        count: { count, error: countError?.message || null },
        courses: { courses, error: coursesError?.message || null },
        coursesWithPdfs: { coursesWithPdfs, error: pdfsError?.message || null }
      }
    })
    
  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : null
    }, { status: 500 })
  }
}
