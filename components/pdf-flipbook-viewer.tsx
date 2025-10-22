"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, Download, Sun, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PDFFlipbookViewerProps {
  pdfUrl: string
  courseId: string
  onSessionUpdate?: (durationSeconds: number, currentPage: number) => void
}

export const PDFFlipbookViewer = ({ pdfUrl, courseId, onSessionUpdate }: PDFFlipbookViewerProps) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [startTime] = useState(() => Date.now())
  const [readingLight, setReadingLight] = useState<"warm" | "cool" | "sepia">("warm")
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [isFlipping, setIsFlipping] = useState(false)
  const intervalRef = useRef<number>()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const pageFlipAudioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    pageFlipAudioRef.current = new Audio()
    pageFlipAudioRef.current.volume = 0.3
    // Using a data URL for a simple page flip sound effect
    pageFlipAudioRef.current.src =
      "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGe77OeeSwwPUKXi8LdjHAU5k9jyzHksBSR3yPDekEALFF+16+qnVRQKRp/h8r9sIQYsgc7y2Ik2CBhnu+znm0sMD1Cl4vC3YxwFOZPY8sx5LAUkd8jw3pBACxRftevqp1UUCkaf4fK/bCEGLIHO8tmJNggYZ7vs55tLDA9QpeLwt2McBTmT2PLMeSwFJHfI8N6QQAsUX7Xr6qdVFApGn+Hyv2whBiyBzvLZiTYIGGe77OebSwwPUKXi8LdjHAU5k9jyzHksBSR3yPDekEALFF+16+qnVRQKRp/h8r9sIQYsgc7y2Yk2CBhnu+znm0sMD1Cl4vC3YxwFOZPY8sx5LAUkd8jw3pBACxRftevqp1UUCkaf4fK/bCEGLIHO8tmJNggYZ7vs55tLDA9QpeLwt2McBTmT2PLMeSwFJHfI8N6QQAsUX7Xr6qdVFApGn+Hyv2whBiyBzvLZiTYIGGe77OebSwwPUKXi8LdjHAU5k9jyzHksBSR3yPDekEALFF+16+qnVRQKRp/h8r9sIQYsgc7y2Yk2CBhnu+znm0sMD1Cl4vC3YxwFOZPY8sx5LAUkd8jw3pBACxRftevqp1UUCkaf4fK/bCEGLIHO8tmJNggYZ7vs55tLDA9QpeLwt2McBTmT2PLMeSwFJHfI8N6QQAsUX7Xr6qdVFApGn+Hyv2whBiyBzvLZiTYIGGe77OebSwwPUKXi8LdjHAU5k9jyzHksBSR3yPDekEALFF+16+qnVRQKRp/h8r9sIQYsgc7y2Yk2CBhnu+znm0sMD1Cl4vC3YxwFOZPY8sx5LAUkd8jw3pBACxRftevqp1UUCkaf4fK/bCEGLIHO8tmJNggYZ7vs55tLDA9QpeLwt2McBTmT2PLMeSwFJHfI8N6QQAsUX7Xr6qdVFApGn+Hyv2whBiyBzvLZiTYIGGe77OebSwwPUKXi8LdjHAU5k9jyzHksBSR3yPDekEALFF+16+qnVRQKRp/h8r9sIQYsgc7y2Yk2CBhnu+znm0sMD1Cl4vC3Yw="
  }, [])

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

  const playPageFlipSound = () => {
    if (soundEnabled && pageFlipAudioRef.current) {
      pageFlipAudioRef.current.currentTime = 0
      pageFlipAudioRef.current.play().catch(() => {
        // Ignore autoplay errors
      })
    }
  }

  const nextPage = () => {
    if (currentPage < totalPages && !isFlipping) {
      setIsFlipping(true)
      playPageFlipSound()
      setTimeout(() => {
        setCurrentPage(currentPage + 1)
        setIsFlipping(false)
      }, 600)
    }
  }

  const prevPage = () => {
    if (currentPage > 1 && !isFlipping) {
      setIsFlipping(true)
      playPageFlipSound()
      setTimeout(() => {
        setCurrentPage(currentPage - 1)
        setIsFlipping(false)
      }, 600)
    }
  }

  const lightFilters = {
    warm: "sepia(20%) brightness(1.05) saturate(1.1)",
    cool: "brightness(1.1) contrast(1.05) hue-rotate(180deg)",
    sepia: "sepia(60%) brightness(1.1) contrast(1.1)",
  }

  const handleDownload = () => {
    const a = document.createElement("a")
    a.href = pdfUrl
    a.download = `${courseId}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Reading Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#2E261D] bg-[#16130F] px-6 py-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4 text-[#F3C77A]" />
            <span className="text-sm text-[#BCB19F]">Luz de leitura:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setReadingLight("warm")}
                className={`rounded-full px-3 py-1 text-xs transition-colors ${
                  readingLight === "warm"
                    ? "bg-[#F3C77A] text-black"
                    : "border border-[#2E261D] text-[#BCB19F] hover:border-[#F3C77A]"
                }`}
              >
                Quente
              </button>
              <button
                onClick={() => setReadingLight("cool")}
                className={`rounded-full px-3 py-1 text-xs transition-colors ${
                  readingLight === "cool"
                    ? "bg-[#F3C77A] text-black"
                    : "border border-[#2E261D] text-[#BCB19F] hover:border-[#F3C77A]"
                }`}
              >
                Fria
              </button>
              <button
                onClick={() => setReadingLight("sepia")}
                className={`rounded-full px-3 py-1 text-xs transition-colors ${
                  readingLight === "sepia"
                    ? "bg-[#F3C77A] text-black"
                    : "border border-[#2E261D] text-[#BCB19F] hover:border-[#F3C77A]"
                }`}
              >
                Sépia
              </button>
            </div>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="flex items-center gap-2 rounded-full border border-[#2E261D] px-3 py-1 text-xs text-[#BCB19F] transition-colors hover:border-[#F3C77A]"
          >
            {soundEnabled ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
            Som {soundEnabled ? "ligado" : "desligado"}
          </button>
        </div>

        <Button
          onClick={handleDownload}
          variant="outline"
          size="sm"
          className="border-[#F3C77A] text-[#F3C77A] hover:bg-[#F3C77A] hover:text-black bg-transparent"
        >
          <Download className="mr-2 h-4 w-4" />
          Baixar PDF
        </Button>
      </div>

      {/* PDF Viewer with Flip Effect */}
      <div className="relative mx-auto w-full max-w-5xl">
        <div
          className={`perspective-[2000px] transition-all duration-600 ${isFlipping ? "scale-[0.98]" : "scale-100"}`}
        >
          <div
            className={`relative overflow-hidden rounded-3xl border border-[#2E261D] bg-white shadow-2xl transition-transform duration-600 ${
              isFlipping ? "rotate-y-[5deg]" : "rotate-y-0"
            }`}
            style={{
              filter: lightFilters[readingLight],
              transformStyle: "preserve-3d",
            }}
          >
            <iframe
              ref={iframeRef}
              src={`${pdfUrl}#page=${currentPage}&view=FitH`}
              className="h-[800px] w-full"
              title="PDF Viewer"
              onLoad={(e) => {
                // Try to get total pages from PDF (this may not work due to CORS)
                try {
                  const iframe = e.target as HTMLIFrameElement
                  const pdfDoc = iframe.contentWindow?.document
                  if (pdfDoc) {
                    setTotalPages(100) // Default fallback
                  }
                } catch {
                  setTotalPages(100) // Default fallback
                }
              }}
            />
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="absolute bottom-8 left-8 right-8 flex items-center justify-between">
          <Button
            onClick={prevPage}
            disabled={currentPage === 1 || isFlipping}
            variant="ghost"
            size="icon"
            className="h-14 w-14 rounded-full bg-[#16130F]/90 text-[#F3C77A] backdrop-blur-sm hover:bg-[#16130F] disabled:opacity-30 shadow-xl"
          >
            <ChevronLeft className="h-7 w-7" />
          </Button>

          <div className="rounded-full bg-[#16130F]/90 px-6 py-3 text-base font-semibold text-[#F3C77A] backdrop-blur-sm shadow-xl">
            Página {currentPage}
          </div>

          <Button
            onClick={nextPage}
            disabled={isFlipping}
            variant="ghost"
            size="icon"
            className="h-14 w-14 rounded-full bg-[#16130F]/90 text-[#F3C77A] backdrop-blur-sm hover:bg-[#16130F] disabled:opacity-30 shadow-xl"
          >
            <ChevronRight className="h-7 w-7" />
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mx-auto w-full max-w-5xl">
        <div className="h-2 overflow-hidden rounded-full bg-[#2E261D]">
          <div
            className="h-full bg-[#F3C77A] transition-all duration-300"
            style={{ width: totalPages > 0 ? `${(currentPage / totalPages) * 100}%` : "0%" }}
          />
        </div>
      </div>
    </div>
  )
}
