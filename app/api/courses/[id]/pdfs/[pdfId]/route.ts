import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { SUPABASE_CONFIG } from '@/lib/supabase-config'

// Função auxiliar para verificar se usuário é admin
async function isAdmin(request: NextRequest): Promise<boolean> {
  try {
    const cookieStore = await cookies()

    // Primeiro verificar sessão com ANON_KEY
    const supabaseAnon = createServerClient(
      SUPABASE_CONFIG.url,
      SUPABASE_CONFIG.anonKey,
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

    const { data: { user }, error: userError } = await supabaseAnon.auth.getUser()
    
    if (userError) {
      console.error('❌ Erro ao obter usuário:', userError)
      return false
    }
    
    if (!user) {
      console.log('⚠️ Usuário não autenticado')
      return false
    }

    console.log('👤 Usuário autenticado:', user.id)

    // Depois verificar role usando SERVICE_ROLE_KEY para bypass RLS
    const adminClient = createClient(
      SUPABASE_CONFIG.url,
      SUPABASE_CONFIG.serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { data: userData, error: roleError } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (roleError) {
      console.error('❌ Erro ao verificar role:', roleError)
      return false
    }
    
    if (!userData) {
      console.log('⚠️ Dados do usuário não encontrados')
      return false
    }

    console.log('🔑 Role do usuário:', userData.role)
    const isAdminUser = userData.role === 'admin'
    console.log(isAdminUser ? '✅ Usuário é admin' : '❌ Usuário NÃO é admin')
    
    return isAdminUser
  } catch (error) {
    console.error('Erro ao verificar admin:', error)
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

    // SEMPRE usar supabaseAdmin para bypassar RLS
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not configured')
    }

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

    const { data: pdf, error } = await supabaseAdmin
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

    // SEMPRE usar supabaseAdmin para bypassar RLS
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not configured')
    }

    const { error } = await supabaseAdmin
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
