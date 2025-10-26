"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { ArrowLeft, CreditCard, Loader2, Check, Barcode, QrCode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import Link from "next/link"

function CheckoutContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const planName = searchParams.get('plan')
  const cycle = searchParams.get('cycle') || 'monthly'

  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [plan, setPlan] = useState<any>(null)
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'boleto' | 'credit_card'>('pix')
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    cpf: '',
    phone: ''
  })

  useEffect(() => {
    fetchPlan()
    fetchUserData()
  }, [planName])

  const fetchPlan = async () => {
    try {
      const { getSupabaseClient } = await import('@/lib/supabase-admin')
      const supabase = getSupabaseClient()

      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('name', planName)
        .single()

      if (error) throw error
      setPlan(data)
    } catch (error) {
      console.error('Erro ao carregar plano:', error)
      router.push('/pricing')
    } finally {
      setLoading(false)
    }
  }

  const fetchUserData = async () => {
    try {
      const { supabase } = await import('@/lib/supabase')

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login?redirect=/checkout')
        return
      }

      const { data: profile } = await supabase
        .from('users')
        .select('full_name, email')
        .eq('id', user.id)
        .single()

      if (profile) {
        setUserData(prev => ({
          ...prev,
          name: profile.full_name || '',
          email: profile.email || user.email || ''
        }))
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProcessing(true)

    try {
      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_name: planName,
          cycle,
          payment_method: paymentMethod.toUpperCase(),
          customer_data: userData
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao processar pagamento')
      }

      // Redirecionar para página de sucesso com dados do pagamento
      router.push(`/checkout/success?payment_id=${result.payment_id}&method=${paymentMethod}`)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao processar pagamento')
    } finally {
      setProcessing(false)
    }
  }

  const getPrice = () => {
    if (!plan) return 0
    return cycle === 'monthly' ? plan.price_monthly : plan.price_yearly
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!plan) {
    return null
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
            <Link href="/pricing">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-12 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Form */}
          <div className="lg:col-span-2">
            <h1 className="text-3xl font-bold mb-2">Finalizar Assinatura</h1>
            <p className="text-muted-foreground mb-8">
              Complete os dados para assinar o plano {plan.display_name}
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Data */}
              <Card>
                <CardHeader>
                  <CardTitle>Dados Pessoais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input
                      id="name"
                      value={userData.name}
                      onChange={(e) => setUserData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={userData.email}
                      onChange={(e) => setUserData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cpf">CPF</Label>
                      <Input
                        id="cpf"
                        placeholder="000.000.000-00"
                        value={userData.cpf}
                        onChange={(e) => setUserData(prev => ({ ...prev, cpf: e.target.value }))}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        placeholder="(00) 00000-0000"
                        value={userData.phone}
                        onChange={(e) => setUserData(prev => ({ ...prev, phone: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle>Forma de Pagamento</CardTitle>
                  <CardDescription>
                    Escolha como deseja pagar sua assinatura
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                    <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                      <RadioGroupItem value="pix" id="pix" />
                      <Label htmlFor="pix" className="flex items-center gap-2 cursor-pointer flex-1">
                        <QrCode className="h-5 w-5 text-primary" />
                        <div>
                          <div className="font-medium">PIX</div>
                          <div className="text-xs text-muted-foreground">
                            Aprovação instantânea
                          </div>
                        </div>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent mt-3">
                      <RadioGroupItem value="boleto" id="boleto" />
                      <Label htmlFor="boleto" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Barcode className="h-5 w-5 text-primary" />
                        <div>
                          <div className="font-medium">Boleto Bancário</div>
                          <div className="text-xs text-muted-foreground">
                            Aprovação em 1-3 dias úteis
                          </div>
                        </div>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent mt-3">
                      <RadioGroupItem value="credit_card" id="credit_card" />
                      <Label htmlFor="credit_card" className="flex items-center gap-2 cursor-pointer flex-1">
                        <CreditCard className="h-5 w-5 text-primary" />
                        <div>
                          <div className="font-medium">Cartão de Crédito</div>
                          <div className="text-xs text-muted-foreground">
                            Aprovação instantânea
                          </div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              <Button type="submit" size="lg" className="w-full" disabled={processing}>
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    Finalizar Assinatura
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Right: Summary */}
          <div>
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground">Plano</div>
                  <div className="font-semibold">{plan.display_name}</div>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground">Ciclo</div>
                  <div className="font-semibold">
                    {cycle === 'monthly' ? 'Mensal' : 'Anual'}
                  </div>
                </div>

                {plan.trial_days > 0 && (
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-600">
                      <Check className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {plan.trial_days} dias grátis
                      </span>
                    </div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-sm text-muted-foreground">Subtotal</span>
                    <span className="font-semibold">
                      R$ {getPrice().toFixed(2).replace('.', ',')}
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">
                      R$ {getPrice().toFixed(2).replace('.', ',')}
                    </span>
                  </div>

                  <div className="text-xs text-muted-foreground mt-2">
                    {cycle === 'monthly' ? 'Cobrado mensalmente' : 'Cobrado anualmente'}
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  Ao finalizar, você concorda com nossos{' '}
                  <Link href="/terms" className="underline">
                    Termos de Uso
                  </Link>{' '}
                  e{' '}
                  <Link href="/privacy" className="underline">
                    Política de Privacidade
                  </Link>
                  .
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}
