"use client"

import { useState, useEffect } from "react"
import { BookOpen, Search, User, Menu, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { PointsDisplay } from "@/components/points-display"
import Link from "next/link"
import { CourseCard } from "@/components/course-card"
import { HeroSection } from "@/components/hero-section"
import { CourseStats } from "@/components/course-stats"

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
              <Button variant="ghost" size="icon" className="h-9 w-9 md:hidden hover:bg-primary/10 hover:text-primary">
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <HeroSection />

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
            <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum curso disponível</h3>
            <p className="text-muted-foreground mb-4">
              Os cursos estão sendo carregados ou não há conteúdo disponível no momento.
            </p>
            <Button onClick={fetchCourses}>Tentar novamente</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
