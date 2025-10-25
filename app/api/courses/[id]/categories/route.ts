import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Atualiza as categorias de um curso
 *
 * PUT /api/courses/:id/categories
 * Body: { categoryIds: string[] }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params
    const { categoryIds } = await request.json()

    console.log('🔄 Atualizando categorias do curso:', courseId)
    console.log('🏷️ Novas categorias:', categoryIds)

    const cookieStore = await cookies()

    // Usar SERVICE_ROLE_KEY para ter permissões de admin
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

    // 1. Remover todas as categorias existentes
    console.log('🗑️ Removendo categorias antigas...')
    const { error: deleteError } = await supabase
      .from('course_categories')
      .delete()
      .eq('course_id', courseId)

    if (deleteError) {
      console.error('❌ Erro ao deletar categorias:', deleteError)
      return NextResponse.json(
        { error: 'Erro ao deletar categorias antigas', details: deleteError },
        { status: 500 }
      )
    }

    console.log('✅ Categorias antigas removidas')

    // 2. Inserir novas categorias (se houver)
    if (categoryIds && categoryIds.length > 0) {
      console.log('➕ Inserindo novas categorias...')

      const categoryRelations = categoryIds.map((categoryId: string) => ({
        course_id: courseId,
        category_id: categoryId
      }))

      console.log('📦 Relações a inserir:', categoryRelations)

      const { data, error: insertError } = await supabase
        .from('course_categories')
        .insert(categoryRelations)
        .select()

      if (insertError) {
        console.error('❌ Erro ao inserir categorias:', insertError)
        return NextResponse.json(
          { error: 'Erro ao inserir categorias', details: insertError },
          { status: 500 }
        )
      }

      console.log('✅ Categorias inseridas:', data)

      return NextResponse.json({
        success: true,
        message: 'Categorias atualizadas com sucesso',
        data
      })
    } else {
      console.log('⚠️ Nenhuma categoria para inserir')
      return NextResponse.json({
        success: true,
        message: 'Categorias removidas (nenhuma nova categoria)'
      })
    }
  } catch (error) {
    console.error('❌ Erro ao atualizar categorias:', error)
    return NextResponse.json(
      { error: 'Erro interno ao atualizar categorias' },
      { status: 500 }
    )
  }
}
