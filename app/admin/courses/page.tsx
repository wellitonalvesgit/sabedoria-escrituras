"use client"

import { useState, useEffect } from "react"
import { BookOpen, Plus, Edit, Trash2, Eye, ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface CoursePDF {
  id: string
  volume: string
  title: string
  url: string
  pages?: number
  reading_time_minutes?: number
  text_content?: string
  use_auto_conversion?: boolean
  display_order: number
}

interface Course {
  id: string
  slug: string
  title: string
  description: string
  author?: string
  category?: string
  pages?: number
  reading_time_minutes?: number
  cover_url?: string
  status: string
  created_at: string
  course_pdfs: CoursePDF[]
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/courses')
      if (!response.ok) {
        throw new Error('Erro ao carregar cursos')
      }
      const data = await response.json()
      setCourses(data.courses || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCourse = async (courseId: string, courseTitle: string) => {
    if (!confirm(`Você tem certeza que deseja deletar o curso "${courseTitle}"?\n\nEsta ação não pode ser desfeita e todos os PDFs associados serão removidos permanentemente.`)) return
    
    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Erro ao deletar curso')
      }
      
      // Recarregar lista de cursos
      await fetchCourses()
    } catch (err) {
      alert('Erro ao deletar curso')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Carregando cursos...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={fetchCourses}>Tentar novamente</Button>
        </div>
      </div>
    )
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
                  <BookOpen className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-semibold tracking-tight">Gerenciar Cursos</span>
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/admin">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar ao Dashboard
                </Button>
              </Link>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Curso
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 pt-24 pb-8 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Gerenciar Cursos</h1>
          <p className="text-muted-foreground">Adicione, edite ou remova cursos da plataforma</p>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card key={course.id} className="group hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{course.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{course.author}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Ativo
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {course.description}
                </p>
                
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <span>{course.course_pdfs.length} volumes</span>
                  <span>{course.pages} páginas</span>
                  <span>{course.reading_time_minutes} min</span>
                </div>

                <div className="flex gap-2">
                  <Link href={`/course/${course.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="mr-2 h-4 w-4" />
                      Visualizar
                    </Button>
                  </Link>
                  <Link href={`/admin/courses/${course.id}`} className="flex-1">
                    <Button size="sm" className="w-full">
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add New Course Card */}
        <Card className="mt-6 border-dashed border-2 border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Plus className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Adicionar Novo Curso</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              Crie um novo curso com múltiplos volumes de PDF
            </p>
            <Button size="lg">
              <Plus className="mr-2 h-5 w-5" />
              Criar Novo Curso
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
