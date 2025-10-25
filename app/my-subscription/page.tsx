"use client"

import { useState, useEffect } from "react"
import { Crown, Calendar, CreditCard, AlertCircle, Check, X, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Subscription {
  id: string
  status: 'trial' | 'active' | 'past_due' | 'canceled' | 'expired'
  trial_ends_at?: string
  current_period_start?: string
  current_period_end?: string
  canceled_at?: string
  plan: {
    name: string
    price_monthly: number
    price_yearly: number
    features: string[]
  }
}

interface Payment {
  id: string
  amount: number
  status: string
  payment_method: string
  created_at: string
  paid_at?: string
}

export default function MySubscriptionPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchSubscriptionData()
  }, [])

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true)

      // Buscar assinatura
      const subResponse = await fetch('/api/subscriptions/current')
      if (subResponse.ok) {
        const data = await subResponse.json()
        setSubscription(data.subscription)
      }

      // Buscar pagamentos
      const paymentsResponse = await fetch('/api/subscriptions/payments')
      if (paymentsResponse.ok) {
        const data = await paymentsResponse.json()
        setPayments(data.payments || [])
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!subscription) return

    const confirmed = confirm(
      'Tem certeza que deseja cancelar sua assinatura? Você terá acesso até o final do período atual.'
    )

    if (!confirmed) return

    try {
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST'
      })

      if (response.ok) {
        alert('Assinatura cancelada com sucesso')
        await fetchSubscriptionData()
      } else {
        alert('Erro ao cancelar assinatura')
      }
    } catch (error) {
      alert('Erro ao cancelar assinatura')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'trial':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Período de Teste</Badge>
      case 'active':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Ativo</Badge>
      case 'past_due':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Pagamento Atrasado</Badge>
      case 'canceled':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Cancelado</Badge>
      case 'expired':
        return <Badge className="bg-gray-500/10 text-gray-600 border-gray-500/20">Expirado</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><Check className="h-3 w-3 mr-1" />Confirmado</Badge>
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Pendente</Badge>
      case 'overdue':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Vencido</Badge>
      case 'refunded':
        return <Badge className="bg-gray-500/10 text-gray-600 border-gray-500/20">Reembolsado</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          <span>Carregando...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/40 bg-background/95 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
                  <Crown className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-semibold tracking-tight">Minha Assinatura</span>
              </div>
            </div>
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-8 lg:px-8">
        {/* Subscription Card */}
        {subscription ? (
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-3">
                    <Crown className="h-6 w-6 text-amber-500" />
                    {subscription.plan.name}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {getStatusBadge(subscription.status)}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">
                    R$ {subscription.plan.price_monthly.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">por mês</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status Info */}
              {subscription.status === 'trial' && subscription.trial_ends_at && (
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-600">Período de Teste</h3>
                  </div>
                  <p className="text-sm">
                    Seu teste gratuito termina em{' '}
                    <strong>{new Date(subscription.trial_ends_at).toLocaleDateString('pt-BR')}</strong>
                  </p>
                </div>
              )}

              {subscription.status === 'active' && subscription.current_period_end && (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Check className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold text-green-600">Assinatura Ativa</h3>
                  </div>
                  <p className="text-sm">
                    Próxima cobrança em{' '}
                    <strong>{new Date(subscription.current_period_end).toLocaleDateString('pt-BR')}</strong>
                  </p>
                </div>
              )}

              {subscription.status === 'past_due' && (
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <h3 className="font-semibold text-yellow-600">Pagamento Pendente</h3>
                  </div>
                  <p className="text-sm">
                    Existe um pagamento pendente. Regularize para manter o acesso aos conteúdos premium.
                  </p>
                  <Link href="/pricing" className="mt-3 inline-block">
                    <Button size="sm" variant="outline" className="border-yellow-600/20 text-yellow-600">
                      Regularizar Pagamento
                    </Button>
                  </Link>
                </div>
              )}

              {subscription.status === 'canceled' && subscription.canceled_at && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <X className="h-5 w-5 text-red-600" />
                    <h3 className="font-semibold text-red-600">Assinatura Cancelada</h3>
                  </div>
                  <p className="text-sm">
                    Cancelada em {new Date(subscription.canceled_at).toLocaleDateString('pt-BR')}
                    {subscription.current_period_end && (
                      <>
                        <br />
                        Você terá acesso até {new Date(subscription.current_period_end).toLocaleDateString('pt-BR')}
                      </>
                    )}
                  </p>
                  <Link href="/pricing" className="mt-3 inline-block">
                    <Button size="sm">Reativar Assinatura</Button>
                  </Link>
                </div>
              )}

              {/* Features */}
              <div>
                <h3 className="font-semibold mb-3">Recursos Inclusos</h3>
                <ul className="space-y-2">
                  {subscription.plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Actions */}
              {subscription.status === 'active' && (
                <div className="pt-4 border-t flex gap-3">
                  <Link href="/pricing" className="flex-1">
                    <Button variant="outline" className="w-full">
                      Mudar Plano
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="flex-1 text-red-600 border-red-600/20 hover:bg-red-500/10"
                    onClick={handleCancelSubscription}
                  >
                    Cancelar Assinatura
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-8">
            <CardContent className="py-12 text-center">
              <Crown className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma Assinatura Ativa</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Assine agora e tenha acesso ilimitado a todos os cursos premium
              </p>
              <Link href="/pricing">
                <Button>
                  <Crown className="mr-2 h-4 w-4" />
                  Ver Planos
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Payment History */}
        {payments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Pagamentos</CardTitle>
              <CardDescription>Seus últimos pagamentos e cobranças</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-muted rounded-lg">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">R$ {payment.amount.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(payment.created_at).toLocaleDateString('pt-BR')} •{' '}
                          {payment.payment_method === 'pix' && 'PIX'}
                          {payment.payment_method === 'boleto' && 'Boleto'}
                          {payment.payment_method === 'credit_card' && 'Cartão de Crédito'}
                        </p>
                      </div>
                    </div>
                    {getPaymentStatusBadge(payment.status)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
