# Plano de Melhorias - Sabedoria das Escrituras

## 🎯 Melhorias Prioritárias (Alta Prioridade)

### 1. Sistema de Cache para Conversões de PDF
**Problema:** Cada vez que o usuário abre o modo Bíblia Digital, o PDF é reconvertido.

**Solução:**
```typescript
// lib/pdf-cache.ts
interface CachedPDF {
  url: string
  text: string
  timestamp: number
  pages: number
}

class PDFCacheManager {
  private cache: Map<string, CachedPDF>

  async get(url: string): Promise<string | null> {
    const cached = this.cache.get(url)
    if (cached && Date.now() - cached.timestamp < 7 * 24 * 60 * 60 * 1000) {
      return cached.text
    }
    return null
  }

  set(url: string, data: CachedPDF): void {
    this.cache.set(url, { ...data, timestamp: Date.now() })
  }
}
```

**Benefícios:**
- Conversão instantânea em acessos subsequentes
- Reduz uso de banda e processamento do servidor
- Melhor experiência do usuário

**Estimativa:** 4-6 horas

---

### 2. Sistema de Busca no Texto
**Problema:** Usuários não conseguem buscar palavras ou versículos específicos no modo Bíblia Digital.

**Solução:**
```typescript
// Adicionar ao bible-digital-reader.tsx
const [searchQuery, setSearchQuery] = useState("")
const [searchResults, setSearchResults] = useState<number[]>([])
const [currentSearchIndex, setCurrentSearchIndex] = useState(0)

const handleSearch = (query: string) => {
  const results = []
  const paragraphs = extractedText.split('\n\n')

  paragraphs.forEach((para, index) => {
    if (para.toLowerCase().includes(query.toLowerCase())) {
      results.push(index)
    }
  })

  setSearchResults(results)
}
```

**Componente de UI:**
```tsx
<div className="search-bar">
  <Input
    placeholder="Buscar no texto..."
    value={searchQuery}
    onChange={(e) => handleSearch(e.target.value)}
  />
  <span>{searchResults.length} resultados</span>
  <Button onClick={nextResult}>Próximo</Button>
</div>
```

**Benefícios:**
- Navegação rápida no conteúdo
- Encontrar versículos ou tópicos específicos
- Melhor experiência de estudo

**Estimativa:** 6-8 horas

---

### 3. Notas e Highlights (Marcações)
**Problema:** Usuários não podem marcar trechos importantes ou adicionar notas.

**Solução:**
```typescript
interface Highlight {
  id: string
  text: string
  color: string
  paragraphIndex: number
  startOffset: number
  endOffset: number
  note?: string
  timestamp: number
}

// lib/highlight-manager.ts
class HighlightManager {
  private highlights: Map<string, Highlight[]> // courseId -> highlights

  addHighlight(courseId: string, highlight: Highlight) {
    const existing = this.highlights.get(courseId) || []
    existing.push(highlight)
    this.highlights.set(courseId, existing)
    localStorage.setItem('highlights', JSON.stringify([...this.highlights]))
  }

  getHighlights(courseId: string): Highlight[] {
    return this.highlights.get(courseId) || []
  }
}
```

**Interface:**
- Seleção de texto com mouse → Menu contextual
- Opções: Amarelo, Verde, Azul, Rosa
- Campo para adicionar nota
- Lista de highlights na sidebar

**Benefícios:**
- Estudos mais profundos
- Revisão rápida de pontos importantes
- Personalização da experiência

**Estimativa:** 12-16 horas

---

### 4. Sincronização de Progresso
**Problema:** Progresso de leitura é perdido ao trocar de dispositivo ou limpar cache.

