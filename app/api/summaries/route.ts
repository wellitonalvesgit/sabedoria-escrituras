import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { SUPABASE_CONFIG } from '@/lib/supabase-config'

// GET /api/summaries - Listar resumos do usuário autenticado
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()

    // ANON_KEY apenas para autenticação
    const supabaseAnon = createServerClient(
      SUPABASE_CONFIG.url,
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
      SUPABASE_CONFIG.url,
      SUPABASE_CONFIG.serviceRoleKey,
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
      .from('summaries')
      .select(`
        *,
        courses (
          id,
          title,
          slug
        ),
        course_pdfs (
          id,
          title,
          volume
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (courseId) {
      query = query.eq('course_id', courseId)
    }

    if (pdfId) {
      query = query.eq('pdf_id', pdfId)
    }

    const { data: summaries, error } = await query

    if (error) {
      console.error('Erro ao buscar resumos:', error)
      return NextResponse.json({ error: 'Erro ao buscar resumos' }, { status: 500 })
    }

    return NextResponse.json({ summaries })
  } catch (error) {
    console.error('Erro na API de resumos:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// POST /api/summaries - Criar novo resumo
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()

    // ANON_KEY apenas para autenticação
    const supabaseAnon = createServerClient(
      SUPABASE_CONFIG.url,
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
      SUPABASE_CONFIG.url,
      SUPABASE_CONFIG.serviceRoleKey,
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
      title,
      content,
      highlight_ids = []
    } = body

    // Validar campos obrigatórios
    if (!course_id || !pdf_id || !title || !content) {
      return NextResponse.json({
        error: 'Campos obrigatórios faltando: course_id, pdf_id, title, content'
      }, { status: 400 })
    }

    const { data: summary, error } = await supabase
      .from('summaries')
      .insert({
        user_id: user.id,
        course_id,
        pdf_id,
        title,
        content,
        highlight_ids
      })
      .select(`
        *,
        courses (
          id,
          title,
          slug
        ),
        course_pdfs (
          id,
          title,
          volume
        )
      `)
      .single()

    if (error) {
      console.error('Erro ao criar resumo:', error)
      return NextResponse.json({ error: 'Erro ao criar resumo' }, { status: 500 })
    }

    return NextResponse.json({ summary }, { status: 201 })
  } catch (error) {
    console.error('Erro na API de criação de resumo:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
