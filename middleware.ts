import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Criar instância específica para middleware
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

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
    // Usar o cliente configurado
    
    // Verificar se há uma sessão válida
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error || !session) {
      console.log('🔒 Sessão inválida, redirecionando para login')
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Verificar se o usuário existe na tabela users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, status, access_expires_at, role')
      .eq('id', session.user.id)
      .single()

    if (userError || !userData) {
      console.log('🔒 Usuário não encontrado na base de dados')
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
