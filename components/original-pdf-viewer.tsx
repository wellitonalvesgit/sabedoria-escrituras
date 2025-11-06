"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, Download, Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { convertGoogleDriveToPreview } from "@/lib/google-drive-utils"

interface OriginalPDFViewerProps {
  pdfUrl: string
  courseId: string
  pdfId?: string  // ID do PDF no banco de dados
  onSessionUpdate?: (durationSeconds: number, currentPage: number) => void
}

export const OriginalPDFViewer = ({ pdfUrl, courseId, pdfId, onSessionUpdate }: OriginalPDFViewerProps) => {
  // Converter URL do Google Drive para formato preview
  const previewUrl = convertGoogleDriveToPreview(pdfUrl)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [startTime] = useState(() => Date.now())
  const [zoom, setZoom] = useState(100)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<number>()

  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      const duration = Math.round((Date.now() - startTime) / 1000)
      onSessionUpdate?.(duration, currentPage)
    }, 60000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      const duration = Math.round((Date.now() - startTime) / 1000)
      onSessionUpdate?.(duration, currentPage)
    }
  }, [startTime, currentPage, onSessionUpdate])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
    }
  }, [])

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 300))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50))
  }

  const handleResetZoom = () => {
    setZoom(100)
  }

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = pdfUrl
    link.download = `${courseId}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const toggleFullscreen = async () => {
    if (!containerRef.current) return

    try {
      if (!document.fullscreenElement) {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen()
        } else if ((containerRef.current as any).webkitRequestFullscreen) {
          await (containerRef.current as any).webkitRequestFullscreen()
        } else if ((containerRef.current as any).mozRequestFullScreen) {
          await (containerRef.current as any).mozRequestFullScreen()
        } else if ((containerRef.current as any).msRequestFullscreen) {
          await (containerRef.current as any).msRequestFullscreen()
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen()
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen()
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen()
        }
      }
    } catch (err) {
      console.error('Erro ao entrar/sair do modo tela cheia:', err)
    }
  }

  const nextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages))
  }

  const prevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1))
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] space-y-4 p-8">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-foreground mb-2">Erro ao carregar PDF</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Tentar Novamente
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Controles do PDF */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#2E261D] bg-[#16130F] px-6 py-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#BCB19F]">Zoom:</span>
            <span className="text-sm font-medium text-[#F3C77A]">{zoom}%</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleZoomOut}
              variant="outline"
              size="sm"
              className="border-[#2E261D] text-[#BCB19F] hover:bg-[#2E261D]"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleResetZoom}
              variant="outline"
              size="sm"
              className="border-[#2E261D] text-[#BCB19F] hover:bg-[#2E261D]"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleZoomIn}
              variant="outline"
              size="sm"
              className="border-[#2E261D] text-[#BCB19F] hover:bg-[#2E261D]"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleDownload}
            variant="outline"
            size="sm"
            className="border-[#F3C77A] text-[#F3C77A] hover:bg-[#F3C77A] hover:text-black"
          >
            <Download className="mr-2 h-4 w-4" />
            Baixar PDF
          </Button>
          <Button
            onClick={toggleFullscreen}
            variant="outline"
            size="sm"
            className="border-[#2E261D] text-[#BCB19F] hover:bg-[#2E261D]"
          >
            <Maximize2 className="mr-2 h-4 w-4" />
            {isFullscreen ? "Sair" : "Tela Cheia"}
          </Button>
        </div>
      </div>

      {/* Visualizador de PDF */}
      <div 
        ref={containerRef}
        className={`relative mx-auto w-full ${isFullscreen ? 'h-screen' : 'max-w-6xl'}`}
      >
        {isLoading && (
          <div className="flex items-center justify-center min-h-[600px]">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F3C77A] mx-auto"></div>
              <p className="text-[#F3C77A] font-medium">Carregando PDF...</p>
            </div>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl border border-[#2E261D] bg-white shadow-2xl"
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
            minHeight: isFullscreen ? '100vh' : '800px'
          }}
        >
          <iframe
            ref={iframeRef}
            src={`${previewUrl}#page=${currentPage}&toolbar=1&navpanes=1&scrollbar=1&zoom=${zoom}`}
            className={`w-full ${isFullscreen ? 'h-screen' : 'h-[800px]'}`}
            onLoad={() => {
              console.log("PDF carregado com sucesso:", previewUrl)
              setIsLoading(false)
              // Simular detecção de páginas totais
              setTotalPages(45) // Em produção, isso viria da API do PDF
            }}
            onError={() => {
              console.log("Erro ao carregar PDF:", previewUrl)
              setError("Não foi possível carregar o PDF. Verifique se o link está correto e se o arquivo está público no Google Drive.")
              setIsLoading(false)
            }}
            title="PDF Viewer"
            allow="autoplay"
          />
        </motion.div>

        {/* Controles de Navegação */}
        <div className="absolute bottom-8 left-8 right-8 flex items-center justify-between">
          <Button
            onClick={prevPage}
            disabled={currentPage === 1}
            variant="ghost"
            size="icon"
            className="h-14 w-14 rounded-full bg-[#16130F]/90 text-[#F3C77A] backdrop-blur-sm hover:bg-[#16130F] disabled:opacity-30 shadow-xl"
          >
            <ChevronLeft className="h-7 w-7" />
          </Button>

          <div className="rounded-full bg-[#16130F]/90 px-6 py-3 text-base font-semibold text-[#F3C77A] backdrop-blur-sm shadow-xl">
            Página {currentPage} {totalPages > 0 && `de ${totalPages}`}
          </div>

          <Button
            onClick={nextPage}
            disabled={currentPage === totalPages}
            variant="ghost"
            size="icon"
            className="h-14 w-14 rounded-full bg-[#16130F]/90 text-[#F3C77A] backdrop-blur-sm hover:bg-[#16130F] disabled:opacity-30 shadow-xl"
          >
            <ChevronRight className="h-7 w-7" />
          </Button>
        </div>
      </div>

      {/* Barra de Progresso */}
      <div className="mx-auto w-full max-w-6xl">
        <div className="h-2 overflow-hidden rounded-full bg-[#2E261D]">
          <div
            className="h-full bg-[#F3C77A] transition-all duration-300"
            style={{ width: `${totalPages > 0 ? (currentPage / totalPages) * 100 : 0}%` }}
          />
        </div>
      </div>
    </div>
  )
}
