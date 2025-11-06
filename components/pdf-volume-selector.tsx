"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Download, Clock, FileText, Play, Volume2 } from "lucide-react"
import { CoursePDF } from "@/lib/courses-data"
import { YouTubeVideoPlayer } from "@/components/youtube-video-player"
import Image from "next/image"

interface PDFVolumeSelectorProps {
  pdfs: CoursePDF[]
  onSelectPDF: (pdf: CoursePDF, mode?: 'original' | 'digital-magazine') => void
  selectedPDF?: CoursePDF
}

export const PDFVolumeSelector = ({ pdfs, onSelectPDF, selectedPDF }: PDFVolumeSelectorProps) => {
  const [hoveredVolume, setHoveredVolume] = useState<string | null>(null)

  // Debug: verificar dados recebidos
  useEffect(() => {
    if (selectedPDF) {
      console.log('🎯 PDF selecionado:', {
        volume: selectedPDF.volume,
        title: selectedPDF.title,
        youtube_url: (selectedPDF as any).youtube_url,
        audio_url: (selectedPDF as any).audio_url
      })
    }
  }, [selectedPDF])

  // Organizar volumes em hierarquia
  const rootVolumes = pdfs.filter((pdf: any) => !pdf.parent_volume_id)
  const getSubvolumes = (parentId: string) => 
    pdfs.filter((pdf: any) => (pdf as any).parent_volume_id === parentId)

  const renderVolume = (pdf: any, level: number = 0) => {
    const volumeId = (pdf as any).id || (pdf as any).volume_id || pdf.volume
    const subvolumes = getSubvolumes(volumeId)
    
    return (
      <div key={volumeId} className={level > 0 ? "mt-2" : ""}>
        <Card
          className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 overflow-hidden ${
            level > 0 ? 'ml-6 border-l-2 border-[#F3C77A]/30' : ''
          } ${
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
                  {(pdf as any).readingTimeMinutes || (pdf as any).reading_time_minutes || 30} min
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <Button
                className={`w-full ${
                  selectedPDF?.volume === pdf.volume 
                    ? "" 
                    : "md:border-[#2E261D] md:text-foreground md:hover:bg-[#2E261D] border-[#F3C77A] bg-[#F3C77A] text-black hover:bg-[#F3C77A]/90 md:bg-transparent md:text-foreground"
                }`}
                variant={selectedPDF?.volume === pdf.volume ? "default" : "outline"}
                size="sm"
              >
                {selectedPDF?.volume === pdf.volume ? "✓ Volume Ativo" : "Abrir Volume"}
              </Button>
            </CardContent>
          </Card>
        {subvolumes.length > 0 && (
          <div className="ml-4 mt-2 space-y-2">
            {subvolumes.map((sub: any) => renderVolume(sub, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6 px-4 md:px-0">
      <div className="text-center">
        <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2">Conteúdo do Curso</h2>
        <p className="text-sm md:text-base text-muted-foreground">Selecione um volume para começar sua leitura</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rootVolumes.map((vol: any) => renderVolume(vol))}
      </div>

      {selectedPDF && (
        <Card className="mt-6 border-[#F3C77A]/30 bg-gradient-to-br from-[#16130F] to-[#2E261D] mx-4 md:mx-0">
          <CardHeader className="px-4 md:px-6">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 md:h-5 md:w-5 text-[#F3C77A]" />
              <CardTitle className="text-base md:text-lg text-foreground">{selectedPDF.title}</CardTitle>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              {selectedPDF.pages || 20} páginas • {(selectedPDF as any).readingTimeMinutes || (selectedPDF as any).reading_time_minutes || 30} minutos de leitura
            </p>
          </CardHeader>
          <CardContent className="space-y-4 md:space-y-6 px-4 md:px-6">
            {/* Seção: Como você quer estudar este volume? */}
            <div>
              <h3 className="text-sm md:text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                <BookOpen className="h-4 w-4 md:h-5 md:w-5 text-[#F3C77A]" />
                Como você quer estudar este volume?
              </h3>

              {/* Grid de Opções Principais */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Opção 1: Visualização Original (PDF) */}
                <button
                  onClick={() => onSelectPDF(selectedPDF, 'original')}
                  className="group relative overflow-hidden rounded-xl border-2 border-[#2E261D] bg-gradient-to-br from-[#16130F] to-[#2E261D] p-4 text-left transition-all hover:border-[#F3C77A] hover:shadow-lg hover:shadow-[#F3C77A]/20"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#F3C77A]/10 group-hover:bg-[#F3C77A]/20">
                      <FileText className="h-6 w-6 text-[#F3C77A]" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground group-hover:text-[#F3C77A]">📖 Visualização Original</h4>
                      <p className="text-xs text-muted-foreground mt-1">Leia o PDF com layout e imagens originais</p>
                    </div>
                  </div>
                </button>

                {/* Opção 2: Modo Kindle */}
                <button
                  onClick={() => onSelectPDF(selectedPDF, 'digital-magazine')}
                  className="group relative overflow-hidden rounded-xl border-2 border-[#2E261D] bg-gradient-to-br from-[#16130F] to-[#2E261D] p-4 text-left transition-all hover:border-[#F3C77A] hover:shadow-lg hover:shadow-[#F3C77A]/20"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#F3C77A]/10 group-hover:bg-[#F3C77A]/20">
                      <BookOpen className="h-6 w-6 text-[#F3C77A]" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground group-hover:text-[#F3C77A]">📱 Modo Kindle</h4>
                      <p className="text-xs text-muted-foreground mt-1">Leitura otimizada com controles de luz e fonte</p>
                    </div>
                  </div>
                </button>

                {/* Opção 3: Download PDF */}
                <button
                  onClick={() => {
                    const link = document.createElement("a")
                    link.href = selectedPDF.url
                    link.download = `${selectedPDF.title}.pdf`
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                  }}
                  className="group relative overflow-hidden rounded-xl border-2 border-[#2E261D] bg-gradient-to-br from-[#16130F] to-[#2E261D] p-4 text-left transition-all hover:border-[#F3C77A] hover:shadow-lg hover:shadow-[#F3C77A]/20"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#F3C77A]/10 group-hover:bg-[#F3C77A]/20">
                      <Download className="h-6 w-6 text-[#F3C77A]" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground group-hover:text-[#F3C77A]">⬇️ Download PDF</h4>
                      <p className="text-xs text-muted-foreground mt-1">Baixe o arquivo para leitura offline</p>
                    </div>
                  </div>
                </button>

                {/* Opção 4: Ver Vídeo (condicional) */}
                {(selectedPDF as any).youtube_url && (
                  <button
                    onClick={() => {
                      const videoSection = document.getElementById('video-player-section')
                      videoSection?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    }}
                    className="group relative overflow-hidden rounded-xl border-2 border-[#2E261D] bg-gradient-to-br from-[#16130F] to-[#2E261D] p-4 text-left transition-all hover:border-[#F3C77A] hover:shadow-lg hover:shadow-[#F3C77A]/20"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#F3C77A]/10 group-hover:bg-[#F3C77A]/20">
                        <Play className="h-6 w-6 text-[#F3C77A]" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground group-hover:text-[#F3C77A]">🎥 Ver Vídeo</h4>
                        <p className="text-xs text-muted-foreground mt-1">Assista ao vídeo explicativo no YouTube</p>
                      </div>
                    </div>
                  </button>
                )}

                {/* Opção 5: Escutar Áudio (condicional) */}
                {(selectedPDF as any).audio_url && (
                  <button
                    onClick={() => {
                      const audioSection = document.getElementById('audio-player-section')
                      audioSection?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    }}
                    className="group relative overflow-hidden rounded-xl border-2 border-[#2E261D] bg-gradient-to-br from-[#16130F] to-[#2E261D] p-4 text-left transition-all hover:border-[#F3C77A] hover:shadow-lg hover:shadow-[#F3C77A]/20"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#F3C77A]/10 group-hover:bg-[#F3C77A]/20">
                        <Volume2 className="h-6 w-6 text-[#F3C77A]" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground group-hover:text-[#F3C77A]">🎧 Escutar Áudio</h4>
                        <p className="text-xs text-muted-foreground mt-1">Ouça a narração em MP3</p>
                      </div>
                    </div>
                  </button>
                )}
              </div>

              {/* Indicador de recursos disponíveis */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">Disponível neste volume:</span>
                <Badge variant="outline" className="text-xs border-[#F3C77A]/30 text-[#F3C77A]">
                  <FileText className="h-3 w-3 mr-1" />
                  PDF
                </Badge>
                {(selectedPDF as any).youtube_url && (
                  <Badge variant="outline" className="text-xs border-[#F3C77A]/30 text-[#F3C77A]">
                    <Play className="h-3 w-3 mr-1" />
                    Vídeo
                  </Badge>
                )}
                {(selectedPDF as any).audio_url && (
                  <Badge variant="outline" className="text-xs border-[#F3C77A]/30 text-[#F3C77A]">
                    <Volume2 className="h-3 w-3 mr-1" />
                    Áudio
                  </Badge>
                )}
              </div>
            </div>

            {/* Player de Vídeo do YouTube (Embed) */}
            {(selectedPDF as any).youtube_url && (
              <div id="video-player-section" className="pt-4 border-t border-[#2E261D]">
                <div className="flex items-center gap-2 mb-3">
                  <Play className="h-4 w-4 text-[#F3C77A]" />
                  <h4 className="font-semibold text-sm text-foreground">Assistir Vídeo</h4>
                </div>
                <YouTubeVideoPlayer
                  youtubeUrl={(selectedPDF as any).youtube_url}
                  volumeTitle={selectedPDF.title}
                  volumeNumber={selectedPDF.volume}
                  className="w-full"
                />
              </div>
            )}

            {/* Player de Áudio (MP3) */}
            {(selectedPDF as any).audio_url && (
              <div id="audio-player-section" className="pt-4 border-t border-[#2E261D]">
                <div className="flex items-center gap-2 mb-3">
                  <Volume2 className="h-4 w-4 text-[#F3C77A]" />
                  <h4 className="font-semibold text-sm text-foreground">Escutar Áudio</h4>
                </div>
                <audio
                  controls
                  className="w-full"
                  style={{
                    filter: 'hue-rotate(20deg) saturate(1.2)',
                  }}
                >
                  <source src={(selectedPDF as any).audio_url} type="audio/mpeg" />
                  Seu navegador não suporta o elemento de áudio.
                </audio>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
