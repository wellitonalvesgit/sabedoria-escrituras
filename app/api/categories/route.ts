import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Cache em memória para otimização de performance
let categoriesCache: { data: any[], timestamp: number } | null = null
const CACHE_TTL = 10 * 60 * 1000 // 10 minutos (categorias mudam raramente)

// GET /api/categories - Listar todas as categorias
export async function GET(request: NextRequest) {
  try {
    // Verificar cache primeiro
    if (categoriesCache && (Date.now() - categoriesCache.timestamp) < CACHE_TTL) {
      return NextResponse.json({ categories: categoriesCache.data }, {
        headers: {
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
        }
      })
    }

    const client = supabase

    if (!client) {
      throw new Error('Supabase client not configured')
    }

    // Buscar categorias
    const { data: categories, error } = await client
      .from('categories')
      .select('id, name, slug, display_as_carousel, display_order, color, icon')
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Erro ao buscar categorias:', error)
      return NextResponse.json({ error: 'Erro ao buscar categorias' }, { status: 500 })
    }

    // Atualizar cache
    categoriesCache = { data: categories || [], timestamp: Date.now() }

    return NextResponse.json({ categories }, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
      }
    })
  } catch (error) {
    console.error('Erro na API de categorias:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// Função para invalidar o cache (útil após criar/atualizar categorias)
export function invalidateCategoriesCache() {
  categoriesCache = null
}
