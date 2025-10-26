import { supabase } from './supabase'

export interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  role: 'admin' | 'moderator' | 'student'
  status: 'active' | 'inactive' | 'suspended'
  total_points: number
  total_reading_minutes: number
  courses_enrolled: number
  courses_completed: number
  current_level: number
  access_days?: number
  access_expires_at?: string
  allowed_categories?: string[]
  blocked_categories?: string[]
  allowed_courses?: string[]
  blocked_courses?: string[]
  created_at: string
  updated_at: string
  last_active_at: string
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !authUser) {
      return null
    }

    // Buscar dados do usuário na tabela users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (userError) {
      console.error('Erro ao buscar dados do usuário:', userError)
      return null
    }

    return userData
  } catch (error) {
    console.error('Erro na autenticação:', error)
    return null
  }
}

export async function signIn(email: string, password: string) {
  try {
    console.log('🔐 Iniciando processo de login para:', email)
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('❌ Erro na autenticação:', error.message)
      
      // Mapear erros específicos do Supabase para mensagens amigáveis
      if (error.message.includes('Invalid login credentials')) {
        return { user: null, error: new Error('Email ou senha incorretos') }
      }
      if (error.message.includes('Email not confirmed')) {
        return { user: null, error: new Error('Email não confirmado. Verifique sua caixa de entrada') }
      }
      if (error.message.includes('Too many requests')) {
        return { user: null, error: new Error('Muitas tentativas. Tente novamente em alguns minutos') }
      }
      
      return { user: null, error: new Error(error.message) }
    }

    if (!data.user) {
      console.error('❌ Usuário não encontrado após autenticação')
      return { user: null, error: new Error('Usuário não encontrado') }
    }

    console.log('✅ Usuário autenticado no Supabase Auth:', data.user.id)

    // Buscar dados completos do usuário na tabela users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (userError) {
      console.error('❌ Erro ao buscar dados do usuário:', userError)
      return { user: null, error: new Error('Erro ao carregar dados do usuário') }
    }

    if (!userData) {
      console.error('❌ Dados do usuário não encontrados na tabela users')
      return { user: null, error: new Error('Dados do usuário não encontrados') }
    }

    // Verificar se o usuário está ativo
    if (userData.status !== 'active') {
      console.error('❌ Usuário inativo:', userData.status)
      return { user: null, error: new Error('Sua conta está inativa. Entre em contato com o suporte') }
    }

    // Verificar se o acesso não expirou
    if (userData.access_expires_at) {
      const expirationDate = new Date(userData.access_expires_at)
      const now = new Date()
      
      if (expirationDate < now) {
        console.error('❌ Acesso expirado:', userData.access_expires_at)
        return { user: null, error: new Error('Seu acesso expirou. Entre em contato com o administrador') }
      }
    }

    console.log('✅ Login realizado com sucesso para:', userData.email)
    return { user: userData, error: null }
  } catch (error) {
    console.error('❌ Erro geral no login:', error)
    return { user: null, error: new Error('Erro interno do servidor') }
  }
}

export async function signUp(email: string, password: string, name: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        }
      }
    })

    if (error) {
      throw error
    }

    // Criar registro na tabela users
    if (data.user) {
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email!,
          name,
          role: 'student',
          status: 'active',
          total_points: 0,
          total_reading_minutes: 0,
          courses_enrolled: 0,
          courses_completed: 0,
          current_level: 1,
          access_days: 30,
          access_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          allowed_categories: [],
          blocked_categories: [],
          allowed_courses: [],
          blocked_courses: []
        })

      if (userError) {
        console.error('Erro ao criar usuário:', userError)
      }
    }

    return { user: data.user, error: null }
  } catch (error) {
    return { user: null, error }
  }
}

export async function signOut() {
  try {
    console.log('🚪 Iniciando processo de logout')
    
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('❌ Erro ao fazer logout:', error)
      return { error: new Error('Erro ao fazer logout') }
    }

    console.log('✅ Logout realizado com sucesso')
    return { error: null }
  } catch (error) {
    console.error('❌ Erro geral no logout:', error)
    return { error: new Error('Erro interno do servidor') }
  }
}

export async function resetPassword(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { error }
  } catch (error) {
    return { error }
  }
}

export async function sendMagicLink(email: string) {
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
      }
    })
    return { error }
  } catch (error) {
    return { error }
  }
}

export async function updatePassword(newPassword: string) {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })
    return { error }
  } catch (error) {
    return { error }
  }
}

export async function updateUserProfile(userId: string, updates: Partial<User>) {
  try {
    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)

    return { error }
  } catch (error) {
    return { error }
  }
}

