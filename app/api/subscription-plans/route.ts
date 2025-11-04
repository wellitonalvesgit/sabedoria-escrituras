import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { SUPABASE_CONFIG } from '@/lib/supabase-config'

// Cache de planos com TTL de 10 minutos
let plansCache: { data: any[], timestamp: number } | null = null
const CACHE_TTL = 10 * 60 * 1000 // 10 minutos

export async function GET(request: NextRequest) {
  try {
    // Verificar cache primeiro
    if (plansCache && (Date.now() - plansCache.timestamp) < CACHE_TTL) {
      return NextResponse.json({ plans: plansCache.data }, {
        headers: {
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200'
        }
      })
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

    // Buscar todos os planos ativos
    const { data: plans, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Erro ao buscar planos:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar planos' },
        { status: 500 }
      )
    }

    // Atualizar cache
    plansCache = { data: plans || [], timestamp: Date.now() }

    return NextResponse.json({ plans: plans || [] }, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200'
      }
    })

  } catch (error) {
    console.error('Erro na API de planos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export function invalidatePlansCache() {
  plansCache = null
}
