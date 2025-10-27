import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const courseId = params.id
    console.log('🔍 Verificando acesso ao curso:', courseId)
    const cookieStore = cookies()

    // Verificar se SERVICE_ROLE_KEY está disponível
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ SERVICE_ROLE_KEY não está configurada')
      // Definir SERVICE_ROLE_KEY diretamente no código (apenas para desenvolvimento)
      if (process.env.NODE_ENV === 'development') {
        process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxdnFwa21qZHR6ZW9jbG5kd2hqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTA5MjY4NiwiZXhwIjoyMDc2NjY4Njg2fQ.0sBklMOxA7TsCiCP8_8oxjumxK43jj8PRia1LE_Mybs'
        console.log('✅ SERVICE_ROLE_KEY definida manualmente para desenvolvimento')
      }
    } else {
      console.log('✅ SERVICE_ROLE_KEY está configurada')
    }

    // IMPORTANTE: Usar SERVICE_ROLE_KEY para bypassar RLS
    // Isso é necessário porque precisamos verificar dados do usuário
    // independentemente das políticas RLS
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
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

    // Verificar sessão do usuário
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    console.log('📊 Dados da sessão:', { 
      hasSession: !!session, 
      hasUser: !!session?.user,
      error: sessionError?.message,
      userId: session?.user?.id,
      userEmail: session?.user?.email
    })

    if (sessionError || !session) {
      console.error('❌ Erro na sessão ou sessão não encontrada:', sessionError?.message)
      return NextResponse.json({
        canAccess: false,
        reason: 'no_access',
        message: 'Usuário não autenticado'
      }, { status: 401 })
    }

    // Buscar curso
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title, is_free')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      return NextResponse.json({
        canAccess: false,
        reason: 'no_access',
        message: 'Curso não encontrado'
      }, { status: 404 })
    }

    // Buscar dados do usuário
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, status, role, access_expires_at, allowed_courses, blocked_courses')
      .eq('id', session.user.id)
      .single()

    console.log('📊 Dados do usuário:', {
      hasUserData: !!userData,
      error: userError?.message,
      userEmail: userData?.email,
      userRole: userData?.role,
      userStatus: userData?.status,
      allowedCourses: userData?.allowed_courses?.length || 0,
      blockedCourses: userData?.blocked_courses?.length || 0,
      accessExpiresAt: userData?.access_expires_at
    })

    if (userError || !userData) {
      console.error('❌ Erro ao buscar dados do usuário:', userError?.message)
      return NextResponse.json({
        canAccess: false,
        reason: 'no_access',
        message: 'Erro ao verificar permissões'
      }, { status: 500 })
    }

    // Verificar se o usuário está ativo
    if (userData.status !== 'active') {
      return NextResponse.json({
        canAccess: false,
        reason: 'no_access',
        message: 'Sua conta está inativa'
      }, { status: 403 })
    }

    // Verificar se o acesso não expirou
    if (userData.access_expires_at) {
      const expirationDate = new Date(userData.access_expires_at)
      const now = new Date()
      
      if (expirationDate < now) {
        return NextResponse.json({
          canAccess: false,
          reason: 'no_access',
          message: 'Seu acesso expirou'
        }, { status: 403 })
      }
    }

    // Verificar se o usuário é admin
    if (userData.role === 'admin') {
      return NextResponse.json({
        canAccess: true,
        reason: 'premium_access',
        message: 'Acesso administrativo',
        course
      })
    }

    // Verificar se o curso é gratuito
    if (course.is_free) {
      return NextResponse.json({
        canAccess: true,
        reason: 'free_course',
        message: 'Curso gratuito',
        course
      })
    }

    // Verificar se o curso está na lista de cursos bloqueados
    if (userData.blocked_courses && userData.blocked_courses.includes(courseId)) {
      return NextResponse.json({
        canAccess: false,
        reason: 'no_access',
        message: 'Acesso bloqueado para este curso',
        course
      }, { status: 403 })
    }

    // Verificar se o curso está na lista de cursos permitidos
    const isCourseAllowed = userData.allowed_courses && userData.allowed_courses.includes(courseId);
    console.log('🔍 Curso está na lista de permitidos?', isCourseAllowed ? 'SIM' : 'NÃO')
    
    if (isCourseAllowed) {
      // Verificar se o usuário tem assinatura
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('status, trial_ends_at, current_period_end')
        .eq('user_id', userData.id)
        .in('status', ['trial', 'active'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      console.log('📊 Dados da assinatura:', {
        hasSubscription: !!subscription,
        status: subscription?.status,
        trialEndsAt: subscription?.trial_ends_at,
        currentPeriodEnd: subscription?.current_period_end
      })

      if (subscription) {
        // Verificar se é trial ou assinatura normal
        const reason = subscription.status === 'trial' ? 'trial_access' : 'premium_access'
        
        console.log('✅ Acesso permitido via assinatura:', reason)
        return NextResponse.json({
          canAccess: true,
          reason,
          message: reason === 'trial_access' ? 'Acesso via período de teste' : 'Assinatura ativa',
          course,
          subscription
        })
      }

      // Se não tem assinatura mas o curso está na lista de permitidos
      console.log('✅ Acesso permitido via lista de cursos permitidos')
      return NextResponse.json({
        canAccess: true,
        reason: 'premium_access',
        message: 'Acesso permitido',
        course
      })
    }

    // Por padrão, negar acesso
    return NextResponse.json({
      canAccess: false,
      reason: 'no_access',
      message: 'Este curso requer assinatura premium',
      course
    }, { status: 403 })

  } catch (error) {
    console.error('Erro na API de acesso a curso:', error)
    return NextResponse.json({
      canAccess: false,
      reason: 'no_access',
      message: 'Erro interno do servidor'
    }, { status: 500 })
  }
}