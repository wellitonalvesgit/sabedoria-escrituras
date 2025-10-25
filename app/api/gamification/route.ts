import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    const { data: stats, error } = await supabase
      .from('users')
      .select('total_points, current_level, courses_completed, total_reading_minutes')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Erro ao buscar stats:', error)
      return NextResponse.json({ error: 'Erro ao buscar estatísticas' }, { status: 500 })
    }

    return NextResponse.json({ stats })

  } catch (error) {
    console.error('Erro na API de gamificação:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    const { totalPoints, level, coursesCompleted, pagesRead, currentStreak } = await request.json()

    const { error } = await supabase
      .from('users')
      .update({
        total_points: totalPoints,
        current_level: level,
        courses_completed: coursesCompleted,
        total_reading_minutes: pagesRead * 2, // Estimativa: 2 min por página
        last_active_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (error) {
      console.error('Erro ao atualizar stats:', error)
      return NextResponse.json({ error: 'Erro ao salvar estatísticas' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Estatísticas atualizadas com sucesso' })

  } catch (error) {
    console.error('Erro na API de gamificação:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}



