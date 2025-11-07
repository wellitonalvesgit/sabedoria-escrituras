import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { SUPABASE_CONFIG } from '@/lib/supabase-config'

/**
 * ✅ OTIMIZAÇÃO FASE 2: Endpoint unificado para o dashboard
 *
 * Antes: 3 chamadas separadas (courses, categories, purchases)
 * Depois: 1 chamada unificada
 *
 * Ganho esperado: -40-50% no tempo de carregamento inicial
 */

// Cache em memória
let dashboardCache: { data: any, timestamp: number } | null = null
const CACHE_TTL = 3 * 60 * 1000 // 3 minutos

export async function GET(request: NextRequest) {
  try {
    // Obter usuário autenticado
    const cookieStore = await cookies()
    const supabaseClient = createServerClient(
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

    const { data: { user } } = await supabaseClient.auth.getUser()

    // Verificar cache (apenas para usuários não autenticados)
    if (!user && dashboardCache && (Date.now() - dashboardCache.timestamp) < CACHE_TTL) {
      return NextResponse.json(dashboardCache.data, {
        headers: {
          'Cache-Control': 'public, s-maxage=180, stale-while-revalidate=300',
        }
      })
    }

    // ✅ Buscar TUDO em paralelo para máxima performance
    const [coursesResult, categoriesResult, purchasesResult] = await Promise.all([
      // 1. Cursos (sem text_content para reduzir payload)
      supabase
        .from('courses')
        .select(`
          id,
          slug,
          title,
          description,
          author,
          pages,
          reading_time_minutes,
          cover_url,
          status,
          price,
          created_at,
          course_pdfs!inner (
            id,
            volume,
            title,
            url,
            pages,
            reading_time_minutes,
            display_order,
            cover_url,
            youtube_url,
            audio_url,
            parent_volume_id
          ),
          course_categories (
            category_id,
            categories (
              id,
              name,
              slug,
              color
            )
          )
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false }),

      // 2. Categorias
      supabase
        .from('categories')
        .select('id, name, slug, color, icon, display_order, display_as_carousel')
        .order('display_order', { ascending: true }),

      // 3. Compras do usuário (apenas se autenticado)
      user
        ? supabase
            .from('course_purchases')
            .select('course_id, purchased_at')
            .eq('user_id', user.id)
        : Promise.resolve({ data: [], error: null })
    ])

    // Verificar erros
    if (coursesResult.error) {
      console.error('Erro ao buscar cursos:', coursesResult.error)
      return NextResponse.json({ error: 'Erro ao buscar cursos' }, { status: 500 })
    }

    if (categoriesResult.error) {
      console.error('Erro ao buscar categorias:', categoriesResult.error)
      return NextResponse.json({ error: 'Erro ao buscar categorias' }, { status: 500 })
    }

    // Montar resposta
    const responseData = {
      courses: coursesResult.data || [],
      categories: categoriesResult.data || [],
      purchases: purchasesResult.data || [],
      user: user ? {
        id: user.id,
        email: user.email,
      } : null
    }

    // Atualizar cache (apenas para não autenticados)
    if (!user) {
      dashboardCache = { data: responseData, timestamp: Date.now() }
    }

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': user
          ? 'private, no-cache'
          : 'public, s-maxage=180, stale-while-revalidate=300',
      }
    })

  } catch (error) {
    console.error('Erro na API de dashboard:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// Função para invalidar cache
export function invalidateDashboardCache() {
  dashboardCache = null
}
