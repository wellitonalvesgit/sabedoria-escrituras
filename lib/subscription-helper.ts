/**
 * Helper functions para verificar status de subscription e trial
 */

export interface SubscriptionStatus {
  hasActiveSubscription: boolean
  isInTrial: boolean
  isTrialExpired: boolean
  isPremium: boolean
  trialDaysLeft: number
  canAccessFreeCourses: boolean
  canAccessPremiumCourses: boolean
  trialEndsAt: Date | null
}

export interface Subscription {
  id: string
  status: 'trial' | 'active' | 'past_due' | 'canceled' | 'expired'
  trial_ends_at?: string
  current_period_end: string
  canceled_at?: string
}

/**
 * Verifica o status da subscription de um usuário
 */
export function getSubscriptionStatus(subscriptions?: Subscription[]): SubscriptionStatus {
  const subscription = subscriptions?.[0]

  // Se não tem subscription, considera como trial expirado
  if (!subscription) {
    return {
      hasActiveSubscription: false,
      isInTrial: false,
      isTrialExpired: true,
      isPremium: false,
      trialDaysLeft: 0,
      canAccessFreeCourses: false,
      canAccessPremiumCourses: false,
      trialEndsAt: null,
    }
  }

  const now = new Date()
  const trialEndsAt = subscription.trial_ends_at ? new Date(subscription.trial_ends_at) : null
  const isInTrial = subscription.status === 'trial' && trialEndsAt && trialEndsAt > now
  const isTrialExpired = subscription.status === 'trial' && trialEndsAt && trialEndsAt <= now
  const isPremium = subscription.status === 'active'

  const trialDaysLeft = trialEndsAt
    ? Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : 0

  return {
    hasActiveSubscription: isPremium || isInTrial,
    isInTrial,
    isTrialExpired: isTrialExpired || false,
    isPremium,
    trialDaysLeft: Math.max(0, trialDaysLeft),
    canAccessFreeCourses: isInTrial, // Trial pode acessar free
    canAccessPremiumCourses: isPremium, // Só premium acessa premium
    trialEndsAt,
  }
}

/**
 * Verifica se usuário pode acessar um curso específico
 */
export function canAccessCourse(
  courseIsFree: boolean,
  subscriptionStatus: SubscriptionStatus
): { canAccess: boolean; reason?: string } {
  // Premium acessa tudo
  if (subscriptionStatus.isPremium) {
    return { canAccess: true }
  }

  // Trial expirado não acessa nada
  if (subscriptionStatus.isTrialExpired) {
    return {
      canAccess: false,
      reason: 'Seu período de teste de 7 dias expirou. Faça upgrade para continuar acessando os cursos.',
    }
  }

  // Trial ativo pode acessar apenas cursos free
  if (subscriptionStatus.isInTrial) {
    if (courseIsFree) {
      return { canAccess: true }
    } else {
      return {
        canAccess: false,
        reason: `Este curso é exclusivo para assinantes Premium. Você ainda tem ${subscriptionStatus.trialDaysLeft} dia(s) de trial para testar os cursos gratuitos.`,
      }
    }
  }

  // Sem subscription
  return {
    canAccess: false,
    reason: 'Você precisa de uma assinatura para acessar este curso.',
  }
}