**Solução - Fase 1 (LocalStorage):**
```typescript
interface ReadingProgress {
  courseId: string
  pdfVolume: string
  scrollPosition: number
  lastReadTimestamp: number
  completionPercentage: number
  highlights: Highlight[]
  bookmarks: number[]
}

// lib/progress-manager.ts
class ProgressManager {
  saveProgress(progress: ReadingProgress) {
    const key = `progress_${progress.courseId}_${progress.pdfVolume}`
    localStorage.setItem(key, JSON.stringify(progress))
  }

  loadProgress(courseId: string, pdfVolume: string): ReadingProgress | null {
    const key = `progress_${courseId}_${pdfVolume}`
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : null
  }
}
```

**Solução - Fase 2 (API + Autenticação):**
```typescript
// app/api/progress/route.ts
export async function POST(request: NextRequest) {
  const { userId, progress } = await request.json()
  // Salvar no banco de dados (Supabase, Firebase, PostgreSQL)
  await db.progress.upsert({
    where: { userId_courseId: { userId, courseId: progress.courseId } },
    update: progress,
    create: progress
  })
}
```

**Benefícios:**
- Continuidade de leitura entre sessões
- Backup automático de marcações
- Multi-dispositivo (com API)

**Estimativa:**
- Fase 1 (LocalStorage): 4-6 horas
- Fase 2 (API): 16-24 horas

---

### 5. Indicador de Progresso de Conversão
**Problema:** Usuário não sabe quanto falta para converter PDFs grandes.

**Solução:**
```tsx
// Adicionar streaming de progresso
const [conversionProgress, setConversionProgress] = useState(0)

const convertPDFToText = async () => {
  const response = await fetch('/api/convert-pdf', {
    method: 'POST',
    body: JSON.stringify({ pdfUrl })
  })

  const reader = response.body?.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value)
    const match = chunk.match(/progress:(\d+)/)
    if (match) {
      setConversionProgress(parseInt(match[1]))
    }
  }
}
```

**UI:**
```tsx
<div className="conversion-progress">
  <Progress value={conversionProgress} />
  <p>Convertendo PDF... {conversionProgress}%</p>
  <p className="text-sm text-muted">Extraindo texto das páginas</p>
</div>
```

**Benefícios:**
- Melhor UX em PDFs grandes
- Reduz ansiedade do usuário
- Transparência no processo

**Estimativa:** 6-8 horas

---

## 🚀 Melhorias de Performance (Média Prioridade)

### 6. Lazy Loading de Componentes
**Problema:** Bundle inicial muito grande, tempo de carregamento alto.

**Solução:**
```typescript
// app/course/[id]/page.tsx
import dynamic from 'next/dynamic'

const OriginalPDFViewer = dynamic(
  () => import('@/components/original-pdf-viewer'),
  { loading: () => <LoadingSpinner /> }
)

const BibleDigitalReader = dynamic(
  () => import('@/components/bible-digital-reader'),
  { loading: () => <LoadingSpinner /> }
)
```

**Benefícios:**
- Reduz bundle inicial em ~40%
- Carregamento mais rápido da página
- Melhor performance em mobile

**Estimativa:** 2-4 horas

---

### 7. Virtualização de Texto Longo
**Problema:** Textos muito longos causam lag no scroll.

**Solução:**
```typescript
import { useVirtualizer } from '@tanstack/react-virtual'

const paragraphs = extractedText.split('\n\n')

const virtualizer = useVirtualizer({
  count: paragraphs.length,
  getScrollElement: () => scrollContainerRef.current,
  estimateSize: () => 100,
  overscan: 5
})

return (
  <div ref={scrollContainerRef} style={{ height: '800px', overflow: 'auto' }}>
    <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
      {virtualizer.getVirtualItems().map(item => (
        <div key={item.index} style={{ height: item.size, transform: `translateY(${item.start}px)` }}>
          {paragraphs[item.index]}
        </div>
      ))}
    </div>
  </div>
)
```

**Benefícios:**
- Scroll suave mesmo com 1000+ parágrafos
- Usa menos memória
- Melhor performance geral

**Estimativa:** 8-10 horas

---

### 8. Service Worker para Modo Offline
**Problema:** Usuários perdem acesso ao conteúdo sem internet.

