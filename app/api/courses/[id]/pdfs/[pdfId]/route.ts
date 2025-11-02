import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { supabase } from '@/lib/supabase'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { SUPABASE_CONFIG } from '@/lib/supabase-config'

// Função auxiliar para verificar se usuário é admin
async function isAdmin(request: NextRequest): Promise<boolean> {
  try {
    // 1) Tentar via Authorization header (Bearer token) — funciona melhor no App Router
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const anonClient = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false, autoRefreshToken: false }
      })

      const { data: userResp } = await anonClient.auth.getUser()
      const userId = userResp?.user?.id
      if (!userId) return false

      const client = supabaseAdmin || anonClient
      const { data: userData } = await client
        .from('users')
        .select('role')
        .eq('id', userId)
        .single()

      if (userData?.role === 'admin') return true
    }

    // 2) Fallback para cookies (quando sessão está em cookies HTTP)
    const cookieStore = await cookies()
    const cookieClient = createServerClient(
      SUPABASE_CONFIG.url,
      SUPABASE_CONFIG.serviceRoleKey,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) },
        },
      }
    )
    const { data: { session } } = await cookieClient.auth.getSession()
    if (!session) return false

    const { data: userData } = await (supabaseAdmin || cookieClient)
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    return userData?.role === 'admin'
  } catch {
    return false
  }
}

// PUT /api/courses/[id]/pdfs/[pdfId] - Atualizar PDF (apenas admins)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pdfId: string }> }
) {
  try {
    // Verificar se é admin
    if (!await isAdmin(request)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { id: courseId, pdfId } = await params
    const body = await request.json()

    const { volume, title, url, pages, reading_time_minutes, text_content, use_auto_conversion, display_order, cover_url, youtube_url } = body

    // Usar supabaseAdmin para bypassar RLS
    const client = supabaseAdmin || supabase

    const updateData: any = {
      volume,
      title,
      url,
      pages,
      reading_time_minutes,
      text_content: text_content || null,
      use_auto_conversion: use_auto_conversion !== false,
      cover_url: cover_url || null,
      youtube_url: youtube_url ?? undefined
    }

    // Só atualizar display_order se foi fornecido
    if (typeof display_order === 'number') {
      updateData.display_order = display_order
    }

    const { data: pdf, error } = await client
      .from('course_pdfs')
      .update(updateData)
      .eq('id', pdfId)
      .eq('course_id', courseId)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar PDF:', error)
      return NextResponse.json({ error: 'Erro ao atualizar PDF: ' + error.message }, { status: 500 })
    }

    if (!pdf) {
      return NextResponse.json({ error: 'PDF não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ pdf, message: 'PDF atualizado com sucesso' })

  } catch (error) {
    console.error('Erro na API de atualização de PDF:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// DELETE /api/courses/[id]/pdfs/[pdfId] - Deletar PDF (apenas admins)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pdfId: string }> }
) {
  try {
    // Verificar se é admin
    if (!await isAdmin(request)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { id: courseId, pdfId } = await params

    // Usar supabaseAdmin para bypassar RLS
    const client = supabaseAdmin || supabase

    const { error } = await client
      .from('course_pdfs')
      .delete()
      .eq('id', pdfId)
      .eq('course_id', courseId)

    if (error) {
      console.error('Erro ao deletar PDF:', error)
      return NextResponse.json({ error: 'Erro ao deletar PDF: ' + error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'PDF deletado com sucesso' })

  } catch (error) {
    console.error('Erro na API de deleção de PDF:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
