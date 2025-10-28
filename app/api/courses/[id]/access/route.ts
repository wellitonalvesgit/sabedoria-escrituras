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
        { canAccess: false, reason: 'Você precisa estar logado.' },
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

    const { data: course } = await supabase
      .from('courses')
      .select('id, title, is_free')
      .eq('id', courseId)
      .single()

    if (!course) {
      return NextResponse.json(
        { canAccess: false, reason: 'Curso não encontrado.' },
        { status: 404 }
      )
    }

    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('id, status, trial_ends_at, current_period_end, canceled_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)

    const subscriptionStatus = getSubscriptionStatus(subscriptions || [])
    const accessResult = canAccessCourse(course.is_free, subscriptionStatus)

    return NextResponse.json({
      canAccess: accessResult.canAccess,
      reason: accessResult.reason,
      courseTitle: course.title,
      isFree: course.is_free,
      subscriptionStatus: {
        isInTrial: subscriptionStatus.isInTrial,
        isTrialExpired: subscriptionStatus.isTrialExpired,
        isPremium: subscriptionStatus.isPremium,
        trialDaysLeft: subscriptionStatus.trialDaysLeft,
      },
    })
  } catch (error) {
    console.error('Erro ao verificar acesso:', error)
    return NextResponse.json(
      { canAccess: false, reason: 'Erro ao verificar acesso.' },
      { status: 500 }
    )
  }
}
