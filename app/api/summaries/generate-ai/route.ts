import { NextRequest, NextResponse } from 'next/server'
import { generateSummary, askClaude } from '@/lib/claude'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { SUPABASE_CONFIG } from '@/lib/supabase-config'

/**
 * POST /api/summaries/generate-ai
 * 
 * Gera um resumo automaticamente usando Claude AI
 * 
 * Body:
 * {
 *   course_id: string
 *   pdf_id: string
 *   text_content: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Autenticação
    const cookieStore = await cookies()
    const supabaseAnon = createServerClient(
      SUPABASE_CONFIG.url,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          }
        }
      }
    )

    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { course_id, pdf_id, text_content } = await request.json()

    if (!course_id || !pdf_id || !text_content) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: course_id, pdf_id, text_content' },
        { status: 400 }
      )
    }

    if (text_content.length < 100) {
      return NextResponse.json(
        { error: 'Texto muito curto para gerar resumo (mínimo 100 caracteres)' },
        { status: 400 }
      )
    }

    // Gerar resumo com Claude
    const summaryContent = await generateSummary(text_content, 250)
    
    // Gerar título automático baseado no resumo
    const titlePrompt = `Crie um título curto e descritivo (máximo 60 caracteres, sem aspas) para este resumo de conteúdo bíblico: ${summaryContent.substring(0, 300)}`
    
    let title: string
    try {
      const titleResponse = await askClaude(titlePrompt, { maxTokens: 50 })
      title = titleResponse.trim().replace(/['"]/g, '').substring(0, 60)
    } catch (error) {
      // Se falhar, usar título padrão
      title = 'Resumo Gerado por IA'
    }

    // Salvar no banco (usando SERVICE_ROLE_KEY)
    const supabase = createServerClient(
      SUPABASE_CONFIG.url,
      SUPABASE_CONFIG.serviceRoleKey,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          }
        }
      }
    )

    const { data: summary, error } = await supabase
      .from('summaries')
      .insert({
        user_id: user.id,
        course_id,
        pdf_id,
        title,
        content: summaryContent,
        highlight_ids: []
      })
      .select(`
        *,
        courses (
          id,
          title,
          slug
        ),
        course_pdfs (
          id,
          title,
          volume
        )
      `)
      .single()

    if (error) {
      console.error('Erro ao salvar resumo:', error)
      return NextResponse.json({ error: 'Erro ao salvar resumo' }, { status: 500 })
    }

    return NextResponse.json({ summary }, { status: 201 })
  } catch (error: any) {
    console.error('Erro ao gerar resumo com IA:', error)
    
    if (error.message?.includes('ANTHROPIC_API_KEY')) {
      return NextResponse.json(
        { 
          error: 'Claude API não configurada',
          message: 'Adicione ANTHROPIC_API_KEY no arquivo .env'
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Erro ao gerar resumo', message: error.message },
      { status: 500 }
    )
  }
}

