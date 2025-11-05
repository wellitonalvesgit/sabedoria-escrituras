"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Loader2, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function CoursePurchaseCallbackPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Verificando pagamento...')

  useEffect(() => {
    verifyPayment()
  }, [])

  const verifyPayment = async () => {
    const transactionId = searchParams.get('transactionId')
    const identifier = searchParams.get('identifier')
    const courseId = searchParams.get('courseId')

    if (!transactionId || !identifier || !courseId) {
      setStatus('error')
      setMessage('Parâmetros inválidos')
      return
    }

    try {
      const response = await fetch(
        `/api/korvex/verify-payment?transactionId=${transactionId}&identifier=${identifier}`
      )

      const result = await response.json()

      if (result.success && result.payment?.status === 'confirmed') {
        setStatus('success')
        setMessage('Pagamento confirmado! Você já tem acesso ao curso.')
        setTimeout(() => {
          router.push(`/course/${courseId}`)
        }, 2000)
      } else {
        setStatus('error')
        setMessage(result.message || 'Pagamento ainda não confirmado. Aguarde ou verifique novamente.')
      }
    } catch (error) {
      console.error('Erro ao verificar pagamento:', error)
      setStatus('error')
      setMessage('Erro ao verificar pagamento. Tente novamente.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {status === 'loading' && 'Verificando Pagamento'}
            {status === 'success' && 'Pagamento Confirmado!'}
            {status === 'error' && 'Erro no Pagamento'}
          </CardTitle>
          <CardDescription className="text-center">
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {status === 'loading' && (
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          )}
          {status === 'success' && (
            <CheckCircle className="h-12 w-12 text-green-500" />
          )}
          {status === 'error' && (
            <XCircle className="h-12 w-12 text-red-500" />
          )}
          {status === 'success' && (
            <p className="text-sm text-muted-foreground text-center">
              Redirecionando para o curso...
            </p>
          )}
          {status === 'error' && (
            <Button
              onClick={() => router.back()}
              variant="outline"
            >
              Voltar
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

