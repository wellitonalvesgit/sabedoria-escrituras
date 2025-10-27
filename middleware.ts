import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { SUPABASE_CONFIG } from './lib/supabase-config'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rotas que não precisam de autenticação
  const publicRoutes = [
    '/',
    '/login',
    '/landing',
    '/pricing',
    '/auth/callback',
    '/reset-password',
    '/api/auth',
    '/api/test-config'
  ]

  // Verificar se é uma rota pública
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route)
  )

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Rotas que precisam de autenticação
  try {
    // Verificar se SERVICE_ROLE_KEY está disponível
    if (!SUPABASE_CONFIG.serviceRoleKey) {
      console.error('❌ SERVICE_ROLE_KEY não está configurada')
      return NextResponse.redirect(new URL('/login?error=config', request.url))
    }

    // Criar cliente Supabase com cookies para middleware
    const cookieStore = cookies()

    // Primeiro, usar ANON_KEY para verificar a sessão
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

    // Verificar se há uma sessão válida
    const { data: { session }, error } = await supabase.auth.getSession()

    console.log('📊 Middleware - Dados da sessão:', { 
      hasSession: !!session, 
      hasUser: !!session?.user,
      error: error?.message,
      userId: session?.user?.id,
      userEmail: session?.user?.email
    })

    if (error || !session) {
      console.log('🔒 Sessão inválida, redirecionando para login')
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Agora usar SERVICE_ROLE_KEY para buscar dados do usuário (bypassar RLS)
    const supabaseAdmin = createServerClient(
      SUPABASE_CONFIG.url,
      SUPABASE_CONFIG.serviceRoleKey,
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

    // Verificar se o usuário existe na tabela users
    // Como estamos usando SERVICE_ROLE_KEY, o RLS não se aplica
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, status, access_expires_at, role, allowed_courses')
      .eq('id', session.user.id)
      .single()

    console.log('📊 Middleware - Dados do usuário:', {
      hasUserData: !!userData,
      error: userError?.message,
      userEmail: userData?.email,
      userRole: userData?.role,
      userStatus: userData?.status,
      allowedCourses: userData?.allowed_courses?.length || 0
    })

    if (userError || !userData) {
      console.log('🔒 Usuário não encontrado na base de dados:', userError?.message)
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Verificar se o usuário está ativo
    if (userData.status !== 'active') {
      console.log('🔒 Usuário inativo:', userData.status)
      return NextResponse.redirect(new URL('/login?error=inactive', request.url))
    }

    // Verificar se o acesso não expirou
    if (userData.access_expires_at) {
      const expirationDate = new Date(userData.access_expires_at)
      const now = new Date()

      if (expirationDate < now) {
        console.log('🔒 Acesso expirado')
        return NextResponse.redirect(new URL('/login?error=expired', request.url))
      }
    }

    // Verificar permissões para rotas administrativas
    if (pathname.startsWith('/admin') && userData.role !== 'admin') {
      console.log('🔒 Acesso negado a área administrativa')
      return NextResponse.redirect(new URL('/dashboard?error=unauthorized', request.url))
    }

    // Adicionar headers com informações do usuário
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', userData.id)
    requestHeaders.set('x-user-role', userData.role)
    requestHeaders.set('x-user-status', userData.status)

    console.log('✅ Middleware - Acesso permitido para:', userData.id)
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })

  } catch (error) {
    console.error('❌ Erro no middleware de autenticação:', error)
    return NextResponse.redirect(new URL('/login?error=server', request.url))
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}