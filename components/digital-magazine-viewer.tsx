"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight, Volume2, VolumeX, Sun, Moon, Palette, RotateCcw, Settings, BookOpen, Eye, EyeOff, Type, AlignLeft, AlignCenter, AlignJustify, Minus, Plus, Bookmark, BookmarkCheck, Zap, ZapOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { Slider } from "@/components/ui/slider"
import { BibleDigitalReader } from "./bible-digital-reader"
import { CoursePDF } from "@/lib/courses-data"

interface DigitalMagazineViewerProps {
  pdfUrl: string
  courseId: string
  pdfData?: CoursePDF  // Dados completos do PDF incluindo textContent
  onSessionUpdate?: (durationSeconds: number, currentPage: number) => void
  readingMode?: 'light' | 'sepia' | 'dark'
  onBackToModeSelection?: () => void
}

export const DigitalMagazineViewer = ({
  pdfUrl,
  courseId,
  pdfData,
  onSessionUpdate,
  readingMode = 'light',
  onBackToModeSelection
}: DigitalMagazineViewerProps) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [startTime] = useState(() => Date.now())
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [direction, setDirection] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [extractedText, setExtractedText] = useState<string[]>([])
  const [showSettings, setShowSettings] = useState(false)
  const [bookmarks, setBookmarks] = useState<number[]>([])
  const [fontSize, setFontSize] = useState(16)
  const [lineHeight, setLineHeight] = useState(1.6)
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'justify'>('justify')
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [warmth, setWarmth] = useState(0)
  const [autoScroll, setAutoScroll] = useState(false)
  const [scrollSpeed, setScrollSpeed] = useState(1)
  // Removido - apenas modo Bíblia Digital
  
  const intervalRef = useRef<number>()
  const pageFlipAudioRef = useRef<HTMLAudioElement | null>(null)
  const autoScrollRef = useRef<number>()

  // Configurações avançadas de temperatura de leitura
  const readingTemperatures = {
    light: {
      background: '#FFFFFF',
      text: '#1A1A1A',
      filter: 'brightness(1.1) contrast(1.05)',
      description: 'Luz natural - ideal para leitura diurna',
      warmth: 0
    },
    sepia: {
      background: '#F4F1E8',
      text: '#5C4B37',
      filter: 'sepia(20%) brightness(1.05) saturate(1.1)',
      description: 'Tom sépia - reduz fadiga ocular',
      warmth: 20
    },
    dark: {
      background: '#1A1A1A',
      text: '#E5E5E5',
      filter: 'brightness(0.9) contrast(1.1) invert(0.1)',
      description: 'Modo escuro - confortável para leitura noturna',
      warmth: -10
    },
    night: {
      background: '#0A0A0A',
      text: '#C0C0C0',
      filter: 'brightness(0.8) contrast(1.2)',
      description: 'Modo noturno - proteção total dos olhos',
      warmth: -20
    },
    paper: {
      background: '#FDF6E3',
      text: '#2D3748',
      filter: 'sepia(10%) brightness(1.02)',
      description: 'Papel - experiência de leitura tradicional',
      warmth: 15
    }
  }

  const currentTemp = readingTemperatures[readingMode]

  // Simular extração de texto com conteúdo mais realista
  useEffect(() => {
    const simulateTextExtraction = async () => {
      setIsLoading(true)
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Conteúdo simulado mais realista baseado no curso
      const mockText = [
        "PANORAMA BÍBLICO - DESVENDANDO AS PARÁBOLAS DE JESUS",
        "PARTE 01 - INTRODUÇÃO ÀS PARÁBOLAS",
        "",
        "As parábolas de Jesus são uma das formas mais poderosas de ensino encontradas nos evangelhos. Através de histórias simples e cotidianas, Jesus transmitia verdades profundas sobre o Reino de Deus.",
        "",
        "Cada parábola carrega em si múltiplas camadas de significado, permitindo que diferentes audiências compreendam a mensagem de acordo com seu nível de maturidade espiritual.",
        "",
        "Neste estudo, exploraremos as principais parábolas de Jesus, analisando seu contexto histórico, significado original e aplicações práticas para nossa vida cristã contemporânea.",
        "",
        "CAPÍTULO 1: O QUE SÃO PARÁBOLAS?",
        "",
        "A palavra 'parábola' vem do grego 'parabole', que significa 'colocar ao lado'. Jesus usava comparações entre situações conhecidas e verdades espirituais desconhecidas.",
        "",
        "As parábolas serviam como:",
        "• Ferramentas de ensino para revelar verdades",
        "• Meios de ocultar verdades dos incrédulos", 
        "• Instrumentos de memorização",
        "• Pontes entre o natural e o sobrenatural",
        "",
        "CAPÍTULO 2: A PARÁBOLA DO SEMEADOR",
        "",
        "Esta parábola, registrada em Mateus 13:1-23, Marcos 4:1-20 e Lucas 8:4-15, é fundamental para compreender como a Palavra de Deus é recebida pelos diferentes tipos de coração.",
        "",
        "Jesus conta a história de um semeador que saiu a semear, e as sementes caíram em diferentes tipos de solo:",
        "",
        "1. À BEIRA DO CAMINHO - Representa corações endurecidos",
        "2. EM TERRENO PEDREGOSO - Representa corações superficiais", 
        "3. ENTRE ESPINHOS - Representa corações divididos",
        "4. EM BOA TERRA - Representa corações receptivos",
        "",
        "Cada tipo de solo representa um tipo diferente de receptividade à Palavra de Deus, ensinando-nos sobre a importância de preparar nosso coração para receber a verdade divina.",
        "",
        "APLICAÇÃO PRÁTICA:",
        "",
        "Como podemos preparar nosso coração para ser 'boa terra'?",
        "",
        "• Arrependimento regular",
        "• Estudo constante da Palavra",
        "• Oração e comunhão com Deus",
        "• Obediência aos mandamentos",
        "• Comunhão com outros crentes",
        "",
        "CAPÍTULO 3: A PARÁBOLA DO TRIGO E DO JOIO",
        "",
        "Esta parábola, encontrada em Mateus 13:24-30, ensina sobre a coexistência do bem e do mal no mundo até o juízo final.",
        "",
        "O fazendeiro semeou boa semente, mas o inimigo veio de noite e semeou joio no meio do trigo. Os servos queriam arrancar o joio, mas o fazendeiro disse para esperar até a colheita.",
        "",
        "LIÇÕES IMPORTANTES:",
        "",
        "1. O mal existe no mundo",
        "2. Deus permite a coexistência temporária",
        "3. O julgamento final está reservado a Deus",
        "4. Devemos focar em crescer como trigo",
        "",
        "Esta parábola nos ensina sobre paciência, discernimento e confiança no plano de Deus.",
        "",
        "CONCLUSÃO DA PARTE 01",
        "",
        "As parábolas de Jesus são tesouros inesgotáveis de sabedoria. Cada estudo nos revela novas camadas de significado e aplicação prática.",
        "",
        "Continue estudando com dedicação, e permita que o Espírito Santo ilumine sua compreensão das verdades eternas contidas nestas histórias simples, mas profundas.",
        "",
        "Na próxima parte, exploraremos mais parábolas e suas aplicações práticas para nossa vida cristã."
      ]
      
      setExtractedText(mockText)
      setTotalPages(mockText.length)
      setIsLoading(false)
    }

    simulateTextExtraction()
  }, [pdfUrl])

  useEffect(() => {
    pageFlipAudioRef.current = new Audio()
    pageFlipAudioRef.current.volume = 0.3
    pageFlipAudioRef.current.src = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGe77OeeSwwPUKXi8LdjHAU5k9jyzHksBSR3yPDekEALFF+16+qnVRQKRp/h8r9sIQYsgc7y2Ik2CBhnu+znm0sMD1Cl4vC3YxwFOZPY8sx5LAUkd8jw3pBACxRftevqp1UUCkaf4fK/bCEGLIHO8tmJNggYZ7vs55tLDA9QpeLwt2McBTmT2PLMeSwFJHfI8N6QQAsUX7Xr6qdVFApGn+Hyv2whBiyBzvLZiTYIGGe77OebSwwPUKXi8LdjHAU5k9jyzHksBSR3yPDekEALFF+16+qnVRQKRp/h8r9sIQYsgc7y2Yk2CBhnu+znm0sMD1Cl4vC3Yw="
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

  // Auto-scroll functionality
  useEffect(() => {
    if (autoScroll && currentPage < totalPages) {
      autoScrollRef.current = window.setTimeout(() => {
        nextPage()
      }, 10000 / scrollSpeed)
    }

    return () => {
      if (autoScrollRef.current) {
        clearTimeout(autoScrollRef.current)
      }
    }
  }, [autoScroll, currentPage, totalPages, scrollSpeed])

  const playPageFlipSound = () => {
    if (soundEnabled && pageFlipAudioRef.current) {
      pageFlipAudioRef.current.currentTime = 0
      pageFlipAudioRef.current.play().catch(() => {})
    }
  }

  const nextPage = () => {
    if (currentPage < totalPages) {
      setDirection(1)
      playPageFlipSound()
      setCurrentPage(prev => prev + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 1) {
      setDirection(-1)
      playPageFlipSound()
      setCurrentPage(prev => prev - 1)
    }
  }

  const toggleBookmark = () => {
    if (bookmarks.includes(currentPage)) {
      setBookmarks(prev => prev.filter(page => page !== currentPage))
    } else {
      setBookmarks(prev => [...prev, currentPage])
    }
  }

  const goToBookmark = (page: number) => {
    setCurrentPage(page)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] space-y-6">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#F3C77A]"></div>
          <BookOpen className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-[#F3C77A]" />
        </div>
        <div className="text-center">
          <p className="text-[#F3C77A] font-medium text-lg">Preparando leitura otimizada...</p>
          <p className="text-sm text-muted-foreground mt-2">Configurando experiência de leitura estilo Kindle</p>
          <div className="mt-4 w-64 h-1 bg-[#2E261D] rounded-full overflow-hidden">
            <div className="h-full bg-[#F3C77A] rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
        </div>
      </div>
    )
  }

  // Sempre renderizar modo Bíblia Digital
  return <BibleDigitalReader pdfUrl={pdfUrl} courseId={courseId} pdfData={pdfData} onSessionUpdate={onSessionUpdate} readingMode={readingMode} onBackToModeSelection={onBackToModeSelection} />
}