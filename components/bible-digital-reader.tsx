"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight, Volume2, VolumeX, Sun, Moon, Palette, RotateCcw, Settings, BookOpen, Eye, EyeOff, Type, AlignLeft, AlignCenter, AlignJustify, Minus, Plus, Bookmark, BookmarkCheck, Zap, ZapOff, Download, FileText, Highlighter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { Slider } from "@/components/ui/slider"
import { CoursePDF } from "@/lib/courses-data"
import { HighlightToolbar } from "@/components/highlight-toolbar"
import { SummariesPanel } from "@/components/summaries-panel"
import { usePageProgress } from "@/hooks/use-page-progress"

interface BibleDigitalReaderProps {
  pdfUrl: string
  courseId: string
  pdfId?: string  // ID do PDF no banco de dados (necessário para highlights)
  pdfData?: CoursePDF  // Dados completos do PDF incluindo text_content pré-carregado
  onSessionUpdate?: (durationSeconds: number, currentPage: number) => void
  readingMode?: 'light' | 'sepia' | 'dark'
  onBackToModeSelection?: () => void
}

export const BibleDigitalReader = ({
  pdfUrl,
  courseId,
  pdfId,
  pdfData,
  onSessionUpdate,
  readingMode = 'light',
  onBackToModeSelection
}: BibleDigitalReaderProps) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [startTime] = useState(() => Date.now())
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [direction, setDirection] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [extractedText, setExtractedText] = useState<string>("")
  const [showSettings, setShowSettings] = useState(false)
  const [bookmarks, setBookmarks] = useState<number[]>([])
  const [fontSize, setFontSize] = useState(18)
  const [lineHeight, setLineHeight] = useState(1.8)
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'justify'>('justify')
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [warmth, setWarmth] = useState(0)
  const [autoScroll, setAutoScroll] = useState(false)
  const [scrollSpeed, setScrollSpeed] = useState(1)
  const [showChapterNumbers, setShowChapterNumbers] = useState(true)
  const [showVerseNumbers, setShowVerseNumbers] = useState(true)
  const [selectedText, setSelectedText] = useState('')
  const [showHighlightToolbar, setShowHighlightToolbar] = useState(false)
  const [showSummariesPanel, setShowSummariesPanel] = useState(false)
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null)
  const [highlights, setHighlights] = useState<any[]>([])
  const [isLoadingHighlights, setIsLoadingHighlights] = useState(false)

  // Hook para gerenciar progresso de páginas
  const { 
    currentPage: savedPage, 
    loadPageProgress, 
    savePageProgress,
    isLoading: isLoadingProgress 
  } = usePageProgress()

  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const pageFlipAudioRef = useRef<HTMLAudioElement | null>(null)
  const autoScrollRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const textContainerRef = useRef<HTMLDivElement | null>(null)

  // Configurações de temperatura de leitura estilo Bíblia
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

  // Carregar configurações salvas do localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('kindle-settings')
      if (saved) {
        const settings = JSON.parse(saved)
        if (settings.fontSize !== undefined) setFontSize(settings.fontSize)
        if (settings.lineHeight !== undefined) setLineHeight(settings.lineHeight)
        if (settings.textAlign !== undefined) setTextAlign(settings.textAlign)
        if (settings.showChapterNumbers !== undefined) setShowChapterNumbers(settings.showChapterNumbers)
        if (settings.showVerseNumbers !== undefined) setShowVerseNumbers(settings.showVerseNumbers)
        if (settings.brightness !== undefined) setBrightness(settings.brightness)
        if (settings.contrast !== undefined) setContrast(settings.contrast)
        if (settings.warmth !== undefined) setWarmth(settings.warmth)
        console.log('📖 Configurações do Kindle carregadas do localStorage')
      }
    } catch (error) {
      console.error('Erro ao carregar configurações do localStorage:', error)
    }
  }, [])

  // Salvar configurações no localStorage sempre que mudarem
  useEffect(() => {
    try {
      const settings = {
        fontSize,
        lineHeight,
        textAlign,
        showChapterNumbers,
        showVerseNumbers,
        brightness,
        contrast,
        warmth
      }
      localStorage.setItem('kindle-settings', JSON.stringify(settings))
    } catch (error) {
      console.error('Erro ao salvar configurações no localStorage:', error)
    }
  }, [fontSize, lineHeight, textAlign, showChapterNumbers, showVerseNumbers, brightness, contrast, warmth])

  // Carregar texto pré-configurado ou tentar conversão automática
  useEffect(() => {
    const loadText = async () => {
      try {
        setIsLoading(true)

        // Prioridade 1: Verificar se há texto pré-carregado pelo admin
        if (pdfData?.text_content && pdfData.text_content.trim().length > 0) {
          console.log('Usando texto pré-carregado pelo administrador')
          setExtractedText(pdfData.text_content)
          setIsLoading(false)
          return
        }

        // Prioridade 2: Verificar se conversão automática está habilitada
        if (pdfData?.use_auto_conversion === false) {
          console.log('Conversão automática desabilitada - aguardando configuração do admin')
          setExtractedText('Este conteúdo está sendo preparado pelo administrador.\n\nPor favor, volte mais tarde ou entre em contato com o responsável pelo curso.')
          setIsLoading(false)
          return
        }

        // Prioridade 3: Conversão automática DESABILITADA por padrão
        console.log('Conversão automática desabilitada por padrão - usando texto pré-configurado')
        setExtractedText('Este conteúdo está sendo preparado pelo administrador.\n\nPor favor, volte mais tarde ou entre em contato com o responsável pelo curso.')
        setIsLoading(false)
        return

        // CÓDIGO DE CONVERSÃO AUTOMÁTICA COMENTADO
        // Descomente apenas se necessário ativar conversão automática
        /*
        console.log('Tentando conversão automática do PDF:', pdfUrl)

        const response = await fetch('/api/convert-pdf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ pdfUrl }),
        })

        console.log('Status da resposta:', response.status)

        if (!response.ok) {
          const errorText = await response.text()
          console.error('Erro HTTP:', response.status, errorText)
          throw new Error(`Erro HTTP ${response.status}: ${errorText}`)
        }

        const data = await response.json()

        console.log('Resposta da API:', data)

        if (data.success) {
          console.log(`PDF convertido com sucesso: ${data.text.length} caracteres`)
          setExtractedText(data.text)
        } else {
          console.warn('API retornou erro:', data)

          // Se houver texto mesmo com erro (caso de PDF de imagens)
          if (data.text) {
            setExtractedText(data.text)
          } else {
            throw new Error(data.error || data.details || 'Erro na conversão')
          }
        }
        */

      } catch (error) {
        console.error('Erro ao carregar texto:', error)

        // Mostrar mensagem de erro - admin deve configurar texto manualmente
        setExtractedText('ERRO: Não foi possível converter o PDF automaticamente.\n\nPor favor, entre em contato com o administrador do curso para que o conteúdo seja configurado corretamente.')
        setIsLoading(false)
      }
    }

    if (pdfUrl) {
      loadText()
    }
  }, [pdfUrl, pdfData])

  // Carregar página salva quando o componente monta
  useEffect(() => {
    if (courseId && !isLoading) {
      loadPageProgress(courseId, pdfId).then(() => {
        // Após carregar o progresso, definir a página salva
        if (savedPage > 1) {
          setCurrentPage(savedPage)
          console.log(`📖 Continuando da página ${savedPage}`)
        }
      })
    }
  }, [courseId, pdfId, isLoading, loadPageProgress, savedPage])

  useEffect(() => {
    pageFlipAudioRef.current = new Audio()
    pageFlipAudioRef.current.volume = 0.3
    pageFlipAudioRef.current.src = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGe77OeeSwwPUKXi8LdjHAU5k9jyzHksBSR3yPDekEALFF+16+qnVRQKRp/h8r9sIQYsgc7y2Ik2CBhnu+znm0sMD1Cl4vC3YxwFOZPY8sx5LAUkd8jw3pBACxRftevqp1UUCkaf4fK/bCEGLIHO8tmJNggYZ7vs55tLDA9QpeLwt2McBTmT2PLMeSwFJHfI8N6QQAsUX7Xr6qdVFApGn+Hyv2whBiyBzvLZiTYIGGe77OebSwwPUKXi8LdjHAU5k9jyzHksBSR3yPDekEALFF+16+qnVRQKRp/h8r9sIQYsgc7y2Yk2CBhnu+znm0sMD1Cl4vC3Yw="
  }, [])

  useEffect(() => {
    intervalRef.current = setInterval(() => {
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
    if (autoScroll && textContainerRef.current) {
      const container = textContainerRef.current
      const scrollHeight = container.scrollHeight
      const clientHeight = container.clientHeight
      const maxScroll = scrollHeight - clientHeight
      
      if (maxScroll > 0) {
        autoScrollRef.current = setInterval(() => {
          const currentScroll = container.scrollTop
          const newScroll = Math.min(currentScroll + scrollSpeed, maxScroll)
          container.scrollTop = newScroll

          if (newScroll >= maxScroll) {
            setAutoScroll(false)
          }
        }, 100)
      }
    }

    return () => {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current)
      }
    }
  }, [autoScroll, scrollSpeed])

  // Salvar progresso baseado na posição do scroll
  useEffect(() => {
    const saveScrollProgress = async () => {
      if (textContainerRef.current && totalPages > 0) {
        const container = textContainerRef.current
        const scrollTop = container.scrollTop
        const scrollHeight = container.scrollHeight
        const clientHeight = container.clientHeight
        
        // Calcular página baseada na posição do scroll
        const scrollPercentage = scrollTop / (scrollHeight - clientHeight)
        const estimatedPage = Math.max(1, Math.ceil(scrollPercentage * totalPages))
        
        // Salvar apenas se mudou significativamente
        if (Math.abs(estimatedPage - currentPage) >= 1) {
          await savePageProgress(courseId, pdfId || null, estimatedPage, totalPages)
          setCurrentPage(estimatedPage)
        }
      }
    }

    // Salvar progresso a cada 5 segundos durante o scroll
    const scrollInterval = setInterval(saveScrollProgress, 5000)
    
    return () => clearInterval(scrollInterval)
  }, [courseId, pdfId, totalPages, currentPage, savePageProgress])

  const playPageFlipSound = () => {
    if (soundEnabled && pageFlipAudioRef.current) {
      pageFlipAudioRef.current.currentTime = 0
      pageFlipAudioRef.current.play().catch(() => {})
    }
  }

  const toggleBookmark = () => {
    if (bookmarks.includes(currentPage)) {
      setBookmarks(prev => prev.filter(page => page !== currentPage))
    } else {
      setBookmarks(prev => [...prev, currentPage])
    }
  }

  const downloadAsTxt = () => {
    const element = document.createElement('a')
    const file = new Blob([extractedText], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = 'conteudo-extraido.txt'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  // Handler para captura de seleção de texto
  const handleTextSelection = () => {
    const selection = window.getSelection()
    const text = selection?.toString().trim()

    if (text && text.length > 0) {
      setSelectedText(text)

      // Calcular posição do texto no conteúdo completo
      const range = selection?.getRangeAt(0)
      if (range && textContainerRef.current) {
        const preSelectionRange = range.cloneRange()
        preSelectionRange.selectNodeContents(textContainerRef.current)
        preSelectionRange.setEnd(range.startContainer, range.startOffset)
        const start = preSelectionRange.toString().length
        const end = start + text.length

        setSelectionRange({ start, end })
      }

      setShowHighlightToolbar(true)
    } else {
      setShowHighlightToolbar(false)
    }
  }

  // Carregar highlights do servidor
  const loadHighlights = async () => {
    if (!pdfId) return

    setIsLoadingHighlights(true)
    try {
      // Obter token da sessão
      const { data: { session } } = await supabase.auth.getSession()

      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      }

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch(`/api/highlights?course_id=${courseId}&pdf_id=${pdfId}`, {
        headers
      })

      if (response.ok) {
        const data = await response.json()
        setHighlights(data.highlights || [])
      } else {
        console.error('Erro ao carregar highlights:', response.status)
      }
    } catch (error) {
      console.error('Erro ao carregar highlights:', error)
    } finally {
      setIsLoadingHighlights(false)
    }
  }

  // Handler para criar highlight
  const handleCreateHighlight = async (color: string, note?: string) => {
    if (!selectedText || !pdfId || !selectionRange) {
      console.warn('Faltam dados para criar highlight:', { selectedText, pdfId, selectionRange })
      return
    }

    try {
      // Obter token da sessão
      const { data: { session } } = await supabase.auth.getSession()

      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      }

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch('/api/highlights', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          course_id: courseId,
          pdf_id: pdfId,
          page_number: 1, // Para texto corrido, usar página 1
          text_content: selectedText,
          start_position: selectionRange.start,
          end_position: selectionRange.end,
          highlight_color: color,
          note: note || undefined,
        }),
      })

      if (response.ok) {
        console.log('Marcação criada com sucesso')
        setShowHighlightToolbar(false)
        setSelectedText('')
        setSelectionRange(null)

        // Limpar seleção
        window.getSelection()?.removeAllRanges()

        // Recarregar highlights
        await loadHighlights()
      } else {
        const error = await response.json()
        console.error('Erro ao criar marcação:', error)
        alert('Erro ao criar marcação: ' + (error.error || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('Erro ao criar marcação:', error)
      alert('Erro ao criar marcação. Por favor, tente novamente.')
    }
  }

  // Handler para deletar highlight
  const handleDeleteHighlight = async (id: string) => {
    try {
      // Obter token da sessão
      const { data: { session } } = await supabase.auth.getSession()

      const headers: HeadersInit = {}

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch(`/api/highlights/${id}`, {
        method: 'DELETE',
        headers
      })

      if (response.ok) {
        console.log('Marcação deletada com sucesso')
        await loadHighlights()
      } else {
        const error = await response.json()
        console.error('Erro ao deletar marcação:', error)
        alert('Erro ao deletar marcação: ' + (error.error || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('Erro ao deletar marcação:', error)
      alert('Erro ao deletar marcação. Por favor, tente novamente.')
    }
  }

  // Handler para atualizar nota do highlight
  const handleUpdateHighlight = async (id: string, note: string) => {
    try {
      // Obter token da sessão
      const { data: { session } } = await supabase.auth.getSession()

      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      }

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch(`/api/highlights/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ note }),
      })

      if (response.ok) {
        console.log('Marcação atualizada com sucesso')
        await loadHighlights()
      } else {
        const error = await response.json()
        console.error('Erro ao atualizar marcação:', error)
        alert('Erro ao atualizar marcação: ' + (error.error || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('Erro ao atualizar marcação:', error)
      alert('Erro ao atualizar marcação. Por favor, tente novamente.')
    }
  }

  // Carregar highlights quando o componente montar ou pdfId mudar
  useEffect(() => {
    loadHighlights()
  }, [pdfId, courseId])

  // Adicionar listener para seleção de texto
  useEffect(() => {
    const container = textContainerRef.current
    if (container) {
      container.addEventListener('mouseup', handleTextSelection)
      container.addEventListener('touchend', handleTextSelection)

      return () => {
        container.removeEventListener('mouseup', handleTextSelection)
        container.removeEventListener('touchend', handleTextSelection)
      }
    }
  }, [extractedText])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] space-y-6">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#F3C77A]"></div>
          <FileText className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-[#F3C77A]" />
        </div>
        <div className="text-center">
          <p className="text-[#F3C77A] font-medium text-lg">Convertendo PDF para texto...</p>
          <p className="text-sm text-muted-foreground mt-2">Extraindo conteúdo sem imagens</p>
          <div className="mt-4 w-64 h-1 bg-[#2E261D] rounded-full overflow-hidden">
            <div className="h-full bg-[#F3C77A] rounded-full animate-pulse" style={{ width: '75%' }}></div>
          </div>
        </div>
      </div>
    )
  }

  // Se não há texto extraído ainda, mostrar loading
  if (!extractedText || extractedText.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] space-y-6">
        <div className="text-center">
          <p className="text-[#F3C77A] font-medium text-lg">Preparando visualização...</p>
          <p className="text-sm text-muted-foreground mt-2">Aguarde um momento</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Painel de Controles Avançados */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#2E261D] bg-[#16130F] px-6 py-4">
        <div className="flex flex-wrap items-center gap-4">
          {onBackToModeSelection && (
            <Button
              onClick={onBackToModeSelection}
              variant="outline"
              size="sm"
              className="border-[#2E261D] text-[#F3C77A] hover:bg-[#2E261D] hover:text-[#FFD88A]"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Trocar Modo
            </Button>
          )}

          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-[#F3C77A]" />
            <span className="text-sm text-[#BCB19F]">Modo:</span>
            <span className="text-sm font-medium text-[#F3C77A] capitalize">{readingMode}</span>
            <span className="text-xs text-muted-foreground">({currentTemp.description})</span>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="flex items-center gap-2 rounded-full border border-[#2E261D] px-3 py-1 text-xs text-[#BCB19F] transition-colors hover:border-[#F3C77A]"
          >
            {soundEnabled ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
            Som {soundEnabled ? "ligado" : "desligado"}
          </button>

          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className="flex items-center gap-2 rounded-full border border-[#2E261D] px-3 py-1 text-xs text-[#BCB19F] transition-colors hover:border-[#F3C77A]"
          >
            {autoScroll ? <Zap className="h-3 w-3" /> : <ZapOff className="h-3 w-3" />}
            Auto-scroll {autoScroll ? "ligado" : "desligado"}
          </button>

          <button
            onClick={toggleBookmark}
            className="flex items-center gap-2 rounded-full border border-[#2E261D] px-3 py-1 text-xs text-[#BCB19F] transition-colors hover:border-[#F3C77A]"
          >
            {bookmarks.includes(currentPage) ? <BookmarkCheck className="h-3 w-3" /> : <Bookmark className="h-3 w-3" />}
            {bookmarks.includes(currentPage) ? "Marcado" : "Marcar"}
          </button>

          <button
            onClick={downloadAsTxt}
            className="flex items-center gap-2 rounded-full border border-[#2E261D] px-3 py-1 text-xs text-[#BCB19F] transition-colors hover:border-[#F3C77A]"
          >
            <Download className="h-3 w-3" />
            Baixar TXT
          </button>

          {pdfId && (
            <button
              onClick={() => setShowSummariesPanel(true)}
              className="flex items-center gap-2 rounded-full border border-[#2E261D] px-3 py-1 text-xs text-[#BCB19F] transition-colors hover:border-[#F3C77A]"
            >
              <Highlighter className="h-3 w-3" />
              Marcações e Resumos
            </button>
          )}

          <Button
            onClick={() => setShowSettings(!showSettings)}
            variant="ghost"
            size="sm"
            className="h-8 px-3 text-[#F3C77A] hover:bg-[#2E261D]"
          >
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </Button>
        </div>

        <div className="flex items-center gap-2 text-sm text-[#BCB19F]">
          <span>Texto corrido • {extractedText.length} caracteres</span>
        </div>
      </div>

      {/* HighlightToolbar - aparece quando o usuário seleciona texto */}
      {showHighlightToolbar && selectedText && pdfId && (
        <HighlightToolbar
          selectedText={selectedText}
          pageNumber={1}
          onHighlight={handleCreateHighlight}
          onCancel={() => {
            setShowHighlightToolbar(false)
            setSelectedText('')
            setSelectionRange(null)
            window.getSelection()?.removeAllRanges()
          }}
          existingHighlights={highlights.filter(h => h.page_number === 1)}
          onDeleteHighlight={handleDeleteHighlight}
          onUpdateHighlight={handleUpdateHighlight}
        />
      )}

      {/* SummariesPanel - painel para visualizar e gerenciar resumos */}
      {showSummariesPanel && pdfId && (
        <SummariesPanel
          courseId={courseId}
          pdfId={pdfId}
          highlights={highlights}
          onClose={() => setShowSummariesPanel(false)}
        />
      )}

      {/* Painel de Configurações Avançadas */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="rounded-2xl border border-[#2E261D] bg-[#16130F] p-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Controle de Fonte */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-[#F3C77A] flex items-center gap-2">
                <Type className="h-4 w-4" />
                Tamanho da Fonte
              </label>
              <div className="flex items-center gap-2">
                <Minus className="h-4 w-4 text-[#BCB19F]" />
                <Slider
                  value={[fontSize]}
                  onValueChange={(value) => setFontSize(value[0])}
                  min={12}
                  max={28}
                  step={1}
                  className="flex-1"
                />
                <Plus className="h-4 w-4 text-[#BCB19F]" />
              </div>
              <span className="text-xs text-muted-foreground">{fontSize}px</span>
            </div>

            {/* Controle de Altura da Linha */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-[#F3C77A] flex items-center gap-2">
                <AlignLeft className="h-4 w-4" />
                Altura da Linha
              </label>
              <div className="flex items-center gap-2">
                <Minus className="h-4 w-4 text-[#BCB19F]" />
                <Slider
                  value={[lineHeight]}
                  onValueChange={(value) => setLineHeight(value[0])}
                  min={1.2}
                  max={2.5}
                  step={0.1}
                  className="flex-1"
                />
                <Plus className="h-4 w-4 text-[#BCB19F]" />
              </div>
              <span className="text-xs text-muted-foreground">{lineHeight.toFixed(1)}</span>
            </div>

            {/* Controle de Brilho */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-[#F3C77A] flex items-center gap-2">
                <Sun className="h-4 w-4" />
                Brilho
              </label>
              <div className="flex items-center gap-2">
                <Minus className="h-4 w-4 text-[#BCB19F]" />
                <Slider
                  value={[brightness]}
                  onValueChange={(value) => setBrightness(value[0])}
                  min={50}
                  max={150}
                  step={5}
                  className="flex-1"
                />
                <Plus className="h-4 w-4 text-[#BCB19F]" />
              </div>
              <span className="text-xs text-muted-foreground">{brightness}%</span>
            </div>

            {/* Controle de Contraste */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-[#F3C77A] flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Contraste
              </label>
              <div className="flex items-center gap-2">
                <Minus className="h-4 w-4 text-[#BCB19F]" />
                <Slider
                  value={[contrast]}
                  onValueChange={(value) => setContrast(value[0])}
                  min={50}
                  max={150}
                  step={5}
                  className="flex-1"
                />
                <Plus className="h-4 w-4 text-[#BCB19F]" />
              </div>
              <span className="text-xs text-muted-foreground">{contrast}%</span>
            </div>
          </div>

          {/* Alinhamento do Texto */}
          <div className="mt-6 space-y-3">
            <label className="text-sm font-medium text-[#F3C77A]">Alinhamento do Texto</label>
            <div className="flex gap-2">
              <Button
                onClick={() => setTextAlign('left')}
                variant={textAlign === 'left' ? 'default' : 'outline'}
                size="sm"
                className="h-8"
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => setTextAlign('center')}
                variant={textAlign === 'center' ? 'default' : 'outline'}
                size="sm"
                className="h-8"
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => setTextAlign('justify')}
                variant={textAlign === 'justify' ? 'default' : 'outline'}
                size="sm"
                className="h-8"
              >
                <AlignJustify className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Opções de Formatação */}
          <div className="mt-6 space-y-3">
            <label className="text-sm font-medium text-[#F3C77A]">Formatação</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showChapterNumbers}
                  onChange={(e) => setShowChapterNumbers(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-[#BCB19F]">Mostrar números de capítulos</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showVerseNumbers}
                  onChange={(e) => setShowVerseNumbers(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-[#BCB19F]">Mostrar números de versículos</span>
              </label>
            </div>
          </div>
        </motion.div>
      )}

      {/* Visualizador de Texto Corrido Estilo Bíblia Digital */}
      <div className="relative mx-auto w-full max-w-5xl">
        <div className="perspective-[2000px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative overflow-hidden rounded-3xl border border-[#2E261D] shadow-2xl"
            style={{
              filter: `${currentTemp.filter} brightness(${brightness}%) contrast(${contrast}%)`,
              minHeight: "800px",
              backgroundColor: currentTemp.background,
              color: currentTemp.text
            }}
          >
            {/* Conteúdo do Texto Corrido */}
            <div 
              ref={textContainerRef}
              className="p-16 h-full max-h-[800px] overflow-y-auto scrollbar-thin scrollbar-thumb-[#F3C77A] scrollbar-track-[#2E261D]"
              style={{
                fontSize: `${fontSize}px`,
                lineHeight: lineHeight,
                textAlign: textAlign,
                color: currentTemp.text
              }}
            >
              <div className="max-w-4xl mx-auto">
                <div className="prose prose-lg max-w-none">
                  {extractedText.split('\n\n').map((paragraph, index) => (
                    <p key={index} className="mb-6 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            {/* Efeito de sombra da página */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-black/5 to-transparent"></div>
              <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-black/5 to-transparent"></div>
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-black/5 to-transparent"></div>
              <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-transparent via-black/5 to-transparent"></div>
            </div>
          </motion.div>
        </div>

        {/* Controles de Navegação */}
        <div className="absolute bottom-8 left-8 right-8 flex items-center justify-between">
          <Button
            onClick={() => {
              if (textContainerRef.current) {
                textContainerRef.current.scrollTop = 0
              }
            }}
            variant="ghost"
            size="icon"
            className="h-16 w-16 rounded-full bg-[#16130F]/95 text-[#F3C77A] backdrop-blur-sm hover:bg-[#16130F] shadow-xl"
            title="Voltar ao topo"
          >
            <RotateCcw className="h-8 w-8" />
          </Button>

          <div className="flex items-center gap-4">
            <div className="rounded-full bg-[#16130F]/95 px-8 py-4 text-lg font-semibold text-[#F3C77A] backdrop-blur-sm shadow-xl">
              Texto Corrido
            </div>
            
            {/* Botão de Salvar Progresso */}
            <Button
              onClick={async () => {
                if (textContainerRef.current && totalPages > 0) {
                  const container = textContainerRef.current
                  const scrollTop = container.scrollTop
                  const scrollHeight = container.scrollHeight
                  const clientHeight = container.clientHeight
                  
                  const scrollPercentage = scrollTop / (scrollHeight - clientHeight)
                  const estimatedPage = Math.max(1, Math.ceil(scrollPercentage * totalPages))
                  
                  const success = await savePageProgress(courseId, pdfId || null, estimatedPage, totalPages)
                  if (success) {
                    alert(`✅ Progresso salvo! Página ${estimatedPage} de ${totalPages}`)
                  }
                }
              }}
              className="h-12 px-6 rounded-full bg-[#F3C77A] text-black font-semibold hover:bg-[#FFD88A] shadow-xl"
              title="Salvar progresso atual"
            >
              💾 Salvar Progresso
            </Button>
            
            <Button
              onClick={downloadAsTxt}
              variant="ghost"
              size="icon"
              className="h-12 w-12 rounded-full bg-[#16130F]/95 text-[#F3C77A] backdrop-blur-sm hover:bg-[#16130F] shadow-xl"
              title="Baixar como TXT"
            >
              <Download className="h-6 w-6" />
            </Button>
          </div>

          <Button
            onClick={() => {
              if (textContainerRef.current) {
                textContainerRef.current.scrollTop = textContainerRef.current.scrollHeight
              }
            }}
            variant="ghost"
            size="icon"
            className="h-16 w-16 rounded-full bg-[#16130F]/95 text-[#F3C77A] backdrop-blur-sm hover:bg-[#16130F] shadow-xl"
            title="Ir para o final"
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        </div>
      </div>

      {/* Barra de Progresso */}
      <div className="mx-auto w-full max-w-5xl">
        <div className="h-3 overflow-hidden rounded-full bg-[#2E261D]">
          <div
            className="h-full bg-gradient-to-r from-[#F3C77A] to-[#FFD88A] transition-all duration-500"
            style={{ width: '100%' }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>Início</span>
          <span>Texto completo disponível</span>
          <span>Fim</span>
        </div>
      </div>
    </div>
  )
}
