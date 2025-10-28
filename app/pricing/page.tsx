"use client"

import { useState, useEffect } from "react"
import { Check, Loader2, Sparkles, Crown, Gift } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Plan {
  id: string
  name: string
  display_name: string
  description: string
  price_monthly: number
  price_yearly: number
  trial_days: number
  features: string[]
  is_active: boolean
  sort_order: number
}

interface Subscription {
  id: string
  status: string
  trial_ends_at: string
  current_period_end: string
  plan_id: string
}

export default function PricingPage() {
  const router = useRouter()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    fetchPlans()
    fetchSubscription()
  }, [])

  const fetchPlans = async () => {
    try {
      // Usar API ao invés de Supabase diretamente
      const response = await fetch('/api/subscription-plans')

      if (!response.ok) {
        throw new Error('Erro ao carregar planos')
      }

      const { plans } = await response.json()
      setPlans(plans || [])
    } catch (error) {
      console.error('Erro ao carregar planos:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSubscription = async () => {
    try {
      // Usar API ao invés de Supabase diretamente
      const response = await fetch('/api/subscriptions/current')

      if (!response.ok) {
        // Se não autenticado ou sem assinatura, apenas retorna
        return
      }

      const { subscription } = await response.json()
      if (subscription) {
        setSubscription(subscription)
      }
    } catch (error) {
      console.error('Erro ao carregar assinatura:', error)
    }
  }

  const handleSelectPlan = async (plan: Plan) => {
    try {
      setProcessing(plan.id)

      // Verificar autenticação usando API
      const response = await fetch('/api/auth/me')

      if (!response.ok) {
        // Não autenticado, redirecionar para login
        router.push('/login?redirect=/pricing')
        return
      }

      // Se é o plano gratuito, apenas confirmar
      if (plan.name === 'free') {
        alert('Você já está no plano gratuito com 30 dias de trial!')
        return
      }

      // Redirecionar para checkout
      router.push(`/checkout?plan=${plan.name}&cycle=${billingCycle}`)
    } catch (error) {
      alert('Erro ao selecionar plano. Tente novamente.')
    } finally {
      setProcessing(null)
    }
  }

  const getPlanPrice = (plan: Plan) => {
    if (plan.name === 'free') return 0
    return billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly
  }

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case 'free':
        return <Gift className="h-8 w-8 text-blue-500" />
      case 'premium-monthly':
      case 'premium-yearly':
        return <Crown className="h-8 w-8 text-yellow-500" />
      default:
        return <Sparkles className="h-8 w-8 text-purple-500" />
    }
  }

  const isCurrentPlan = (plan: Plan) => {
    if (!subscription) return false
    return subscription.plan_id === plan.id
  }

  const isInTrial = () => {
    if (!subscription) return false
    if (subscription.status !== 'trial') return false
    const trialEnd = new Date(subscription.trial_ends_at)
    return trialEnd > new Date()
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
      {/* Header */}
      <div className="border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="text-xl font-semibold">
              Sabedoria das Escrituras
            </Link>
            <Link href="/dashboard">
              <Button variant="outline">Voltar ao Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
            Escolha seu plano
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Comece com 30 dias grátis. Cancele quando quiser.
          </p>

          {isInTrial() && subscription && (
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full">
              <Sparkles className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-blue-600">
                Seu trial termina em{' '}
                {Math.ceil(
                  (new Date(subscription.trial_ends_at).getTime() - Date.now()) /
                    (1000 * 60 * 60 * 24)
                )}{' '}
                dias
              </span>
            </div>
          )}
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center bg-muted p-1 rounded-lg">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'yearly'
                  ? 'bg-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Anual
              <Badge className="ml-2 bg-green-500 text-white">-17%</Badge>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => {
            const price = getPlanPrice(plan)
            const isCurrent = isCurrentPlan(plan)
            const isPremium = plan.name.includes('premium')

            return (
              <Card
                key={plan.id}
                className={`relative ${
                  isPremium
                    ? 'border-primary shadow-lg scale-105'
                    : ''
                }`}
              >
                {isPremium && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      Mais Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-8 pt-8">
                  <div className="mx-auto mb-4">{getPlanIcon(plan.name)}</div>
                  <CardTitle className="text-2xl">{plan.display_name}</CardTitle>
                  <CardDescription className="mt-2">
                    {plan.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Price */}
                  <div className="text-center">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold">
                        R$ {price.toFixed(2).replace('.', ',')}
                      </span>
                      {price > 0 && (
                        <span className="text-muted-foreground">
                          /{billingCycle === 'monthly' ? 'mês' : 'ano'}
                        </span>
                      )}
                    </div>
                    {plan.trial_days > 0 && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {plan.trial_days} dias grátis para testar
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    variant={isPremium ? 'default' : 'outline'}
                    size="lg"
                    onClick={() => handleSelectPlan(plan)}
                    disabled={isCurrent || processing === plan.id}
                  >
                    {processing === plan.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processando...
                      </>
                    ) : isCurrent ? (
                      'Plano Atual'
                    ) : plan.name === 'free' ? (
                      'Plano Gratuito'
                    ) : (
                      'Assinar Agora'
                    )}
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>

        {/* FAQ/Info */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold text-center mb-8">
            Perguntas Frequentes
          </h3>

          <div className="space-y-6">
            <div>
              <h4 className="font-semibold mb-2">
                Posso cancelar a qualquer momento?
              </h4>
              <p className="text-muted-foreground">
                Sim! Você pode cancelar sua assinatura a qualquer momento. Você
                manterá o acesso até o final do período pago.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Como funciona o trial?</h4>
              <p className="text-muted-foreground">
                Todos os novos usuários ganham 30 dias de acesso completo
                gratuitamente. Não é necessário cartão de crédito para começar.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">
                Quais formas de pagamento aceitam?
              </h4>
              <p className="text-muted-foreground">
                Aceitamos PIX, Boleto e Cartão de Crédito através da plataforma
                Asaas.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">
                Qual a diferença entre mensal e anual?
              </h4>
              <p className="text-muted-foreground">
                O plano anual oferece 17% de desconto (equivalente a 2 meses
                grátis). Ambos dão acesso completo a todos os cursos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
