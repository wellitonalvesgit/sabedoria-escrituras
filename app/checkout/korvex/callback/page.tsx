"use client"

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function KorvexCallbackPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    verifyPayment()
  }, [])

  const verifyPayment = async () => {
    try {
      const transactionId = searchParams.get('transactionId')
      const identifier = searchParams.get('identifier')

      if (!transactionId || !identifier) {
        setStatus('error')
        setMessage('Parâmetros inválidos')
        return
      }

      // Verificar status do pagamento
      const response = await fetch(`/api/korvex/verify-payment?transactionId=${transactionId}&identifier=${identifier}`)
      const result = await response.json()

      if (result.success && result.payment?.status === 'confirmed') {
        setStatus('success')
        setMessage('Pagamento confirmado! Você já tem acesso ao plano.')
        
        // Aguardar 2 segundos e redirecionar
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      } else {
        setStatus('error')
        setMessage(result.message || 'Pagamento ainda não confirmado. Aguarde ou verifique novamente.')
      }
    } catch (error) {
      setStatus('error')
      setMessage('Erro ao verificar pagamento. Tente novamente.')
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {status === 'loading' && 'Verificando pagamento...'}
            {status === 'success' && 'Pagamento confirmado!'}
            {status === 'error' && 'Aguardando confirmação'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-center text-muted-foreground">
                Aguarde enquanto verificamos seu pagamento...
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-4">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <p className="text-center text-green-600 font-medium">
                {message}
              </p>
              <p className="text-sm text-center text-muted-foreground">
                Redirecionando para o dashboard...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-4">
              <XCircle className="h-12 w-12 text-yellow-500" />
              <p className="text-center text-muted-foreground">
                {message}
              </p>
              <div className="flex gap-2">
                <Button onClick={verifyPayment} variant="outline">
                  Verificar novamente
                </Button>
                <Button onClick={() => router.push('/dashboard')}>
                  Ir para Dashboard
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

