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
  pdfId?: string  // ID do PDF no banco de dados
  pdfData?: CoursePDF  // Dados completos do PDF incluindo textContent
  onSessionUpdate?: (durationSeconds: number, currentPage: number) => void
  readingMode?: 'light' | 'sepia' | 'dark'
  onBackToModeSelection?: () => void
}

export const DigitalMagazineViewer = ({
  pdfUrl,
  courseId,
  pdfId,
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

  // Carregar texto real do banco de dados
  useEffect(() => {
    const loadTextContent = async () => {
      setIsLoading(true)

      try {
        // 1. Verificar se há textContent no pdfData do banco
        if (pdfData?.textContent) {
          console.log('Usando textContent do banco de dados')
          // Dividir o texto em parágrafos/páginas
          const paragraphs = pdfData.textContent
            .split('\n\n')
            .filter((p: string) => p.trim().length > 0)

          setExtractedText(paragraphs)
          setTotalPages(paragraphs.length)
        }
        // 2. Se useAutoConversion estiver habilitado, tentar extrair do PDF
        else if (pdfData?.useAutoConversion !== false) {
          console.log('Tentando extração automática do PDF...')
          // TODO: Implementar extração real com pdf.js
          // Por enquanto, mostrar mensagem informativa
          setExtractedText([
            'Modo de Leitura Digital',
            '',
            'Extração automática de PDF em desenvolvimento.',
            '',
            'Para usar o Modo Kindle, o administrador deve:',
            '1. Ir em Admin → Cursos → Editar Curso',
            '2. Encontrar o PDF desejado',
            '3. Clicar em "Texto Kindle"',
            '4. Colar o texto extraído manualmente ou fazer upload de arquivo TXT',
            '',
            'Alternativamente, aguarde a implementação da extração automática com pdf.js.'
          ])
          setTotalPages(11)
        }
        // 3. Fallback: mensagem de texto não disponível
        else {
          console.log('Texto não disponível para este PDF')
          setExtractedText([
            'Texto Não Disponível',
            '',
            'O modo de leitura digital não está disponível para este PDF.',
            '',
            'Entre em contato com o administrador para solicitar a configuração do texto.'
          ])
          setTotalPages(5)
        }
      } catch (error) {
        console.error('Erro ao carregar texto:', error)
        setExtractedText([
          'Erro ao Carregar Texto',
          '',
          'Ocorreu um erro ao tentar carregar o conteúdo.',
          'Por favor, tente novamente mais tarde.'
        ])
        setTotalPages(4)
      } finally {
        setIsLoading(false)
      }
    }

    loadTextContent()
  }, [pdfData, pdfUrl])

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
  return <BibleDigitalReader pdfUrl={pdfUrl} courseId={courseId} pdfId={pdfId} pdfData={pdfData} onSessionUpdate={onSessionUpdate} readingMode={readingMode} onBackToModeSelection={onBackToModeSelection} />
}