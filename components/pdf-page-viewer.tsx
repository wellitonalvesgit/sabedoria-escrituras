"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, Download, Sun, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"

interface PDFPageViewerProps {
  pages: React.ReactNode[]
  courseId: string
  onSessionUpdate?: (durationSeconds: number, currentPage: number) => void
}

export const PDFPageViewer = ({ pages, courseId, onSessionUpdate }: PDFPageViewerProps) => {
  const [currentPage, setCurrentPage] = useState(0)
  const [startTime] = useState(() => Date.now())
  const [readingLight, setReadingLight] = useState<"warm" | "cool" | "sepia">("warm")
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [direction, setDirection] = useState(0)
  const intervalRef = useRef<number>()
  const pageFlipAudioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    pageFlipAudioRef.current = new Audio()
    pageFlipAudioRef.current.volume = 0.3
    pageFlipAudioRef.current.src =
      "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGe77OeeSwwPUKXi8LdjHAU5k9jyzHksBSR3yPDekEALFF+16+qnVRQKRp/h8r9sIQYsgc7y2Ik2CBhnu+znm0sMD1Cl4vC3YxwFOZPY8sx5LAUkd8jw3pBACxRftevqp1UUCkaf4fK/bCEGLIHO8tmJNggYZ7vs55tLDA9QpeLwt2McBTmT2PLMeSwFJHfI8N6QQAsUX7Xr6qdVFApGn+Hyv2whBiyBzvLZiTYIGGe77OebSwwPUKXi8LdjHAU5k9jyzHksBSR3yPDekEALFF+16+qnVRQKRp/h8r9sIQYsgc7y2Yk2CBhnu+znm0sMD1Cl4vC3YxwFOZPY8sx5LAUkd8jw3pBACxRftevqp1UUCkaf4fK/bCEGLIHO8tmJNggYZ7vs55tLDA9QpeLwt2McBTmT2PLMeSwFJHfI8N6QQAsUX7Xr6qdVFApGn+Hyv2whBiyBzvLZiTYIGGe77OebSwwPUKXi8LdjHAU5k9jyzHksBSR3yPDekEALFF+16+qnVRQKRp/h8r9sIQYsgc7y2Yk2CBhnu+znm0sMD1Cl4vC3YxwFOZPY8sx5LAUkd8jw3pBACxRftevqp1UUCkaf4fK/bCEGLIHO8tmJNggYZ7vs55tLDA9QpeLwt2McBTmT2PLMeSwFJHfI8N6QQAsUX7Xr6qdVFApGn+Hyv2whBiyBzvLZiTYIGGe77OebSwwPUKXi8LdjHAU5k9jyzHksBSR3yPDekEALFF+16+qnVRQKRp/h8r9sIQYsgc7y2Yk2CBhnu+znm0sMD1Cl4vC3Yw="
  }, [])

  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      const duration = Math.round((Date.now() - startTime) / 1000)
      onSessionUpdate?.(duration, currentPage + 1)
    }, 60000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      const duration = Math.round((Date.now() - startTime) / 1000)
      onSessionUpdate?.(duration, currentPage + 1)
    }
  }, [startTime, currentPage, onSessionUpdate])

  const playPageFlipSound = () => {
    if (soundEnabled && pageFlipAudioRef.current) {
      pageFlipAudioRef.current.currentTime = 0
      pageFlipAudioRef.current.play().catch(() => {})
    }
  }

  const nextPage = () => {
    if (currentPage < pages.length - 1) {
      setDirection(1)
      playPageFlipSound()
      setCurrentPage(currentPage + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 0) {
      setDirection(-1)
      playPageFlipSound()
      setCurrentPage(currentPage - 1)
    }
  }

  const lightFilters = {
    warm: "sepia(20%) brightness(1.05) saturate(1.1)",
    cool: "brightness(1.1) contrast(1.05) hue-rotate(180deg)",
    sepia: "sepia(60%) brightness(1.1) contrast(1.1)",
  }

  const handleDownload = () => {
    alert("Funcionalidade de download será implementada em breve!")
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

      {/* Page Viewer with Flip Effect */}
      <div className="relative mx-auto w-full max-w-5xl">
        <div className="perspective-[2000px]">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentPage}
              custom={direction}
              initial={{ rotateY: direction > 0 ? 90 : -90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: direction > 0 ? -90 : 90, opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="relative overflow-hidden rounded-3xl border border-[#2E261D] bg-white shadow-2xl"
              style={{
                filter: lightFilters[readingLight],
                transformStyle: "preserve-3d",
                minHeight: "800px",
              }}
            >
              <div className="p-12">{pages[currentPage]}</div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Buttons */}
        <div className="absolute bottom-8 left-8 right-8 flex items-center justify-between">
          <Button
            onClick={prevPage}
            disabled={currentPage === 0}
            variant="ghost"
            size="icon"
            className="h-14 w-14 rounded-full bg-[#16130F]/90 text-[#F3C77A] backdrop-blur-sm hover:bg-[#16130F] disabled:opacity-30 shadow-xl"
          >
            <ChevronLeft className="h-7 w-7" />
          </Button>

          <div className="rounded-full bg-[#16130F]/90 px-6 py-3 text-base font-semibold text-[#F3C77A] backdrop-blur-sm shadow-xl">
            Página {currentPage + 1} de {pages.length}
          </div>

          <Button
            onClick={nextPage}
            disabled={currentPage === pages.length - 1}
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
            style={{ width: `${((currentPage + 1) / pages.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}
