"use client"

import { useState, useEffect } from "react"
import { BookOpen, Search, Filter, CreditCard, Calendar, User, DollarSign, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

interface SubscriptionPlan {
  id: string
  name: string
  display_name: string
  price_monthly: number
  price_yearly: number
}

interface Subscription {
  id: string
  user_id: string
  plan_id: string
  status: 'trial' | 'active' | 'past_due' | 'canceled' | 'expired'
  trial_ends_at?: string
  current_period_end: string
  canceled_at?: string
  created_at: string
  subscription_plans: SubscriptionPlan
  users: {
    id: string
    name: string
    email: string
  }
}

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [stats, setStats] = useState({
    total: 0,
    trial: 0,
    active: 0,
    pastDue: 0,
    canceled: 0,
    expired: 0,
    monthlyRevenue: 0
  })

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  const fetchSubscriptions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/subscriptions')
      if (response.ok) {
        const data = await response.json()
        setSubscriptions(data.subscriptions || [])
        calculateStats(data.subscriptions || [])
      }
    } catch (error) {
      console.error('Erro ao carregar assinaturas:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (subs: Subscription[]) => {
    const trial = subs.filter(s => s.status === 'trial').length
    const active = subs.filter(s => s.status === 'active').length
    const pastDue = subs.filter(s => s.status === 'past_due').length
    const canceled = subs.filter(s => s.status === 'canceled').length
    const expired = subs.filter(s => s.status === 'expired').length

    // Calcular receita mensal (assinaturas ativas)
    const monthlyRevenue = subs
      .filter(s => s.status === 'active')
      .reduce((acc, s) => {
        const price = s.subscription_plans.price_monthly ||
                     (s.subscription_plans.price_yearly / 12) || 0
        return acc + price
      }, 0)

    setStats({
      total: subs.length,
      trial,
      active,
      pastDue,
      canceled,
      expired,
      monthlyRevenue
    })
  }

  const getFilteredSubscriptions = () => {
    return subscriptions.filter(sub => {
      const matchesSearch =
        sub.users.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.users.email.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus =
        statusFilter === "all" || sub.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      'trial': <Badge className="bg-yellow-500/10 text-yellow-600">🆓 Trial</Badge>,
      'active': <Badge className="bg-green-500/10 text-green-600">💎 Ativo</Badge>,
      'past_due': <Badge className="bg-orange-500/10 text-orange-600">⏰ Pendente</Badge>,
      'canceled': <Badge className="bg-gray-500/10 text-gray-600">❌ Cancelado</Badge>,
      'expired': <Badge className="bg-red-500/10 text-red-600">⚠️ Expirado</Badge>
    }
    return badges[status as keyof typeof badges] || <Badge>{status}</Badge>
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const calculateDaysLeft = (endDate: string) => {
    const now = new Date()
    const end = new Date(endDate)
    const diffTime = end.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          <span>Carregando assinaturas...</span>
        </div>
      </div>
    )
  }

  const filteredSubscriptions = getFilteredSubscriptions()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/admin" className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
                  <BookOpen className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-semibold tracking-tight">Sabedoria das Escrituras</span>
              </Link>
              <Badge variant="secondary" className="bg-[#F3C77A] text-black">
                Gerenciar Assinaturas
              </Badge>
            </div>
            <Link href="/admin">
              <Button variant="outline" size="sm">
                Voltar ao Admin
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 pt-8 pb-8 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Gerenciar Assinaturas</h1>
          <p className="text-muted-foreground">Visualize e gerencie todas as assinaturas da plataforma</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Assinaturas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trial</CardTitle>
              <Calendar className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.trial}</div>
              <p className="text-xs text-muted-foreground">Em teste</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ativas</CardTitle>
              <User className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <p className="text-xs text-muted-foreground">Pagantes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Calendar className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.pastDue}</div>
              <p className="text-xs text-muted-foreground">Pagamento atrasado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Canceladas</CardTitle>
              <User className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats.canceled}</div>
              <p className="text-xs text-muted-foreground">Usuários cancelados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                R$ {stats.monthlyRevenue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">Receita recorrente</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="trial">🆓 Trial</SelectItem>
              <SelectItem value="active">💎 Ativo</SelectItem>
              <SelectItem value="past_due">⏰ Pendente</SelectItem>
              <SelectItem value="canceled">❌ Cancelado</SelectItem>
              <SelectItem value="expired">⚠️ Expirado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Subscriptions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Assinaturas ({filteredSubscriptions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Usuário</th>
                    <th className="text-left p-4 font-medium">Plano</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Valor</th>
                    <th className="text-left p-4 font-medium">Expira em</th>
                    <th className="text-left p-4 font-medium">Dias Restantes</th>
                    <th className="text-left p-4 font-medium">Criado em</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubscriptions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center p-8 text-muted-foreground">
                        Nenhuma assinatura encontrada
                      </td>
                    </tr>
                  ) : (
                    filteredSubscriptions.map((sub) => {
                      const daysLeft = calculateDaysLeft(sub.current_period_end)
                      const price = sub.subscription_plans.price_monthly > 0
                        ? `R$ ${sub.subscription_plans.price_monthly}/mês`
                        : sub.subscription_plans.price_yearly > 0
                        ? `R$ ${sub.subscription_plans.price_yearly}/ano`
                        : 'Grátis'

                      return (
                        <tr key={sub.id} className="border-b hover:bg-muted/50">
                          <td className="p-4">
                            <div>
                              <p className="font-medium">{sub.users.name}</p>
                              <p className="text-sm text-muted-foreground">{sub.users.email}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge variant="outline">{sub.subscription_plans.display_name}</Badge>
                          </td>
                          <td className="p-4">{getStatusBadge(sub.status)}</td>
                          <td className="p-4">{price}</td>
                          <td className="p-4">{formatDate(sub.current_period_end)}</td>
                          <td className="p-4">
                            {daysLeft > 0 ? (
                              <span className={daysLeft <= 7 ? 'text-orange-600 font-semibold' : ''}>
                                {daysLeft} {daysLeft === 1 ? 'dia' : 'dias'}
                              </span>
                            ) : (
                              <span className="text-red-600 font-semibold">Expirado</span>
                            )}
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {formatDate(sub.created_at)}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
