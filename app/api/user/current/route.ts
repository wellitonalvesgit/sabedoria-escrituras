import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, supabase } from '@/lib/supabase'

// GET /api/user/current - Buscar usuário atual
export async function GET(request: NextRequest) {
  try {
    // Em produção, isso viria do token de autenticação
    const userId = request.headers.get('x-user-id') || '43f29360-cfff-4f67-8c6e-70503e4194b9' // aluno@teste.com

    const client = supabaseAdmin || supabase
    if (!client) {
      throw new Error('Supabase client not configured')
    }

    const { data: user, error } = await client
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Erro ao buscar usuário atual:', error)
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Erro na API de usuário atual:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
