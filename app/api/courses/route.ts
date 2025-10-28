import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { supabase } from '@/lib/supabase'

// Cache em memória para otimização de performance
let coursesCache: { data: any[], timestamp: number } | null = null
const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

// GET /api/courses - Listar todos os cursos
export async function GET(request: NextRequest) {
  try {
    // Verificar cache primeiro
    if (coursesCache && (Date.now() - coursesCache.timestamp) < CACHE_TTL) {
      return NextResponse.json({ courses: coursesCache.data }, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        }
      })
    }

    const client = supabase

    if (!client) {
      throw new Error('Supabase client not configured')
    }

    // Buscar cursos com seus PDFs e categorias
    const { data: courses, error } = await client
      .from('courses')
      .select(`
        id,
        slug,
        title,
        description,
        author,
        pages,
        reading_time_minutes,
        cover_url,
        status,
        created_at,
        updated_at,
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
          cover_url
        ),
        course_categories (
          category_id,
          categories (
            id,
            name,
            slug,
            color
          )
        )
      `)
      .eq('status', 'published')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar cursos:', error)
      
      // Fallback: retornar dados mockados se a conexão falhar
      console.log('Usando dados mockados como fallback...')
      const mockCourses = [
        {
          id: '1',
          slug: 'panorama-parabolas-jesus',
          title: 'Panorama das Parábolas de Jesus',
          description: 'Análise completa das parábolas de Jesus Cristo',
          author: 'Pr. Welliton Alves Dos Santos',
          category: 'Panorama Bíblico',
          pages: 120,
          reading_time_minutes: 180,
          cover_url: '/bible-study-books-parabolas.jpg',
          status: 'published',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          course_pdfs: [
            {
              id: '1',
              volume: 'VOL-I',
              title: 'Panorama Bíblico - Desvendando as Parábolas de Jesus - Parte 01',
              url: 'https://drive.google.com/file/d/1EbjfK--R591qRxg06HddKjr095qEZO6p/preview',
              pages: 20,
              reading_time_minutes: 30,
              text_content: null,
              use_auto_conversion: true,
              display_order: 0
            }
          ]
        }
      ]
      
      return NextResponse.json({ courses: mockCourses })
    }

    // Atualizar cache
    coursesCache = { data: courses || [], timestamp: Date.now() }

    return NextResponse.json({ courses }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      }
    })
  } catch (error) {
    console.error('Erro na API de cursos:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// Função para invalidar o cache (útil após criar/atualizar cursos)
export function invalidateCoursesCache() {
  coursesCache = null
}

// POST /api/courses - Criar novo curso
export async function POST(request: NextRequest) {
  try {
    // Usar admin se disponível, senão usar cliente público
    const client = supabaseAdmin || supabase
    
    if (!client) {
      throw new Error('Supabase client not configured')
    }
    const body = await request.json()
    
    const { title, description, author, category, pages, reading_time_minutes, cover_url, pdfs } = body

    // Inserir curso
    const { data: course, error: courseError } = await client
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

      const { error: pdfsError } = await client
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

