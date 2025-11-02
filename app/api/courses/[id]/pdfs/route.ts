import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { supabase } from '@/lib/supabase'
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

// POST /api/courses/[id]/pdfs - Adicionar PDF a um curso (apenas admins)
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verificar se é admin
    if (!await isAdmin(request)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { id: courseId } = await params
    const body = await request.json()

    const { volume, title, url, pages, reading_time_minutes, text_content, use_auto_conversion, cover_url } = body

    // Usar supabaseAdmin para bypassar RLS
    const client = supabaseAdmin || supabase

    // Verificar se curso existe
    const { data: course } = await client
      .from('courses')
      .select('id')
      .eq('id', courseId)
      .single()

    if (!course) {
      return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 })
    }

    // Buscar o maior display_order atual
    const { data: pdfs } = await client
      .from('course_pdfs')
      .select('display_order')
      .eq('course_id', courseId)
      .order('display_order', { ascending: false })
      .limit(1)

    const nextOrder = pdfs && pdfs.length > 0 ? (pdfs[0].display_order + 1) : 0

    // Inserir PDF
    const { data: pdf, error } = await client
      .from('course_pdfs')
      .insert({
        course_id: courseId,
        volume,
        title,
        url,
        pages,
        reading_time_minutes,
        text_content: text_content || null,
        use_auto_conversion: use_auto_conversion !== false,
        display_order: nextOrder,
        cover_url: cover_url || null
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao adicionar PDF:', error)
      return NextResponse.json({ error: 'Erro ao adicionar PDF: ' + error.message }, { status: 500 })
    }

    return NextResponse.json({ pdf, message: 'PDF adicionado com sucesso' }, { status: 201 })

  } catch (error) {
    console.error('Erro na API de adição de PDF:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
