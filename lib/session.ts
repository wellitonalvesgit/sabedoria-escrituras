"use client"

import { supabase } from '@/lib/supabase'
import { User } from '@/lib/auth'

interface SessionData {
  user: User | null
  loading: boolean
  lastActivity: number
  sessionId: string
}

class SessionManager {
  private static instance: SessionManager
  private sessionData: SessionData = {
    user: null,
    loading: true,
    lastActivity: Date.now(),
    sessionId: ''
  }
  private listeners: Set<(session: SessionData) => void> = new Set()
  private inactivityTimer: NodeJS.Timeout | null = null
  private readonly INACTIVITY_TIMEOUT = 30 * 60 * 1000 // 30 minutos

  // Cache de dados do usuário para melhor performance
  private userCache: { data: User | null, timestamp: number } | null = null
  private readonly USER_CACHE_TTL = 10 * 1000 // 10 segundos (reduzido para evitar cache desatualizado)

  private constructor() {
    // Inicializar imediatamente para melhor performance
    if (typeof window !== 'undefined') {
      this.initializeSession().catch(() => {
        this.updateSession({ user: null, loading: false })
      })
      this.setupInactivityDetection()
    }
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager()
    }
    return SessionManager.instance
  }

  private async initializeSession() {
    try {
      // Verificar cache primeiro (otimização crítica)
      if (this.userCache && (Date.now() - this.userCache.timestamp) < this.USER_CACHE_TTL) {
        this.updateSession({ user: this.userCache.data, loading: false })
        return
      }

      // Verificar sessão do Supabase
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) {
        this.updateSession({ user: null, loading: false })
        return
      }

      // Verificar expiração
      if (session.expires_at && new Date(session.expires_at * 1000) < new Date()) {
        await supabase.auth.signOut()
        this.updateSession({ user: null, loading: false })
        return
      }

      // Buscar dados do usuário via API (mais rápido que RLS)
      const userData = await this.fetchUserData(session.access_token)

      if (!userData || userData.status !== 'active') {
        this.updateSession({ user: null, loading: false })
        return
      }

      // Atualizar cache e sessão
      this.userCache = { data: userData, timestamp: Date.now() }
      this.updateSession({
        user: userData,
        loading: false,
        sessionId: session.access_token
      })

      // Listener para mudanças de autenticação
      supabase.auth.onAuthStateChange(async (event, newSession) => {
        if (event === 'SIGNED_IN' && newSession?.user) {
          const user = await this.fetchUserData(newSession.access_token)
          if (user) {
            this.userCache = { data: user, timestamp: Date.now() }
            this.updateSession({
              user,
              loading: false,
              sessionId: newSession.access_token
            })
          }
        } else if (event === 'SIGNED_OUT') {
          this.userCache = null
          this.updateSession({ user: null, loading: false, sessionId: '' })
        }
      })

    } catch (error) {
      this.updateSession({ user: null, loading: false })
    }
  }

  private async fetchUserData(token: string): Promise<User | null> {
    try {
      const response = await fetch('/api/users/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (!response.ok) return null

      const data = await response.json()
      return data || null
    } catch {
      return null
    }
  }

  private updateSession(updates: Partial<SessionData>) {
    this.sessionData = { ...this.sessionData, ...updates }
    this.notifyListeners()
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.sessionData))
  }

  private setupInactivityDetection() {
    if (typeof window === 'undefined') return

    const events = ['mousedown', 'keypress', 'scroll', 'touchstart']

    const resetTimer = () => {
      this.sessionData.lastActivity = Date.now()

      if (this.inactivityTimer) clearTimeout(this.inactivityTimer)

      this.inactivityTimer = setTimeout(() => {
        this.signOut()
      }, this.INACTIVITY_TIMEOUT)
    }

    events.forEach(event => {
      document.addEventListener(event, resetTimer, { passive: true })
    })

    resetTimer()
  }

  public subscribe(listener: (session: SessionData) => void) {
    this.listeners.add(listener)
    // Notificar imediatamente com estado atual
    listener(this.sessionData)
    return () => this.listeners.delete(listener)
  }

  public getSession(): SessionData {
    return { ...this.sessionData }
  }

  public async signOut() {
    try {
      this.userCache = null
      await supabase.auth.signOut()
      this.updateSession({ user: null, loading: false, sessionId: '' })
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  public isSessionValid(): boolean {
    if (!this.sessionData.user) return false

    if (this.sessionData.user.access_expires_at) {
      const expirationDate = new Date(this.sessionData.user.access_expires_at)
      return expirationDate > new Date()
    }

    return true
  }

  public getTimeUntilExpiration(): number | null {
    if (!this.sessionData.user?.access_expires_at) return null

    const expirationDate = new Date(this.sessionData.user.access_expires_at)
    const diff = expirationDate.getTime() - Date.now()

    return diff > 0 ? diff : 0
  }

  public refreshActivity() {
    this.sessionData.lastActivity = Date.now()
  }

  public invalidateCache() {
    this.userCache = null
  }

  public async refreshUserData() {
    this.userCache = null
    await this.initializeSession()
  }
}

export const sessionManager = SessionManager.getInstance()