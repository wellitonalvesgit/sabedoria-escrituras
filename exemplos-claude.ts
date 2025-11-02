/**
 * EXEMPLOS DE CÓDIGO - Claude API
 * 
 * Este arquivo contém exemplos práticos de como usar o Claude no projeto
 * Copie e adapte conforme necessário
 */

// ============================================
// EXEMPLO 1: Uso Básico no Servidor
// ============================================

import { askClaude, generateSummary } from '@/lib/claude'

// Exemplo 1.1: Fazer uma pergunta simples
export async function exemploPerguntaSimples() {
  const resposta = await askClaude('Explique o que são parábolas bíblicas')
  console.log(resposta)
  return resposta
}

// Exemplo 1.2: Gerar resumo de texto
export async function exemploResumo(texto: string) {
  const resumo = await generateSummary(texto, 100) // 100 palavras
  return resumo
}

// Exemplo 1.3: Personalizar modelo e tokens
export async function exemploAvancado(prompt: string) {
  const resposta = await askClaude(prompt, {
    model: 'claude-3-5-sonnet-20241022',
    maxTokens: 2048,
    system: 'Você é um especialista em estudos bíblicos e teologia.'
  })
  return resposta
}

// ============================================
// EXEMPLO 2: Gerar Resumo Automático de PDF
// ============================================

import { generateSummary } from '@/lib/claude'

export async function gerarResumoAutomaticoPDF(
  textoPDF: string,
  cursoId: string,
  pdfId: string
) {
  // Gerar resumo com Claude
  const resumoAutomatico = await generateSummary(textoPDF, 200)
  
  // Criar título automático baseado no resumo
  const tituloPrompt = `Crie um título curto e descritivo (máximo 60 caracteres) para este resumo: ${resumoAutomatico.substring(0, 300)}`
  const titulo = await askClaude(tituloPrompt, {
    maxTokens: 50
  })
  
  return {
    title: titulo.trim(),
    content: resumoAutomatico,
    course_id: cursoId,
    pdf_id: pdfId
  }
}

// ============================================
// EXEMPLO 3: API Route para Gerar Resumo com IA
// ============================================

/*
// app/api/summaries/generate-ai/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { generateSummary, askClaude } from '@/lib/claude'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    // Autenticação
    const cookieStore = await cookies()
    const supabaseAnon = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
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

    if (!text_content || text_content.length < 100) {
      return NextResponse.json(
        { error: 'Texto muito curto para gerar resumo' },
        { status: 400 }
      )
    }

    // Gerar resumo com Claude
    const summaryContent = await generateSummary(text_content, 250)
    
    // Gerar título automático
    const titlePrompt = `Crie um título curto (máximo 60 caracteres) para este resumo de conteúdo bíblico: ${summaryContent.substring(0, 300)}`
    const title = await askClaude(titlePrompt, { maxTokens: 50 })

    // Salvar no banco (usando SERVICE_ROLE_KEY)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
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
        title: title.trim().replace(/['"]/g, ''),
        content: summaryContent,
        highlight_ids: []
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao salvar resumo:', error)
      return NextResponse.json({ error: 'Erro ao salvar resumo' }, { status: 500 })
    }

    return NextResponse.json({ summary }, { status: 201 })
  } catch (error: any) {
    console.error('Erro ao gerar resumo:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar resumo', message: error.message },
      { status: 500 }
    )
  }
}
*/

// ============================================
// EXEMPLO 4: Componente React com Claude
// ============================================

/*
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'

export function GeradorResumoIA() {
  const [texto, setTexto] = useState('')
  const [resumo, setResumo] = useState('')
  const [carregando, setCarregando] = useState(false)

  const gerarResumo = async () => {
    if (!texto.trim()) return

    setCarregando(true)
    try {
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'summary',
          text: texto,
          options: { maxLength: 150 }
        })
      })

      const data = await response.json()
      if (response.ok) {
        setResumo(data.summary)
      } else {
        alert('Erro: ' + data.error)
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao gerar resumo')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="space-y-4 p-4">
      <Textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Cole o texto aqui..."
        rows={10}
      />
      <Button
        onClick={gerarResumo}
        disabled={carregando || !texto.trim()}
        className="bg-[#F3C77A] text-black hover:bg-[#FFD88A]"
      >
        {carregando ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Gerando...
          </>
        ) : (
          'Gerar Resumo com IA'
        )}
      </Button>
      {resumo && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-bold mb-2">Resumo Gerado:</h3>
          <p>{resumo}</p>
        </div>
      )}
    </div>
  )
}
*/

