import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Cache em memória para otimização (ranking atualiza a cada sessão, 1 minuto é ok)
let rankingCache: { data: any[], timestamp: number } | null = null
const CACHE_TTL = 60 * 1000 // 1 minuto

export async function GET(request: NextRequest) {
  try {
    // Verificar cache primeiro
    if (rankingCache && (Date.now() - rankingCache.timestamp) < CACHE_TTL) {
      return NextResponse.json({ leaderboard: rankingCache.data }, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        }
      })
    }

    const cookieStore = await cookies()

    // Criar cliente com SERVICE_ROLE_KEY para bypassar RLS
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
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

    const { data: users, error } = await supabase
      .from('users')
      .select(`
        id,
        name,
        email,
        avatar_url,
        total_points,
        current_level,
        courses_completed,
        total_reading_minutes,
        last_active_at,
        created_at
      `)
      .eq('status', 'active')
      .order('total_points', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Erro ao buscar ranking:', error)
      return NextResponse.json({ error: 'Erro ao buscar ranking' }, { status: 500 })
    }

    // Transformar dados para o formato esperado pelo frontend
    const leaderboard = users.map((user, index) => ({
      userId: user.id,
      displayName: user.name,
      photoUrl: user.avatar_url || '/placeholder.svg',
      totalDurationSeconds: user.total_reading_minutes * 60,
      totalSessions: user.courses_completed,
      totalPoints: user.total_points,
      level: user.current_level,
      rank: index + 1
    }))

    // Atualizar cache
    rankingCache = { data: leaderboard, timestamp: Date.now() }

    return NextResponse.json({ leaderboard }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      }
    })

  } catch (error) {
    console.error('Erro na API de ranking:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// Função para invalidar o cache (útil após atualizar pontos)
export function invalidateRankingCache() {
  rankingCache = null
}
