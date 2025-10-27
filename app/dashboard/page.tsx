"use client"

import { useState, useEffect } from "react"
import { BookOpen, Search, User, Menu, Loader2, Shield, Clock, Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { PointsDisplay } from "@/components/points-display"
import { LogoutButton } from "@/components/logout-button"
import { MobileDrawer } from "@/components/mobile-drawer"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { CourseCard } from "@/components/course-card"
import { HeroSection } from "@/components/hero-section"
import { CourseStats } from "@/components/course-stats"
import { CategorySelector } from "@/components/category-selector"
import { CategoryCarousel } from "@/components/category-carousel"
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
  category_id?: string
  userHasAccess?: boolean // Novo campo para indicar se o usuário tem acesso
  course_categories?: Array<{
    category_id: string
    categories: {
      id: string
      name: string
      slug: string
      color: string
    }
  }>
}

interface Category {
  id: string
  name: string
  slug: string
  display_as_carousel: boolean
  display_order: number
}

export default function DashboardPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [allCourses, setAllCourses] = useState<Course[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const { user, loading: userLoading, sessionValid, hasAccessToCategory, hasAccessToCourse, isAccessExpired } = useCurrentUser()

  useEffect(() => {
    if (!userLoading) {
      fetchCourses()
      fetchCategories()
    }
  }, [userLoading])

  // Verificação de segurança para sessionValid
  useEffect(() => {
    if (sessionValid === undefined) {
      console.log('⚠️ sessionValid é undefined, aguardando inicialização...')
    } else {
      console.log('✅ sessionValid inicializado:', sessionValid)
    }
  }, [sessionValid])

  // Aplicar filtros
  useEffect(() => {
    let filtered = allCourses

    // Filtro por categorias
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(course => {
        // Verificar se o curso tem alguma das categorias selecionadas
        // Por enquanto, vamos usar o campo category simples
        // TODO: Implementar busca por course_categories quando disponível
        return selectedCategories.some(catId => 
          course.category === catId || 
          course.tags?.includes(catId)
        )
      })
    }

    // Filtro por termo de busca
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(course => 
        course.title.toLowerCase().includes(term) ||
        course.description.toLowerCase().includes(term) ||
        course.author?.toLowerCase().includes(term)
      )
    }

    setCourses(filtered)
  }, [allCourses, selectedCategories, searchTerm])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      console.log('🔍 Iniciando busca de cursos...')
      console.log('👤 Usuário atual:', user ? `${user.name} (${user.email})` : 'Não logado')
      console.log('🔑 Dados do usuário:', user ? {
        role: user.role,
        status: user.status,
        allowed_courses: user.allowed_courses,
        allowed_categories: user.allowed_categories,
        blocked_courses: user.blocked_courses,
        blocked_categories: user.blocked_categories
      } : 'N/A')
      console.log('⏳ Loading state:', loading)
      console.log('🔐 Session valid:', sessionValid)
      
      const response = await fetch('/api/courses')
      if (!response.ok) {
        throw new Error('Erro ao carregar cursos')
      }
      const data = await response.json()
      console.log('Dashboard - courses data:', data.courses)

      // Mostrar TODOS os cursos, mas marcar quais têm acesso
      const allCoursesWithAccess = (data.courses || []).map((course: Course) => {
        console.log(`Verificando acesso ao curso: ${course.title}`)
        
        // Verificar se o usuário tem acesso ao curso
        // Se tem acesso direto ao curso, permitir independente da categoria
        const hasAccess = user && sessionValid && (
          hasAccessToCourse(course.id) || 
          // Se não tem acesso direto ao curso, verificar se tem acesso via categoria
          (course.course_categories && course.course_categories.length > 0 && 
           course.course_categories.some((cc: any) => hasAccessToCategory(cc.category_id)))
        )
        
        console.log(`${hasAccess ? '✅' : '🔒'} Curso ${course.title} - ${hasAccess ? 'Acesso liberado' : 'Acesso restrito'}`)
        
        return {
          ...course,
          userHasAccess: hasAccess
        }
      })

      console.log('Dashboard - todos os cursos:', allCoursesWithAccess.length)
      console.log('Dashboard - cursos com acesso:', allCoursesWithAccess.filter(c => c.userHasAccess).length)
      setAllCourses(allCoursesWithAccess)
      setCourses(allCoursesWithAccess)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      // Usar a instância global do supabase
      const { supabase } = await import('@/lib/supabase')

      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug, display_as_carousel, display_order')
        .order('display_order', { ascending: true })

      if (error) throw error
      setCategories(data || [])
    } catch (err) {
      console.error('Erro ao carregar categorias:', err)
    }
  }

  // Agrupar cursos por categoria
  const getCoursesByCategory = (categoryId: string) => {
    return courses.filter(course => course.category_id === categoryId)
  }

  // Categorias que devem ser exibidas como carrossel
  const carouselCategories = categories.filter(cat => cat.display_as_carousel)

  // Cursos que não estão em nenhuma categoria com carrossel
  const standaloneCourses = courses.filter(course =>
    !course.category_id ||
    !carouselCategories.some(cat => cat.id === course.category_id)
  )

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
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/95">
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
              <MobileDrawer 
                user={user ? { name: user.name, email: user.email, role: user.role } : undefined}
                currentPath="/dashboard"
              />
            </div>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-6 pt-24 pb-8 lg:px-8">
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

        {/* Filtros */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Buscar cursos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {searchTerm && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                      onClick={() => setSearchTerm("")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <CategorySelector
                  selectedCategories={selectedCategories}
                  onChange={setSelectedCategories}
                  multiple={true}
                />
              </div>
            </div>
            
            {/* Filtros ativos */}
            {(selectedCategories.length > 0 || searchTerm) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedCategories.length > 0 && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Filter className="h-3 w-3" />
                    {selectedCategories.length} categoria(s)
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1"
                      onClick={() => setSelectedCategories([])}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                {searchTerm && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Search className="h-3 w-3" />
                    "{searchTerm}"
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1"
                      onClick={() => setSearchTerm("")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

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
          <div>
            {/* Categorias com Carrossel */}
            {carouselCategories.map((category) => {
              const categoryCourses = getCoursesByCategory(category.id)
              if (categoryCourses.length === 0) return null

              return (
                <CategoryCarousel
                  key={category.id}
                  categoryName={category.name}
                  categorySlug={category.slug}
                  courses={categoryCourses.map(course => ({
                    id: course.id,
                    slug: course.slug,
                    title: course.title,
                    description: course.description,
                    thumbnail_url: course.cover_url || null,
                    instructor_name: course.author || null,
                    duration_hours: course.reading_time_minutes ? Math.ceil(course.reading_time_minutes / 60) : null,
                    level: null,
                    rating: null,
                    students_count: 0
                  }))}
                />
              )
            })}

            {/* Cursos Standalone (grid tradicional) */}
            {standaloneCourses.length > 0 && (
              <div>
                {carouselCategories.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">Outros Cursos</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {standaloneCourses.length} {standaloneCourses.length === 1 ? 'curso disponível' : 'cursos disponíveis'}
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {standaloneCourses.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={{
                        id: course.id,
                        slug: course.slug,
                        title: course.title,
                        description: course.description,
                        readingTimeMinutes: course.reading_time_minutes || 0,
                        coverUrl: course.cover_url,
                        tags: course.tags,
                        userHasAccess: course.userHasAccess
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