**Solução:**
```typescript
// public/sw.js
const CACHE_NAME = 'sabedoria-v1'
const urlsToCache = [
  '/',
  '/manifest.json',
  // PDFs convertidos em texto serão cacheados dinamicamente
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  )
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  )
})
```

**Benefícios:**
- Leitura offline de conteúdo já acessado
- PWA instalável
- Melhor UX em conexões ruins

**Estimativa:** 10-12 horas

---

## 🎨 Melhorias de UX/UI (Média Prioridade)

### 9. Controles de Voz (Text-to-Speech)
**Problema:** Usuários querem "ouvir" o conteúdo enquanto fazem outras atividades.

**Solução:**
```typescript
const [isSpeaking, setIsSpeaking] = useState(false)
const [speechRate, setSpeechRate] = useState(1.0)

const handleSpeak = () => {
  const utterance = new SpeechSynthesisUtterance(extractedText)
  utterance.rate = speechRate
  utterance.lang = 'pt-BR'

  utterance.onend = () => setIsSpeaking(false)

  speechSynthesis.speak(utterance)
  setIsSpeaking(true)
}

const handlePause = () => {
  speechSynthesis.pause()
}

const handleResume = () => {
  speechSynthesis.resume()
}
```

**UI:**
```tsx
<div className="voice-controls">
  <Button onClick={isSpeaking ? handlePause : handleSpeak}>
    {isSpeaking ? <Pause /> : <Play />}
  </Button>
  <Slider
    value={[speechRate]}
    onValueChange={(v) => setSpeechRate(v[0])}
    min={0.5}
    max={2}
    step={0.1}
  />
  <span>{speechRate}x</span>
</div>
```

**Benefícios:**
- Acessibilidade para deficientes visuais
- Multitarefa durante estudo
- Diferentes estilos de aprendizado

**Estimativa:** 6-8 horas

---

### 10. Temas Personalizáveis
**Problema:** Apenas 3 modos de leitura (light, sepia, dark).

**Solução:**
```typescript
interface CustomTheme {
  id: string
  name: string
  background: string
  text: string
  accent: string
  filter: string
}

const themes: CustomTheme[] = [
  { id: 'light', name: 'Claro', background: '#FFFFFF', text: '#1A1A1A', accent: '#F3C77A', filter: 'brightness(1.1)' },
  { id: 'sepia', name: 'Sépia', background: '#F4F1E8', text: '#5C4B37', accent: '#D4AF37', filter: 'sepia(20%)' },
  { id: 'dark', name: 'Escuro', background: '#1A1A1A', text: '#E5E5E5', accent: '#F3C77A', filter: 'brightness(0.9)' },
  { id: 'forest', name: 'Floresta', background: '#1B2B1F', text: '#C8E6C9', accent: '#4CAF50', filter: '' },
  { id: 'ocean', name: 'Oceano', background: '#0D1B2A', text: '#B8D4E8', accent: '#2196F3', filter: '' },
  { id: 'sunset', name: 'Pôr do Sol', background: '#2D1B16', text: '#FFCCBC', accent: '#FF5722', filter: '' },
]

// Permitir criar temas customizados
const [customThemes, setCustomThemes] = useState<CustomTheme[]>([])

const createCustomTheme = (theme: CustomTheme) => {
  setCustomThemes([...customThemes, theme])
  localStorage.setItem('custom-themes', JSON.stringify([...customThemes, theme]))
}
```

**Benefícios:**
- Personalização total
- Conforto visual para cada usuário
- Diferenciação de outros leitores

**Estimativa:** 8-10 horas

---

### 11. Modo de Comparação de Volumes
**Problema:** Usuários não podem comparar trechos de volumes diferentes lado a lado.

**Solução:**
```tsx
<div className="comparison-mode grid grid-cols-2 gap-4">
  <BibleDigitalReader
    pdfUrl={selectedPDF1.url}
    compact={true}
  />
  <BibleDigitalReader
    pdfUrl={selectedPDF2.url}
    compact={true}
  />
</div>
```

