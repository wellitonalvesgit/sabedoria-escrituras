"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Download, Clock, FileText } from "lucide-react"
import { CoursePDF } from "@/lib/courses-data"

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
            className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 ${
              selectedPDF?.volume === pdf.volume
                ? "ring-2 ring-[#F3C77A] bg-[#F3C77A]/5 border-[#F3C77A]"
                : "hover:border-[#F3C77A]/50"
            }`}
            onMouseEnter={() => setHoveredVolume(pdf.volume)}
            onMouseLeave={() => setHoveredVolume(null)}
            onClick={() => onSelectPDF(pdf)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge 
                  variant={selectedPDF?.volume === pdf.volume ? "default" : "secondary"}
                  className={`${
                    selectedPDF?.volume === pdf.volume 
                      ? "bg-[#F3C77A] text-black" 
                      : "bg-[#2E261D] text-[#F3C77A]"
                  }`}
                >
                  {pdf.volume}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <FileText className="h-3 w-3" />
                  {pdf.pages || 20} páginas
                </div>
              </div>
              <CardTitle className="text-sm font-medium text-foreground line-clamp-2">
                {pdf.title}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {pdf.readingTimeMinutes || 30} min
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  Leitura
                </div>
              </div>
              
              <Button 
                className="w-full"
                variant={selectedPDF?.volume === pdf.volume ? "default" : "outline"}
                size="sm"
              >
                {selectedPDF?.volume === pdf.volume ? "Volume Ativo" : "Abrir Volume"}
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
    </div>
  )
}
