import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/users/[id] - Buscar usuário específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not configured')
    }
    const { id } = params

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select(`
        *,
        user_course_progress (
          course_id,
          status,
          progress_percentage,
          total_reading_minutes
        )
      `)
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
  { params }: { params: { id: string } }
) {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not configured')
    }
    const { id } = params
    const body = await request.json()
    
    const { name, email, role, status, avatar_url } = body

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .update({
        name,
        email,
        role,
        status,
        avatar_url
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar usuário:', error)
      return NextResponse.json({ error: 'Erro ao atualizar usuário' }, { status: 500 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Erro na API de atualização de usuário:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// DELETE /api/users/[id] - Deletar usuário
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not configured')
    }
    const { id } = params

    const { error } = await supabaseAdmin
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

