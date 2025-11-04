import { NextRequest, NextResponse } from 'next/server'
import { askQuestionAboutContext } from '@/lib/claude'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { SUPABASE_CONFIG } from '@/lib/supabase-config'

/**
 * POST /api/ai/ask
 * 
 * Faz uma pergunta sobre o conteúdo de um PDF usando Claude
 * 
 * Body:
 * {
 *   question: string
 *   pdf_id: string
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

    const { question, pdf_id } = await request.json()

    if (!question || !pdf_id) {
      return NextResponse.json(
        { error: 'Pergunta e pdf_id são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar conteúdo do PDF
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

    const { data: pdf, error: pdfError } = await supabase
      .from('course_pdfs')
      .select('text_content, title')
      .eq('id', pdf_id)
      .single()

    if (pdfError || !pdf) {
      return NextResponse.json(
        { error: 'PDF não encontrado' },
        { status: 404 }
      )
    }

    if (!pdf.text_content || pdf.text_content.length < 50) {
      return NextResponse.json(
        { error: 'PDF não possui conteúdo de texto suficiente' },
        { status: 400 }
      )
    }

    // Usar Claude para responder a pergunta
    const answer = await askQuestionAboutContext(
      question,
      pdf.text_content
    )

    return NextResponse.json({ 
      answer,
      pdf_title: pdf.title
    })
  } catch (error: any) {
    console.error('Erro ao processar pergunta:', error)
    
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
      { error: 'Erro ao processar pergunta', message: error.message },
      { status: 500 }
    )
  }
}

