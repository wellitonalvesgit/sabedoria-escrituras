"use client"

import { createClient } from '@/lib/supabase'
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

  private constructor() {
    this.initializeSession()
    this.setupInactivityDetection()
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager()
    }
    return SessionManager.instance
  }

  private async initializeSession() {
    try {
      const supabase = createClient()
      
      // Verificar sessão atual
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('❌ Erro ao verificar sessão:', error)
        this.updateSession({ user: null, loading: false })
        return
      }

      if (session?.user) {
        // Buscar dados completos do usuário
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (userError || !userData) {
          console.error('❌ Erro ao buscar dados do usuário:', userError)
          this.updateSession({ user: null, loading: false })
          return
        }

        this.updateSession({ 
          user: userData, 
          loading: false,
          sessionId: session.access_token
        })
      } else {
        this.updateSession({ user: null, loading: false })
      }

      // Escutar mudanças na autenticação
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('🔄 Mudança na autenticação:', event)
        
        if (event === 'SIGNED_IN' && session?.user) {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (!userError && userData) {
            this.updateSession({ 
              user: userData, 
              loading: false,
              sessionId: session.access_token
            })
          }
        } else if (event === 'SIGNED_OUT') {
          this.updateSession({ user: null, loading: false, sessionId: '' })
        }
      })

    } catch (error) {
      console.error('❌ Erro ao inicializar sessão:', error)
      this.updateSession({ user: null, loading: false })
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
    // Detectar atividade do usuário
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    
    const resetTimer = () => {
      this.sessionData.lastActivity = Date.now()
      
      if (this.inactivityTimer) {
        clearTimeout(this.inactivityTimer)
      }

      this.inactivityTimer = setTimeout(() => {
        console.log('⏰ Sessão inativa por 30 minutos, fazendo logout automático')
        this.signOut()
      }, this.INACTIVITY_TIMEOUT)
    }

    events.forEach(event => {
      document.addEventListener(event, resetTimer, true)
    })

    resetTimer()
  }

  public subscribe(listener: (session: SessionData) => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  public getSession(): SessionData {
    return { ...this.sessionData }
  }

  public async signOut() {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      this.updateSession({ user: null, loading: false, sessionId: '' })
    } catch (error) {
      console.error('❌ Erro ao fazer logout:', error)
    }
  }

  public isSessionValid(): boolean {
    if (!this.sessionData.user) return false
    
    // Verificar se o acesso não expirou
    if (this.sessionData.user.access_expires_at) {
      const expirationDate = new Date(this.sessionData.user.access_expires_at)
      const now = new Date()
      return expirationDate > now
    }
    
    return true
  }

  public getTimeUntilExpiration(): number | null {
    if (!this.sessionData.user?.access_expires_at) return null
    
    const expirationDate = new Date(this.sessionData.user.access_expires_at)
    const now = new Date()
    const diff = expirationDate.getTime() - now.getTime()
    
    return diff > 0 ? diff : 0
  }

  public refreshActivity() {
    this.sessionData.lastActivity = Date.now()
  }
}

export const sessionManager = SessionManager.getInstance()
