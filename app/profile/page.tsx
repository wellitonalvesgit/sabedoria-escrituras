"use client"

import { useState, useEffect } from "react"
import { User, Mail, Lock, Calendar, Crown, CreditCard, Save, Eye, EyeOff, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { useCurrentUser } from "@/hooks/use-current-user"

interface Subscription {
  id: string
  status: string
  trial_ends_at?: string
  current_period_end?: string
  plan: {
    name: string
    price_monthly: number
  }
}

interface Payment {
  id: string
  amount: number
  status: string
  payment_method: string
  created_at: string
}

export default function ProfilePage() {
  const { user, loading: userLoading } = useCurrentUser()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  // Dados pessoais
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")

  // Trocar senha
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  // Assinatura e pagamentos - com loading states granulares
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [subscriptionLoading, setSubscriptionLoading] = useState(false)
  const [paymentsLoading, setPaymentsLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.name || "")
      setEmail(user.email || "")
      fetchSubscriptionData()
    }
  }, [user])

  const fetchSubscriptionData = async () => {
    try {
      setSubscriptionLoading(true)
      setPaymentsLoading(true)

      // Fazer chamadas em paralelo para melhor performance
      const [subResponse, paymentsResponse] = await Promise.all([
        fetch('/api/subscriptions/current'),
        fetch('/api/subscriptions/payments')
      ])

      // Processar resposta da assinatura
      if (subResponse.ok) {
        const data = await subResponse.json()
        setSubscription(data.subscription)
      } else {
        console.error('Erro ao buscar assinatura:', subResponse.status)
      }

      // Processar resposta dos pagamentos
      if (paymentsResponse.ok) {
        const data = await paymentsResponse.json()
        setPayments(data.payments || [])
      } else {
        console.error('Erro ao buscar pagamentos:', paymentsResponse.status)
      }
    } catch (error) {
      console.error('Erro ao carregar dados de assinatura:', error)
    } finally {
      setSubscriptionLoading(false)
      setPaymentsLoading(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar perfil')
      }

      setSuccess("Perfil atualizado com sucesso!")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar perfil')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem")
      setLoading(false)
      return
    }

    if (newPassword.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres")
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/profile/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao trocar senha')
      }

      setSuccess("Senha alterada com sucesso!")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao trocar senha')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'trial':
        return <Badge className="bg-blue-500/10 text-blue-600">Período de Teste</Badge>
      case 'active':
        return <Badge className="bg-green-500/10 text-green-600">Ativo</Badge>
      case 'past_due':
        return <Badge className="bg-yellow-500/10 text-yellow-600">Atrasado</Badge>
      case 'canceled':
        return <Badge className="bg-red-500/10 text-red-600">Cancelado</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-500/10 text-green-600">Confirmado</Badge>
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-600">Pendente</Badge>
      case 'overdue':
        return <Badge className="bg-red-500/10 text-red-600">Vencido</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (userLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          <span>Carregando...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-bold mb-2">Acesso Negado</h2>
            <p className="text-muted-foreground mb-4">Você precisa estar logado para acessar esta página</p>
            <Link href="/login">
              <Button>Fazer Login</Button>
            </Link>
          </CardContent>
        </Card>
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
                  <User className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-semibold tracking-tight">Meu Perfil</span>
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
        {/* Alerts */}
        {success && (
          <Alert className="mb-6 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <AlertDescription className="text-green-800 dark:text-green-200">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="mb-6 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
            <AlertDescription className="text-red-800 dark:text-red-200">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal">
              <User className="mr-2 h-4 w-4" />
              Dados Pessoais
            </TabsTrigger>
            <TabsTrigger value="security">
              <Lock className="mr-2 h-4 w-4" />
              Segurança
            </TabsTrigger>
            <TabsTrigger value="subscription">
              <Crown className="mr-2 h-4 w-4" />
              Assinatura
            </TabsTrigger>
          </TabsList>

          {/* Dados Pessoais */}
          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
                <CardDescription>
                  Atualize seus dados pessoais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome Completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-10"
                        placeholder="Seu nome completo"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        placeholder="seu@email.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button type="submit" disabled={loading}>
                      <Save className="mr-2 h-4 w-4" />
                      {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Segurança */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Trocar Senha</CardTitle>
                <CardDescription>
                  Mantenha sua conta segura atualizando sua senha regularmente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword">Senha Atual</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="pl-10 pr-10"
                        placeholder="Digite sua senha atual"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="newPassword">Nova Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="pl-10 pr-10"
                        placeholder="Digite sua nova senha"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Mínimo de 6 caracteres
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10"
                        placeholder="Confirme sua nova senha"
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button type="submit" disabled={loading}>
                      <Lock className="mr-2 h-4 w-4" />
                      {loading ? 'Alterando...' : 'Alterar Senha'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assinatura */}
          <TabsContent value="subscription">
            <div className="space-y-6">
              {/* Card de Assinatura */}
              {subscriptionLoading ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                      <span>Carregando assinatura...</span>
                    </div>
                  </CardContent>
                </Card>
              ) : subscription ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{subscription.plan.name}</CardTitle>
                        <CardDescription className="mt-2">
                          {getStatusBadge(subscription.status)}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">
                          R$ {subscription.plan.price_monthly.toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">por mês</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {subscription.status === 'trial' && subscription.trial_ends_at && (
                        <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="h-4 w-4 text-blue-600" />
                            <h4 className="font-semibold text-blue-600">Período de Teste</h4>
                          </div>
                          <p className="text-sm text-blue-600">
                            Termina em {new Date(subscription.trial_ends_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      )}

                      {subscription.status === 'active' && subscription.current_period_end && (
                        <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Crown className="h-4 w-4 text-green-600" />
                            <h4 className="font-semibold text-green-600">Assinatura Ativa</h4>
                          </div>
                          <p className="text-sm text-green-600">
                            Próxima cobrança em {new Date(subscription.current_period_end).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      )}

                      <div className="flex gap-3 pt-4">
                        <Link href="/my-subscription" className="flex-1">
                          <Button variant="outline" className="w-full">
                            Gerenciar Assinatura
                          </Button>
                        </Link>
                        <Link href="/pricing" className="flex-1">
                          <Button className="w-full">
                            Ver Planos
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Crown className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhuma Assinatura Ativa</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      Assine agora e tenha acesso a todos os cursos premium
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

              {/* Histórico de Pagamentos */}
              {paymentsLoading ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Histórico de Pagamentos</CardTitle>
                    <CardDescription>Carregando pagamentos...</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center py-8">
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                        <span>Carregando histórico...</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : payments.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Histórico de Pagamentos</CardTitle>
                    <CardDescription>Seus últimos pagamentos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {payments.slice(0, 5).map((payment) => (
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
                                {payment.payment_method === 'credit_card' && 'Cartão'}
                              </p>
                            </div>
                          </div>
                          {getPaymentStatusBadge(payment.status)}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
