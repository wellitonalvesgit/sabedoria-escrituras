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
    // IMPORTANTE: Usar cliente regular aqui porque o RLS permite que o usuário
    // veja seu próprio perfil (auth.uid() = id)
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
        return { success: false, user: null, error: 'Email ou senha incorretos' }
      }
      if (error.message.includes('Email not confirmed')) {
        return { success: false, user: null, error: 'Email não confirmado. Verifique sua caixa de entrada' }
      }
      if (error.message.includes('Too many requests')) {
        return { success: false, user: null, error: 'Muitas tentativas. Tente novamente em alguns minutos' }
      }
      
      return { success: false, user: null, error: error.message }
    }

    if (!data.user) {
      console.error('❌ Usuário não encontrado após autenticação')
      return { success: false, user: null, error: 'Usuário não encontrado' }
    }

    console.log('✅ Usuário autenticado no Supabase Auth:', data.user.id)

    // Buscar dados completos do usuário na tabela users
    // Como o usuário acabou de se autenticar, o RLS permite acesso ao próprio perfil
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (userError) {
      console.error('❌ Erro ao buscar dados do usuário:', userError)
      return { success: false, user: null, error: 'Erro ao carregar dados do usuário' }
    }

    if (!userData) {
      console.error('❌ Dados do usuário não encontrados na tabela users')
      return { success: false, user: null, error: 'Dados do usuário não encontrados' }
    }

    // Verificar se o usuário está ativo
    if (userData.status !== 'active') {
      console.error('❌ Usuário inativo:', userData.status)
      return { success: false, user: null, error: 'Sua conta está inativa. Entre em contato com o suporte' }
    }

    // Verificar se o acesso não expirou
    if (userData.access_expires_at) {
      const expirationDate = new Date(userData.access_expires_at)
      const now = new Date()
      
      if (expirationDate < now) {
        console.error('❌ Acesso expirado:', userData.access_expires_at)
        return { success: false, user: null, error: 'Seu acesso expirou. Entre em contato com o administrador' }
      }
    }

    console.log('✅ Login realizado com sucesso para:', userData.email)
    return { success: true, user: userData, error: null }
  } catch (error) {
    console.error('❌ Erro geral no login:', error)
    return { success: false, user: null, error: 'Erro interno do servidor' }
  }
}

