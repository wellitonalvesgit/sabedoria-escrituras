import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { supabase } from '@/lib/supabase'

// Cache em memória para otimização de performance
let coursesCache: { data: any[], timestamp: number } | null = null
const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

// GET /api/courses - Listar todos os cursos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeAllStatus = searchParams.get('all') === 'true' || searchParams.get('admin') === 'true'
    
    // Verificar cache primeiro (apenas para cursos públicos)
    if (!includeAllStatus && coursesCache && (Date.now() - coursesCache.timestamp) < CACHE_TTL) {
      return NextResponse.json({ courses: coursesCache.data }, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        }
      })
    }

    // Para admin, usar supabaseAdmin para garantir acesso a todos os cursos
    const client = includeAllStatus ? supabaseAdmin : supabase

    if (!client) {
      throw new Error('Supabase client not configured')
    }

    // Buscar cursos com seus PDFs e categorias
    let query = client
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
          cover_url,
          youtube_url,
          audio_url
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
    
    // Filtrar por status apenas se não for admin
    if (!includeAllStatus) {
      query = query.eq('status', 'published')
    }
    
    const { data: courses, error } = await query.order('created_at', { ascending: false })

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

    // Atualizar cache apenas para cursos públicos
    if (!includeAllStatus) {
      coursesCache = { data: courses || [], timestamp: Date.now() }
    }

    return NextResponse.json({ courses }, {
      headers: {
        'Cache-Control': includeAllStatus ? 'no-cache' : 'public, s-maxage=300, stale-while-revalidate=600',
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

// Função para gerar slug a partir do título
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// POST /api/courses - Criar novo curso
export async function POST(request: NextRequest) {
  try {
    // SEMPRE usar supabaseAdmin para bypass RLS
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not configured')
    }

    const body = await request.json()

    const { title, description, author, category, pages, reading_time_minutes, cover_url, pdfs, slug, category_ids } = body

    // Validar campos obrigatórios
    if (!title || !description) {
      return NextResponse.json(
        { error: 'Título e descrição são obrigatórios' },
        { status: 400 }
      )
    }

    // Gerar slug se não fornecido
    const courseSlug = slug || generateSlug(title)

    // Verificar se slug já existe e gerar um único
    let finalSlug = courseSlug
    let slugExists = true
    let counter = 1

    while (slugExists) {
      const { data: existingCourse } = await supabaseAdmin
        .from('courses')
        .select('id')
        .eq('slug', finalSlug)
        .single()

      if (!existingCourse) {
        slugExists = false
      } else {
        finalSlug = `${courseSlug}-${counter}`
        counter++
      }
    }

    // Inserir curso usando supabaseAdmin (bypass RLS)
    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .insert({
        slug: finalSlug,
        title,
        description,
        author: author || null,
        category: category || null,
        pages: pages || 0,
        reading_time_minutes: reading_time_minutes || 0,
        cover_url: cover_url || null,
        status: 'published'
      })
      .select()
      .single()

    if (courseError) {
      console.error('Erro ao criar curso:', courseError)
      return NextResponse.json(
        { error: `Erro ao criar curso: ${courseError.message}` },
        { status: 500 }
      )
    }

    // Inserir PDFs do curso
    if (pdfs && pdfs.length > 0) {
      const pdfsToInsert = pdfs.map((pdf: any, index: number) => ({
        course_id: course.id,
        volume: pdf.volume,
        title: pdf.title,
        url: pdf.url,
        pages: pdf.pages || 0,
        reading_time_minutes: pdf.reading_time_minutes || 0,
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

    // Vincular categorias ao curso se fornecido
    if (category_ids && Array.isArray(category_ids) && category_ids.length > 0) {
      const categoryRelations = category_ids.map((categoryId: string) => ({
        course_id: course.id,
        category_id: categoryId
      }))

      const { error: categoriesError } = await supabaseAdmin
        .from('course_categories')
        .insert(categoryRelations)

      if (categoriesError) {
        console.error('Erro ao vincular categorias:', categoriesError)
        // Não falhar aqui, o curso já foi criado
      }
    }

    // Invalidar cache
    invalidateCoursesCache()

    return NextResponse.json({ course }, { status: 201 })
  } catch (error) {
    console.error('Erro na API de criação de curso:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

