'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, MessageSquare } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ClaudeQuestionAskerProps {
  pdfId: string
  pdfTitle?: string
}

/**
 * Componente para fazer perguntas sobre o conteúdo de um PDF usando Claude
 */
export function ClaudeQuestionAsker({
  pdfId,
  pdfTitle
}: ClaudeQuestionAskerProps) {
  const [pergunta, setPergunta] = useState('')
  const [resposta, setResposta] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const fazerPergunta = async () => {
    if (!pergunta.trim()) {
      setErro('Digite uma pergunta')
      return
    }

    setCarregando(true)
    setErro(null)
    setResposta(null)

    try {
      const response = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: pergunta.trim(),
          pdf_id: pdfId
        })
      })

      const data = await response.json()

      if (response.ok) {
        setResposta(data.answer)
        setPergunta('')
      } else {
        setErro(data.error || 'Erro ao processar pergunta')
      }
    } catch (error) {
      console.error('Erro:', error)
      setErro('Erro ao conectar com o servidor')
    } finally {
      setCarregando(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !carregando) {
      e.preventDefault()
      fazerPergunta()
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-[#F3C77A]" />
          Perguntar sobre o Conteúdo
          {pdfTitle && (
            <span className="text-sm font-normal text-gray-500 ml-2">
              - {pdfTitle}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={pergunta}
            onChange={(e) => {
              setPergunta(e.target.value)
              setErro(null)
            }}
            onKeyPress={handleKeyPress}
            placeholder="Ex: Qual é o tema principal deste capítulo?"
            disabled={carregando}
            className="flex-1"
          />
          <Button
            onClick={fazerPergunta}
            disabled={carregando || !pergunta.trim()}
            className="bg-[#F3C77A] text-black hover:bg-[#FFD88A] disabled:opacity-50"
          >
            {carregando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Perguntar'
            )}
          </Button>
        </div>

        {erro && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {erro}
          </div>
        )}

        {resposta && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-blue-900 mb-2">Resposta:</h4>
                <p className="text-blue-800 whitespace-pre-wrap leading-relaxed">
                  {resposta}
                </p>
              </div>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-500">
          💡 A IA analisa o conteúdo do PDF para responder sua pergunta
        </p>
      </CardContent>
    </Card>
  )
}

