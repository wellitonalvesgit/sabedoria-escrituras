import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { SUPABASE_CONFIG } from '@/lib/supabase-config'

// Cache em memória para otimização de performance
let categoriesCache: { data: any[], timestamp: number } | null = null
const CACHE_TTL = 10 * 60 * 1000 // 10 minutos (categorias mudam raramente)

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

    if (userError || !user) {
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

    if (roleError || !userData) {
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

// GET /api/categories - Listar todas as categorias
export async function GET(request: NextRequest) {
  try {
    // Verificar cache primeiro
    if (categoriesCache && (Date.now() - categoriesCache.timestamp) < CACHE_TTL) {
      return NextResponse.json({ categories: categoriesCache.data }, {
        headers: {
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
        }
      })
    }

    const client = supabase

    if (!client) {
      throw new Error('Supabase client not configured')
    }

    // Buscar categorias
    const { data: categories, error } = await client
      .from('categories')
      .select('id, name, slug, description, display_as_carousel, display_order, color, icon, parent_id, created_at, updated_at')
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Erro ao buscar categorias:', error)
      return NextResponse.json({ error: 'Erro ao buscar categorias' }, { status: 500 })
    }

    // Atualizar cache
    categoriesCache = { data: categories || [], timestamp: Date.now() }

    return NextResponse.json({ categories }, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
      }
    })
  } catch (error) {
    console.error('Erro na API de categorias:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// POST /api/categories - Criar nova categoria (apenas admins)
export async function POST(request: NextRequest) {
  try {
    console.log('🔐 POST /api/categories - Iniciando verificação de admin...')

    // Verificar se é admin
    if (!await isAdmin(request)) {
      console.error('❌ Acesso negado: usuário não é admin')
      return NextResponse.json({
        error: 'Acesso negado. Você precisa ser administrador para realizar esta ação.',
        code: 'FORBIDDEN'
      }, { status: 403 })
    }

    console.log('✅ Admin verificado, criando categoria...')

    const body = await request.json()
    const { name, description, icon, color, display_as_carousel } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    // SEMPRE usar supabaseAdmin para bypassar RLS
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not configured')
    }

    // Gerar slug
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Buscar próximo display_order
    const { data: categories } = await supabaseAdmin
      .from('categories')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)

    const nextOrder = categories && categories.length > 0 ? (categories[0].display_order + 1) : 0

    // Criar categoria
    const { data: category, error } = await supabaseAdmin
      .from('categories')
      .insert({
        name,
        slug,
        description: description || null,
        icon: icon || 'BookOpen',
        color: color || '#F3C77A',
        display_order: nextOrder,
        display_as_carousel: display_as_carousel || false
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar categoria:', error)
      return NextResponse.json({ error: 'Erro ao criar categoria: ' + error.message }, { status: 500 })
    }

    // Invalidar cache
    invalidateCategoriesCache()

    return NextResponse.json({ category, message: 'Categoria criada com sucesso' }, { status: 201 })

  } catch (error) {
    console.error('Erro na API de criação de categoria:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// PUT /api/categories - Atualizar categoria (apenas admins)
export async function PUT(request: NextRequest) {
  try {
    console.log('🔐 PUT /api/categories - Iniciando verificação de admin...')

    // Verificar se é admin
    if (!await isAdmin(request)) {
      console.error('❌ Acesso negado: usuário não é admin')
      return NextResponse.json({
        error: 'Acesso negado. Você precisa ser administrador para realizar esta ação.',
        code: 'FORBIDDEN'
      }, { status: 403 })
    }

    console.log('✅ Admin verificado, atualizando categoria...')

    const body = await request.json()
    const { id, name, description, icon, color, display_as_carousel } = body

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    // SEMPRE usar supabaseAdmin para bypassar RLS
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not configured')
    }

    // Gerar slug
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Atualizar categoria
    const { data: category, error } = await supabaseAdmin
      .from('categories')
      .update({
        name,
        slug,
        description: description || null,
        icon: icon || 'BookOpen',
        color: color || '#F3C77A',
        display_as_carousel: display_as_carousel || false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar categoria:', error)
      return NextResponse.json({ error: 'Erro ao atualizar categoria: ' + error.message }, { status: 500 })
    }

    // Invalidar cache
    invalidateCategoriesCache()

    return NextResponse.json({ category, message: 'Categoria atualizada com sucesso' })

  } catch (error) {
    console.error('Erro na API de atualização de categoria:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// DELETE /api/categories - Deletar categoria (apenas admins)
export async function DELETE(request: NextRequest) {
  try {
    console.log('🔐 DELETE /api/categories - Iniciando verificação de admin...')

    // Verificar se é admin
    if (!await isAdmin(request)) {
      console.error('❌ Acesso negado: usuário não é admin')
      return NextResponse.json({
        error: 'Acesso negado. Você precisa ser administrador para realizar esta ação.',
        code: 'FORBIDDEN'
      }, { status: 403 })
    }

    console.log('✅ Admin verificado, deletando categoria...')

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
    }

    // SEMPRE usar supabaseAdmin para bypassar RLS
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not configured')
    }

    // Deletar categoria
    const { error } = await supabaseAdmin
      .from('categories')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao deletar categoria:', error)
      return NextResponse.json({ error: 'Erro ao deletar categoria: ' + error.message }, { status: 500 })
    }

    // Invalidar cache
    invalidateCategoriesCache()

    return NextResponse.json({ message: 'Categoria deletada com sucesso' })

  } catch (error) {
    console.error('Erro na API de deleção de categoria:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// Função para invalidar o cache (útil após criar/atualizar categorias)
export function invalidateCategoriesCache() {
  categoriesCache = null
}
