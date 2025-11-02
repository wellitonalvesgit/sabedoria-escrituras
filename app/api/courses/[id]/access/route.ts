import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getSubscriptionStatus, canAccessCourse } from '@/lib/subscription-helper'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params
    const cookieStore = await cookies()

    const supabaseAnon = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          canAccess: false,
          reason: 'no_access' as const,
          message: 'Você precisa estar logado para acessar este curso.'
        },
        { status: 401 }
      )
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    // Buscar dados do usuário para verificar role
    const { data: userData } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', user.id)
      .single()

    // Se for admin, liberar acesso total
    if (userData?.role === 'admin') {
      return NextResponse.json({
        canAccess: true,
        reason: 'admin_access' as const,
        message: 'Acesso administrativo concedido',
        course: { id: courseId, title: '', is_free: false }
      })
    }

    const { data: course } = await supabase
      .from('courses')
      .select('id, title, is_free')
      .eq('id', courseId)
      .single()

    if (!course) {
      return NextResponse.json(
        {
          canAccess: false,
          reason: 'no_access' as const,
          message: 'Curso não encontrado.'
        },
        { status: 404 }
      )
    }

    // Se o curso é gratuito, liberar acesso
    if (course.is_free) {
      return NextResponse.json({
        canAccess: true,
        reason: 'free_course' as const,
        message: 'Este curso está disponível gratuitamente para todos os usuários',
        course: {
          id: course.id,
          title: course.title,
          is_free: course.is_free
        }
      })
    }

    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('id, status, trial_ends_at, current_period_end, canceled_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)

    const subscriptionStatus = getSubscriptionStatus(subscriptions || [])
    const accessResult = canAccessCourse(course.is_free, subscriptionStatus)

    // Determinar reason baseado no status
    let apiReason: 'free_course' | 'premium_access' | 'trial_access' | 'admin_access' | 'no_access' = 'no_access'

    if (accessResult.canAccess) {
      if (subscriptionStatus.isPremium) {
        apiReason = 'premium_access'
      } else if (subscriptionStatus.isInTrial) {
        apiReason = 'trial_access'
      }
    }

    return NextResponse.json({
      canAccess: accessResult.canAccess,
      reason: apiReason,
      message: accessResult.reason,
      course: {
        id: course.id,
        title: course.title,
        is_free: course.is_free
      },
      subscription: subscriptions && subscriptions.length > 0 ? {
        status: subscriptions[0].status,
        trial_ends_at: subscriptions[0].trial_ends_at,
        current_period_end: subscriptions[0].current_period_end
      } : undefined
    })
  } catch (error) {
    console.error('Erro ao verificar acesso:', error)
    return NextResponse.json(
      { canAccess: false, reason: 'Erro ao verificar acesso.' },
      { status: 500 }
    )
  }
}
