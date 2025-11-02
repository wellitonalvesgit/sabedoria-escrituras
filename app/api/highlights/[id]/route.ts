import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// PUT /api/highlights/[id] - Atualizar marcação
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const body = await request.json()
    const { text_content, highlight_color, note } = body

    // Atualizar apenas se a marcação pertence ao usuário
    const { data: highlight, error } = await supabase
      .from('highlights')
      .update({
        text_content,
        highlight_color,
        note
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar marcação:', error)
      return NextResponse.json({ error: 'Erro ao atualizar marcação' }, { status: 500 })
    }

    if (!highlight) {
      return NextResponse.json({ error: 'Marcação não encontrada ou sem permissão' }, { status: 404 })
    }

    return NextResponse.json({ highlight })
  } catch (error) {
    console.error('Erro na API de atualização de marcação:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// DELETE /api/highlights/[id] - Deletar marcação
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    // Deletar apenas se a marcação pertence ao usuário
    const { error } = await supabase
      .from('highlights')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Erro ao deletar marcação:', error)
      return NextResponse.json({ error: 'Erro ao deletar marcação' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Marcação deletada com sucesso' })
  } catch (error) {
    console.error('Erro na API de exclusão de marcação:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
