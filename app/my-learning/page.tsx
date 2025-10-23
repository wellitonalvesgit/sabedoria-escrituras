"use client"

import { useState, useEffect } from "react"
import { BookOpen, Search, User, Menu, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { PointsDisplay } from "@/components/points-display"
import Link from "next/link"
import { GamificationPanel } from "@/components/gamification-panel"

interface Course {
  id: string
  title: string
  author?: string
  cover_url?: string
  category?: string
  pages?: number
  reading_time_minutes?: number
  course_pdfs: any[]
}

export default function MyLearningPage() {
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
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
                  <BookOpen className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-semibold tracking-tight">Sabedoria das Escrituras</span>
              </Link>

              <div className="hidden md:flex items-center gap-6">
                <Link
                  href="/"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
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
                  className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                >
                  Meu Aprendizado
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="h-9 w-9 hidden md:flex">
                <Search className="h-5 w-5" />
              </Button>
              <ThemeToggle />
              <PointsDisplay />
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <User className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Meu Aprendizado</h1>
          <p className="mt-2 text-lg text-muted-foreground">Acompanhe seu progresso e conquistas</p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="mb-4 text-2xl font-bold text-foreground">Continue Estudando</h2>
              <div className="space-y-4">
                {courses.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Nenhum curso disponível no momento.</p>
                    <Link href="/">
                      <Button className="mt-4">Explorar Cursos</Button>
                    </Link>
                  </div>
                ) : (
                  courses.map((course) => (
                    <Link
                      key={course.id}
                      href={`/course/${course.id}`}
                      className="group flex gap-4 rounded-xl border border-border bg-muted/30 p-4 transition-all duration-300 hover:border-primary/30 hover:bg-muted/50 hover:shadow-lg"
                    >
                      <div className="relative h-24 w-32 flex-shrink-0 overflow-hidden rounded-lg">
                        <img
                          src={course.cover_url || "/placeholder.svg"}
                          alt={course.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {course.title}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">{course.author || 'Autor não informado'}</p>
                        <div className="mt-3 space-y-1">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{course.course_pdfs.length} PDFs disponíveis</span>
                            <span>{course.reading_time_minutes || 0} min de leitura</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="bg-primary/10 text-primary px-2 py-1 rounded-full">
                              {course.category || 'Categoria'}
                            </span>
                            {course.pages && (
                              <span>{course.pages} páginas</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <GamificationPanel />
          </div>
        </div>
      </div>
    </div>
  )
}
