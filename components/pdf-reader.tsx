"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useGamification } from "@/contexts/gamification-context"

interface PDFReaderProps {
  courseTitle: string
}

export function PDFReader({ courseTitle }: PDFReaderProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [isFlipping, setIsFlipping] = useState(false)
  const [flipDirection, setFlipDirection] = useState<"next" | "prev" | null>(null)
  const totalPages = 24

  const { incrementPagesRead } = useGamification()

  // Mock page content
  const getPageContent = (pageNum: number) => {
    const contents = [
      {
        title: "Chapter 1: Introduction to Leadership",
        subtitle: "Understanding the Fundamentals",
        content: [
          "Leadership is not about being in charge. It's about taking care of those in your charge.",
          "Great leaders don't set out to be a leader. They set out to make a difference.",
          "The key to successful leadership is influence, not authority.",
        ],
      },
      {
        title: "The Leadership Mindset",
        subtitle: "Developing Your Core Values",
        content: [
          "Authentic leadership begins with self-awareness and understanding your values.",
          "Leaders must be willing to be vulnerable and admit when they don't have all the answers.",
          "Building trust is the foundation of effective leadership.",
        ],
      },
      {
        title: "Communication Excellence",
        subtitle: "The Art of Inspiring Others",
        content: [
          "Effective communication is the cornerstone of great leadership.",
          "Listen more than you speak, and when you speak, make every word count.",
          "Body language and tone matter as much as the words you choose.",
        ],
      },
      {
        title: "Building High-Performance Teams",
        subtitle: "Creating a Culture of Excellence",
        content: [
          "Great teams are built on trust, respect, and shared purpose.",
          "Diversity of thought leads to better decisions and innovation.",
          "Empower your team members to take ownership and make decisions.",
        ],
      },
    ]
    return contents[(pageNum - 1) % contents.length]
  }

  const handleNextPage = () => {
    if (currentPage < totalPages && !isFlipping) {
      setIsFlipping(true)
      setFlipDirection("next")
      incrementPagesRead()
      setTimeout(() => {
        setCurrentPage(currentPage + 1)
        setIsFlipping(false)
        setFlipDirection(null)
      }, 600)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1 && !isFlipping) {
      setIsFlipping(true)
      setFlipDirection("prev")
      setTimeout(() => {
        setCurrentPage(currentPage - 1)
        setIsFlipping(false)
        setFlipDirection(null)
      }, 600)
    }
  }

  const currentContent = getPageContent(currentPage)
  const nextContent = currentPage < totalPages ? getPageContent(currentPage + 1) : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevPage}
            disabled={currentPage === 1 || isFlipping}
            className="h-10 w-10 bg-transparent"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="text-sm font-medium text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNextPage}
            disabled={currentPage === totalPages || isFlipping}
            className="h-10 w-10 bg-transparent"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-10 w-10">
            <ZoomOut className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-10 w-10">
            <ZoomIn className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-10 w-10">
            <Maximize2 className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-10 w-10">
            <Download className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="relative mx-auto max-w-5xl" style={{ perspective: "2000px" }}>
        <div className="relative aspect-[16/10] rounded-2xl shadow-2xl">
          {/* Left page (current) */}
          <div
            className={cn(
              "absolute left-0 top-0 h-full w-1/2 origin-right rounded-l-2xl border border-border bg-card p-8 transition-all duration-600",
              isFlipping && flipDirection === "next" && "animate-flip-left",
              isFlipping && flipDirection === "prev" && "animate-flip-left-reverse",
            )}
            style={{
              transformStyle: "preserve-3d",
              backfaceVisibility: "hidden",
            }}
          >
            <div className="flex h-full flex-col">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground text-balance">{currentContent.title}</h2>
                <p className="mt-2 text-sm text-primary font-medium">{currentContent.subtitle}</p>
              </div>
              <div className="flex-1 space-y-4">
                {currentContent.content.map((paragraph, idx) => (
                  <p key={idx} className="text-sm leading-relaxed text-muted-foreground">
                    {paragraph}
                  </p>
                ))}
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                <span className="text-xs text-muted-foreground">{courseTitle}</span>
                <span className="text-xs font-medium text-foreground">{currentPage}</span>
              </div>
            </div>
          </div>

          {/* Right page (next) */}
          <div
            className={cn(
              "absolute right-0 top-0 h-full w-1/2 origin-left rounded-r-2xl border border-border bg-card p-8 transition-all duration-600",
              isFlipping && flipDirection === "next" && "animate-flip-right",
              isFlipping && flipDirection === "prev" && "animate-flip-right-reverse",
            )}
            style={{
              transformStyle: "preserve-3d",
              backfaceVisibility: "hidden",
            }}
          >
            {nextContent && (
              <div className="flex h-full flex-col">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-foreground text-balance">{nextContent.title}</h2>
                  <p className="mt-2 text-sm text-primary font-medium">{nextContent.subtitle}</p>
                </div>
                <div className="flex-1 space-y-4">
                  {nextContent.content.map((paragraph, idx) => (
                    <p key={idx} className="text-sm leading-relaxed text-muted-foreground">
                      {paragraph}
                    </p>
                  ))}
                </div>
                <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                  <span className="text-xs text-muted-foreground">{courseTitle}</span>
                  <span className="text-xs font-medium text-foreground">{currentPage + 1}</span>
                </div>
              </div>
            )}
          </div>

          {/* Center spine shadow */}
          <div className="absolute left-1/2 top-0 h-full w-1 -translate-x-1/2 bg-gradient-to-r from-black/10 via-black/5 to-black/10" />
        </div>
      </div>

      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => (
          <button
            key={i}
            onClick={() => {
              if (!isFlipping && i + 1 !== currentPage) {
                setIsFlipping(true)
                setFlipDirection(i + 1 > currentPage ? "next" : "prev")
                setTimeout(() => {
                  setCurrentPage(i + 1)
                  setIsFlipping(false)
                  setFlipDirection(null)
                }, 600)
              }
            }}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              currentPage === i + 1 ? "w-8 bg-primary" : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50",
            )}
          />
        ))}
      </div>
    </div>
  )
}
