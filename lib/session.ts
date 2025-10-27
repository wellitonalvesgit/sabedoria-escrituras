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
        this.initializeSession().catch(error => {
          console.error('❌ Erro fatal ao inicializar sessão:', error)
          this.updateSession({ user: null, loading: false })
        })
        this.setupInactivityDetection()
      }, 100)
    } else {
      this.initializeSession().catch(error => {
        console.error('❌ Erro fatal ao inicializar sessão (server):', error)
        this.updateSession({ user: null, loading: false })
      })
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

      // Aguardar um pouco para garantir que o Supabase esteja pronto
      await new Promise(resolve => setTimeout(resolve, 300))

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
        if (session.expires_at) {
          // O expires_at do Supabase é um timestamp Unix em segundos
          // Precisamos multiplicar por 1000 para converter para milissegundos
          const expirationDate = new Date(session.expires_at * 1000)
          const now = new Date()
          const isExpired = expirationDate < now
          
          console.log('⏰ Verificação de expiração da sessão:', {
            expiresAt: session.expires_at,
            expirationDate: expirationDate.toISOString(),
            now: now.toISOString(),
            isExpired: isExpired,
            timeDifference: expirationDate.getTime() - now.getTime()
          })
          
          if (isExpired) {
            console.log('⏰ Sessão expirada, fazendo logout')
            await supabase.auth.signOut()
            this.updateSession({ user: null, loading: false })
            return
          }
        }
        
        console.log('✅ Sessão válida, buscando dados do usuário...')

        // SOLUÇÃO: Usar API route para buscar dados do usuário
        // Isso evita problemas com RLS no client-side
        let userData;
        try {
          console.log('📡 Buscando dados do usuário via API...')

          // Adicionar token de autenticação no header
          const headers: HeadersInit = {
            'Content-Type': 'application/json',
          }

          if (session.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`
          }

          const response = await fetch('/api/users/me', {
            method: 'GET',
            headers,
            credentials: 'include',
          })

          if (!response.ok) {
            throw new Error(`Erro ao buscar usuário: ${response.status}`)
          }

          const apiUserData = await response.json()

          console.log('📊 Dados do usuário (via API):', {
            hasUserData: !!apiUserData,
            userEmail: apiUserData?.email,
            userRole: apiUserData?.role,
            userStatus: apiUserData?.status
          })

          if (!apiUserData) {
            throw new Error('Dados do usuário não encontrados via API')
          }

          userData = apiUserData;

        } catch (apiError) {
          console.error('❌ Erro ao buscar via API:', apiError)

          // Fallback para cliente normal (com RLS)
          console.log('🔍 Tentando fallback para cliente normal (RLS)...')
          const { data: normalUserData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()

          console.log('📊 Dados do usuário na tabela (via RLS):', {
            hasUserData: !!normalUserData,
            error: userError?.message,
            userEmail: normalUserData?.email,
            userRole: normalUserData?.role,
            userStatus: normalUserData?.status
          })

          if (userError || !normalUserData) {
            console.error('❌ Erro ao buscar dados do usuário:', userError)
            console.error('💡 Dica: Verifique se as políticas RLS estão configuradas corretamente')
            this.updateSession({ user: null, loading: false })
            return
          }
          
          // Atribuir os dados do usuário à variável externa
          userData = normalUserData;
        }
        
        // Verificar se temos dados do usuário
        if (!userData) {
          console.error('❌ Dados do usuário não encontrados após tentativas')
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
        
        // Log adicional para confirmar que a sessão foi atualizada
        console.log('✅ Sessão atualizada com dados do usuário:', {
          id: userData.id,
          email: userData.email,
          role: userData.role,
          status: userData.status,
          allowed_courses: userData.allowed_courses?.length || 0
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
          try {
            // Buscar dados do usuário via API
            const response = await fetch('/api/users/me', {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
            })

            if (!response.ok) {
              throw new Error(`Erro ao buscar usuário: ${response.status}`)
            }

            const userData = await response.json()

            console.log('📊 Auth change - Dados do usuário (via API):', {
              hasUserData: !!userData,
              userEmail: userData?.email
            })

            if (userData) {
              this.updateSession({
                user: userData,
                loading: false,
                sessionId: session.access_token
              })
            } else {
              throw new Error('Dados do usuário não encontrados')
            }
          } catch (adminError) {
            console.error('❌ Auth change - Erro ao usar cliente admin:', adminError)
            
            // Fallback para cliente normal
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
            } else {
              console.error('❌ Auth change - Erro ao buscar dados do usuário:', userError)
            }
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
