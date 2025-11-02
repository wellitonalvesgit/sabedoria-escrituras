import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// GET /api/highlights - Listar marcações do usuário autenticado
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()

    // ANON_KEY apenas para autenticação
    const supabaseAnon = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // SERVICE_ROLE_KEY para operações no banco
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
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

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('course_id')
    const pdfId = searchParams.get('pdf_id')

    let query = supabase
      .from('highlights')
      .select('*')
      .eq('user_id', user.id)
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
    const cookieStore = await cookies()

    // ANON_KEY apenas para autenticação
    const supabaseAnon = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // SERVICE_ROLE_KEY para operações no banco
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
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
        user_id: user.id,
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
