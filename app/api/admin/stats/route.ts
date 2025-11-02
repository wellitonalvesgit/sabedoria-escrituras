import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { SUPABASE_CONFIG } from '@/lib/supabase-config'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()

    // Criar cliente Supabase com SERVICE_ROLE_KEY para bypassar RLS
    const supabase = createServerClient(
      SUPABASE_CONFIG.url,
      SUPABASE_CONFIG.serviceRoleKey,
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

    // Buscar usuários
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('status')

    if (usersError) {
      throw usersError
    }

    // Buscar categorias
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id')

    if (categoriesError) {
      throw categoriesError
    }

    const stats = {
      totalUsers: users?.length || 0,
      activeUsers: users?.filter(u => u.status === 'active').length || 0,
      totalCategories: categories?.length || 0
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar estatísticas' },
      { status: 500 }
    )
  }
}