**Benefícios:**
- Estudo comparativo de volumes
- Análise paralela de textos
- Recurso avançado para estudantes

**Estimativa:** 12-16 horas

---

## 🔧 Melhorias Técnicas (Baixa Prioridade)

### 12. OCR para PDFs Escaneados
**Problema:** PDFs escaneados não podem ser convertidos para texto.

**Solução:**
```typescript
// app/api/ocr/route.ts
import Tesseract from 'tesseract.js'

export async function POST(request: NextRequest) {
  const { pdfUrl } = await request.json()

  // 1. Converter PDF para imagens
  const images = await pdfToImages(pdfUrl)

  // 2. Aplicar OCR em cada imagem
  const texts = []
  for (const image of images) {
    const { data: { text } } = await Tesseract.recognize(image, 'por')
    texts.push(text)
  }

  return NextResponse.json({
    success: true,
    text: texts.join('\n\n'),
    isOCR: true
  })
}
```

**Benefícios:**
- Suporte a todos os tipos de PDF
- Maior alcance de documentos
- Solução completa

**Estimativa:** 20-24 horas
**Custo:** Processamento OCR pode ser caro em escala

---

### 13. Autenticação e Perfis de Usuário
**Problema:** Sem identificação de usuários, dados não persistem entre dispositivos.

**Solução:**
```typescript
// Usar NextAuth.js ou Clerk
import { auth } from '@/lib/auth'

export default async function CoursePage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  // Carregar progresso do usuário do banco
  const progress = await db.progress.findMany({
    where: { userId: session.user.id }
  })
}
```

**Funcionalidades:**
- Login com Google, Facebook, Email
- Perfil do usuário
- Sincronização entre dispositivos
- Estatísticas personalizadas

**Estimativa:** 24-32 horas

---

### 14. Analytics e Métricas
**Problema:** Não sabemos como usuários interagem com o sistema.

**Solução:**
```typescript
// lib/analytics.ts
import { track } from '@/lib/analytics'

// Eventos para rastrear:
track('pdf_conversion_started', { courseId, pdfUrl })
track('pdf_conversion_completed', { courseId, duration, textLength })
track('reading_session_started', { courseId, mode: 'bible-digital' })
track('reading_session_ended', { courseId, duration, scrollDepth })
track('highlight_created', { courseId, color })
track('search_performed', { courseId, query })
```

**Métricas importantes:**
- Taxa de conversão de PDFs com sucesso/falha
- Modo mais usado (Original vs Bíblia Digital)
- Tempo médio de leitura por curso
- Cursos mais populares
- Taxa de abandono

**Estimativa:** 8-12 horas

---

### 15. Testes Automatizados
**Problema:** Mudanças podem quebrar funcionalidades existentes.

**Solução:**
```typescript
// __tests__/bible-digital-reader.test.tsx
import { render, screen } from '@testing-library/react'
import { BibleDigitalReader } from '@/components/bible-digital-reader'

describe('BibleDigitalReader', () => {
  it('should display loading state initially', () => {
    render(<BibleDigitalReader pdfUrl="test.pdf" courseId="1" />)
    expect(screen.getByText(/convertendo pdf/i)).toBeInTheDocument()
  })

  it('should display extracted text after conversion', async () => {
    render(<BibleDigitalReader pdfUrl="test.pdf" courseId="1" />)
    await waitFor(() => {
      expect(screen.getByText(/panorama bíblico/i)).toBeInTheDocument()
    })
  })
})

// __tests__/api/convert-pdf.test.ts
describe('PDF Conversion API', () => {
  it('should convert Google Drive URLs correctly', () => {
    const input = 'https://drive.google.com/file/d/ABC123/view'
    const output = convertGoogleDriveUrl(input)
    expect(output).toBe('https://drive.google.com/uc?export=download&id=ABC123')
  })
})
```

**Tipos de teste:**
- Unit tests (funções isoladas)
- Integration tests (componentes + API)
- E2E tests (fluxo completo do usuário)

