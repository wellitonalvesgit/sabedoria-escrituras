import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/courses - Listar todos os cursos
export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not configured')
    }
    
    // Buscar cursos com seus PDFs
    const { data: courses, error } = await supabaseAdmin
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
      .eq('status', 'published')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar cursos:', error)
      return NextResponse.json({ error: 'Erro ao buscar cursos' }, { status: 500 })
    }

    return NextResponse.json({ courses })
  } catch (error) {
    console.error('Erro na API de cursos:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// POST /api/courses - Criar novo curso
export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not configured')
    }
    const body = await request.json()
    
    const { title, description, author, category, pages, reading_time_minutes, cover_url, pdfs } = body

    // Inserir curso
    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .insert({
        title,
        description,
        author,
        category,
        pages,
        reading_time_minutes,
        cover_url,
        status: 'published'
      })
      .select()
      .single()

    if (courseError) {
      console.error('Erro ao criar curso:', courseError)
      return NextResponse.json({ error: 'Erro ao criar curso' }, { status: 500 })
    }

    // Inserir PDFs do curso
    if (pdfs && pdfs.length > 0) {
      const pdfsToInsert = pdfs.map((pdf: any, index: number) => ({
        course_id: course.id,
        volume: pdf.volume,
        title: pdf.title,
        url: pdf.url,
        pages: pdf.pages,
        reading_time_minutes: pdf.reading_time_minutes,
        text_content: pdf.text_content || null,
        use_auto_conversion: pdf.use_auto_conversion !== false,
        display_order: index
      }))

      const { error: pdfsError } = await supabaseAdmin
        .from('course_pdfs')
        .insert(pdfsToInsert)

      if (pdfsError) {
        console.error('Erro ao inserir PDFs:', pdfsError)
        // Não falhar aqui, o curso já foi criado
      }
    }

    return NextResponse.json({ course }, { status: 201 })
  } catch (error) {
    console.error('Erro na API de criação de curso:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

