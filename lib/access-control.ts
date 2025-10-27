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
 * Sistema de prioridade de acesso:
 * 1. Admin: acesso total
 * 2. Usuário inativo ou bloqueado: sem acesso
 * 3. Acesso expirado (access_expires_at): sem acesso
 * 4. Curso bloqueado (blocked_courses): sem acesso
 * 5. Curso gratuito (is_free): acesso liberado
 * 6. Período de teste válido (access_expires_at): acesso liberado
 * 7. Curso na lista de permitidos (allowed_courses): acesso liberado
 * 8. Tem assinatura ativa ou trial: acesso liberado
 * 9. Caso contrário: sem acesso
 */
export async function userCanAccessCourse(
  userId: string,
  courseId: string,
  supabaseClient?: any
): Promise<{
  canAccess: boolean
  reason?: 'free_course' | 'premium_access' | 'trial_access' | 'admin_access' | 'no_access'
  message?: string
  course?: any
  subscription?: any
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

  console.log('🔍 [userCanAccessCourse] Verificando acesso:', { userId, courseId })

  // Buscar curso
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id, title, is_free')
    .eq('id', courseId)
    .single()

  console.log('📚 [userCanAccessCourse] Curso encontrado:', { course, error: courseError })

  if (!course) {
    return {
      canAccess: false,
      reason: 'no_access',
      message: 'Curso não encontrado'
    }
  }

  // Buscar dados do usuário
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, status, role, access_expires_at, allowed_courses, blocked_courses')
    .eq('id', userId)
    .single()

  console.log('👤 [userCanAccessCourse] Dados do usuário:', {
    userData: {
      id: userData?.id,
      status: userData?.status,
      role: userData?.role,
      access_expires_at: userData?.access_expires_at,
      allowed_courses: userData?.allowed_courses?.length || 0,
      blocked_courses: userData?.blocked_courses?.length || 0
    },
    error: userError
  })

  if (!userData) {
    return {
      canAccess: false,
      reason: 'no_access',
      message: 'Usuário não encontrado'
    }
  }

  // 1. Verificar se o usuário é admin
  if (userData.role === 'admin') {
    return {
      canAccess: true,
      reason: 'admin_access',
      message: 'Acesso administrativo',
      course
    }
  }

  // 2. Verificar se o usuário está ativo
  if (userData.status !== 'active') {
    return {
      canAccess: false,
      reason: 'no_access',
      message: 'Sua conta está inativa',
      course
    }
  }

  // 3. Verificar se o acesso não expirou
  let hasValidAccessPeriod = false
  if (userData.access_expires_at) {
    const expirationDate = new Date(userData.access_expires_at)
    const now = new Date()

    if (expirationDate < now) {
      // Acesso expirado, mas continue para verificar outras formas de acesso
    } else {
      hasValidAccessPeriod = true
    }
  }

  // 4. Verificar se o curso está na lista de cursos bloqueados
  if (userData.blocked_courses && userData.blocked_courses.includes(courseId)) {
    return {
      canAccess: false,
      reason: 'no_access',
      message: 'Acesso bloqueado para este curso',
      course
    }
  }

  // 5. Se o curso é gratuito, qualquer um pode acessar
  if (course.is_free) {
    return {
      canAccess: true,
      reason: 'free_course',
      message: 'Curso gratuito',
      course
    }
  }

  // 6. Se o usuário tem período de acesso válido (access_expires_at ainda não expirou)
  // dar acesso a todos os cursos (sistema de trial de 30 dias)
  if (hasValidAccessPeriod) {
    console.log('✅ [userCanAccessCourse] Acesso concedido via período de teste válido')
    return {
      canAccess: true,
      reason: 'trial_access',
      message: `Acesso via período de teste (válido até ${new Date(userData.access_expires_at!).toLocaleDateString('pt-BR')})`,
      course
    }
  }

  // 7. Verificar se o curso está na lista de cursos permitidos
  const isCourseInAllowedList = userData.allowed_courses && userData.allowed_courses.includes(courseId)
  console.log('🔍 [userCanAccessCourse] Curso na lista de permitidos?', isCourseInAllowedList)

  if (isCourseInAllowedList) {
    console.log('✅ [userCanAccessCourse] Acesso concedido via lista de cursos permitidos')
    return {
      canAccess: true,
      reason: 'premium_access',
      message: 'Acesso permitido',
      course
    }
  }

  // 8. Verificar se tem assinatura ativa
  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .select('status, trial_ends_at, current_period_end')
    .eq('user_id', userData.id)
    .in('status', ['trial', 'active'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  console.log('💳 [userCanAccessCourse] Assinatura encontrada:', { subscription, error: subError })

  if (subscription) {
    const now = new Date()

    // Verificar se é trial válido
    if (subscription.status === 'trial' && subscription.trial_ends_at) {
      const trialEnd = new Date(subscription.trial_ends_at)
      if (now <= trialEnd) {
        console.log('✅ [userCanAccessCourse] Acesso concedido via trial de assinatura')
        return {
          canAccess: true,
          reason: 'trial_access',
          message: 'Acesso via período de teste',
          course,
          subscription
        }
      }
    }

    // Verificar se assinatura ativa está dentro do período
    if (subscription.status === 'active' && subscription.current_period_end) {
      const periodEnd = new Date(subscription.current_period_end)
      if (now <= periodEnd) {
        console.log('✅ [userCanAccessCourse] Acesso concedido via assinatura ativa')
        return {
          canAccess: true,
          reason: 'premium_access',
          message: 'Assinatura ativa',
          course,
          subscription
        }
      }
    }
  }

  // 9. Por padrão, negar acesso
  console.log('❌ [userCanAccessCourse] Acesso negado - nenhuma condição atendida')
  return {
    canAccess: false,
    reason: 'no_access',
    message: 'Este curso requer assinatura premium',
    course
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
