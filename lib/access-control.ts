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
 * NOVA LÓGICA (Sistema de 3 Categorias):
 * 1. Admin: acesso total
 * 2. Curso gratuito (is_free): acesso liberado
 * 3. Arsenal Espiritual: APENAS com compra individual
 * 4. Cartas de Paulo: Plano Básico (2 meses) OU Premium (vitalício)
 * 5. Bônus: APENAS Plano Premium (vitalício)
 * 6. Compras individuais: acesso vitalício ao curso comprado
 */
export async function userCanAccessCourse(
  userId: string,
  courseId: string,
  supabaseClient?: any
): Promise<{
  canAccess: boolean
  reason?: 'free_course' | 'premium_access' | 'basic_access' | 'individual_purchase' | 'admin_access' | 'no_access' | 'upgrade_required'
  message?: string
  course?: any
  subscription?: any
  category?: string
  planType?: 'basic' | 'premium' | null
}> {
  // Se não foi passado um cliente, criar um novo
  let supabase = supabaseClient

  if (!supabase) {
    const cookieStore = await cookies()
    supabase = createServerClient(
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
  }

  // Buscar curso com categoria
  const { data: course } = await supabase
    .from('courses')
    .select(`
      id,
      title,
      is_free,
      course_categories (
        categories (
          id,
          name,
          slug
        )
      )
    `)
    .eq('id', courseId)
    .single()

  if (!course) {
    return {
      canAccess: false,
      reason: 'no_access',
      message: 'Curso não encontrado'
    }
  }

  // Buscar dados do usuário
  const { data: userData } = await supabase
    .from('users')
    .select('id, status, role')
    .eq('id', userId)
    .single()

  if (!userData) {
    return {
      canAccess: false,
      reason: 'no_access',
      message: 'Usuário não encontrado'
    }
  }

  // 1. Admin tem acesso total
  if (userData.role === 'admin') {
    return {
      canAccess: true,
      reason: 'admin_access',
      message: 'Acesso administrativo',
      course
    }
  }

  // 2. Usuário inativo = sem acesso
  if (userData.status !== 'active') {
    return {
      canAccess: false,
      reason: 'no_access',
      message: 'Sua conta está inativa',
      course
    }
  }

  // 3. Curso gratuito = acesso liberado
  if (course.is_free) {
    return {
      canAccess: true,
      reason: 'free_course',
      message: 'Curso gratuito',
      course
    }
  }

  // 4. Usar função SQL para verificar acesso
  const { data: accessResult, error } = await supabase
    .rpc('check_user_course_access', {
      p_user_id: userId,
      p_course_id: courseId
    })

  if (error) {
    console.error('Erro ao verificar acesso:', error)
    return {
      canAccess: false,
      reason: 'no_access',
      message: 'Erro ao verificar acesso',
      course
    }
  }

  // Buscar assinatura e categoria para mensagens detalhadas
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select(`
      status,
      trial_ends_at,
      current_period_end,
      plan_expires_at,
      plan:subscription_plans(name, plan_type, duration_days)
    `)
    .eq('user_id', userId)
    .in('status', ['trial', 'active'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const category = course.course_categories?.[0]?.categories?.slug || null
  const planType = subscription?.plan?.plan_type || null

  // Se tem acesso, determinar razão
  if (accessResult) {
    let reason: any = 'premium_access'
    let message = 'Você tem acesso a este curso'

    // Verificar se é compra individual
    const { data: purchase } = await supabase
      .from('user_course_purchases')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('is_active', true)
      .eq('payment_status', 'completed')
      .maybeSingle()

    if (purchase) {
      reason = 'individual_purchase'
      message = 'Você comprou este curso'
    } else if (planType === 'basic') {
      reason = 'basic_access'
      message = 'Incluído no seu Plano Básico'
    } else if (planType === 'premium') {
      reason = 'premium_access'
      message = 'Incluído no seu Plano Premium'
    }

    return {
      canAccess: true,
      reason,
      message,
      course,
      subscription,
      category,
      planType
    }
  }

  // Se não tem acesso, fornecer mensagem específica por categoria
  let message = 'Você não tem acesso a este curso'

  if (category === 'arsenal-espiritual') {
    message = 'Este curso é vendido separadamente. Clique em "Comprar" para adquirir.'
  } else if (category === 'bonus') {
    message = 'Este curso está disponível apenas no Plano Premium. Faça upgrade para ter acesso.'
  } else if (category === 'cartas-de-paulo') {
    if (!planType) {
      message = 'Adquira o Plano Básico ou Premium para acessar este curso.'
    } else {
      message = 'Seu acesso expirou. Renove seu plano para continuar.'
    }
  }

  return {
    canAccess: false,
    reason: category === 'bonus' && planType === 'basic' ? 'upgrade_required' : 'no_access',
    message,
    course,
    subscription,
    category,
    planType
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
