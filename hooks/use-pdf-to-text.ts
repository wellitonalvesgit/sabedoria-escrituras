'use client'

import { useState, useCallback } from 'react'
import { configurePdfjs, getPdfjsWorkerSrc } from '@/lib/pdfjs-config'

export interface PdfToTextResult {
  text: string
  pages: number
  info?: {
    title?: string
    author?: string
    subject?: string
  }
}

export function usePdfToText() {
  const [isConverting, setIsConverting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  const convertPdfToText = useCallback(async (pdfUrl: string): Promise<PdfToTextResult | null> => {
    setIsConverting(true)
    setError(null)
    setProgress(0)

    try {
      // Configurar pdfjs para evitar conflitos com Image constructor
      const restoreImage = configurePdfjs()
      
      // Importar pdfjs-dist dinamicamente no cliente
      const pdfjsLib = await import('pdfjs-dist')

      // Configurar worker usando CDN com fallback
      if (typeof window !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = getPdfjsWorkerSrc(pdfjsLib.version)
      }

      // Converter URL do Google Drive se necessário
      let processedUrl = pdfUrl
      if (pdfUrl.includes('drive.google.com/file/d/')) {
        const fileIdMatch = pdfUrl.match(/\/d\/([a-zA-Z0-9_-]+)/)
        if (fileIdMatch && fileIdMatch[1]) {
          const fileId = fileIdMatch[1]
          // Usar formato de visualização direta que funciona melhor no browser
          processedUrl = `https://drive.google.com/uc?export=view&id=${fileId}`
        }
      }

      console.log('Carregando PDF:', processedUrl)

      // Carregar o PDF
      const loadingTask = pdfjsLib.getDocument({
        url: processedUrl,
        // Habilitar CORS para Google Drive
        withCredentials: false,
        // Configurações para evitar conflitos com Image constructor
        useSystemFonts: false,
        disableFontFace: true,
        disableRange: false,
        disableStream: false,
      })

      // Monitorar progresso de carregamento
      loadingTask.onProgress = (progressData: any) => {
        if (progressData.total > 0) {
          const percent = Math.round((progressData.loaded / progressData.total) * 50) // 50% para carregamento
          setProgress(percent)
        }
      }

      const pdf = await loadingTask.promise
      const numPages = pdf.numPages

      console.log(`PDF carregado com ${numPages} páginas`)

      let fullText = ''

      // Extrair texto de cada página
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdf.getPage(pageNum)
        const textContent = await page.getTextContent()

        const pageText = textContent.items
          .map((item: any) => {
            if ('str' in item) {
              return item.str
            }
            return ''
          })
          .join(' ')

        fullText += pageText + '\n\n'

        // Atualizar progresso (50% a 100%)
        const percent = 50 + Math.round((pageNum / numPages) * 50)
        setProgress(percent)
      }

      // Limpar e formatar o texto
      const cleanText = fullText
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\t/g, ' ')
        .replace(/ +/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim()

      // Obter metadados
      let info: PdfToTextResult['info'] = {}
      try {
        const metadata = await pdf.getMetadata()
        info = {
          title: metadata?.info?.Title || '',
          author: metadata?.info?.Author || '',
          subject: metadata?.info?.Subject || '',
        }
      } catch (e) {
        console.warn('Não foi possível obter metadados do PDF')
      }

      // Verificar se extraiu texto suficiente
      if (cleanText.length < 100) {
        console.warn('Pouco texto extraído. Pode ser um PDF de imagens.')
        setError('Este PDF parece conter principalmente imagens. Use o modo "PDF Original" para melhor visualização.')

        return {
          text: 'AVISO: Este PDF parece conter principalmente imagens.\n\nNão foi possível extrair texto significativo. O PDF pode ser:\n\n1. Um documento escaneado (apenas imagens)\n2. Um PDF protegido\n3. Um PDF com texto em formato de imagem\n\nSugestões:\n- Use o modo "PDF Original" para visualizar o documento\n- Ou faça o download do PDF e visualize em um leitor PDF local',
          pages: numPages,
          info
        }
      }

      console.log(`Conversão concluída: ${cleanText.length} caracteres extraídos`)
      setProgress(100)

      // Restaurar o Image constructor original
      if (restoreImage) {
        restoreImage()
      }

      return {
        text: cleanText,
        pages: numPages,
        info
      }

    } catch (err) {
      console.error('Erro na conversão do PDF:', err)

      // Restaurar o Image constructor original em caso de erro
      if (restoreImage) {
        restoreImage()
      }

      let errorMessage = 'Erro ao converter PDF para texto'

      if (err instanceof Error) {
        if (err.message.includes('CORS') || err.message.includes('cross-origin')) {
          errorMessage = 'Erro de permissão ao acessar o PDF. Verifique se o link do Google Drive está com permissão de visualização pública.'
        } else if (err.message.includes('Invalid PDF') || err.message.includes('Pdf')) {
          errorMessage = 'Arquivo PDF inválido ou corrompido'
        } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
          errorMessage = 'Erro de conexão ao carregar o PDF. Verifique sua internet.'
        } else {
          errorMessage = `Erro: ${err.message}`
        }
      }

      setError(errorMessage)
      return null

    } finally {
      setIsConverting(false)
    }
  }, [])

  return {
    convertPdfToText,
    isConverting,
    error,
    progress
  }
}
