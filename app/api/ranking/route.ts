import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
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

    return NextResponse.json({ leaderboard })

  } catch (error) {
    console.error('Erro na API de ranking:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

