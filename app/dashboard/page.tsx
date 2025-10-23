"use client"

import { useState, useEffect } from "react"
import { BookOpen, Search, User, Menu, Loader2, Shield, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { PointsDisplay } from "@/components/points-display"
import { LogoutButton } from "@/components/logout-button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { CourseCard } from "@/components/course-card"
import { HeroSection } from "@/components/hero-section"
import { CourseStats } from "@/components/course-stats"
import { useCurrentUser } from "@/hooks/use-current-user"

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
  tags?: string[]
}

export default function DashboardPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, loading: userLoading, hasAccessToCategory, hasAccessToCourse, isAccessExpired } = useCurrentUser()

  useEffect(() => {
    if (!userLoading) {
      fetchCourses()
    }
  }, [userLoading])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/courses')
      if (!response.ok) {
        throw new Error('Erro ao carregar cursos')
      }
      const data = await response.json()
      console.log('Dashboard - courses data:', data.courses)
      
      // Filtrar cursos baseado no acesso do usuário
      const filteredCourses = (data.courses || []).filter((course: Course) => {
        // Verificar acesso ao curso específico
        if (!hasAccessToCourse(course.id)) {
          return false
        }
        
        // Verificar acesso à categoria (se o curso tem categoria)
        if (course.category && !hasAccessToCategory(course.category)) {
          return false
        }
        
        return true
      })
      
      console.log('Dashboard - filtered courses:', filteredCourses)
      setCourses(filteredCourses)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  if (loading || userLoading) {
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
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
                  <BookOpen className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-semibold tracking-tight">Sabedoria das Escrituras</span>
              </Link>

              <div className="hidden md:flex items-center gap-6">
                <Link href="/dashboard" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                  Cursos
                </Link>
                <Link
                  href="/ranking"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Ranking
                </Link>
                <Link
                  href="/my-learning"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Meu Aprendizado
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="h-9 w-9 hidden md:flex hover:bg-primary/10 hover:text-primary">
                <Search className="h-5 w-5" />
              </Button>
              <ThemeToggle />
              <PointsDisplay />
              <Link href="/settings">
                <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-primary/10 hover:text-primary">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
              <LogoutButton user={user ? { name: user.name, email: user.email, role: user.role } : undefined} />
              <Button variant="ghost" size="icon" className="h-9 w-9 md:hidden hover:bg-primary/10 hover:text-primary">
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <HeroSection />

        {/* Alertas de Acesso */}
        {isAccessExpired() && (
          <Alert className="mb-6 border-orange-500 bg-orange-500/10">
            <Clock className="h-4 w-4" />
            <AlertDescription className="text-orange-600">
              Seu acesso expirou em {user?.access_expires_at ? new Date(user.access_expires_at).toLocaleDateString('pt-BR') : 'data não definida'}. 
              Entre em contato com o administrador para renovar seu acesso.
            </AlertDescription>
          </Alert>
        )}

        {user && (user.allowed_categories?.length || user.allowed_courses?.length) && (
          <Alert className="mb-6 border-blue-500 bg-blue-500/10">
            <Shield className="h-4 w-4" />
            <AlertDescription className="text-blue-600">
              Você tem acesso personalizado a {user.allowed_categories?.length || 0} categorias e {user.allowed_courses?.length || 0} cursos específicos.
            </AlertDescription>
          </Alert>
        )}

        <div className="mb-12">
          <CourseStats />
        </div>

        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-foreground mb-2">Cursos disponíveis</h2>
          <p className="text-muted-foreground">
            Acesse conteúdos em PDF, leitura responsiva com efeito de revista, progresso gamificado e desafios semanais.
          </p>
        </div>

        {courses.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {user?.allowed_categories?.length || user?.allowed_courses?.length 
                ? "Nenhum curso disponível para seu acesso" 
                : "Nenhum curso disponível"
              }
            </h3>
            <p className="text-muted-foreground mb-4">
              {user?.allowed_categories?.length || user?.allowed_courses?.length 
                ? "Você não tem acesso aos cursos disponíveis ou não há conteúdo liberado para seu perfil."
                : "Os cursos estão sendo carregados ou não há conteúdo disponível no momento."
              }
            </p>
            <Button onClick={fetchCourses}>Tentar novamente</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <CourseCard 
                key={course.id} 
                course={{
                  id: course.id,
                  slug: course.slug,
                  title: course.title,
                  description: course.description,
                  readingTimeMinutes: course.reading_time_minutes || 0,
                  coverUrl: course.cover_url,
                  tags: course.tags
                }} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
