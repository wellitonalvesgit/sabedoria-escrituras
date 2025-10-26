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

    // Atualizar timer de expiração a cada minuto
    const interval = setInterval(() => {
      setTimeUntilExpiration(sessionManager.getTimeUntilExpiration())
      setSessionValid(sessionManager.isSessionValid())
    }, 60000)

    return () => {
      unsubscribe()
      clearInterval(interval)
    }
  }, [])

  // Funções de verificação de acesso
  const hasAccessToCategory = (categoryId: string): boolean => {
    if (!user) return false
    if (user.role === 'admin') return true
    if (!sessionValid) return false
    
    // Verificar se a categoria não está bloqueada
    if (user.blocked_categories && user.blocked_categories.includes(categoryId)) return false
    
    // Verificar se a categoria está explicitamente permitida
    if (user.allowed_categories && user.allowed_categories.includes(categoryId)) return true
    
    // Se não há categorias específicas permitidas, permitir todas (exceto bloqueadas)
    return !user.allowed_categories || user.allowed_categories.length === 0
  }

  const hasAccessToCourse = (courseId: string): boolean => {
    if (!user) return false
    if (user.role === 'admin') return true
    if (!sessionValid) return false
    
    // Verificar se o curso não está bloqueado
    if (user.blocked_courses && user.blocked_courses.includes(courseId)) return false
    
    // Verificar se o curso está explicitamente permitido
    if (user.allowed_courses && user.allowed_courses.includes(courseId)) return true
    
    // Se não há cursos específicos permitidos, permitir todos (exceto bloqueados)
    return !user.allowed_courses || user.allowed_courses.length === 0
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

  return {
    user,
    loading,
    sessionValid,
    timeUntilExpiration,
    hasAccessToCategory,
    hasAccessToCourse,
    isAccessExpired,
    getAccessDaysRemaining,
    getFormattedTimeUntilExpiration,
    refreshSession,
    signOut
  }
}