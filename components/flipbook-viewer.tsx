"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, Download, Sun } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"

interface FlipbookViewerProps {
  courseId: string
  pages: Array<{ title: string; content: string }>
  onSessionUpdate?: (durationSeconds: number, currentPage: number) => void
}

export const FlipbookViewer = ({ courseId, pages, onSessionUpdate }: FlipbookViewerProps) => {
  const [currentPage, setCurrentPage] = useState(0)
  const [startTime] = useState(() => Date.now())
  const [readingLight, setReadingLight] = useState<"warm" | "cool" | "sepia">("warm")
  const intervalRef = useRef<number>()

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

  const nextPage = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
    }
  }

  const lightFilters = {
    warm: "sepia(20%) brightness(1.05)",
    cool: "hue-rotate(180deg) brightness(1.1)",
    sepia: "sepia(60%) brightness(1.1)",
  }

  const handleDownload = () => {
    // Create a simple text file with all pages content
    const content = pages
      .map((page, idx) => `\n\n=== Página ${idx + 1}: ${page.title} ===\n\n${page.content}`)
      .join("\n")
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${courseId}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Reading Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#2E261D] bg-[#16130F] px-6 py-4">
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

      {/* Flipbook Container */}
      <div
        className="relative mx-auto w-full max-w-4xl overflow-hidden rounded-3xl border border-[#2E261D] bg-[#F5EFE3] shadow-2xl"
        style={{ filter: lightFilters[readingLight] }}
      >
        <div className="aspect-[3/4] p-8 md:p-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, rotateY: -15 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: 15 }}
              transition={{ duration: 0.5 }}
              className="h-full overflow-y-auto"
            >
              <h2 className="mb-6 text-3xl font-bold text-[#1A1410]">{pages[currentPage].title}</h2>
              <div className="prose prose-lg max-w-none text-[#2E261D]">
                {pages[currentPage].content.split("\n\n").map((paragraph, idx) => (
                  <p key={idx} className="mb-4 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Buttons */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
          <Button
            onClick={prevPage}
            disabled={currentPage === 0}
            variant="ghost"
            size="icon"
            className="h-12 w-12 rounded-full bg-[#16130F]/80 text-[#F3C77A] backdrop-blur-sm hover:bg-[#16130F] disabled:opacity-30"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          <div className="rounded-full bg-[#16130F]/80 px-4 py-2 text-sm font-medium text-[#F3C77A] backdrop-blur-sm">
            {currentPage + 1} / {pages.length}
          </div>

          <Button
            onClick={nextPage}
            disabled={currentPage === pages.length - 1}
            variant="ghost"
            size="icon"
            className="h-12 w-12 rounded-full bg-[#16130F]/80 text-[#F3C77A] backdrop-blur-sm hover:bg-[#16130F] disabled:opacity-30"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mx-auto w-full max-w-4xl">
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
