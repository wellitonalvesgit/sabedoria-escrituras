"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Download, Clock, FileText, Play } from "lucide-react"
import { CoursePDF } from "@/lib/courses-data"
import { YouTubeVideoPlayer } from "@/components/youtube-video-player"
import Image from "next/image"

interface PDFVolumeSelectorProps {
  pdfs: CoursePDF[]
  onSelectPDF: (pdf: CoursePDF) => void
  selectedPDF?: CoursePDF
}

export const PDFVolumeSelector = ({ pdfs, onSelectPDF, selectedPDF }: PDFVolumeSelectorProps) => {
  const [hoveredVolume, setHoveredVolume] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Conteúdo do Curso</h2>
        <p className="text-muted-foreground">Selecione um volume para começar sua leitura</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pdfs.map((pdf, index) => (
          <Card
            key={pdf.volume}
            className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 overflow-hidden ${
              selectedPDF?.volume === pdf.volume
                ? "ring-2 ring-[#F3C77A] bg-[#F3C77A]/5 border-[#F3C77A]"
                : "hover:border-[#F3C77A]/50"
            }`}
            onMouseEnter={() => setHoveredVolume(pdf.volume)}
            onMouseLeave={() => setHoveredVolume(null)}
            onClick={() => onSelectPDF(pdf)}
          >
            {/* Capa do Volume */}
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-gradient-to-br from-[#2E261D] to-[#16130F]">
              {pdf.cover_url ? (
                <Image
                  src={pdf.cover_url}
                  alt={`Capa ${pdf.title}`}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                  <BookOpen className="h-16 w-16 text-[#F3C77A]/40 mb-4" />
                  <div className="text-[#F3C77A] font-semibold text-lg mb-2">{pdf.volume}</div>
                  <div className="text-xs text-muted-foreground line-clamp-3">{pdf.title}</div>
                </div>
              )}

              {/* Badge do Volume sobre a capa */}
              <div className="absolute top-3 left-3">
                <Badge
                  variant={selectedPDF?.volume === pdf.volume ? "default" : "secondary"}
                  className={`${
                    selectedPDF?.volume === pdf.volume
                      ? "bg-[#F3C77A] text-black shadow-lg"
                      : "bg-[#2E261D]/90 text-[#F3C77A] backdrop-blur-sm"
                  }`}
                >
                  {pdf.volume}
                </Badge>
              </div>

              {/* Ícone de seleção */}
              {selectedPDF?.volume === pdf.volume && (
                <div className="absolute top-3 right-3">
                  <div className="bg-[#F3C77A] text-black rounded-full p-1">
                    <BookOpen className="h-4 w-4" />
                  </div>
                </div>
              )}
            </div>

            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-foreground line-clamp-2">
                {pdf.title}
              </CardTitle>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                <div className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {pdf.pages || 20} pág
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {pdf.readingTimeMinutes || 30} min
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <Button
                className="w-full"
                variant={selectedPDF?.volume === pdf.volume ? "default" : "outline"}
                size="sm"
              >
                {selectedPDF?.volume === pdf.volume ? "✓ Volume Ativo" : "Abrir Volume"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedPDF && (
        <div className="mt-6 p-4 rounded-xl bg-[#16130F] border border-[#2E261D]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">{selectedPDF.title}</h3>
              <p className="text-sm text-muted-foreground">
                {selectedPDF.pages || 20} páginas • {selectedPDF.readingTimeMinutes || 30} minutos de leitura
              </p>
            </div>
            <Button
              onClick={() => {
                const link = document.createElement("a")
                link.href = selectedPDF.url
                link.download = `${selectedPDF.title}.pdf`
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
              }}
              variant="outline"
              size="sm"
              className="border-[#F3C77A] text-[#F3C77A] hover:bg-[#F3C77A] hover:text-black"
            >
              <Download className="mr-2 h-4 w-4" />
              Baixar PDF
            </Button>
          </div>
        </div>
      )}

      {/* Player de Vídeo do YouTube */}
      {selectedPDF && selectedPDF.youtube_url && (
        <div className="mt-6">
          <YouTubeVideoPlayer
            youtubeUrl={selectedPDF.youtube_url}
            volumeTitle={selectedPDF.title}
            volumeNumber={selectedPDF.volume}
            className="w-full"
          />
        </div>
      )}
    </div>
  )
}
