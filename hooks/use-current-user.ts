"use client"

import { useState, useEffect } from "react"
import { sessionManager } from "@/lib/session"
import { User } from "@/lib/auth"

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [sessionValid, setSessionValid] = useState(true)
  const [timeUntilExpiration, setTimeUntilExpiration] = useState<number | null>(null)

  useEffect(() => {
    // Subscrever às mudanças da sessão
    const unsubscribe = sessionManager.subscribe((session) => {
      setUser(session.user)
      setLoading(session.loading)
      setSessionValid(sessionManager.isSessionValid())
      setTimeUntilExpiration(sessionManager.getTimeUntilExpiration())
    })

    return () => {
      unsubscribe()
    }
  }, [])

  // Funções de verificação de acesso
  // NOTA: Removido hasAccessToCategory - controle apenas por curso individual

  const hasAccessToCourse = (courseId: string): boolean => {
    if (!user) {
      return false
    }
    if (user.role === 'admin') {
      return true
    }
    if (!sessionValid) {
      return false
    }

    // 1. Verificar se o curso está bloqueado
    if (user.blocked_courses && user.blocked_courses.includes(courseId)) {
      return false
    }

    // 2. Se tem lista de cursos permitidos ESPECÍFICOS, usar APENAS essa lista
    if (user.allowed_courses && user.allowed_courses.length > 0) {
      return user.allowed_courses.includes(courseId)
    }

    // 3. Se NÃO tem cursos específicos, usar período de acesso (trial/premium)
    if (user.access_expires_at) {
      const expirationDate = new Date(user.access_expires_at)
      const now = new Date()
      return expirationDate > now
    }

    // 4. Sem cursos específicos E sem período de acesso válido
    return false
  }

  const isAccessExpired = (): boolean => {
    if (!user?.access_expires_at) return false
    const expirationDate = new Date(user.access_expires_at)
    const now = new Date()
    return expirationDate < now
  }

  const getAccessDaysRemaining = (): number => {
    if (!user?.access_expires_at) return 0
    const expirationDate = new Date(user.access_expires_at)
    const now = new Date()
    const diffTime = expirationDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }

  const getFormattedTimeUntilExpiration = (): string => {
    if (!timeUntilExpiration) return ''
    
    const days = Math.floor(timeUntilExpiration / (1000 * 60 * 60 * 24))
    const hours = Math.floor((timeUntilExpiration % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((timeUntilExpiration % (1000 * 60 * 60)) / (1000 * 60))
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const refreshSession = () => {
    sessionManager.refreshActivity()
  }

  const signOut = async () => {
    await sessionManager.signOut()
  }

  const refreshUserData = async () => {
    await sessionManager.refreshUserData()
  }

  return {
    user,
    loading,
    sessionValid,
    timeUntilExpiration,
    hasAccessToCourse,
    isAccessExpired,
    getAccessDaysRemaining,
    getFormattedTimeUntilExpiration,
    refreshSession,
    refreshUserData,
    signOut
  }
}