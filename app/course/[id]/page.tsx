"use client"

import { BookOpen, ChevronLeft, User, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { PointsDisplay } from "@/components/points-display"
import { MobileDrawer } from "@/components/mobile-drawer"
import Link from "next/link"
import { PDFVolumeSelector } from "@/components/pdf-volume-selector"
import { ViewModeSelector } from "@/components/view-mode-selector"
import { OriginalPDFViewer } from "@/components/original-pdf-viewer"
import { DigitalMagazineViewer } from "@/components/digital-magazine-viewer"
import { useGamification } from "@/contexts/gamification-context"
import { PremiumAccessGate } from "@/components/premium-access-gate"
import { CongratulationsModal } from "@/components/congratulations-modal"
import { useCongratulations } from "@/hooks/use-congratulations"
import { useCurrentUser } from "@/hooks/use-current-user"
import { useState, use, useEffect } from "react"
import { CoursePDF } from "@/lib/courses-data"

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

export default function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = use(params)
  const [showPDFReader, setShowPDFReader] = useState(false)
  const [selectedPDF, setSelectedPDF] = useState<CoursePDF | null>(null)
  const [viewMode, setViewMode] = useState<'original' | 'digital-magazine' | undefined>(undefined)
  const [readingMode, setReadingMode] = useState<'light' | 'sepia' | 'dark'>('light')
  const { addPoints } = useGamification()
  const { 
    showModal, 
    courseId: congratsCourseId, 
    courseTitle: congratsCourseTitle, 
    checkForCompletion, 
    closeModal 
  } = useCongratulations()
  const { user, hasAccessToCourse } = useCurrentUser()
  const [sessionDuration, setSessionDuration] = useState(0)
  const [lastPage, setLastPage] = useState(1)
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCourse()
  }, [courseId])

  const fetchCourse = async () => {
    try {
      setLoading(true)
      // Verificar se é um UUID (ID) ou slug
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(courseId)
      
      let response
      if (isUUID) {
        // Se for UUID, buscar por ID
        response = await fetch(`/api/courses/${courseId}`)
      } else {
        // Se não for UUID, buscar por slug
        response = await fetch(`/api/courses/by-slug/${courseId}`)
      }
      
      if (response.ok) {
        const data = await response.json()
        console.log('📚 Dados do curso recebidos:', data.course)
        console.log('📄 PDFs do curso:', data.course?.course_pdfs)
        // Verificar se os PDFs têm youtube_url e audio_url
        if (data.course?.course_pdfs) {
          data.course.course_pdfs.forEach((pdf: any, index: number) => {
            console.log(`📋 PDF ${index + 1} (${pdf.volume}):`, {
              youtube_url: pdf.youtube_url,
              audio_url: pdf.audio_url,
              title: pdf.title
            })
          })
        }
        setCourse(data.course)
      }
    } catch (error) {
      console.error('Erro ao carregar curso:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          <span>Carregando curso...</span>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Curso não encontrado</p>
      </div>
    )
  }

  // NOTA: A verificação de acesso é feita pelo PremiumAccessGate (server-side)
  // que é mais confiável e segura. Removemos a verificação client-side duplicada.

  const handleSessionUpdate = (durationSeconds: number, currentPage: number) => {
    setSessionDuration(durationSeconds)
    if (currentPage > lastPage) {
      addPoints(5, `Leu até a página ${currentPage}`)
      setLastPage(currentPage)
    }
  }

  const handleSelectPDF = (pdf: CoursePDF, mode?: 'original' | 'digital-magazine') => {
    setSelectedPDF(pdf)
    setShowPDFReader(true)
    if (mode) {
      setViewMode(mode)
    } else {
      setViewMode(undefined)
    }
  }

  const handleSelectViewMode = (mode: 'original' | 'digital-magazine') => {
    setViewMode(mode)
  }

  const handleDownload = () => {
    if (selectedPDF) {
      const link = document.createElement("a")
      link.href = selectedPDF.url
      link.download = `${selectedPDF.title}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleBackToModeSelection = () => {
    setViewMode(undefined)
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <div className="flex h-14 md:h-16 items-center justify-between">
            <div className="flex items-center gap-4 md:gap-8">
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-xl bg-primary">
                  <BookOpen className="h-4 w-4 md:h-5 md:w-5 text-primary-foreground" />
                </div>
                <span className="text-lg md:text-xl font-semibold tracking-tight hidden sm:inline">As Cartas de Paulo</span>
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
              <ThemeToggle />
              <PointsDisplay />
              <Link href="/settings" className="hidden md:block">
                <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-primary/10 hover:text-primary">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
              <MobileDrawer
                user={user ? { name: user.name || user.email, email: user.email, role: user.role || 'student' } : undefined}
                currentPath={`/course/${courseId}`}
              />
            </div>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => {
              // Usar router.push como fallback se window.history.back() não funcionar
              if (window.history.length > 1) {
                window.history.back()
              } else {
                // Fallback: ir para dashboard se não há histórico
                window.location.href = '/dashboard'
              }
            }}
            className="inline-flex items-center gap-2 text-sm text-[#F3C77A] hover:text-[#FFD88A] transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>

        <PremiumAccessGate 
          courseId={course.id}
          course={{
            id: course.id,
            title: course.title,
            price: (course as any).price,
            course_categories: course.course_categories
          }}
        >
          {!showPDFReader ? (
          <div className="mb-8">
            <div className="mb-6">
              {course.category && (
                <p className="text-sm uppercase tracking-[0.2em] text-[#F3C77A] mb-2">CURSO COMPLETO</p>
              )}
              <h1 className="text-4xl font-bold tracking-tight text-foreground text-balance">{course.title}</h1>
              {course.author && <p className="mt-2 text-lg text-[#CABFAF]">{course.author}</p>}
            </div>

            <p className="text-base leading-relaxed text-[#CABFAF] max-w-3xl mb-8">{course.description}</p>

            <PDFVolumeSelector
              pdfs={course.course_pdfs || []}
              onSelectPDF={handleSelectPDF}
              selectedPDF={selectedPDF || undefined}
            />
          </div>
        ) : selectedPDF && !viewMode ? (
          <div className="mt-8">
            <ViewModeSelector
              onSelectMode={handleSelectViewMode}
              selectedMode={viewMode}
              onDownload={handleDownload}
              readingMode={readingMode}
              onReadingModeChange={setReadingMode}
            />
          </div>
        ) : selectedPDF && viewMode ? (
          <div className="mt-8">
            {viewMode === 'original' ? (
              <OriginalPDFViewer
                pdfUrl={selectedPDF.url}
                courseId={courseId}
                pdfId={selectedPDF.id}
                onSessionUpdate={handleSessionUpdate}
              />
            ) : (
              <DigitalMagazineViewer
                pdfUrl={selectedPDF.url}
                courseId={courseId}
                pdfId={selectedPDF.id}
                pdfData={selectedPDF}
                onSessionUpdate={handleSessionUpdate}
                readingMode={readingMode}
                onBackToModeSelection={handleBackToModeSelection}
              />
            )}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[#1F1A14] bg-[#16130F] px-6 py-6">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-[#F3C77A]">Gamificação ativa</p>
                <p className="text-base text-[#CABFAF]">
                  Tempo contabilizado: {Math.round(sessionDuration / 60)} min • Página atual #{lastPage}
                </p>
                <p className="text-sm text-[#F3C77A] mt-1">
                  Volume: {selectedPDF.volume} - {selectedPDF.title}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Modo: {viewMode === 'original' ? 'PDF Original' : 'Bíblia Digital'}
                  {viewMode === 'digital-magazine' && ` • Temperatura: ${readingMode}`}
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setViewMode(undefined)
                    setShowPDFReader(false)
                    setSelectedPDF(null)
                  }}
                  variant="outline"
                  size="sm"
                  className="border-[#2E261D] text-[#BCB19F] hover:bg-[#2E261D]"
                >
                  Voltar aos Volumes
                </Button>
                <button
                  onClick={async () => {
                    addPoints(sessionDuration, `Sessão de leitura de ${Math.round(sessionDuration / 60)} minutos`)
                    alert("Progresso salvo no ranking!")
                    
                    // Verificar se o curso foi concluído
                    if (course) {
                      await checkForCompletion(course.id, course.title)
                    }
                  }}
                  disabled={sessionDuration < 60}
                  className="rounded-full bg-[#F3C77A] px-6 py-3 text-sm font-semibold text-black shadow-[0_20px_60px_rgba(243,199,122,0.35)] disabled:cursor-not-allowed disabled:bg-[#B39B6C]"
                >
                  Salvar progresso no ranking
                </button>
              </div>
            </div>
          </div>
        ) : null}
        </PremiumAccessGate>

        {/* Modal de Parabéns */}
        {congratsCourseId && congratsCourseTitle && (
          <CongratulationsModal
            courseId={congratsCourseId}
            courseTitle={congratsCourseTitle}
            isOpen={showModal}
            onClose={closeModal}
          />
        )}
      </div>
    </div>
  )
}