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
  private readonly USER_CACHE_TTL = 2 * 1000 // 2 segundos (reduzido para atualização rápida de permissões)

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
      console.log('[SessionManager] Iniciando sessão...')

      // Verificar cache primeiro (otimização crítica)
      if (this.userCache && (Date.now() - this.userCache.timestamp) < this.USER_CACHE_TTL) {
        console.log('[SessionManager] Usando cache (ainda válido)')
        this.updateSession({ user: this.userCache.data, loading: false })
        return
      }

      console.log('[SessionManager] Cache expirado ou não existe, buscando dados do usuário via API...')

      // CORREÇÃO: Buscar dados diretamente via API usando cookies (não depende de getSession)
      // Isso funciona porque os cookies HTTP-only são enviados automaticamente
      const userData = await this.fetchUserDataViaCookies()

      if (!userData || userData.status !== 'active') {
        console.log('[SessionManager] Sem usuário ou usuário inativo')
        this.updateSession({ user: null, loading: false })
        return
      }

      console.log('[SessionManager] ✅ Usuário carregado:', userData.email)

      // Atualizar cache e sessão
      this.userCache = { data: userData, timestamp: Date.now() }
      this.updateSession({
        user: userData,
        loading: false,
        sessionId: userData.id // Usar ID do usuário como sessionId
      })

      // Listener para mudanças de autenticação do Supabase
      supabase.auth.onAuthStateChange(async (event, newSession) => {
        console.log('[SessionManager] Auth state changed:', event)
        if (event === 'SIGNED_IN') {
          // Recarregar dados do usuário
          await this.refreshUserData()
        } else if (event === 'SIGNED_OUT') {
          this.userCache = null
          this.updateSession({ user: null, loading: false, sessionId: '' })
        }
      })

    } catch (error) {
      console.error('[SessionManager] Erro ao inicializar sessão:', error)
      this.updateSession({ user: null, loading: false })
    }
  }

  // NOVO: Buscar dados do usuário via cookies (sem token explícito)
  private async fetchUserDataViaCookies(): Promise<User | null> {
    try {
      console.log('[SessionManager] Buscando dados via cookies...')

      const response = await fetch('/api/users/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // IMPORTANTE: Envia cookies automaticamente
      })

      console.log('[SessionManager] Status da resposta:', response.status)

      if (!response.ok) {
        if (response.status === 401) {
          console.log('[SessionManager] Usuário não autenticado (401)')
        } else {
          console.error('[SessionManager] Erro ao buscar usuário. Status:', response.status)
        }
        return null
      }

      const data = await response.json()
      console.log('[SessionManager] ✅ Dados recebidos:', {
        email: data?.email,
        allowed_courses: data?.allowed_courses,
        allowed_courses_count: data?.allowed_courses?.length
      })
      return data || null
    } catch (error) {
      console.error('[SessionManager] Erro ao buscar dados do usuário:', error)
      return null
    }
  }

  // MANTIDO: Para compatibilidade com auth state change
  private async fetchUserData(token: string): Promise<User | null> {
    try {
      console.log('[SessionManager] Buscando dados do usuário com token...')

      const response = await fetch('/api/users/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (!response.ok) {
        return null
      }

      const data = await response.json()
      return data || null
    } catch (error) {
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
    console.log('[SessionManager] Forçando atualização dos dados do usuário...')
    this.userCache = null
    await this.initializeSession()
  }
}

export const sessionManager = SessionManager.getInstance()