import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { userCanAccessCourse } from '@/lib/access-control'

/**
 * Verifica se o usuário pode acessar um curso
 *
 * GET /api/courses/:id/access
 *
 * Retorna:
 * {
 *   canAccess: boolean
 *   reason: 'free_course' | 'premium_access' | 'trial_access' | 'no_access'
 *   message: string
 *   course?: { id, title, is_free }
 *   subscription?: { status, trial_ends_at, current_period_end }
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

    // Verificar autenticação
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        {
          canAccess: false,
          reason: 'no_access',
          message: 'Você precisa fazer login para acessar este curso'
        },
        { status: 401 }
      )
    }

    // Verificar acesso ao curso
    const accessCheck = await userCanAccessCourse(user.id, courseId)

    // Buscar informações do curso
    const { data: course } = await supabase
      .from('courses')
      .select('id, title, is_free')
      .eq('id', courseId)
      .single()

    // Buscar informações da assinatura
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('status, trial_ends_at, current_period_end')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    return NextResponse.json({
      ...accessCheck,
      course,
      subscription
    })
  } catch (error) {
    console.error('Erro ao verificar acesso ao curso:', error)
    return NextResponse.json(
      {
        canAccess: false,
        reason: 'no_access',
        message: 'Erro ao verificar acesso ao curso'
      },
      { status: 500 }
    )
  }
}
