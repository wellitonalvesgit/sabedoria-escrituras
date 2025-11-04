import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_CONFIG } from '@/lib/supabase-config'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    
    // Configurar cliente admin diretamente
    const supabaseUrl = SUPABASE_CONFIG.url
    const supabaseServiceRoleKey = SUPABASE_CONFIG.serviceRoleKey
    
    const client = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    if (!client) {
      throw new Error('Supabase client not configured')
    }

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
      .eq('slug', slug)
      .eq('status', 'published')
      .single()

    if (error) {
      console.error('Erro ao buscar curso por slug:', error)
      return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ course })

  } catch (error) {
    console.error('Erro na API de curso por slug:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
