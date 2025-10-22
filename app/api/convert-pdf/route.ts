import { NextRequest, NextResponse } from 'next/server'

// Marcar como rota dinâmica para evitar problemas de build
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Função para converter URL do Google Drive para link de download direto
function convertGoogleDriveUrl(url: string): string {
  // Padrão: https://drive.google.com/file/d/FILE_ID/view
  const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/)

  if (fileIdMatch && fileIdMatch[1]) {
    const fileId = fileIdMatch[1]
    // Converter para formato de download direto
    return `https://drive.google.com/uc?export=download&id=${fileId}`
  }

  // Se já estiver no formato de download direto, retornar como está
  if (url.includes('drive.google.com/uc?')) {
    return url
  }

  return url
}

// Função para extrair texto do PDF usando pdfjs-dist
async function extractTextFromPDF(buffer: ArrayBuffer) {
  // Importar dinamicamente apenas no servidor
  const pdfjsLib = await import('pdfjs-dist')

  // Configurar worker (necessário para Node.js)
  const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.mjs')
  if (pdfjsLib.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker
  }

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    useWorkerFetch: false,
    isEvalSupported: false,
  })

  const pdfDoc = await loadingTask.promise
  const numPages = pdfDoc.numPages
  let fullText = ''

  // Extrair texto de cada página
  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum)
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
  }

  // Obter metadados
  const metadata = await pdfDoc.getMetadata().catch(() => null)

  return {
    text: fullText,
    numpages: numPages,
    info: {
      title: metadata?.info?.Title || '',
      author: metadata?.info?.Author || '',
      subject: metadata?.info?.Subject || '',
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { pdfUrl } = await request.json()

    if (!pdfUrl) {
      return NextResponse.json({ error: 'URL do PDF é obrigatória' }, { status: 400 })
    }

    console.log('Processando PDF...')

    let pdfBuffer: ArrayBuffer

    // Verificar se é um data URI (base64)
    if (pdfUrl.startsWith('data:')) {
      console.log('Detectado data URI base64')
      const base64Data = pdfUrl.split(',')[1]
      if (!base64Data) {
        throw new Error('Data URI inválida')
      }
      const buffer = Buffer.from(base64Data, 'base64')
      pdfBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
      console.log('PDF decodificado do base64. Tamanho:', pdfBuffer.byteLength, 'bytes')
    } else {
      // Processar como URL
      console.log('URL original recebida:', pdfUrl)

      // Converter URL do Google Drive se necessário
      let downloadUrl = pdfUrl
      if (pdfUrl.includes('drive.google.com')) {
        downloadUrl = convertGoogleDriveUrl(pdfUrl)
        console.log('URL convertida para download:', downloadUrl)
      }

      // Baixar o PDF com headers apropriados
      const response = await fetch(downloadUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        redirect: 'follow'
      })

      if (!response.ok) {
        console.error('Erro ao baixar PDF:', response.status, response.statusText)
        throw new Error(`Erro ao baixar o PDF: ${response.status} ${response.statusText}`)
      }

      const contentType = response.headers.get('content-type')
      console.log('Content-Type recebido:', contentType)

      // Verificar se realmente é um PDF
      if (contentType && !contentType.includes('pdf') && !contentType.includes('octet-stream')) {
        throw new Error(`Tipo de arquivo inválido: ${contentType}. Esperado: application/pdf`)
      }

      pdfBuffer = await response.arrayBuffer()
      console.log('PDF baixado com sucesso. Tamanho:', pdfBuffer.byteLength, 'bytes')
    }

    if (pdfBuffer.byteLength === 0) {
      throw new Error('PDF está vazio')
    }

    // Converter PDF para texto usando pdfjs-dist
    const pdfData = await extractTextFromPDF(pdfBuffer)
    console.log('PDF processado:', {
      pages: pdfData.numpages,
      textLength: pdfData.text.length,
      info: pdfData.info
    })

    // Limpar e formatar o texto preservando parágrafos
    let cleanText = pdfData.text
      .replace(/\r\n/g, '\n') // Normalizar quebras de linha
      .replace(/\r/g, '\n')
      .replace(/\t/g, ' ') // Substituir tabs por espaços
      .replace(/ +/g, ' ') // Remove espaços múltiplos, mas preserva quebras de linha
      .replace(/\n{3,}/g, '\n\n') // Remove mais de 2 quebras de linha consecutivas
      .trim()

    // Se o texto estiver muito pequeno, pode ser um PDF de imagens
    if (cleanText.length < 100) {
      console.warn('Texto extraído muito pequeno. Pode ser um PDF de imagens.')
      return NextResponse.json({
        success: false,
        error: 'PDF convertido, mas contém pouco texto',
        text: cleanText || 'AVISO: Este PDF parece conter principalmente imagens.\n\nNão foi possível extrair texto significativo. O PDF pode ser:\n\n1. Um documento escaneado (apenas imagens)\n2. Um PDF protegido\n3. Um PDF com texto em formato de imagem\n\nSugestões:\n- Use o modo "PDF Original" para visualizar o documento\n- Ou converta o PDF usando ferramentas OCR (Reconhecimento Óptico de Caracteres)',
        pages: pdfData.numpages,
        info: pdfData.info,
        warning: 'Pouco texto extraído - possivelmente PDF de imagens'
      })
    }

    return NextResponse.json({
      success: true,
      text: cleanText,
      pages: pdfData.numpages,
      info: pdfData.info,
      downloadUrl: downloadUrl // Retornar a URL de download usada
    })

  } catch (error) {
    console.error('Erro na conversão do PDF:', error)

    let errorMessage = 'Erro ao converter PDF para texto'
    let details = error instanceof Error ? error.message : 'Erro desconhecido'

    // Mensagens de erro mais específicas
    if (details.includes('Failed to fetch') || details.includes('network')) {
      errorMessage = 'Erro de conexão ao baixar o PDF'
      details = 'Verifique se o link do PDF está acessível e a conexão com a internet está funcionando'
    } else if (details.includes('Invalid PDF')) {
      errorMessage = 'Arquivo PDF inválido ou corrompido'
      details = 'O arquivo não é um PDF válido ou está corrompido'
    } else if (details.includes('Tipo de arquivo inválido')) {
      errorMessage = 'Tipo de arquivo incorreto'
    }

    return NextResponse.json({
      success: false,
      error: errorMessage,
      details: details
    }, { status: 500 })
  }
}

