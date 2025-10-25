import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// PUT /api/summaries/[id] - Atualizar resumo
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const body = await request.json()
    const { title, content, highlight_ids } = body

    // Atualizar apenas se o resumo pertence ao usuário (RLS vai garantir isso)
    const { data: summary, error } = await supabase
      .from('summaries')
      .update({
        title,
        content,
        highlight_ids
        // updated_at será atualizado automaticamente pelo trigger
      })
      .eq('id', id)
      .eq('user_id', user.id) // Garantir que apenas o dono pode atualizar
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

    const { id } = await params

    // Deletar apenas se o resumo pertence ao usuário (RLS vai garantir isso)
    const { error } = await supabase
      .from('summaries')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id) // Garantir que apenas o dono pode deletar

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
