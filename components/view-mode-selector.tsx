"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  FileText, 
  BookOpen, 
  Download, 
  Eye, 
  BookMarked, 
  Monitor,
  Sun,
  Moon,
  Palette
} from "lucide-react"

interface ViewModeSelectorProps {
  onSelectMode: (mode: 'original' | 'digital-magazine') => void
  selectedMode?: 'original' | 'digital-magazine'
  onDownload: () => void
}

export const ViewModeSelector = ({ onSelectMode, selectedMode, onDownload }: ViewModeSelectorProps) => {
  const [readingMode, setReadingMode] = useState<'light' | 'sepia' | 'dark'>('light')

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Escolha seu modo de leitura</h2>
        <p className="text-muted-foreground">Selecione como você prefere visualizar o conteúdo</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Modo PDF Original */}
        <Card 
          className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 ${
            selectedMode === 'original'
              ? "ring-2 ring-[#F3C77A] bg-[#F3C77A]/5 border-[#F3C77A]"
              : "hover:border-[#F3C77A]/50"
          }`}
          onClick={() => onSelectMode('original')}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Badge 
                variant={selectedMode === 'original' ? "default" : "secondary"}
                className={`${
                  selectedMode === 'original' 
                    ? "bg-[#F3C77A] text-black" 
                    : "bg-[#2E261D] text-[#F3C77A]"
                }`}
              >
                <FileText className="h-3 w-3 mr-1" />
                PDF Original
              </Badge>
              <Monitor className="h-5 w-5 text-muted-foreground" />
            </div>
            <CardTitle className="text-lg font-semibold text-foreground">
              Visualização Original
            </CardTitle>
          </CardHeader>
          
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground mb-4">
              Visualize o PDF exatamente como foi criado, com layout original, imagens e formatação preservadas.
            </p>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Eye className="h-3 w-3" />
                <span>Layout original preservado</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileText className="h-3 w-3" />
                <span>Imagens e gráficos nativos</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Monitor className="h-3 w-3" />
                <span>Zoom e navegação padrão</span>
              </div>
            </div>
            
            <Button
              className="w-full"
              variant={selectedMode === 'original' ? "default" : "outline"}
              size="sm"
            >
              {selectedMode === 'original' ? "Modo Ativo" : "Ler"}
            </Button>
          </CardContent>
        </Card>

        {/* Modo Revista Digital */}
        <Card 
          className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 ${
            selectedMode === 'digital-magazine'
              ? "ring-2 ring-[#F3C77A] bg-[#F3C77A]/5 border-[#F3C77A]"
              : "hover:border-[#F3C77A]/50"
          }`}
          onClick={() => onSelectMode('digital-magazine')}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Badge 
                variant={selectedMode === 'digital-magazine' ? "default" : "secondary"}
                className={`${
                  selectedMode === 'digital-magazine' 
                    ? "bg-[#F3C77A] text-black" 
                    : "bg-[#2E261D] text-[#F3C77A]"
                }`}
              >
                <BookOpen className="h-3 w-3 mr-1" />
                Revista Digital
              </Badge>
              <BookMarked className="h-5 w-5 text-muted-foreground" />
            </div>
            <CardTitle className="text-lg font-semibold text-foreground">
              Experiência Kindle
            </CardTitle>
          </CardHeader>
          
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground mb-4">
              Texto extraído e otimizado para leitura, com efeitos de virar página, sons e controles de temperatura.
            </p>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <BookOpen className="h-3 w-3" />
                <span>Efeito flipbook com som</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Sun className="h-3 w-3" />
                <span>Controles de temperatura</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Palette className="h-3 w-3" />
                <span>Modos de leitura (claro/escuro/sépia)</span>
              </div>
            </div>
            
            <Button
              className="w-full"
              variant={selectedMode === 'digital-magazine' ? "default" : "outline"}
              size="sm"
            >
              {selectedMode === 'digital-magazine' ? "Modo Ativo" : "Ler"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Controles de Leitura */}
      {selectedMode === 'digital-magazine' && (
        <Card className="bg-[#16130F] border-[#2E261D]">
          <CardHeader>
            <CardTitle className="text-lg text-foreground flex items-center gap-2">
              <Palette className="h-5 w-5 text-[#F3C77A]" />
              Controles de Leitura
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant={readingMode === 'light' ? "default" : "outline"}
                size="sm"
                onClick={() => setReadingMode('light')}
                className={readingMode === 'light' ? "bg-[#F3C77A] text-black" : ""}
              >
                <Sun className="h-4 w-4 mr-2" />
                Claro
              </Button>
              <Button
                variant={readingMode === 'sepia' ? "default" : "outline"}
                size="sm"
                onClick={() => setReadingMode('sepia')}
                className={readingMode === 'sepia' ? "bg-[#F3C77A] text-black" : ""}
              >
                <Palette className="h-4 w-4 mr-2" />
                Sépia
              </Button>
              <Button
                variant={readingMode === 'dark' ? "default" : "outline"}
                size="sm"
                onClick={() => setReadingMode('dark')}
                className={readingMode === 'dark' ? "bg-[#F3C77A] text-black" : ""}
              >
                <Moon className="h-4 w-4 mr-2" />
                Escuro
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botão de Download */}
      <Card className="bg-[#16130F] border-[#2E261D]">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Download className="h-5 w-5 text-[#F3C77A]" />
                Download do PDF Original
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Baixe o arquivo PDF para leitura offline
              </p>
            </div>
            <Button
              onClick={onDownload}
              className="bg-[#F3C77A] text-black hover:bg-[#FFD88A] font-semibold shadow-[0_20px_60px_rgba(243,199,122,0.35)]"
            >
              <Download className="mr-2 h-4 w-4" />
              Baixar PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
