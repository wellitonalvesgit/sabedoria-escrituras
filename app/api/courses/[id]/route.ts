import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
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
    console.error('❌ Erro ao verificar admin:', error)
    return false
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const isAdminRequest = searchParams.get('admin') === 'true'

    // Para admin, usar supabaseAdmin e não filtrar por status
    // Para usuários normais, usar supabase e filtrar apenas published
    const client = isAdminRequest ? supabaseAdmin : supabase
    
    if (!client) {
      throw new Error('Supabase client not configured')
    }

    let query = client
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
          cover_url,
          youtube_url,
          audio_url
        ),
        course_categories (
          category_id,
          categories (
            id,
            name,
            slug,
            color
          )
        )
      `)
      .eq('id', id)
    
    // Filtrar por status apenas se não for admin
    if (!isAdminRequest) {
      query = query.eq('status', 'published')
    }
    
    const { data: course, error } = await query.single()

    if (error) {
      console.error('Erro ao buscar curso:', error)
      return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 })
    }

    if (!course) {
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
    console.log('🔐 PUT /api/courses/[id] - Iniciando verificação de admin...')
    
    // Verificar se é admin
    const adminCheck = await isAdmin(request)
    console.log('🔐 Resultado da verificação admin:', adminCheck)
    
    if (!adminCheck) {
      console.error('❌ Acesso negado: usuário não é admin')
      return NextResponse.json({ 
        error: 'Acesso negado. Você precisa ser administrador para realizar esta ação.',
        code: 'FORBIDDEN'
      }, { status: 403 })
    }
    
    console.log('✅ Admin verificado, continuando com atualização...')

    const { id } = await params
    const body = await request.json()

    const { title, description, author, category, pages, reading_time_minutes, cover_url, is_free, status } = body

    // SEMPRE usar supabaseAdmin para bypassar RLS em operações admin
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not configured')
    }

    // Buscar curso atual para verificar se título mudou (e atualizar slug se necessário)
    const { data: currentCourse } = await supabaseAdmin
      .from('courses')
      .select('title, slug')
      .eq('id', id)
      .single()

    let updateData: any = {
      title,
      description,
      author: author || null,
      category: category || null,
      pages: pages || 0,
      reading_time_minutes: reading_time_minutes || 0,
      cover_url: cover_url || null,
      is_free: is_free || false,
      status: status || 'published',
      updated_at: new Date().toISOString()
    }

    // Atualizar slug se título mudou
    if (currentCourse && title && title !== currentCourse.title) {
      // Gerar novo slug baseado no título
      const generateSlug = (text: string): string => {
        return text
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
      }

      let newSlug = generateSlug(title)
      let slugExists = true
      let counter = 1

      // Verificar se slug já existe (exceto para o curso atual)
      while (slugExists) {
        const { data: existingCourse } = await supabaseAdmin
          .from('courses')
          .select('id')
          .eq('slug', newSlug)
          .neq('id', id)
          .single()

        if (!existingCourse) {
          slugExists = false
        } else {
          newSlug = `${generateSlug(title)}-${counter}`
          counter++
        }
      }

      updateData.slug = newSlug
    }

    const { data: course, error } = await supabaseAdmin
      .from('courses')
      .update(updateData)
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

    // SEMPRE usar supabaseAdmin para bypassar RLS
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not configured')
    }

    // Deletar PDFs primeiro (cascade pode não estar configurado)
    await supabaseAdmin
      .from('course_pdfs')
      .delete()
      .eq('course_id', id)

    // Deletar categorias do curso
    await supabaseAdmin
      .from('course_categories')
      .delete()
      .eq('course_id', id)

    // Deletar curso
    const { error } = await supabaseAdmin
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