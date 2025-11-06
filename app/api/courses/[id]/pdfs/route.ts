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

// POST /api/courses/[id]/pdfs - Adicionar PDF a um curso (apenas admins)
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verificar se é admin
    if (!await isAdmin(request)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { id: courseId } = await params
    const body = await request.json()

    const { volume, title, url, pages, reading_time_minutes, text_content, use_auto_conversion, cover_url, youtube_url, audio_url, parent_volume_id } = body

    // SEMPRE usar supabaseAdmin para bypassar RLS
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not configured')
    }

    // Verificar se curso existe
    const { data: course } = await supabaseAdmin
      .from('courses')
      .select('id')
      .eq('id', courseId)
      .single()

    if (!course) {
      return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 })
    }

    // Buscar o maior display_order atual
    const { data: pdfs } = await supabaseAdmin
      .from('course_pdfs')
      .select('display_order')
      .eq('course_id', courseId)
      .order('display_order', { ascending: false })
      .limit(1)

    const nextOrder = pdfs && pdfs.length > 0 ? (pdfs[0].display_order + 1) : 0

    // Inserir PDF
    const { data: pdf, error } = await supabaseAdmin
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
        cover_url: cover_url || null,
        youtube_url: youtube_url && youtube_url.trim() !== '' ? youtube_url : null,
        audio_url: audio_url && audio_url.trim() !== '' ? audio_url : null,
        parent_volume_id: parent_volume_id || null
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
