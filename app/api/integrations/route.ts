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

// GET /api/integrations - Listar todas as integrações (apenas admins)
export async function GET(request: NextRequest) {
  try {
    console.log('🔐 GET /api/integrations - Iniciando verificação de admin...')

    // Verificar se é admin
    if (!await isAdmin(request)) {
      console.error('❌ Acesso negado: usuário não é admin')
      return NextResponse.json({
        error: 'Acesso negado. Você precisa ser administrador para realizar esta ação.',
        code: 'FORBIDDEN'
      }, { status: 403 })
    }

    console.log('✅ Admin verificado, buscando integrações...')

    // SEMPRE usar supabaseAdmin para bypassar RLS
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not configured')
    }

    // Buscar integrações
    const { data: integrations, error } = await supabaseAdmin
      .from('integrations')
      .select('*')
      .order('category', { ascending: true })
      .order('display_name', { ascending: true })

    if (error) {
      console.error('Erro ao buscar integrações:', error)
      return NextResponse.json({ error: 'Erro ao buscar integrações' }, { status: 500 })
    }

    return NextResponse.json({ integrations })

  } catch (error) {
    console.error('Erro na API de integrações:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// PUT /api/integrations - Atualizar integração (apenas admins)
export async function PUT(request: NextRequest) {
  try {
    console.log('🔐 PUT /api/integrations - Iniciando verificação de admin...')

    // Verificar se é admin
    if (!await isAdmin(request)) {
      console.error('❌ Acesso negado: usuário não é admin')
      return NextResponse.json({
        error: 'Acesso negado. Você precisa ser administrador para realizar esta ação.',
        code: 'FORBIDDEN'
      }, { status: 403 })
    }

    console.log('✅ Admin verificado, atualizando integração...')

    const body = await request.json()
    const { id, is_enabled, config, credentials_encrypted, last_test_status, last_test_message, last_test_at } = body

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
    }

    // SEMPRE usar supabaseAdmin para bypassar RLS
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not configured')
    }

    // Construir objeto de atualização
    const updateData: any = {}
    if (typeof is_enabled !== 'undefined') updateData.is_enabled = is_enabled
    if (config) updateData.config = config
    if (credentials_encrypted) updateData.credentials_encrypted = credentials_encrypted
    if (last_test_status) updateData.last_test_status = last_test_status
    if (last_test_message) updateData.last_test_message = last_test_message
    if (last_test_at) updateData.last_test_at = last_test_at

    // Atualizar integração
    const { data: integration, error } = await supabaseAdmin
      .from('integrations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar integração:', error)
      return NextResponse.json({ error: 'Erro ao atualizar integração: ' + error.message }, { status: 500 })
    }

    return NextResponse.json({ integration, message: 'Integração atualizada com sucesso' })

  } catch (error) {
    console.error('Erro na API de atualização de integração:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
