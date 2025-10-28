import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { SUPABASE_CONFIG } from '@/lib/supabase-config'

// Função auxiliar para verificar se usuário é admin
async function isAdmin(request: NextRequest): Promise<boolean> {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      SUPABASE_CONFIG.url,
      SUPABASE_CONFIG.serviceRoleKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return false

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    return userData?.role === 'admin'
  } catch {
    return false
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const { data: course, error } = await supabase
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
          cover_url
        )
      `)
      .eq('id', id)
      .eq('status', 'published')
      .single()

    if (error) {
      console.error('Erro ao buscar curso:', error)
      return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ course })

  } catch (error) {
    console.error('Erro na API de curso:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// PUT /api/courses/[id] - Atualizar curso (apenas admins)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verificar se é admin
    if (!await isAdmin(request)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    const { title, description, author, category, pages, reading_time_minutes, cover_url, is_free, status } = body

    // Usar supabaseAdmin para bypassar RLS
    const client = supabaseAdmin || supabase

    const { data: course, error } = await client
      .from('courses')
      .update({
        title,
        description,
        author,
        category,
        pages,
        reading_time_minutes,
        cover_url,
        is_free: is_free || false,
        status: status || 'published',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar curso:', error)
      return NextResponse.json({ error: 'Erro ao atualizar curso: ' + error.message }, { status: 500 })
    }

    // Invalidar cache
    const { invalidateCoursesCache } = await import('../route')
    invalidateCoursesCache()

    return NextResponse.json({ course, message: 'Curso atualizado com sucesso' })

  } catch (error) {
    console.error('Erro na API de atualização de curso:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// DELETE /api/courses/[id] - Deletar curso (apenas admins)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verificar se é admin
    if (!await isAdmin(request)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { id } = await params

    // Usar supabaseAdmin para bypassar RLS
    const client = supabaseAdmin || supabase

    // Deletar PDFs primeiro (cascade pode não estar configurado)
    await client
      .from('course_pdfs')
      .delete()
      .eq('course_id', id)

    // Deletar categorias do curso
    await client
      .from('course_categories')
      .delete()
      .eq('course_id', id)

    // Deletar curso
    const { error } = await client
      .from('courses')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao deletar curso:', error)
      return NextResponse.json({ error: 'Erro ao deletar curso: ' + error.message }, { status: 500 })
    }

    // Invalidar cache
    const { invalidateCoursesCache } = await import('../route')
    invalidateCoursesCache()

    return NextResponse.json({ message: 'Curso deletado com sucesso' })

  } catch (error) {
    console.error('Erro na API de deleção de curso:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}