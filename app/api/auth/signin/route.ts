import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit'
import { SUPABASE_CONFIG } from '@/lib/supabase-config'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar rate limiting
    const rateLimitCheck = checkRateLimit(email)

    if (!rateLimitCheck.allowed) {
      const minutesUntilReset = Math.ceil(rateLimitCheck.timeUntilReset / (1000 * 60))

      return NextResponse.json(
        {
          error: `Muitas tentativas de login. Tente novamente em ${minutesUntilReset} minutos.`,
          rateLimited: true,
          timeUntilReset: rateLimitCheck.timeUntilReset
        },
        { status: 429 }
      )
    }

    // Criar cliente Supabase com suporte a cookies do servidor
    const cookieStore = await cookies()
    const supabase = createServerClient(
      SUPABASE_CONFIG.url,
      SUPABASE_CONFIG.anonKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    // Fazer login via Supabase Auth (cria cookies automaticamente)
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      console.log(`❌ Login falhado para ${email}:`, authError.message)

      return NextResponse.json(
        {
          error: authError.message === 'Invalid login credentials'
            ? 'Email ou senha incorretos'
            : authError.message,
          remainingAttempts: rateLimitCheck.remainingAttempts - 1
        },
        { status: 401 }
      )
    }

    if (!authData.user) {
      console.error('❌ Usuário não encontrado após autenticação')
      return NextResponse.json(
        { error: 'Erro ao fazer login' },
        { status: 500 }
      )
    }

    console.log('✅ Usuário autenticado no Supabase Auth:', authData.user.id)

    // Buscar dados completos do usuário usando SERVICE_ROLE_KEY
    const adminClient = createClient(
      SUPABASE_CONFIG.url,
      SUPABASE_CONFIG.serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { data: userData, error: userError } = await adminClient
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (userError || !userData) {
      console.error('❌ Erro ao buscar dados do usuário:', userError)
      return NextResponse.json(
        { error: 'Erro ao carregar dados do usuário' },
        { status: 500 }
      )
    }

    // Verificar se o usuário está ativo
    if (userData.status !== 'active') {
      console.error('❌ Usuário inativo:', userData.status)
      return NextResponse.json(
        { error: 'Sua conta está inativa. Entre em contato com o suporte' },
        { status: 403 }
      )
    }

    // Verificar se o acesso não expirou
    if (userData.access_expires_at) {
      const expirationDate = new Date(userData.access_expires_at)
      const now = new Date()

      if (expirationDate < now) {
        console.error('❌ Acesso expirado:', userData.access_expires_at)
        return NextResponse.json(
          { error: 'Seu acesso expirou. Entre em contato com o administrador' },
          { status: 403 }
        )
      }
    }

    // Login bem-sucedido - resetar rate limit
    resetRateLimit(email)
    console.log(`✅ Login bem-sucedido para ${email}`)

    return NextResponse.json({
      success: true,
      message: 'Login realizado com sucesso',
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        status: userData.status
      }
    })

  } catch (error) {
    console.error('❌ Erro na API de login:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}