"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Download, Upload, RefreshCw, CheckCircle, XCircle, BookOpen } from "lucide-react"

export default function SyncNotionPage() {
  const [notionContent, setNotionContent] = useState("")
  const [courses, setCourses] = useState<any[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null)

  const parseNotionContent = () => {
    setIsProcessing(true)
    setStatus(null)

    try {
      // Tentar parsear como JSON primeiro
      try {
        const parsed = JSON.parse(notionContent)
        setCourses(Array.isArray(parsed) ? parsed : [parsed])
        setStatus({ type: 'success', message: `${Array.isArray(parsed) ? parsed.length : 1} curso(s) importado(s) com sucesso!` })
        setIsProcessing(false)
        return
      } catch {
        // Se não for JSON, tentar extrair informações do texto
      }

      // Extrair cursos e PDFs do texto colado
      const lines = notionContent.split('\n').filter(line => line.trim())
      const parsedCourses: any[] = []
      let currentCourse: any = null
      let currentSection: string = ''

      for (const line of lines) {
        const trimmed = line.trim()

        // Ignorar linhas de navegação/menu
        if (trimmed.toLowerCase().includes('menu') ||
            trimmed.toLowerCase().includes('início') ||
            trimmed.toLowerCase().includes('notion.so') ||
            trimmed.length < 3) {
          continue
        }

        // Detectar seções principais (PANORAMA BÍBLICO, MAPAS MENTAIS, etc)
        if (trimmed === trimmed.toUpperCase() &&
            trimmed.length > 5 &&
            !trimmed.startsWith('http') &&
            !trimmed.includes('VOL') &&
            !trimmed.includes('PARTE')) {
          currentSection = trimmed
          continue
        }

        // Detectar início de novo curso
        // Pode ser uma linha que começa com emoji/número ou é um título destacado
        const isCourseTitle = (
          (trimmed.match(/^[📚📖📙📕📗📘🎓✝️⛪]/)) || // Começa com emoji
          (trimmed.match(/^\d+\./)) || // Começa com número
          (trimmed.length > 15 && trimmed.length < 150 && !trimmed.includes('drive.google.com') && !trimmed.includes('http')) // Título razoável
        )

        if (isCourseTitle) {
          if (currentCourse && currentCourse.pdfs.length > 0) {
            parsedCourses.push(currentCourse)
          }

          // Limpar emoji e numeração do título
          const cleanTitle = trimmed
            .replace(/^[📚📖📙📕📗📘🎓✝️⛪]\s*/, '')
            .replace(/^\d+\.\s*/, '')
            .trim()

          currentCourse = {
            title: cleanTitle,
            description: '',
            pdfs: [],
            author: 'Pr. Welliton Alves Dos Santos',
            category: currentSection || 'Estudo Bíblico',
            coverUrl: '/bible-study-books-collection.jpg'
          }
        }
        // Detectar URLs do Google Drive (vários formatos)
        else if (trimmed.includes('drive.google.com')) {
          if (currentCourse) {
            // Tentar extrair título do volume antes do link (pode estar na mesma linha)
            const volumeMatch = trimmed.match(/^([^http]+)(https?:\/\/)/)
            const volumeTitle = volumeMatch ? volumeMatch[1].trim() : null

            // Extrair ID do arquivo do Google Drive
            const urlMatch = trimmed.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/)
            if (urlMatch) {
              const fileId = urlMatch[1]

              // Detectar formato de volume (VOL-I, VOL-II, etc ou Parte 01, etc)
              let volume = `VOL-${currentCourse.pdfs.length + 1}`
              if (volumeTitle) {
                if (volumeTitle.match(/VOL[- ]?[IVX\d]+/i)) {
                  volume = volumeTitle.match(/VOL[- ]?[IVX\d]+/i)![0]
                } else if (volumeTitle.match(/PARTE\s*\d+/i)) {
                  volume = volumeTitle.match(/PARTE\s*\d+/i)![0]
                } else {
                  volume = volumeTitle
                }
              }

              currentCourse.pdfs.push({
                volume: volume.toUpperCase(),
                title: volumeTitle || `Volume ${currentCourse.pdfs.length + 1}`,
                url: `https://drive.google.com/file/d/${fileId}/preview`
              })
            }
          }
        }
        // Detectar volume separado (linha antes do link)
        else if (currentCourse && trimmed.match(/^(VOL[- ]?[IVX\d]+|PARTE\s*\d+|Volume\s*\d+)/i)) {
          // Guardar para o próximo link
          currentCourse._nextVolume = trimmed
        }
        // Detectar descrição (linhas normais de texto, não muito curtas, não muito longas)
        else if (currentCourse && !currentCourse.description && trimmed.length > 20 && trimmed.length < 500) {
          currentCourse.description = trimmed
        }
      }

      if (currentCourse) {
        parsedCourses.push(currentCourse)
      }

      if (parsedCourses.length > 0) {
        // Gerar IDs e slugs
        const coursesWithIds = parsedCourses.map(course => ({
          ...course,
          id: course.title
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, ''),
          slug: course.title
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, ''),
          readingTimeMinutes: course.pdfs.length * 30,
          pages: course.pdfs.length * 20
        }))

        setCourses(coursesWithIds)
        setStatus({ type: 'success', message: `${coursesWithIds.length} curso(s) extraído(s) com sucesso!` })
      } else {
        setStatus({ type: 'error', message: 'Não foi possível extrair cursos do texto fornecido.' })
      }
    } catch (error) {
      console.error('Erro ao processar conteúdo:', error)
      setStatus({ type: 'error', message: 'Erro ao processar o conteúdo. Verifique o formato.' })
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadCoursesFile = () => {
    const fileContent = `// Auto-gerado via Admin Sync em ${new Date().toISOString()}
export interface CoursePDF {
  volume: string
  title: string
  url: string
  pages?: number
  readingTimeMinutes?: number
}

export interface Course {
  id: string
  slug: string
  title: string
  description: string
  readingTimeMinutes: number
  coverUrl: string
  author?: string
  pages?: number
  category?: string
  pdfs: CoursePDF[]
}

export const courses: Course[] = ${JSON.stringify(courses, null, 2)}

export function getCourseById(id: string): Course | undefined {
  return courses.find((course) => course.id === id || course.slug === id)
}
`

    const blob = new Blob([fileContent], { type: 'text/typescript' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'courses-data.ts'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    setStatus({ type: 'success', message: 'Arquivo courses-data.ts baixado! Substitua o arquivo em lib/courses-data.ts' })
  }

  const copyToClipboard = () => {
    const json = JSON.stringify(courses, null, 2)
    navigator.clipboard.writeText(json)
    setStatus({ type: 'info', message: 'JSON copiado para a área de transferência!' })
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Sincronizar Cursos do Notion</h1>
          <p className="text-muted-foreground">
            Cole o conteúdo da página do Notion para extrair automaticamente os cursos e PDFs
          </p>
        </div>

        {/* Card de Instruções */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Como usar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Opção 1: Copiar da Página do Notion</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Abra a página do Notion: <a href="https://rich-ixia-528.notion.site/IN-CIO-181c2132576a80af830ec69cd14227cc" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Link do Notion</a></li>
                <li>Selecione TODO o conteúdo da página (Ctrl+A ou Cmd+A)</li>
                <li>Copie (Ctrl+C ou Cmd+C)</li>
                <li>Cole na caixa de texto abaixo</li>
                <li>Clique em "Processar Conteúdo"</li>
              </ol>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Opção 2: Cole manualmente no formato</h3>
              <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
{`NOME DO CURSO EM MAIÚSCULAS
Descrição do curso aqui
https://drive.google.com/file/d/FILE_ID1/view
https://drive.google.com/file/d/FILE_ID2/view

OUTRO CURSO EM MAIÚSCULAS
Descrição do outro curso
https://drive.google.com/file/d/FILE_ID3/view`}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Status Messages */}
        {status && (
          <Alert variant={status.type === 'error' ? 'destructive' : 'default'}>
            {status.type === 'success' && <CheckCircle className="h-4 w-4" />}
            {status.type === 'error' && <XCircle className="h-4 w-4" />}
            <AlertDescription>{status.message}</AlertDescription>
          </Alert>
        )}

        {/* Input Area */}
        <Card>
          <CardHeader>
            <CardTitle>Cole o Conteúdo do Notion</CardTitle>
            <CardDescription>
              Cole todo o texto da página do Notion aqui
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={notionContent}
              onChange={(e) => setNotionContent(e.target.value)}
              placeholder="Cole o conteúdo aqui..."
              className="min-h-[300px] font-mono text-sm"
            />
            <div className="flex gap-2">
              <Button
                onClick={parseNotionContent}
                disabled={!notionContent || isProcessing}
                className="flex-1"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isProcessing ? 'animate-spin' : ''}`} />
                {isProcessing ? 'Processando...' : 'Processar Conteúdo'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setNotionContent('')}
              >
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview dos Cursos Extraídos */}
        {courses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Cursos Extraídos ({courses.length})</span>
                <div className="flex gap-2">
                  <Button onClick={copyToClipboard} variant="outline" size="sm">
                    <Upload className="mr-2 h-4 w-4" />
                    Copiar JSON
                  </Button>
                  <Button onClick={downloadCoursesFile} size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Baixar courses-data.ts
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {courses.map((course, idx) => (
                  <Card key={idx} className="bg-muted/50">
                    <CardHeader>
                      <CardTitle className="text-lg">{course.title}</CardTitle>
                      <CardDescription>{course.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div><strong>ID:</strong> {course.id}</div>
                          <div><strong>Categoria:</strong> {course.category}</div>
                          <div><strong>Autor:</strong> {course.author}</div>
                          <div><strong>PDFs:</strong> {course.pdfs.length} volume(s)</div>
                        </div>
                        {course.pdfs.length > 0 && (
                          <div className="mt-4">
                            <h4 className="font-semibold text-sm mb-2">Volumes:</h4>
                            <ul className="space-y-1">
                              {course.pdfs.map((pdf: any, pdfIdx: number) => (
                                <li key={pdfIdx} className="text-xs text-muted-foreground flex items-center gap-2">
                                  <span className="font-mono bg-muted px-2 py-1 rounded">{pdf.volume}</span>
                                  <span className="flex-1 truncate">{pdf.title}</span>
                                  <a
                                    href={pdf.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                  >
                                    Link
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preview JSON */}
        {courses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Preview JSON</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto max-h-96">
                {JSON.stringify(courses, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
