'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ClaudeSummaryGeneratorProps {
  courseId: string
  pdfId: string
  onSummaryGenerated?: () => void
}

/**
 * Componente para gerar resumos automaticamente usando Claude AI
 */
export function ClaudeSummaryGenerator({
  courseId,
  pdfId,
  onSummaryGenerated
}: ClaudeSummaryGeneratorProps) {
  const [texto, setTexto] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)

  const gerarResumo = async () => {
    if (!texto.trim() || texto.trim().length < 100) {
      setErro('O texto deve ter pelo menos 100 caracteres')
      return
    }

    setCarregando(true)
    setErro(null)
    setSucesso(false)

    try {
      const response = await fetch('/api/summaries/generate-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: courseId,
          pdf_id: pdfId,
          text_content: texto.trim()
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSucesso(true)
        setTexto('')
        if (onSummaryGenerated) {
          onSummaryGenerated()
        }
        
        // Resetar sucesso após 3 segundos
        setTimeout(() => setSucesso(false), 3000)
      } else {
        setErro(data.error || 'Erro ao gerar resumo')
      }
    } catch (error) {
      console.error('Erro:', error)
      setErro('Erro ao conectar com o servidor')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#F3C77A]" />
          Gerar Resumo com IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Cole o texto que deseja resumir (mínimo 100 caracteres)
          </label>
          <Textarea
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value)
              setErro(null)
            }}
            placeholder="Cole aqui o texto do PDF ou selecione um trecho que deseja resumir..."
            rows={8}
            className="resize-none"
          />
          <p className="text-xs text-gray-500">
            {texto.length} caracteres
          </p>
        </div>

        {erro && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {erro}
          </div>
        )}

        {sucesso && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            ✅ Resumo gerado com sucesso! Verifique na aba de resumos.
          </div>
        )}

        <Button
          onClick={gerarResumo}
          disabled={carregando || texto.trim().length < 100}
          className="w-full bg-[#F3C77A] text-black hover:bg-[#FFD88A] disabled:opacity-50"
        >
          {carregando ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Gerando resumo com IA...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Gerar Resumo Automaticamente
            </>
          )}
        </Button>

        <p className="text-xs text-gray-500 text-center">
          A IA irá criar um resumo e um título automaticamente
        </p>
      </CardContent>
    </Card>
  )
}

