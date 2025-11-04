import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_CONFIG } from '@/lib/supabase-config'

// GET /api/users/[id] - Buscar usuário específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Configurar cliente admin diretamente
    const supabaseUrl = SUPABASE_CONFIG.url
    const supabaseServiceRoleKey = SUPABASE_CONFIG.serviceRoleKey

    const client = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    if (!client) {
      throw new Error('Supabase client not configured')
    }

    const { data: user, error } = await client
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Erro ao buscar usuário:', error)
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Erro na API de busca de usuário:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// PUT /api/users/[id] - Atualizar usuário
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    console.log('🔄 Atualizando usuário:', id)
    console.log('📝 Dados recebidos:', body)

    // Configurar cliente admin diretamente
    const supabaseUrl = SUPABASE_CONFIG.url
    const supabaseServiceRoleKey = SUPABASE_CONFIG.serviceRoleKey

    const client = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    if (!client) {
      throw new Error('Supabase client not configured')
    }

    const { name, email, role, status, access_days, allowed_courses, blocked_courses } = body

    // Calcular data de expiração
    const accessExpiresAt = new Date()
    accessExpiresAt.setDate(accessExpiresAt.getDate() + (access_days || 30))

    console.log('📅 Calculando data de expiração...')
    console.log('   access_days:', access_days)
    console.log('   accessExpiresAt:', accessExpiresAt.toISOString())

    const updateData = {
      name,
      email,
      role,
      status,
      access_days: access_days || 30,
      access_expires_at: accessExpiresAt.toISOString(),
      allowed_courses: allowed_courses || [],
      blocked_courses: blocked_courses || [],
      updated_at: new Date().toISOString()
    }

    console.log('💾 Dados a salvar:', updateData)

    const { data: user, error } = await client
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('❌ Erro ao atualizar usuário:', error)
      return NextResponse.json({ error: 'Erro ao atualizar usuário', details: error }, { status: 500 })
    }

    console.log('✅ Usuário atualizado com sucesso:', user)

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Erro na API de atualização de usuário:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// DELETE /api/users/[id] - Deletar usuário
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Configurar cliente admin diretamente
    const supabaseUrl = SUPABASE_CONFIG.url
    const supabaseServiceRoleKey = SUPABASE_CONFIG.serviceRoleKey

    const client = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    if (!client) {
      throw new Error('Supabase client not configured')
    }

    const { error } = await client
      .from('users')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao deletar usuário:', error)
      return NextResponse.json({ error: 'Erro ao deletar usuário' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Usuário deletado com sucesso' })
  } catch (error) {
    console.error('Erro na API de exclusão de usuário:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}