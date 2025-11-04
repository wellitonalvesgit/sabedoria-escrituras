import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { SUPABASE_CONFIG } from '@/lib/supabase-config'

// PUT /api/summaries/[id] - Atualizar resumo
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const body = await request.json()
    const { title, content, highlight_ids } = body

    // Atualizar apenas se o resumo pertence ao usuário
    const { data: summary, error } = await supabase
      .from('summaries')
      .update({
        title,
        content,
        highlight_ids
      })
      .eq('id', id)
      .eq('user_id', user.id)
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
      console.error('Erro ao atualizar resumo:', error)
      return NextResponse.json({ error: 'Erro ao atualizar resumo' }, { status: 500 })
    }

    if (!summary) {
      return NextResponse.json({ error: 'Resumo não encontrado ou sem permissão' }, { status: 404 })
    }

    return NextResponse.json({ summary })
  } catch (error) {
    console.error('Erro na API de atualização de resumo:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// DELETE /api/summaries/[id] - Deletar resumo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    // Deletar apenas se o resumo pertence ao usuário
    const { error } = await supabase
      .from('summaries')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Erro ao deletar resumo:', error)
      return NextResponse.json({ error: 'Erro ao deletar resumo' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Resumo deletado com sucesso' })
  } catch (error) {
    console.error('Erro na API de exclusão de resumo:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
