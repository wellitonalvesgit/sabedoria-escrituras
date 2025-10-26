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

  private constructor() {
    // Aguardar um pouco para garantir que o DOM esteja pronto
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        this.initializeSession()
        this.setupInactivityDetection()
      }, 100)
    } else {
      this.initializeSession()
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
      console.log('🔄 Inicializando sessão...')
      
      // Aguardar mais tempo para garantir que o Supabase esteja pronto
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Verificar se o Supabase está disponível
      if (!supabase) {
        console.error('❌ Supabase não está disponível')
        this.updateSession({ user: null, loading: false })
        return
      }
      
      console.log('✅ Supabase disponível, verificando sessão...')
      
      // Verificar sessão atual
      const { data: { session }, error } = await supabase.auth.getSession()
      
      console.log('📊 Dados da sessão:', { 
        hasSession: !!session, 
        hasUser: !!session?.user,
        error: error?.message,
        userId: session?.user?.id,
        userEmail: session?.user?.email,
        sessionExpiry: session?.expires_at,
        sessionValid: session ? new Date(session.expires_at) > new Date() : false
      })
      
      if (error) {
        console.error('❌ Erro ao verificar sessão:', error)
        this.updateSession({ user: null, loading: false })
        return
      }

      if (session?.user) {
        console.log('👤 Usuário encontrado na sessão:', session.user.id)
        
        // Verificar se a sessão não expirou
        if (session.expires_at && new Date(session.expires_at) < new Date()) {
          console.log('⏰ Sessão expirada, fazendo logout')
          await supabase.auth.signOut()
          this.updateSession({ user: null, loading: false })
          return
        }
        
        console.log('✅ Sessão válida, buscando dados do usuário...')
        
        // Buscar dados completos do usuário
        // NOTA: Com RLS configurado corretamente, o usuário pode ver seu próprio registro
        // porque a política permite SELECT quando auth.uid() = id
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        console.log('📊 Dados do usuário na tabela:', {
          hasUserData: !!userData,
          error: userError?.message,
          userEmail: userData?.email,
          userRole: userData?.role,
          userStatus: userData?.status
        })

        if (userError || !userData) {
          console.error('❌ Erro ao buscar dados do usuário:', userError)
          console.error('💡 Dica: Verifique se as políticas RLS estão configuradas corretamente')
          this.updateSession({ user: null, loading: false })
          return
        }

        // Verificar se o usuário está ativo
        if (userData.status !== 'active') {
          console.log('❌ Usuário inativo:', userData.status)
          this.updateSession({ user: null, loading: false })
          return
        }

        console.log('✅ Usuário carregado com sucesso:', userData.email)
        this.updateSession({ 
          user: userData, 
          loading: false,
          sessionId: session.access_token
        })
      } else {
        console.log('❌ Nenhuma sessão ativa encontrada')
        
        // Tentar verificar se há sessão em localStorage
        if (typeof window !== 'undefined') {
          const localStorageKeys = Object.keys(localStorage).filter(key => 
            key.includes('supabase') || key.includes('sb-')
          )
          console.log('🔍 Chaves do Supabase no localStorage:', localStorageKeys)
          
          if (localStorageKeys.length > 0) {
            console.log('⚠️ Há dados do Supabase no localStorage, mas sessão não encontrada')
          }
        }
        
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
    // Verificar se está no cliente
    if (typeof window === 'undefined') return
    
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
      // Usar o cliente configurado
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
