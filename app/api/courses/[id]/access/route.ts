import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { userCanAccessCourse } from '@/lib/access-control'
import { SUPABASE_CONFIG } from '@/lib/supabase-config'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params
    const cookieStore = await cookies()

    const supabaseAnon = createServerClient(
      SUPABASE_CONFIG.url,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          canAccess: false,
          reason: 'no_access' as const,
          message: 'Você precisa estar logado para acessar este curso.'
        },
        { status: 401 }
      )
    }

    const supabase = createServerClient(
      SUPABASE_CONFIG.url,
      SUPABASE_CONFIG.serviceRoleKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    // Buscar dados do usuário para verificar role
    const { data: userData } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', user.id)
      .single()

    // Se for admin, liberar acesso total
    if (userData?.role === 'admin') {
      return NextResponse.json({
        canAccess: true,
        reason: 'admin_access' as const,
        message: 'Acesso administrativo concedido',
        course: { id: courseId, title: '', is_free: false }
      })
    }

    // Buscar dados completos do curso (incluindo categoria e preço)
    const { data: courseData } = await supabase
      .from('courses')
      .select(`
        id,
        title,
        price,
        course_categories (
          categories (
            slug
          )
        )
      `)
      .eq('id', courseId)
      .single()

    // Usar a função correta que verifica allowed_courses, blocked_courses, etc.
    const accessResult = await userCanAccessCourse(user.id, courseId, supabase)

    return NextResponse.json({
      canAccess: accessResult.canAccess,
      reason: accessResult.reason || 'no_access',
      message: accessResult.message,
      category: accessResult.category,
      course: accessResult.course ? {
        id: accessResult.course.id,
        title: accessResult.course.title,
        is_free: accessResult.course.is_free,
        price: courseData?.price || null
      } : undefined,
      subscription: accessResult.subscription ? {
        status: accessResult.subscription.status,
        trial_ends_at: accessResult.subscription.trial_ends_at,
        current_period_end: accessResult.subscription.current_period_end
      } : undefined
    })
  } catch (error) {
    console.error('Erro ao verificar acesso ao curso:', error)
    return NextResponse.json(
      { canAccess: false, reason: 'Erro ao verificar acesso.' },
      { status: 500 }
    )
  }
}