export async function signUp(email: string, password: string, name: string) {
  try {
    console.log('📝 Iniciando processo de cadastro para:', email)
    
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
      console.error('❌ Erro no cadastro:', error.message)
      
      // Mapear erros específicos do Supabase para mensagens amigáveis
      if (error.message.includes('User already registered')) {
        return { success: false, error: 'Este email já está cadastrado' }
      }
      if (error.message.includes('Password should be at least')) {
        return { success: false, error: 'A senha deve ter pelo menos 6 caracteres' }
      }
      if (error.message.includes('Invalid email')) {
        return { success: false, error: 'Email inválido' }
      }
      
      return { success: false, error: error.message }
    }

    // Criar registro na tabela users via API route (que usa supabaseAdmin)
    if (data.user) {
      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
          allowed_courses: [],
          blocked_courses: []
        })
      })

      const { error: userError } = await response.json()

      if (userError) {
        console.error('❌ Erro ao criar usuário na tabela users:', userError)
        return { success: false, error: 'Erro ao criar perfil do usuário' }
      }
    }

    console.log('✅ Cadastro realizado com sucesso para:', email)
    return { success: true, error: null }
  } catch (error) {
    console.error('❌ Erro geral no cadastro:', error)
    return { success: false, error: 'Erro interno do servidor' }
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
    console.log('🔄 Enviando email de recuperação para:', email)
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password`,
    })

    if (error) {
      console.error('❌ Erro ao enviar email de recuperação:', error.message)
      
      // Mapear erros específicos do Supabase para mensagens amigáveis
      if (error.message.includes('Invalid email')) {
        return { success: false, error: 'Email inválido' }
      }
      if (error.message.includes('Too many requests')) {
        return { success: false, error: 'Muitas tentativas. Tente novamente em alguns minutos' }
      }
      
      return { success: false, error: error.message }
    }

    console.log('✅ Email de recuperação enviado com sucesso para:', email)
    return { success: true, error: null }
  } catch (error) {
    console.error('❌ Erro geral ao enviar email de recuperação:', error)
    return { success: false, error: 'Erro interno do servidor' }
  }
}

export async function sendMagicLink(email: string) {
  try {
    console.log('✨ Enviando link mágico para:', email)
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
      }
    })

    if (error) {
      console.error('❌ Erro ao enviar link mágico:', error.message)
      
      // Mapear erros específicos do Supabase para mensagens amigáveis
      if (error.message.includes('Invalid email')) {
        return { success: false, error: 'Email inválido' }
      }
      if (error.message.includes('Too many requests')) {
        return { success: false, error: 'Muitas tentativas. Tente novamente em alguns minutos' }
      }
      
      return { success: false, error: error.message }
    }

    console.log('✅ Link mágico enviado com sucesso para:', email)
    return { success: true, error: null }
  } catch (error) {
    console.error('❌ Erro geral ao enviar link mágico:', error)
    return { success: false, error: 'Erro interno do servidor' }
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

export async function sendAccessCode(email: string) {
  try {
    console.log('🔑 Enviando código de acesso para:', email)
    
    // Gerar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Salvar código temporariamente (você pode usar Redis ou uma tabela temporária)
    // Por enquanto, vamos usar localStorage como fallback
    if (typeof window !== 'undefined') {
      localStorage.setItem(`access_code_${email}`, JSON.stringify({
        code,
        expires: Date.now() + 10 * 60 * 1000 // 10 minutos
      }))
    }

    // Enviar email com o código usando Resend
    const { sendEmailResend } = await import('./email-resend')
    
    const emailResult = await sendEmailResend({
      to: email,
      subject: '🔑 Código de Acesso - Sabedoria das Escrituras',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #F3C77A;">
            <h1 style="color: #F3C77A; font-size: 28px; margin: 0;">📚 Sabedoria das Escrituras</h1>
            <h2 style="color: #2c3e50; font-size: 24px; margin: 10px 0;">Código de Acesso</h2>
          </div>

          <p>Olá!</p>
          <p>Você solicitou um código de acesso para entrar na plataforma. Use o código abaixo para fazer login:</p>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #F3C77A; margin: 20px 0; text-align: center;">
            <h3 style="color: #2c3e50; margin-top: 0;">Seu Código de Acesso</h3>
            <div style="font-size: 32px; font-weight: bold; color: #e74c3c; background: #ffe6e6; padding: 20px; border-radius: 8px; letter-spacing: 4px; margin: 15px 0;">
              ${code}
            </div>
          </div>

          <div style="background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <strong>⚠️ Importante:</strong> Este código é válido por apenas 10 minutos. Não compartilhe este código com ninguém.
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login"
               style="display: inline-block; background: #F3C77A; color: #2c3e50; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
              🚀 Acessar Plataforma
            </a>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px;">
            <p>Se você não solicitou este código, ignore este email.</p>
            <p><strong>Equipe Sabedoria das Escrituras</strong></p>
          </div>
        </div>
      `,
      text: `
        Código de Acesso - Sabedoria das Escrituras
        
        Olá!
        
        Você solicitou um código de acesso para entrar na plataforma. Use o código abaixo para fazer login:
        
        CÓDIGO: ${code}
        
        IMPORTANTE: Este código é válido por apenas 10 minutos. Não compartilhe este código com ninguém.
        
        ACESSAR PLATAFORMA:
        ${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login
        
        Se você não solicitou este código, ignore este email.
        
        Equipe Sabedoria das Escrituras
      `
    })

    if (!emailResult) {
      return { success: false, error: 'Erro ao enviar email com código' }
    }

    console.log('✅ Código de acesso enviado com sucesso para:', email)
    return { success: true, error: null }
  } catch (error) {
    console.error('❌ Erro geral ao enviar código de acesso:', error)
    return { success: false, error: 'Erro interno do servidor' }
  }
}

export async function verifyAccessCode(email: string, code: string) {
  try {
    console.log('🔍 Verificando código de acesso para:', email)
    
    if (typeof window === 'undefined') {
      return { success: false, error: 'Verificação de código não disponível no servidor' }
    }

    const storedData = localStorage.getItem(`access_code_${email}`)
    if (!storedData) {
      return { success: false, error: 'Código não encontrado ou expirado' }
    }

    const { code: storedCode, expires } = JSON.parse(storedData)
    
    if (Date.now() > expires) {
      localStorage.removeItem(`access_code_${email}`)
      return { success: false, error: 'Código expirado' }
    }

    if (storedCode !== code) {
      return { success: false, error: 'Código incorreto' }
    }

    // Código válido - fazer login automático
    localStorage.removeItem(`access_code_${email}`)
    
    // Buscar usuário por email e fazer login
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (userError || !userData) {
      return { success: false, error: 'Usuário não encontrado' }
    }

    // Verificar se o usuário está ativo
    if (userData.status !== 'active') {
      return { success: false, error: 'Sua conta está inativa' }
    }

    console.log('✅ Código verificado com sucesso para:', email)
    return { success: true, user: userData, error: null }
  } catch (error) {
    console.error('❌ Erro geral ao verificar código:', error)
    return { success: false, error: 'Erro interno do servidor' }
  }
}



export async function updateUserProfile(userId: string, data: Partial<User>) {
  try {
    const { error } = await supabase
      .from('users')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
    
    if (error) {
      console.error('Erro ao atualizar perfil:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true, error: null }
  } catch (error) {
    console.error('Erro geral ao atualizar perfil:', error)
    return { success: false, error: 'Erro interno do servidor' }
  }
}
