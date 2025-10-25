import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// GET /api/highlights - Listar marcações do usuário autenticado
export async function GET(request: NextRequest) {
  try {
    // Verificar variáveis de ambiente
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Variáveis de ambiente Supabase não configuradas')
      return NextResponse.json({ error: 'Configuração do servidor inválida' }, { status: 500 })
    }

    // Criar cliente Supabase com cookies para autenticação
    const cookieStore = await cookies()
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          }
        }
      }
    )

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('course_id')
    const pdfId = searchParams.get('pdf_id')

    let query = supabase
      .from('highlights')
      .select('*')
      .eq('user_id', user.id) // Filtrar apenas marcações do usuário autenticado
      .order('created_at', { ascending: false })

    if (courseId) {
      query = query.eq('course_id', courseId)
    }

    if (pdfId) {
      query = query.eq('pdf_id', pdfId)
    }

    const { data: highlights, error } = await query

    if (error) {
      console.error('Erro ao buscar marcações:', error)
      return NextResponse.json({ error: 'Erro ao buscar marcações' }, { status: 500 })
    }

    return NextResponse.json({ highlights })
  } catch (error) {
    console.error('Erro na API de marcações:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// POST /api/highlights - Criar nova marcação
export async function POST(request: NextRequest) {
  try {
    // Verificar variáveis de ambiente
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Variáveis de ambiente Supabase não configuradas')
      return NextResponse.json({ error: 'Configuração do servidor inválida' }, { status: 500 })
    }

    // Criar cliente Supabase com cookies para autenticação
    const cookieStore = await cookies()
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          }
        }
      }
    )

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const {
      course_id,
      pdf_id,
      page_number,
      text_content,
      start_position,
      end_position,
      highlight_color = 'yellow',
      note
    } = body

    // Validar campos obrigatórios
    if (!course_id || !pdf_id || !page_number || !text_content) {
      return NextResponse.json({
        error: 'Campos obrigatórios faltando: course_id, pdf_id, page_number, text_content'
      }, { status: 400 })
    }

    const { data: highlight, error } = await supabase
      .from('highlights')
      .insert({
        user_id: user.id, // Usar ID do usuário autenticado
        course_id,
        pdf_id,
        page_number,
        text_content,
        start_position,
        end_position,
        highlight_color,
        note
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar marcação:', error)
      return NextResponse.json({ error: 'Erro ao criar marcação' }, { status: 500 })
    }

    return NextResponse.json({ highlight }, { status: 201 })
  } catch (error) {
    console.error('Erro na API de criação de marcação:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
