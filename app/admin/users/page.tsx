"use client"

import { useState, useEffect } from "react"
import { Users, UserPlus, Search, MoreVertical, Edit, Trash2, Shield, Mail, Calendar, Filter, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Link from "next/link"
import { AddUserDrawer } from "@/components/add-user-drawer"
import { AddUserDrawerFixed } from "@/components/add-user-drawer-fixed"

interface SubscriptionPlan {
  id: string
  name: string
  price: number
  duration_days: number
}

interface Subscription {
  id: string
  plan_id: string
  status: 'trial' | 'active' | 'past_due' | 'canceled' | 'expired'
  trial_ends_at?: string
  current_period_end: string
  canceled_at?: string
  subscription_plans: SubscriptionPlan
}

interface User {
  id: string
  name: string
  email: string
  role: string
  status: string
  avatar_url?: string
  access_days?: number
  access_expires_at?: string
  allowed_categories?: string[]
  blocked_categories?: string[]
  allowed_courses?: string[]
  blocked_courses?: string[]
  total_points: number
  total_reading_minutes: number
  courses_enrolled: number
  courses_completed: number
  current_level: number
  created_at: string
  last_active_at: string
  user_course_progress: any[]
  subscriptions?: Subscription[]
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [planFilter, setPlanFilter] = useState("all")
  const [addUserDrawerOpen, setAddUserDrawerOpen] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (roleFilter !== 'all') params.append('role', roleFilter)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (searchTerm) params.append('search', searchTerm)
      
      const response = await fetch(`/api/users?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Erro ao carregar usuários')
      }
      const data = await response.json()
      setUsers(data.users || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja deletar este usuário?')) return
    
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Erro ao deletar usuário')
      }
      
      // Recarregar lista de usuários
      await fetchUsers()
    } catch (err) {
      alert('Erro ao deletar usuário')
    }
  }

  // Refetch quando filtros mudarem
  useEffect(() => {
    if (!loading) {
      fetchUsers()
    }
  }, [roleFilter, statusFilter, searchTerm])

  // Filtrar usuários por plano (client-side já que subscriptions vem via JOIN)
  const getFilteredUsers = () => {
    let filtered = users

    // Filtro por plano
    if (planFilter !== 'all') {
      filtered = filtered.filter(user => {
        const subscription = user.subscriptions?.[0]

        if (!subscription && planFilter === 'no-plan') return true
        if (!subscription) return false

        switch (planFilter) {
          case 'trial':
            if (subscription.status !== 'trial') return false
            const trialEnds = new Date(subscription.trial_ends_at!)
            return trialEnds > new Date()

          case 'trial-expired':
            if (subscription.status !== 'trial') return false
            const trialExpired = new Date(subscription.trial_ends_at!)
            return trialExpired <= new Date()

          case 'active':
            return subscription.status === 'active'

          case 'past_due':
            return subscription.status === 'past_due'

          case 'canceled':
            return subscription.status === 'canceled'

          default:
            return true
        }
      })
    }

    return filtered
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Carregando usuários...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={fetchUsers}>Tentar novamente</Button>
        </div>
      </div>
    )
  }

  // Usar dados do Supabase com filtros aplicados
  const filteredUsers = getFilteredUsers()

  // Calcular estatísticas de planos
  const usersInTrial = users.filter(u => {
    const sub = u.subscriptions?.[0]
    return sub?.status === 'trial' && new Date(sub.trial_ends_at!) > new Date()
  }).length

  const usersTrialExpired = users.filter(u => {
    const sub = u.subscriptions?.[0]
    return sub?.status === 'trial' && new Date(sub.trial_ends_at!) <= new Date()
  }).length

  const usersPremium = users.filter(u => u.subscriptions?.[0]?.status === 'active').length

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: { label: "Administrador", className: "bg-red-500/10 text-red-500 border-red-500/20" },
      moderator: { label: "Moderador", className: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
      student: { label: "Aluno", className: "bg-green-500/10 text-green-500 border-green-500/20" },
    }
    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.student
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>
  }

  const getStatusBadge = (status: string) => {
    return status === "active" ? (
      <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Ativo</Badge>
    ) : (
      <Badge variant="outline" className="bg-gray-500/10 text-gray-500 border-gray-500/20">Inativo</Badge>
    )
  }

  const getSubscriptionBadge = (user: User) => {
    const subscription = user.subscriptions?.[0]

    if (!subscription) {
      return <Badge variant="outline" className="bg-gray-500/10 text-gray-500 border-gray-500/20">Sem Plano</Badge>
    }

    switch (subscription.status) {
      case 'trial':
        const trialEnds = new Date(subscription.trial_ends_at!)
        const now = new Date()
        const daysLeft = Math.ceil((trialEnds.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        if (daysLeft > 0) {
          return (
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
              🆓 Trial - {daysLeft} dia{daysLeft !== 1 ? 's' : ''}
            </Badge>
          )
        } else {
          return (
            <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
              ⚠️ Trial Expirado
            </Badge>
          )
        }

      case 'active':
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
            💎 Premium
          </Badge>
        )

      case 'past_due':
        return (
          <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20">
            ⏰ Pagamento Pendente
          </Badge>
        )

      case 'canceled':
        const periodEnd = new Date(subscription.current_period_end)
        return (
          <Badge variant="outline" className="bg-gray-500/10 text-gray-600 border-gray-500/20">
            ❌ Cancelado - {periodEnd.toLocaleDateString('pt-BR')}
          </Badge>
        )

      case 'expired':
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
            🚫 Expirado
          </Badge>
        )

      default:
        return <Badge variant="outline">Desconhecido</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/40 bg-background/95 backdrop-blur-xl fixed top-0 left-0 right-0 z-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/admin" className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
                  <Users className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-semibold tracking-tight">Gerenciar Usuários</span>
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/admin">
                <Button variant="outline" size="sm" className="hover:bg-primary/10 hover:text-primary hover:border-primary/30">
                  Voltar ao Admin
                </Button>
              </Link>
              <Button
                className="bg-[#F3C77A] text-black hover:bg-[#FFD88A]"
                onClick={() => setAddUserDrawerOpen(true)}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Adicionar Usuário
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 pt-24 pb-8 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{users.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Cadastrados</p>
            </CardContent>
          </Card>

          <Card className="border-yellow-500/20 bg-yellow-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-yellow-600">🆓 Trial Ativo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{usersInTrial}</div>
              <p className="text-xs text-muted-foreground mt-1">7 dias grátis</p>
            </CardContent>
          </Card>

          <Card className="border-green-500/20 bg-green-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-600">💎 Premium</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{usersPremium}</div>
              <p className="text-xs text-muted-foreground mt-1">Pagantes ativos</p>
            </CardContent>
          </Card>

          <Card className="border-red-500/20 bg-red-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-red-600">⚠️ Trial Expirado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{usersTrialExpired}</div>
              <p className="text-xs text-muted-foreground mt-1">Precisam upgrade</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Administradores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {users.filter(u => u.role === "admin").length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Acesso total</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filtrar por role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os roles</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="moderator">Moderador</SelectItem>
                  <SelectItem value="student">Aluno</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>

              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filtrar por plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os planos</SelectItem>
                  <SelectItem value="trial">🆓 Free Trial</SelectItem>
                  <SelectItem value="trial-expired">⚠️ Trial Expirado</SelectItem>
                  <SelectItem value="active">💎 Premium Ativo</SelectItem>
                  <SelectItem value="past_due">⏰ Pagamento Pendente</SelectItem>
                  <SelectItem value="canceled">❌ Cancelado</SelectItem>
                  <SelectItem value="no-plan">Sem Plano</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Usuários ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border">
                  <tr className="text-sm text-muted-foreground">
                    <th className="px-6 py-3 text-left font-medium">Usuário</th>
                    <th className="px-6 py-3 text-left font-medium">Role</th>
                    <th className="px-6 py-3 text-left font-medium">Status</th>
                    <th className="px-6 py-3 text-left font-medium">Plano</th>
                    <th className="px-6 py-3 text-left font-medium">Cursos</th>
                    <th className="px-6 py-3 text-left font-medium">Pontos</th>
                    <th className="px-6 py-3 text-left font-medium">Cadastro</th>
                    <th className="px-6 py-3 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 bg-primary/10">
                            <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-primary">
                              {user.name.split(' ').map(n => n[0]).join('')}
                            </div>
                          </Avatar>
                          <div>
                            <div className="font-medium text-foreground">{user.name}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                      <td className="px-6 py-4">{getStatusBadge(user.status)}</td>
                      <td className="px-6 py-4">{getSubscriptionBadge(user)}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-medium text-foreground">{user.courses_enrolled} inscritos</div>
                          <div className="text-muted-foreground">{user.courses_completed} concluídos</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-[#F3C77A]">{user.total_points.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(user.created_at).toLocaleDateString('pt-BR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/users/${user.id}`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remover
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add User Drawer - Versão Corrigida */}
      <AddUserDrawerFixed
        open={addUserDrawerOpen}
        onOpenChange={setAddUserDrawerOpen}
        onUserAdded={fetchUsers}
      />
    </div>
  )
}
