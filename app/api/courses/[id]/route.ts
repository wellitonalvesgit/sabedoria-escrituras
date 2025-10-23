import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, supabase } from '@/lib/supabase'

// GET /api/courses/[id] - Buscar curso específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('API: Buscando curso com ID:', params.id)
    
    // Usar admin se disponível, senão usar cliente público
    const client = supabaseAdmin || supabase
    
    if (!client) {
      console.error('API: Supabase client not configured')
      throw new Error('Supabase client not configured')
    }
    
    const { id } = params
    console.log('API: ID extraído dos params:', id)

    const { data: course, error } = await client
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
      .eq('id', id)
      .single()

    if (error) {
      console.error('API: Erro ao buscar curso:', error)
      return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 })
    }

    console.log('API: Curso encontrado:', course)
    return NextResponse.json({ course })
  } catch (error) {
    console.error('API: Erro na API de busca de curso:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// PUT /api/courses/[id] - Atualizar curso
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Usar admin se disponível, senão usar cliente público
    const client = supabaseAdmin || supabase
    
    if (!client) {
      throw new Error('Supabase client not configured')
    }
    const { id } = params
    const body = await request.json()
    
    const { title, description, author, category, pages, reading_time_minutes, cover_url, status, pdfs } = body

    // Atualizar curso
    const { data: course, error: courseError } = await client
      .from('courses')
      .update({
        title,
        description,
        author,
        category,
        pages,
        reading_time_minutes,
        cover_url,
        status
      })
      .eq('id', id)
      .select()
      .single()

    if (courseError) {
      console.error('Erro ao atualizar curso:', courseError)
      return NextResponse.json({ error: 'Erro ao atualizar curso' }, { status: 500 })
    }

    // Se PDFs foram fornecidos, atualizar
    if (pdfs) {
      // Primeiro, remover PDFs existentes
      await client
        .from('course_pdfs')
        .delete()
        .eq('course_id', id)

      // Inserir novos PDFs
      if (pdfs.length > 0) {
        const pdfsToInsert = pdfs.map((pdf: any, index: number) => ({
          course_id: id,
          volume: pdf.volume,
          title: pdf.title,
          url: pdf.url,
          pages: pdf.pages,
          reading_time_minutes: pdf.reading_time_minutes,
          text_content: pdf.text_content || null,
          use_auto_conversion: pdf.use_auto_conversion !== false,
          display_order: index
        }))

        const { error: pdfsError } = await client
          .from('course_pdfs')
          .insert(pdfsToInsert)

        if (pdfsError) {
          console.error('Erro ao atualizar PDFs:', pdfsError)
        }
      }
    }

    return NextResponse.json({ course })
  } catch (error) {
    console.error('Erro na API de atualização de curso:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// DELETE /api/courses/[id] - Deletar curso
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Usar admin se disponível, senão usar cliente público
    const client = supabaseAdmin || supabase
    
    if (!client) {
      throw new Error('Supabase client not configured')
    }
    const { id } = params

    // Deletar curso (PDFs serão deletados automaticamente por CASCADE)
    const { error } = await client
      .from('courses')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao deletar curso:', error)
      return NextResponse.json({ error: 'Erro ao deletar curso' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Curso deletado com sucesso' })
  } catch (error) {
    console.error('Erro na API de exclusão de curso:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

