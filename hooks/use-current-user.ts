"use client"

import { useState, useEffect } from "react"
import { getCurrentUser, User } from "@/lib/auth"

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCurrentUser()
  }, [])

  const fetchCurrentUser = async () => {
    try {
      setLoading(true)
      const currentUser = await getCurrentUser()
      
      if (currentUser) {
        setUser(currentUser)
      } else {
        // Fallback para usuário mock se não houver autenticação
        const mockUser: User = {
          id: "43f29360-cfff-4f67-8c6e-70503e4194b9",
          name: "Aluno Teste",
          email: "aluno@teste.com",
          role: "student",
          status: "active",
          access_days: 30,
          access_expires_at: "2024-12-31T23:59:59Z",
          allowed_categories: [],
          blocked_categories: [],
          allowed_courses: [],
          blocked_courses: [],
          total_points: 0,
          total_reading_minutes: 0,
          courses_enrolled: 0,
          courses_completed: 0,
          current_level: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_active_at: new Date().toISOString()
        }
        setUser(mockUser)
      }
    } catch (error) {
      console.error('Erro ao buscar usuário atual:', error)
      // Fallback para usuário mock
      const mockUser: User = {
        id: "43f29360-cfff-4f67-8c6e-70503e4194b9",
        name: "Aluno Teste",
        email: "aluno@teste.com",
        role: "student",
        status: "active",
        access_days: 30,
        access_expires_at: "2024-12-31T23:59:59Z",
        allowed_categories: [],
        blocked_categories: [],
        allowed_courses: [],
        blocked_courses: [],
        total_points: 0,
        total_reading_minutes: 0,
        courses_enrolled: 0,
        courses_completed: 0,
        current_level: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_active_at: new Date().toISOString()
      }
      setUser(mockUser)
    } finally {
      setLoading(false)
    }
  }

  const hasAccessToCategory = (category: string): boolean => {
    if (!user) return false
    
    // Se não há restrições, acesso liberado
    if (!user.allowed_categories?.length && !user.blocked_categories?.length) {
      return true
    }
    
    // Se categoria está bloqueada, negar acesso
    if (user.blocked_categories?.includes(category)) {
      return false
    }
    
    // Se há categorias permitidas, verificar se está na lista
    if (user.allowed_categories?.length) {
      return user.allowed_categories.includes(category)
    }
    
    return true
  }

  const hasAccessToCourse = (courseId: string): boolean => {
    if (!user) return false
    
    // Se não há restrições, acesso liberado
    if (!user.allowed_courses?.length && !user.blocked_courses?.length) {
      return true
    }
    
    // Se curso está bloqueado, negar acesso
    if (user.blocked_courses?.includes(courseId)) {
      return false
    }
    
    // Se há cursos permitidos, verificar se está na lista
    if (user.allowed_courses?.length) {
      return user.allowed_courses.includes(courseId)
    }
    
    return true
  }

  const isAccessExpired = (): boolean => {
    if (!user?.access_expires_at) return false
    return new Date() > new Date(user.access_expires_at)
  }

  return {
    user,
    loading,
    hasAccessToCategory,
    hasAccessToCourse,
    isAccessExpired
  }
}
