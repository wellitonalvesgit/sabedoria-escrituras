import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { SUPABASE_CONFIG } from '@/lib/supabase-config'

/**
 * API para buscar um plano específico por ID ou nome
 * GET /api/subscription-plans/[identifier]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ identifier: string }> }
) {
  try {
    const { identifier } = await params

    if (!identifier) {
      return NextResponse.json(
        { error: 'Identificador do plano é obrigatório' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()

    // Criar cliente com SERVICE_ROLE_KEY
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

    // Tentar buscar por ID primeiro (UUID)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier)

    let query = supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)

    if (isUUID) {
      query = query.eq('id', identifier)
    } else {
      // Buscar por nome
      query = query.eq('name', identifier)
    }

    const { data: plan, error } = await query.single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Plano não encontrado' },
          { status: 404 }
        )
      }
      console.error('Erro ao buscar plano:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar plano' },
        { status: 500 }
      )
    }

    return NextResponse.json({ plan }, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200'
      }
    })

  } catch (error) {
    console.error('Erro na API de plano:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
