# Solução para Conversão de PDF para Texto

## Problema Identificado

A conversão de PDF para texto no Next.js 15 está falhando com o erro:
```
TypeError: Object.defineProperty called on non-object
```

**Causa**: A biblioteca `pdf-parse` e seu dependency `pdfjs-dist` não são compatíveis com o webpack do Next.js 15 quando usadas com dynamic imports em API routes.

## O Que Foi Tentado

1. ✅ Implementação inicial com `pdf-parse` - Falhou (incompatibilidade webpack)
2. ✅ Tentativa de usar `pdfjs-dist` diretamente - Falhou (mesmo erro)
3. ✅ Configuração de `runtime: 'nodejs'` e `dynamic: 'force-dynamic'` - Não resolveu
4. ⏳ Tentativa de instalar `pdf2json` - Erro no npm registry

## Soluções Recomendadas (em ordem de prioridade)

### Solução 1: Usar Serverless Function Externa (RECOMENDADO) ⭐

Criar um endpoint separado que roda em ambiente Node.js puro, fora do Next.js.

**Vantagens**:
- Total compatibilidade com libraries Node.js
- Sem problemas de webpack
- Pode ser hospedado em Vercel Functions ou AWS Lambda

**Implementação**:
```bash
# Criar pasta para serverless functions
mkdir -p api-external
cd api-external
npm init -y
npm install pdf-parse express cors
```

Criar arquivo `api-external/convert-pdf.js`:
```javascript
const express = require('express')
const pdf = require('pdf-parse')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(express.json({ limit: '50mb' }))

app.post('/convert-pdf', async (req, res) => {
  try {
    const { pdfUrl } = req.body

    let pdfBuffer
    if (pdfUrl.startsWith('data:')) {
      const base64Data = pdfUrl.split(',')[1]
      pdfBuffer = Buffer.from(base64Data, 'base64')
    } else {
      const response = await fetch(pdfUrl)
      pdfBuffer = Buffer.from(await response.arrayBuffer())
    }

    const data = await pdf(pdfBuffer)

    res.json({
      success: true,
      text: data.text,
      pages: data.numpages,
      info: data.info
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`PDF Conversion API running on port ${PORT}`)
})
```

Depois atualizar o `.env.local`:
```env
NEXT_PUBLIC_PDF_CONVERSION_API=http://localhost:4000
```

E chamar essa API externa do componente React.

---

### Solução 2: Usar PDF.js no Cliente (Browser) 🌐

Fazer a conversão no browser usando PDF.js client-side.

**Vantagens**:
- Sem problemas de servidor
- PDF.js funciona perfeitamente no browser
- Processamento no cliente alivia servidor

**Desvantagens**:
- PDFs grandes podem consumir muita memória do usuário
- Conversão mais lenta
- Precisa baixar PDF inteiro para o browser

**Implementação**:
```bash
npm install pdfjs-dist
```

Criar componente `components/pdf-to-text-converter.tsx`:
```typescript
'use client'

import { useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'

// Configurar worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

export function usePdfToText() {
  const [isConverting, setIsConverting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const convertPdfToText = async (pdfUrl: string): Promise<string | null> => {
    setIsConverting(true)
    setError(null)

    try {
      const loadingTask = pdfjsLib.getDocument(pdfUrl)
      const pdf = await loadingTask.promise

      let fullText = ''

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum)
        const textContent = await page.getTextContent()
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ')
        fullText += pageText + '\n\n'
      }

      return fullText
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      return null
    } finally {
      setIsConverting(false)
    }
  }

  return { convertPdfToText, isConverting, error }
}
```

Usar no componente:
```typescript
const { convertPdfToText, isConverting } = usePdfToText()

useEffect(() => {
  async function loadPdf() {
    const text = await convertPdfToText(pdfUrl)
    if (text) {
      setConvertedText(text)
    }
  }
  loadPdf()
}, [pdfUrl])
```

---

### Solução 3: Usar Vercel Edge Functions com WASM

Usar uma biblioteca que compila para WebAssembly, compatível com Edge Runtime.

**Implementação**:
```bash
npm install pdf-lib
```

Atualizar `app/api/convert-pdf/route.ts`:
```typescript
export const runtime = 'edge'

import { PDFDocument } from 'pdf-lib'

export async function POST(request: Request) {
  const { pdfUrl } = await request.json()

  const response = await fetch(pdfUrl)
  const pdfBytes = await response.arrayBuffer()

  const pdfDoc = await PDFDocument.load(pdfBytes)
  const pages = pdfDoc.getPages()

  let text = ''
  // Nota: pdf-lib não extrai texto diretamente
  // Precisaria usar outra lib ou fazer OCR

  return Response.json({ success: true, text })
}
```

**Nota**: `pdf-lib` é mais para criação/edição de PDFs, não extração de texto.

---

### Solução 4: Usar Serviço Externo (Google Cloud Document AI, AWS Textract)

Usar serviços de cloud que fazem OCR e extração de texto profissionalmente.

**Vantagens**:
- Extração de texto de alta qualidade
- Funciona com PDFs escaneados (imagens)
- OCR incluído
- Suporta múltiplos idiomas

**Desvantagens**:
- Custo por uso
- Dependência externa
- Latência de rede

---

## Recomendação Final

**Para desenvolvimento local**: Use **Solução 1** (Serverless Function Externa)
- Rápido de implementar
- Funciona perfeitamente
- Fácil de debugar

**Para produção**: Considere **Solução 2** (Client-Side) ou **Solução 4** (Serviço Cloud)
- Client-side: Grátis, funciona bem para PDFs médios
- Cloud: Melhor qualidade, suporta OCR, mas tem custo

## Próximos Passos

1. Escolher uma das soluções acima
2. Implementar a solução escolhida
3. Testar com PDFs reais do Google Drive
4. Adicionar cache para evitar reconversões
5. Adicionar progresso visual durante conversão
6. Implementar fallback entre múltiplas soluções

## Arquivos Modificados

- ✅ `app/api/convert-pdf/route.ts` - Tentativa com pdfjs-dist (não funcionou)
- ✅ `test-pdf-conversion.mjs` - Script de teste criado
- ✅ `components/bible-digital-reader.tsx` - Componente atualizado com melhor error handling
- ✅ `components/digital-magazine-viewer.tsx` - Callback de navegação adicionado
- ✅ `app/course/[id]/page.tsx` - Handler de navegação implementado

## Status Atual

🟡 **EM PROGRESSO** - Aguardando escolha e implementação da solução

---

**Última atualização**: 21/10/2025 01:00 AM
**Próxima sessão**: Implementar solução escolhida e testar
