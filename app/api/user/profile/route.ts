import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { supabase } from '@/lib/supabase'

// GET /api/user/profile - Buscar perfil do usuário atual
export async function GET(request: NextRequest) {
  try {
    // Usar admin se disponível, senão usar cliente público
    const client = supabaseAdmin || supabase

    if (!client) {
      throw new Error('Supabase client not configured')
    }

    // Em produção, isso viria do token de autenticação
    const userId = request.headers.get('x-user-id') || 'current-user'

    const { data: user, error } = await client
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Erro ao buscar perfil:', error)
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Erro na API de perfil:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// PUT /api/user/profile - Atualizar perfil do usuário
export async function PUT(request: NextRequest) {
  try {
    // Usar admin se disponível, senão usar cliente público
    const client = supabaseAdmin || supabase

    if (!client) {
      throw new Error('Supabase client not configured')
    }

    const userId = request.headers.get('x-user-id') || 'current-user'
    const body = await request.json()

    const { 
      name, 
      email, 
      cpf, 
      phone, 
      bio, 
      birth_date, 
      address, 
      city, 
      state, 
      zip_code,
      preferences,
      notification_settings
    } = body

    const { data: user, error } = await client
      .from('users')
      .update({
        name,
        email,
        cpf,
        phone,
        bio,
        birth_date,
        address,
        city,
        state,
        zip_code,
        preferences: preferences || {},
        notification_settings: notification_settings || {}
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar perfil:', error)
      return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Erro na API de atualização de perfil:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
