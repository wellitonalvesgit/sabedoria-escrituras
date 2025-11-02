import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    console.log('API: Buscando curso com ID:', id)
    
    if (!id) {
      return NextResponse.json({ error: 'ID do curso é obrigatório' }, { status: 400 })
    }
    
    // Usar admin se disponível, senão usar cliente público
    const client = supabaseAdmin || supabase
    
    if (!client) {
      console.error('API: Supabase client not configured')
      throw new Error('Supabase client not configured')
    }
    
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
          display_order,
          cover_url,
          youtube_url
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