// ============================================
// EXEMPLO 5: Sistema de Perguntas sobre Conteúdo
// ============================================

/*
// app/api/ai/ask/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { askQuestionAboutContext } from '@/lib/claude'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    // Autenticação
    const cookieStore = await cookies()
    const supabaseAnon = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
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

    const { data: { user } } = await supabaseAnon.auth.getUser()
    if (!user) {
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
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
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

    // Usar Claude para responder
    const answer = await askQuestionAboutContext(
      question,
      pdf.text_content || ''
    )

    return NextResponse.json({ answer })
  } catch (error: any) {
    console.error('Erro:', error)
    return NextResponse.json(
      { error: 'Erro ao processar pergunta' },
      { status: 500 }
    )
  }
}
*/

// ============================================
// EXEMPLO 6: Melhorar Resumo Existente com IA
// ============================================

export async function melhorarResumoExistente(resumoOriginal: string) {
  const prompt = `Melhore e expanda este resumo, mantendo a essência mas tornando-o mais claro e completo:\n\n${resumoOriginal}`
  
  const resumoMelhorado = await askClaude(prompt, {
    maxTokens: 1000,
    system: 'Você é um especialista em criar resumos educacionais claros e informativos.'
  })
  
  return resumoMelhorado
}

// ============================================
// EXEMPLO 7: Extrair Insights de Texto Bíblico
// ============================================

export async function extrairInsights(textoBiblico: string) {
  const prompt = `Analise o seguinte texto bíblico e extraia:
1. Tema principal
2. Pontos-chave (máximo 5)
3. Aplicação prática para a vida moderna

Texto:\n${textoBiblico}`

  const insights = await askClaude(prompt, {
    maxTokens: 1500,
    system: 'Você é um estudioso bíblico especializado em extrair insights práticos das Escrituras.'
  })

  return insights
}

// ============================================
// EXEMPLO 8: Comparar Dois Textos
// ============================================

export async function compararTextos(texto1: string, texto2: string) {
  const prompt = `Compare os seguintes dois textos bíblicos e identifique:
1. Semelhanças
2. Diferenças
3. Contexto histórico de cada um

Texto 1:\n${texto1}\n\nTexto 2:\n${texto2}`

  const comparacao = await askClaude(prompt, {
    maxTokens: 2000,
    system: 'Você é um especialista em análise comparativa de textos bíblicos.'
  })

  return comparacao
}

// ============================================
// EXEMPLO 9: Chat com Claude sobre Conteúdo
// ============================================

/*
// app/api/ai/chat/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { askQuestionAboutContext } from '@/lib/claude'

export async function POST(request: NextRequest) {
  try {
    const { message, context, conversationHistory = [] } = await request.json()

    if (!message || !context) {
      return NextResponse.json(
        { error: 'Mensagem e contexto são obrigatórios' },
        { status: 400 }
      )
    }

    // Construir histórico de conversa
    let fullPrompt = `Contexto:\n${context}\n\n`
    
    if (conversationHistory.length > 0) {
      fullPrompt += 'Histórico da conversa:\n'
      conversationHistory.forEach((msg: { role: string; content: string }) => {
        fullPrompt += `${msg.role}: ${msg.content}\n`
      })
      fullPrompt += '\n'
    }

    fullPrompt += `Pergunta atual: ${message}`

    const answer = await askQuestionAboutContext(message, context)

    return NextResponse.json({ answer })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao processar mensagem' },
      { status: 500 }
    )
  }
}
*/

// ============================================
// EXEMPLO 10: Uso em Server Component
// ============================================

/*
// app/pages/exemplo-server-component.tsx

import { askClaude } from '@/lib/claude'

export default async function ExemploServerComponent() {
  // Funciona em Server Components do Next.js
  const resposta = await askClaude(
    'Explique o significado das parábolas de Jesus',
    {
      maxTokens: 500
    }
  )

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Resposta da IA</h1>
      <div className="prose max-w-none">
        <p>{resposta}</p>
      </div>
    </div>
  )
}
*/

