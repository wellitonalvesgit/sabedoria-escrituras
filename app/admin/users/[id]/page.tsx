"use client"

import { useState, useEffect } from "react"
import { use } from "react"
import { ArrowLeft, Save, User, Calendar, Shield, BookOpen, X, Plus, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CategorySelector } from "@/components/category-selector"
import Link from "next/link"

interface User {
  id: string
  name: string
  email: string
  role: string
  status: string
  access_days: number
  access_expires_at: string
  allowed_courses: string[]
  blocked_courses: string[]
  created_at: string
  subscriptions?: Array<{
    id: string
    plan_id: string
    status: string
    plan_expires_at: string | null
    subscription_plans: {
      id: string
      name: string
      plan_type: string
      duration_days: number
    }
  }>
  course_purchases?: Array<{
    id: string
    course_id: string
    payment_status: string
    is_active: boolean
  }>
  user_course_purchases?: Array<{
    id: string
    course_id: string
    payment_status: string
    is_active: boolean
  }>
}

interface Course {
  id: string
  title: string
  category: string
}

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: userId } = use(params)
  const [user, setUser] = useState<User | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [editedUser, setEditedUser] = useState({
    name: "",
    email: "",
    role: "",
    status: "",
    access_days: 30,
    allowed_courses: [] as string[],
    blocked_courses: [] as string[]
  })

  const [newCourse, setNewCourse] = useState("")
  
  // Estados para controle manual de acesso
  const [manualAccess, setManualAccess] = useState({
    hasBasic: false,
    hasPremium: false,
    arsenalEspiritual: {
      '3d65d963-d3b8-4d42-a312-e82a73a1f563': false, // Estudo do Apocalipse
      '742aba61-0125-4fb8-8a63-d7bf500fc445': false, // Mulher Cristã
      'afa265fa-2600-48ca-9bd8-ff9aed8c5bcb': false, // Pregador Premium
      '189a4f75-5aa6-4d6c-a74e-cede5cd47862': false  // Unção do Leão
    }
  })
  
  // IDs dos cursos do Arsenal Espiritual
  const arsenalEspiritualCourses = [
    { id: '3d65d963-d3b8-4d42-a312-e82a73a1f563', title: 'Estudo do Apocalipse' },
    { id: '742aba61-0125-4fb8-8a63-d7bf500fc445', title: 'Mulher Cristã' },
    { id: 'afa265fa-2600-48ca-9bd8-ff9aed8c5bcb', title: 'Pregador Premium' },
    { id: '189a4f75-5aa6-4d6c-a74e-cede5cd47862', title: 'Unção do Leão' }
  ]

  useEffect(() => {
    fetchUser()
    fetchCourses()
  }, [userId])

  const fetchUser = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/users/${userId}`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Erro ao carregar usuário')
      }
      const data = await response.json()
      if (!data.user) {
        throw new Error('Usuário não encontrado')
      }
      setUser(data.user)
      // Limpar conflitos entre cursos permitidos e bloqueados
      const allowedCourses = data.user.allowed_courses || []
      const blockedCourses = data.user.blocked_courses || []
      
      // Remover cursos que estão em ambas as listas (priorizar permitidos)
      const cleanBlockedCourses = blockedCourses.filter(courseId => !allowedCourses.includes(courseId))
      
      setEditedUser({
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        status: data.user.status,
        access_days: data.user.access_days || 30,
        allowed_courses: allowedCourses,
        blocked_courses: cleanBlockedCourses
      })
      
      // Verificar subscriptions existentes
      const subscriptions = data.user.subscriptions || []
      const hasBasic = subscriptions.some((sub: any) => 
        sub.subscription_plans?.plan_type === 'basic' && 
        sub.status === 'active' &&
        (!sub.plan_expires_at || new Date(sub.plan_expires_at) > new Date())
      )
      const hasPremium = subscriptions.some((sub: any) => 
        sub.subscription_plans?.plan_type === 'premium' && 
        sub.status === 'active' &&
        (!sub.plan_expires_at || new Date(sub.plan_expires_at) > new Date())
      )
      
      // Verificar compras individuais de cursos
      const coursePurchases = data.user.user_course_purchases || data.user.course_purchases || []
      const arsenalEspiritual: Record<string, boolean> = {}
      arsenalEspiritualCourses.forEach(course => {
        arsenalEspiritual[course.id] = coursePurchases.some((purchase: any) => 
          purchase.course_id === course.id && 
          purchase.payment_status === 'completed' && 
          purchase.is_active === true
        )
      })
      
      setManualAccess({
        hasBasic,
        hasPremium,
        arsenalEspiritual
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses')
      if (response.ok) {
        const data = await response.json()
        setCourses(data.courses || [])
      }
    } catch (error) {
      console.error('Erro ao carregar cursos:', error)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      
      // Limpar conflitos antes de salvar
      const cleanBlockedCourses = editedUser.blocked_courses.filter(courseId => 
        !editedUser.allowed_courses.includes(courseId)
      )
      
      // Verificar se houve conflitos resolvidos
      const hadConflicts = editedUser.blocked_courses.length !== cleanBlockedCourses.length
      if (hadConflicts) {
        setSuccess("Conflitos de permissões resolvidos automaticamente. Cursos permitidos têm prioridade sobre bloqueados.")
      }
      
      const userDataToSave = {
        ...editedUser,
        blocked_courses: cleanBlockedCourses,
        manual_access: manualAccess
      }
      
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userDataToSave)
      })
      
      if (!response.ok) {
        throw new Error('Erro ao salvar usuário')
      }
      
      setSuccess("Usuário atualizado com sucesso!")
      await fetchUser() // Recarregar dados
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const addCourse = (type: 'allowed' | 'blocked') => {
    if (!newCourse) return
    
    const field = type === 'allowed' ? 'allowed_courses' : 'blocked_courses'
    const oppositeField = type === 'allowed' ? 'blocked_courses' : 'allowed_courses'
    
    setEditedUser(prev => ({
      ...prev,
      [field]: [...prev[field as keyof typeof prev] as string[], newCourse],
      // Remover o curso da lista oposta se estiver lá
      [oppositeField]: (prev[oppositeField as keyof typeof prev] as string[]).filter(c => c !== newCourse)
    }))
    setNewCourse("")
  }

  const removeCourse = (type: 'allowed' | 'blocked', courseId: string) => {
    const field = type === 'allowed' ? 'allowed_courses' : 'blocked_courses'
    setEditedUser(prev => ({
      ...prev,
      [field]: (prev[field as keyof typeof prev] as string[]).filter(c => c !== courseId)
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Carregando usuário...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Erro ao carregar usuário</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Link href="/admin/users">
            <Button className="hover:bg-primary/90">Voltar aos Usuários</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Usuário não encontrado</h1>
          <p className="text-muted-foreground mb-4">O usuário solicitado não existe</p>
          <Link href="/admin/users">
            <Button className="hover:bg-primary/90">Voltar aos Usuários</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/admin/users" className="flex items-center gap-2">
                <ArrowLeft className="h-5 w-5" />
                <span className="text-xl font-semibold tracking-tight">Editar Usuário</span>
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/admin/users">
                <Button variant="outline" size="sm">
                  Cancelar
                </Button>
              </Link>
              <Button onClick={handleSave} disabled={saving} className="bg-[#F3C77A] text-black hover:bg-[#FFD88A]">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-500 bg-green-500/10">
            <AlertDescription className="text-green-600">{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={editedUser.name}
                  onChange={(e) => setEditedUser(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editedUser.email}
                  onChange={(e) => setEditedUser(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={editedUser.role} onValueChange={(value) => setEditedUser(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="moderator">Moderador</SelectItem>
                      <SelectItem value="student">Aluno</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={editedUser.status} onValueChange={(value) => setEditedUser(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Controle de Acesso */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Controle de Acesso
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-muted rounded-lg border border-border">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Informações de Acesso
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Cadastrado em:</span>
                    <span className="font-medium">{new Date(user.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Expira em:</span>
                    <span className="font-medium">
                      {user.access_expires_at 
                        ? new Date(user.access_expires_at).toLocaleDateString('pt-BR') 
                        : 'Vitalício'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Dias restantes:</span>
                    <Badge 
                      variant={user.access_expires_at ? "secondary" : "default"}
                      className={
                        user.access_expires_at 
                          ? (Math.ceil((new Date(user.access_expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) > 0
                              ? "bg-green-500/10 text-green-600 border-green-500/20"
                              : "bg-red-500/10 text-red-600 border-red-500/20")
                          : "bg-purple-500/10 text-purple-600 border-purple-500/20"
                      }
                    >
                      {user.access_expires_at 
                        ? (() => {
                            const daysLeft = Math.ceil((new Date(user.access_expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                            return daysLeft > 0 ? `${daysLeft} dia${daysLeft !== 1 ? 's' : ''}` : 'Expirado'
                          })()
                        : '∞ Vitalício'}
                    </Badge>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                    <strong>Nota:</strong> Os dias de acesso são calculados automaticamente conforme o plano (Básico: 2 meses / Premium: Vitalício) ou compras individuais de cursos.
                </p>
                </div>
              </div>

              {/* Liberação Manual de Planos */}
              <div className="space-y-4 border-t pt-4">
                <div>
                  <h4 className="font-semibold mb-3">Liberação Manual de Acesso</h4>
                  <p className="text-xs text-muted-foreground mb-4">
                    Marque as opções abaixo para liberar manualmente o acesso aos planos e cursos
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={manualAccess.hasBasic}
                        onCheckedChange={(checked) => 
                          setManualAccess(prev => ({ ...prev, hasBasic: checked }))
                        }
                      />
                      <Label htmlFor="basic" className="font-medium cursor-pointer">
                        Plano Básico
                      </Label>
                    </div>
                    <Badge variant={manualAccess.hasBasic ? "default" : "outline"}>
                      {manualAccess.hasBasic ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={manualAccess.hasPremium}
                        onCheckedChange={(checked) => 
                          setManualAccess(prev => ({ ...prev, hasPremium: checked }))
                        }
                      />
                      <Label htmlFor="premium" className="font-medium cursor-pointer">
                        Plano Premium
                      </Label>
                    </div>
                    <Badge variant={manualAccess.hasPremium ? "default" : "outline"}>
                      {manualAccess.hasPremium ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </div>

                {/* Cursos do Arsenal Espiritual */}
                <div className="space-y-2 mt-4">
                  <Label className="text-sm font-semibold">Cursos do Arsenal Espiritual</Label>
                  <div className="space-y-2">
                    {arsenalEspiritualCourses.map((course) => (
                      <div key={course.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={manualAccess.arsenalEspiritual[course.id as keyof typeof manualAccess.arsenalEspiritual]}
                            onCheckedChange={(checked) => 
                              setManualAccess(prev => ({
                                ...prev,
                                arsenalEspiritual: {
                                  ...prev.arsenalEspiritual,
                                  [course.id]: checked
                                }
                              }))
                            }
                          />
                          <Label className="text-sm cursor-pointer">
                            {course.title}
                          </Label>
                        </div>
                        <Badge 
                          variant={manualAccess.arsenalEspiritual[course.id as keyof typeof manualAccess.arsenalEspiritual] ? "default" : "outline"}
                          className="text-xs"
                        >
                          {manualAccess.arsenalEspiritual[course.id as keyof typeof manualAccess.arsenalEspiritual] ? "Liberado" : "Bloqueado"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cursos Permitidos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Cursos Permitidos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Selecione os cursos específicos que o aluno PODE acessar</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Se nenhum curso for selecionado, o aluno terá acesso a todos os cursos das categorias permitidas
                </p>
              </div>
              <div className="flex gap-2">
                <Select value={newCourse} onValueChange={setNewCourse}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um curso..." />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.filter(c => 
                      !editedUser.allowed_courses.includes(c.id) && 
                      !editedUser.blocked_courses.includes(c.id)
                    ).map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={() => addCourse('allowed')} size="sm" disabled={!newCourse}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                {editedUser.allowed_courses.map((courseId) => {
                  const course = courses.find(c => c.id === courseId)
                  return (
                    <div key={courseId} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded">
                      <span className="text-sm font-medium text-green-800 dark:text-green-200">{course?.title || courseId}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCourse('allowed', courseId)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                })}
                {editedUser.allowed_courses.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">Nenhum curso específico permitido - Acesso baseado em categorias</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Cursos Bloqueados */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Cursos Bloqueados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Selecione os cursos específicos que o aluno NÃO PODE acessar</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Esses cursos serão sempre bloqueados, mesmo se suas categorias estiverem permitidas
                </p>
              </div>
              <div className="flex gap-2">
                <Select value={newCourse} onValueChange={setNewCourse}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um curso..." />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.filter(c => 
                      !editedUser.blocked_courses.includes(c.id) && 
                      !editedUser.allowed_courses.includes(c.id)
                    ).map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={() => addCourse('blocked')} size="sm" variant="destructive" disabled={!newCourse}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                {editedUser.blocked_courses.map((courseId) => {
                  const course = courses.find(c => c.id === courseId)
                  return (
                    <div key={courseId} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded">
                      <span className="text-sm font-medium text-red-800 dark:text-red-200">{course?.title || courseId}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCourse('blocked', courseId)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                })}
                {editedUser.blocked_courses.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">Nenhum curso bloqueado</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
