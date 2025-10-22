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

export default function Home() {
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
              <Link href="/" className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
                  <BookOpen className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-semibold tracking-tight">Sabedoria das Escrituras</span>
              </Link>

              <div className="hidden md:flex items-center gap-6">
                <Link href="/" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
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
                <Link
                  href="/admin"
                  className="text-sm font-medium text-[#F3C77A] hover:text-[#FFD88A] transition-colors"
                >
                  Admin
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

      <div className="mx-auto max-w-7xl px-6 py-12">
        <HeroSection />
      </div>

             <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
               <div className="mb-12">
                 <h2 className="text-3xl font-bold tracking-tight text-foreground">Cursos disponíveis</h2>
                 <p className="mt-2 text-muted-foreground">
                   Acesse conteúdos em PDF, leitura responsiva com efeito de revista, progresso gamificado e desafios semanais.
                 </p>
               </div>
               
               <CourseStats />

               {/* Cursos por Categoria */}
               {(() => {
                 // Agrupar cursos por categoria
                 const coursesByCategory = courses.reduce((acc, course) => {
                   const category = course.category || 'Outros';
                   if (!acc[category]) {
                     acc[category] = [];
                   }
                   acc[category].push(course);
                   return acc;
                 }, {} as Record<string, typeof courses>);

                 // Definir ordem e cores das categorias
                 const categoryOrder = [
                   { name: 'Sabedoria das Escrituras', color: 'bg-blue-600', description: 'Coleção completa de estudos bíblicos e teológicos' },
                   { name: 'Unção do Leão', color: 'bg-amber-600', description: 'Desenvolvendo Autoridades Espirituais' },
                   { name: 'Kit do Pregador Premium', color: 'bg-purple-600', description: 'Formação completa para pregadores e comunicadores' },
                   { name: 'Ebooks Apocalipse Revelado', color: 'bg-red-600', description: 'Estudos profundos sobre o livro do Apocalipse' },
                   { name: 'Kit da Mulher Cristã', color: 'bg-pink-600', description: 'Recursos especiais para o crescimento espiritual da mulher cristã' },
                   { name: 'Bônus', color: 'bg-emerald-600', description: 'Cursos Especiais e Bônus' }
                 ];

                 return categoryOrder.map((categoryInfo) => {
                   const categoryCourses = coursesByCategory[categoryInfo.name];
                   if (!categoryCourses || categoryCourses.length === 0) return null;

                   return (
                     <div key={categoryInfo.name} className="mb-16">
                       <div className="flex items-center gap-4 mb-8">
                         <div className={`w-4 h-4 rounded-full ${categoryInfo.color}`}></div>
                         <div>
                           <h3 className="text-2xl font-bold text-foreground">{categoryInfo.name}</h3>
                           <p className="text-muted-foreground">{categoryInfo.description}</p>
                         </div>
                         <div className="ml-auto">
                           <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                             {categoryCourses.length} curso{categoryCourses.length !== 1 ? 's' : ''}
                           </span>
                         </div>
                       </div>
                       
                       <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                         {categoryCourses.map((course, index) => (
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
                             index={index} 
                           />
                         ))}
                       </div>
                     </div>
                   );
                 });
               })()}
             </section>
    </div>
  )
}
