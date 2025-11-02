import { NextRequest, NextResponse } from 'next/server'
import { askClaude, generateSummary, askQuestionAboutContext } from '@/lib/claude'

/**
 * API Route para usar Claude
 * 
 * POST /api/claude
 * Body: { type: 'ask' | 'summary' | 'question', ... }
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, prompt, text, question, context, options } = body

    switch (type) {
      case 'ask': {
        if (!prompt) {
          return NextResponse.json(
            { error: 'Campo "prompt" é obrigatório' },
            { status: 400 }
          )
        }

        const response = await askClaude(prompt, options)
        return NextResponse.json({ response })
      }

      case 'summary': {
        if (!text) {
          return NextResponse.json(
            { error: 'Campo "text" é obrigatório' },
            { status: 400 }
          )
        }

        const summary = await generateSummary(text, options?.maxLength)
        return NextResponse.json({ summary })
      }

      case 'question': {
        if (!question || !context) {
          return NextResponse.json(
            { error: 'Campos "question" e "context" são obrigatórios' },
            { status: 400 }
          )
        }

        const answer = await askQuestionAboutContext(question, context)
        return NextResponse.json({ answer })
      }

      default:
        return NextResponse.json(
          { error: 'Tipo inválido. Use: "ask", "summary" ou "question"' },
          { status: 400 }
        )
    }
  } catch (error: any) {
    console.error('Erro na API Claude:', error)
    
    if (error.message?.includes('ANTHROPIC_API_KEY')) {
      return NextResponse.json(
        { 
          error: 'Chave da API Claude não configurada',
          message: 'Adicione ANTHROPIC_API_KEY no arquivo .env'
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Erro ao processar solicitação', message: error.message },
      { status: 500 }
    )
  }
}

// GET para testar se a configuração está correta
export async function GET() {
  try {
    // Verifica se a chave está configurada
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({
        configured: false,
        message: 'ANTHROPIC_API_KEY não está configurada'
      })
    }

    return NextResponse.json({
      configured: true,
      message: 'Claude API está configurada corretamente'
    })
  } catch (error: any) {
    return NextResponse.json({
      configured: false,
      error: error.message
    })
  }
}

