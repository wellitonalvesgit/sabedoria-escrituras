"use client"

import { useState, useEffect } from "react"
import { BookOpen, Search, User, Menu, Loader2, Shield, Clock, Filter, X, RefreshCw } from "lucide-react"
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
  courses?: Course[]
  color?: string
  icon?: string
}

export default function DashboardPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [allCourses, setAllCourses] = useState<Course[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [refreshing, setRefreshing] = useState(false)
  const { user, loading: userLoading, sessionValid, hasAccessToCourse, isAccessExpired, refreshUserData } = useCurrentUser()

  useEffect(() => {
    if (!userLoading) {
      // Carregar cursos e categorias em paralelo para melhor performance
      Promise.all([fetchCourses(), fetchCategories()])
    }
  }, [userLoading])

  // sessionValid é gerenciado automaticamente pelo useCurrentUser

  // Aplicar filtros
  useEffect(() => {
    let filtered = allCourses

    // Filtro por categorias
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(course => {
        // Verificar se o curso tem alguma das categorias selecionadas usando course_categories
        if (course.course_categories && course.course_categories.length > 0) {
          return course.course_categories.some(cc => 
            selectedCategories.includes(cc.category_id)
          )
        }
        // Fallback: verificar se o curso tem categoria simples
        return selectedCategories.includes(course.category_id || '')
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

      const response = await fetch('/api/courses')
      if (!response.ok) {
        throw new Error('Erro ao carregar cursos')
      }
      const data = await response.json()

      // Buscar compras individuais do usuário se estiver logado
      let userPurchases: string[] = []
      if (user?.id && sessionValid) {
        try {
          const purchasesResponse = await fetch('/api/user/purchases', {
            credentials: 'include'
          })
          if (purchasesResponse.ok) {
            const purchasesData = await purchasesResponse.json()
            userPurchases = (purchasesData.purchases || []).map((p: any) => p.course_id)
          }
        } catch (err) {
          console.error('Erro ao buscar compras do usuário:', err)
        }
      }

      // Mostrar TODOS os cursos, mas marcar quais têm acesso
      const allCoursesWithAccess = (data.courses || []).map((course: Course) => {
        // Verificar se é curso da categoria arsenal-espiritual
        const categorySlug = course.course_categories?.[0]?.categories?.slug
        const isArsenalEspiritual = categorySlug === 'arsenal-espiritual'

        // Se for arsenal-espiritual, APENAS verificar se o usuário comprou o curso
        if (isArsenalEspiritual) {
          const hasPurchased = userPurchases.includes(course.id)
          return {
            ...course,
            userHasAccess: hasPurchased // Só liberado se comprou
          }
        }

        // Para outros cursos, usar a verificação padrão
        const hasAccess = user && sessionValid && hasAccessToCourse(course.id)
        return {
          ...course,
          userHasAccess: hasAccess
        }
      })

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
      // Buscar categorias via API
      const response = await fetch('/api/categories')

      if (!response.ok) {
        throw new Error('Erro ao carregar categorias')
      }

      const data = await response.json()
      setCategories(data.categories || [])
    } catch (err) {
      console.error('Erro ao carregar categorias:', err)
    }
  }

  const handleRefreshPermissions = async () => {
    try {
      setRefreshing(true)
      await refreshUserData()
      // Recarregar os cursos para atualizar o status de acesso
      await fetchCourses()
    } catch (err) {
      console.error('Erro ao atualizar permissões:', err)
    } finally {
      setRefreshing(false)
    }
  }

  // Agrupar cursos por categoria (usar courses filtrados, não allCourses)
  const getCoursesByCategory = (categoryId: string) => {
    return courses.filter(course => {
      // Verificar se o curso tem a categoria especificada (usando course_categories)
      if (course.course_categories && course.course_categories.length > 0) {
        return course.course_categories.some(cc => cc.category_id === categoryId)
      }
      // Fallback: verificar se o curso tem categoria simples
      return course.category_id === categoryId
    })
  }

  // Filtrar categorias se houver seleção específica
  const categoriesToShow = selectedCategories.length > 0
    ? categories.filter(cat => selectedCategories.includes(cat.id))
    : categories

  // Organizar categorias com seus cursos
  const categoriesWithCourses = categoriesToShow
    .map(cat => ({
      ...cat,
      courses: getCoursesByCategory(cat.id)
    }))
    .filter(cat => cat.courses.length > 0)
    .sort((a, b) => a.display_order - b.display_order)

  // Categorias que devem ser exibidas como carrossel
  const carouselCategories = categories.filter(cat => cat.display_as_carousel)

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
                <span className="text-xl font-semibold tracking-tight">As Cartas de Paulo</span>
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
              {/* Indicador de Status de Conexão */}
              {user ? (
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-medium text-green-600 dark:text-green-400">
                    {user.email}
                  </span>
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  <span className="text-xs font-medium text-red-600 dark:text-red-400">
                    Desconectado
                  </span>
                </div>
              )}

              <Button variant="ghost" size="icon" className="h-9 w-9 hidden md:flex hover:bg-primary/10 hover:text-primary">
                <Search className="h-5 w-5" />
              </Button>
              <ThemeToggle />
              <PointsDisplay />
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 hover:bg-primary/10 hover:text-primary"
                onClick={handleRefreshPermissions}
                disabled={refreshing}
                title="Atualizar permissões"
              >
                <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
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

        {user && user.allowed_courses?.length && (
          <Alert className="mb-6 border-blue-500 bg-blue-500/10">
            <Shield className="h-4 w-4" />
            <AlertDescription className="text-blue-600">
              Você tem acesso personalizado a {user.allowed_courses?.length || 0} cursos específicos.
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
              {user?.allowed_courses?.length
                ? "Nenhum curso disponível para seu acesso"
                : "Nenhum curso disponível"
              }
            </h3>
            <p className="text-muted-foreground mb-4">
              {user?.allowed_courses?.length
                ? "Você não tem acesso aos cursos disponíveis ou não há conteúdo liberado para seu perfil."
                : "Os cursos estão sendo carregados ou não há conteúdo disponível no momento."
              }
            </p>
            <Button onClick={fetchCourses}>Tentar novamente</Button>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Mostrar TODAS as categorias organizadas */}
            {categoriesWithCourses.map((category) => (
              <div key={category.id} className="space-y-4">
                {/* Cabeçalho da Categoria - apenas para categorias sem carrossel */}
                {!category.display_as_carousel && (
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold tracking-tight text-foreground">
                        {category.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {category.courses.length} {category.courses.length === 1 ? 'curso' : 'cursos'}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {category.slug}
                    </Badge>
                  </div>
                )}

                {/* Cursos da Categoria */}
                {category.display_as_carousel ? (
                  <CategoryCarousel
                    categoryName={category.name}
                    categorySlug={category.slug}
                    courses={category.courses.map(course => ({
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
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {category.courses.map((course) => (
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
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