**Estimativa:** 16-24 horas

---

## 📊 Priorização por Impacto vs Esforço

### Alto Impacto, Baixo Esforço (Fazer Primeiro)
1. ✅ Cache de PDFs (6h)
2. ✅ Lazy Loading (4h)
3. ✅ Indicador de Progresso (8h)
4. ✅ LocalStorage para progresso (6h)

### Alto Impacto, Alto Esforço (Planejar Bem)
1. Sistema de Busca (8h)
2. Notas e Highlights (16h)
3. Text-to-Speech (8h)
4. Autenticação + API (32h)

### Baixo Impacto, Baixo Esforço (Quick Wins)
1. Temas personalizáveis (10h)
2. Analytics básico (8h)

### Baixo Impacto, Alto Esforço (Evitar)
1. OCR (24h + custos)
2. Modo comparação (16h)

---

## 🎯 Roadmap Sugerido

### Sprint 1 (Semana 1-2) - Performance e Cache
- [ ] Sistema de cache para PDFs convertidos
- [ ] Lazy loading de componentes
- [ ] Indicador de progresso na conversão

### Sprint 2 (Semana 3-4) - Funcionalidades de Leitura
- [ ] Sistema de busca no texto
- [ ] LocalStorage para salvar progresso
- [ ] Melhorias na UI do leitor

### Sprint 3 (Semana 5-6) - Personalização
- [ ] Notas e highlights
- [ ] Temas customizáveis
- [ ] Text-to-Speech

### Sprint 4 (Semana 7-8) - Infraestrutura
- [ ] Autenticação de usuários
- [ ] API para sincronização
- [ ] Analytics e métricas

### Sprint 5 (Semana 9-10) - Qualidade
- [ ] Testes automatizados
- [ ] Service Worker (PWA)
- [ ] Otimizações finais

---

## 💡 Melhorias Rápidas (1-2 horas cada)

1. **Atalhos de Teclado**
   - `Ctrl/Cmd + F`: Buscar
   - `→`: Próxima página
   - `←`: Página anterior
   - `Ctrl/Cmd + D`: Adicionar bookmark
   - `Ctrl/Cmd + H`: Toggle highlights

2. **Estatísticas de Leitura**
   - Palavras por minuto
   - Tempo estimado restante
   - Progresso visual (% lido)

3. **Compartilhamento**
   - Botão para compartilhar citações
   - Compartilhar progresso nas redes sociais

4. **Melhorias de Acessibilidade**
   - Suporte a leitores de tela
   - Navegação completa por teclado
   - Alto contraste
   - ARIA labels adequados

5. **Exportação**
   - Exportar highlights como PDF
   - Exportar notas como Markdown
   - Enviar para Evernote/Notion

---

## 🚀 Como Implementar

Para cada melhoria:

1. **Criar branch**: `git checkout -b feature/nome-da-feature`
2. **Desenvolver** seguindo as especificações
3. **Testar** localmente
4. **Commit**: `git commit -m "feat: adiciona [feature]"`
5. **Push**: `git push origin feature/nome-da-feature`
6. **Pull Request** para review
7. **Merge** após aprovação
8. **Deploy** automático na Vercel

---

## 📈 Métricas de Sucesso

- **Performance**: Tempo de carregamento < 2s
- **Conversão**: Taxa de sucesso na conversão > 95%
- **Engajamento**: Tempo médio de sessão > 15min
- **Retenção**: Usuários retornam 3+ vezes
- **Satisfação**: NPS > 50

---

## 🎓 Recursos para Aprender

- **React Performance**: [web.dev/react](https://web.dev/react)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)
- **Tesseract.js**: [tesseract.projectnaptha.com](https://tesseract.projectnaptha.com/)
- **Web Speech API**: [developer.mozilla.org/docs/Web/API/Web_Speech_API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- **PWA**: [web.dev/progressive-web-apps](https://web.dev/progressive-web-apps/)
