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
  allowed_categories: string[]
  blocked_categories: string[]
  allowed_courses: string[]
  blocked_courses: string[]
  created_at: string
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
    allowed_categories: [] as string[],
    blocked_categories: [] as string[],
    allowed_courses: [] as string[],
    blocked_courses: [] as string[]
  })

  const [newCourse, setNewCourse] = useState("")

  useEffect(() => {
    fetchUser()
    fetchCourses()
  }, [userId])

  const fetchUser = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/users/${userId}`)
      if (!response.ok) {
        throw new Error('Usuário não encontrado')
      }
      const data = await response.json()
      setUser(data.user)
      setEditedUser({
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        status: data.user.status,
        access_days: data.user.access_days || 30,
        allowed_categories: data.user.allowed_categories || [],
        blocked_categories: data.user.blocked_categories || [],
        allowed_courses: data.user.allowed_courses || [],
        blocked_courses: data.user.blocked_courses || []
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
      
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedUser)
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
    setEditedUser(prev => ({
      ...prev,
      [field]: [...prev[field as keyof typeof prev] as string[], newCourse]
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

  if (error || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Usuário não encontrado</h1>
          <p className="text-muted-foreground mb-4">{error || 'O usuário solicitado não existe'}</p>
          <Link href="/admin/users">
            <Button>Voltar aos Usuários</Button>
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
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="access_days">Dias de Acesso</Label>
                <Input
                  id="access_days"
                  type="number"
                  min="1"
                  max="3650"
                  value={editedUser.access_days}
                  onChange={(e) => setEditedUser(prev => ({ ...prev, access_days: parseInt(e.target.value) || 30 }))}
                />
                <p className="text-xs text-muted-foreground">
                  Número de dias que o usuário terá acesso à plataforma
                </p>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Informações de Acesso</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p><strong>Cadastrado em:</strong> {new Date(user.created_at).toLocaleDateString('pt-BR')}</p>
                  <p><strong>Expira em:</strong> {user.access_expires_at ? new Date(user.access_expires_at).toLocaleDateString('pt-BR') : 'Não definido'}</p>
                  <p><strong>Dias restantes:</strong> {user.access_expires_at ? Math.ceil((new Date(user.access_expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Categorias Permitidas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Categorias Permitidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Selecione as categorias que o aluno PODE acessar</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Se nenhuma categoria for selecionada, o aluno terá acesso a todas (exceto bloqueadas)
                </p>
                <CategorySelector
                  selectedCategories={editedUser.allowed_categories}
                  onChange={(categories) => setEditedUser(prev => ({ ...prev, allowed_categories: categories }))}
                  multiple={true}
                />
              </div>
            </CardContent>
          </Card>

          {/* Categorias Bloqueadas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <X className="h-5 w-5" />
                Categorias Bloqueadas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Selecione as categorias que o aluno NÃO PODE acessar</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Essas categorias serão sempre bloqueadas, mesmo se estiverem em "Permitidas"
                </p>
                <CategorySelector
                  selectedCategories={editedUser.blocked_categories}
                  onChange={(categories) => setEditedUser(prev => ({ ...prev, blocked_categories: categories }))}
                  multiple={true}
                />
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
                    {courses.filter(c => !editedUser.allowed_courses.includes(c.id)).map((course) => (
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
                    {courses.filter(c => !editedUser.blocked_courses.includes(c.id)).map((course) => (
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
