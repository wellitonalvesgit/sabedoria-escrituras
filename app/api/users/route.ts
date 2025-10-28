import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// GET /api/users - Listar todos os usuários
export async function GET(request: NextRequest) {
  try {
    // Usar configuração segura do Supabase
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    if (!client) {
      throw new Error('Supabase client not configured')
    }
    const { searchParams } = new URL(request.url)
    
    const role = searchParams.get('role')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    let query = client
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    // Aplicar filtros
    if (role && role !== 'all') {
      query = query.eq('role', role)
    }
    
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data: users, error } = await query

    if (error) {
      console.error('Erro ao buscar usuários:', error)
      return NextResponse.json({ error: 'Erro ao buscar usuários' }, { status: 500 })
    }

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Erro na API de usuários:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// POST /api/users - Criar novo usuário
export async function POST(request: NextRequest) {
  try {
    // Usar configuração segura do Supabase
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    if (!client) {
      throw new Error('Supabase client not configured')
    }
    const body = await request.json()
    
    const { name, email, role = 'student', status = 'active' } = body

    const { data: user, error } = await client
      .from('users')
      .insert({
        name,
        email,
        role,
        status
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar usuário:', error)
      return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 })
    }

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    console.error('Erro na API de criação de usuário:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

