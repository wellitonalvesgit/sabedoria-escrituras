"use client"

import { BookOpen, Plus, Edit, Trash2, Upload, FileText, Users, BarChart3, Tag, Plug } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useState, useEffect } from "react"

interface Course {
  id: string
  title: string
  pages?: number
  course_pdfs: any[]
}

export default function AdminPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalCategories: 0
  })

  useEffect(() => {
    fetchCourses()
    fetchStats()
  }, [])

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses')
      if (response.ok) {
        const data = await response.json()
        setCourses(data.courses || [])
      }
    } catch (error) {
      console.error('Erro ao carregar cursos:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  const totalCourses = courses.length
  const totalPDFs = courses.reduce((acc, course) => acc + (course.course_pdfs?.length || 0), 0)
  const totalPages = courses.reduce((acc, course) => acc + (course.pages || 0), 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          <span>Carregando dados...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
                  <BookOpen className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-semibold tracking-tight">Sabedoria das Escrituras</span>
              </Link>
              <Badge variant="secondary" className="bg-[#F3C77A] text-black">
                Área Administrativa
              </Badge>
            </div>
            <Link href="/">
              <Button variant="outline" size="sm">
                Voltar ao Site
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 pt-24 pb-8 lg:px-8">
        {/* Dashboard Stats */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Dashboard Administrativo</h1>
          <p className="text-muted-foreground">Gerencie cursos, PDFs e conteúdo da plataforma</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Cursos</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCourses}</div>
              <p className="text-xs text-muted-foreground">Cursos disponíveis</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de PDFs</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPDFs}</div>
              <p className="text-xs text-muted-foreground">Arquivos PDF</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Páginas Totais</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPages}</div>
              <p className="text-xs text-muted-foreground">Páginas de conteúdo</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeUsers}</div>
              <p className="text-xs text-muted-foreground">de {stats.totalUsers} usuários</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categorias</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCategories}</div>
              <p className="text-xs text-muted-foreground">Categorias criadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[#F3C77A]" />
                Gerenciar Cursos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Adicione, edite ou remova cursos da plataforma
              </p>
              <Link href="/admin/courses" className="w-full">
                <Button className="w-full bg-[#F3C77A] text-black hover:bg-[#FFD88A]">
                  <Edit className="mr-2 h-4 w-4" />
                  Acessar Cursos
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-[#F3C77A]" />
                Gerenciar Usuários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Controle de usuários, permissões e acessos
              </p>
              <Link href="/admin/users" className="w-full">
                <Button className="w-full bg-[#F3C77A] text-black hover:bg-[#FFD88A]">
                  <Users className="mr-2 h-4 w-4" />
                  Acessar Usuários
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-[#F3C77A]" />
                Gerenciar Categorias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Organize cursos em categorias e subcategorias
              </p>
              <Link href="/admin/categories" className="w-full">
                <Button className="w-full bg-[#F3C77A] text-black hover:bg-[#FFD88A]">
                  <Tag className="mr-2 h-4 w-4" />
                  Acessar Categorias
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-primary/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plug className="h-5 w-5 text-[#F3C77A]" />
                Integrações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Configure pagamentos, storage e outras integrações
              </p>
              <Link href="/admin/integrations" className="w-full">
                <Button className="w-full bg-[#F3C77A] text-black hover:bg-[#FFD88A]">
                  <Plug className="mr-2 h-4 w-4" />
                  Gerenciar Integrações
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Courses */}
        <Card>
          <CardHeader>
            <CardTitle>Cursos Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {courses.slice(0, 5).map((course) => (
                <div key={course.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{course.title}</h3>
                      <p className="text-sm text-muted-foreground">{course.course_pdfs?.length || 0} volumes</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/courses/${course.id}`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
