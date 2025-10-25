"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { CheckCircle2, Copy, Download, Loader2, QrCode, Barcode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const paymentId = searchParams.get('payment_id')
  const method = searchParams.get('method')

  const [loading, setLoading] = useState(true)
  const [payment, setPayment] = useState<any>(null)

  useEffect(() => {
    if (paymentId) {
      fetchPayment()
    }
  }, [paymentId])

  const fetchPayment = async () => {
    try {
      const { createClient } = await import('@/lib/supabase')
      const supabase = createClient()

      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single()

      if (error) throw error
      setPayment(data)
    } catch (error) {
      console.error('Erro ao carregar pagamento:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyPix = () => {
    if (payment?.pix_copy_paste) {
      navigator.clipboard.writeText(payment.pix_copy_paste)
      alert('Código PIX copiado!')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-12">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Assinatura Criada!</h1>
          <p className="text-muted-foreground">
            {method === 'pix' && 'Escaneie o QR Code ou copie o código PIX para finalizar o pagamento'}
            {method === 'boleto' && 'Seu boleto está pronto! Pague até o vencimento'}
            {method === 'credit_card' && 'Seu pagamento está sendo processado'}
          </p>
        </div>

        {/* Payment Details */}
        {method === 'pix' && payment?.pix_qrcode && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Pagamento via PIX
              </CardTitle>
              <CardDescription>
                Escaneie o QR Code com o app do seu banco
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* QR Code */}
              <div className="flex justify-center p-6 bg-white rounded-lg">
                <img
                  src={`data:image/png;base64,${payment.pix_qrcode}`}
                  alt="QR Code PIX"
                  className="w-64 h-64"
                />
              </div>

              {/* Copy/Paste Code */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Ou copie o código PIX:
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={payment.pix_copy_paste || ''}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button onClick={handleCopyPix} variant="outline">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="text-xs text-muted-foreground text-center">
                O PIX é válido por 24 horas. Após o pagamento, seu acesso será liberado automaticamente.
              </div>
            </CardContent>
          </Card>
        )}

        {method === 'boleto' && payment?.boleto_url && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Barcode className="h-5 w-5" />
                Boleto Bancário
              </CardTitle>
              <CardDescription>
                Pague em qualquer banco ou lotérica
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor:</span>
                  <span className="font-semibold">
                    R$ {payment.amount.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vencimento:</span>
                  <span className="font-semibold">
                    {new Date(payment.due_date).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>

              <Button asChild className="w-full" size="lg">
                <a href={payment.boleto_url} target="_blank" rel="noopener noreferrer">
                  <Download className="mr-2 h-4 w-4" />
                  Baixar Boleto
                </a>
              </Button>

              <div className="text-xs text-muted-foreground text-center">
                Após o pagamento (1-3 dias úteis), seu acesso será liberado automaticamente.
              </div>
            </CardContent>
          </Card>
        )}

        {method === 'credit_card' && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Pagamento Processado</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Seu pagamento está sendo processado. Você receberá um e-mail de confirmação em breve.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Próximos Passos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">1</span>
              </div>
              <div>
                <div className="font-medium">
                  {method === 'pix' && 'Realize o pagamento via PIX'}
                  {method === 'boleto' && 'Pague o boleto até o vencimento'}
                  {method === 'credit_card' && 'Aguarde a confirmação'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {method === 'pix' && 'Use o app do seu banco para escanear o QR Code'}
                  {method === 'boleto' && 'Em qualquer banco, lotérica ou app de pagamentos'}
                  {method === 'credit_card' && 'Processamento instantâneo'}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">2</span>
              </div>
              <div>
                <div className="font-medium">Receba confirmação por e-mail</div>
                <div className="text-sm text-muted-foreground">
                  Enviaremos um e-mail assim que o pagamento for confirmado
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">3</span>
              </div>
              <div>
                <div className="font-medium">Comece a estudar!</div>
                <div className="text-sm text-muted-foreground">
                  Acesse todos os cursos premium imediatamente
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Button asChild variant="outline" className="flex-1">
            <Link href="/pricing">Ver outros planos</Link>
          </Button>
          <Button asChild className="flex-1">
            <Link href="/dashboard">Ir para Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>
}

function Input({ value, readOnly, className }: { value: string; readOnly?: boolean; className?: string }) {
  return <input value={value} readOnly={readOnly} className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ${className}`} />
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
