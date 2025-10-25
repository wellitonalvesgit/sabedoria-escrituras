import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Verifica se o usuário tem acesso premium ativo
 *
 * Retorna true se:
 * 1. Usuário está em período de trial válido
 * 2. Usuário tem assinatura ativa (status = 'active')
 * 3. current_period_end ainda não expirou
 */
export async function userHasPremiumAccess(userId: string): Promise<boolean> {
  const cookieStore = await cookies()

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

  // Buscar assinatura ativa do usuário
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['trial', 'active'])
    .single()

  if (!subscription) {
    return false
  }

  const now = new Date()

  // Verificar se está em trial válido
  if (subscription.status === 'trial' && subscription.trial_ends_at) {
    const trialEnd = new Date(subscription.trial_ends_at)
    if (now <= trialEnd) {
      return true
    }
  }

  // Verificar se assinatura ativa está dentro do período
  if (subscription.status === 'active' && subscription.current_period_end) {
    const periodEnd = new Date(subscription.current_period_end)
    if (now <= periodEnd) {
      return true
    }
  }

  return false
}

/**
 * Verifica se o usuário pode acessar um curso específico
 *
 * Retorna true se:
 * 1. O curso é gratuito (is_free = true)
 * 2. O usuário tem acesso premium ativo
 */
export async function userCanAccessCourse(userId: string, courseId: string): Promise<{
  canAccess: boolean
  reason?: 'free_course' | 'premium_access' | 'trial_access' | 'no_access'
  message?: string
}> {
  const cookieStore = await cookies()

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

  // Buscar curso
  const { data: course } = await supabase
    .from('courses')
    .select('is_free')
    .eq('id', courseId)
    .single()

  if (!course) {
    return {
      canAccess: false,
      reason: 'no_access',
      message: 'Curso não encontrado'
    }
  }

  // Se o curso é gratuito, qualquer um pode acessar
  if (course.is_free) {
    return {
      canAccess: true,
      reason: 'free_course',
      message: 'Curso gratuito'
    }
  }

  // Verificar se usuário tem premium
  const hasPremium = await userHasPremiumAccess(userId)

  if (hasPremium) {
    // Verificar se está em trial ou assinatura paga
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', userId)
      .in('status', ['trial', 'active'])
      .single()

    if (subscription?.status === 'trial') {
      return {
        canAccess: true,
        reason: 'trial_access',
        message: 'Acesso via período de teste'
      }
    }

    return {
      canAccess: true,
      reason: 'premium_access',
      message: 'Assinatura ativa'
    }
  }

  return {
    canAccess: false,
    reason: 'no_access',
    message: 'Este curso requer assinatura premium. Inicie seu período de teste gratuito!'
  }
}

/**
 * Busca informações da assinatura do usuário
 */
export async function getUserSubscription(userId: string) {
  const cookieStore = await cookies()

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

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select(`
      *,
      plan:subscription_plans(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return subscription
}
