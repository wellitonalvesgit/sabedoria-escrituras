"use client"

import { useState, useEffect } from "react"
import { use } from "react"
import { ArrowLeft, Save, Plus, Trash2, Edit, Eye, FileText, Upload, Download, Loader2, Copy, ArrowUp, ArrowDown, Gift, Youtube, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { PDFUpload } from "@/components/pdf-upload"
import { GoogleDriveLink } from "@/components/google-drive-link"
import { ImageUpload } from "@/components/image-upload"
import { CategorySelector } from "@/components/category-selector"
import { VolumeCoverUpload } from "@/components/volume-cover-upload"
import { YouTubeUrlManager } from "@/components/youtube-url-manager"
import Link from "next/link"

interface CoursePDF {
  id: string
  volume: string
  title: string
  url: string
  pages?: number
  reading_time_minutes?: number
  text_content?: string
  use_auto_conversion?: boolean
  display_order: number
  cover_url?: string
  youtube_url?: string
}

interface Course {
  id: string
  slug: string
  title: string
  description: string
  author?: string
  category?: string
  pages?: number
  reading_time_minutes?: number
  cover_url?: string
  status: string
  created_at: string
  course_pdfs: CoursePDF[]
  is_free?: boolean
}

export default function AdminEditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = use(params)
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [editedCourse, setEditedCourse] = useState({
    title: "",
    description: "",
    author: "",
    category: "",
    reading_time_minutes: 0,
    pages: 0,
    cover_url: "",
    is_free: false,
    status: "published"
  })

  const [editingPDF, setEditingPDF] = useState<string | null>(null)
  const [editingPDFData, setEditingPDFData] = useState<CoursePDF | null>(null)
  const [newPDF, setNewPDF] = useState({
    volume: "",
    title: "",
    url: "",
    pages: 0,
    reading_time_minutes: 0,
    text_content: "",
    use_auto_conversion: true
  })

  const [showTextConfig, setShowTextConfig] = useState<number | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  useEffect(() => {
    fetchCourse()
  }, [courseId])

  const fetchCourse = async () => {
    try {
      setLoading(true)
      console.log('Buscando curso com ID:', courseId)

      // Usar API com parâmetro admin=true para buscar todos os cursos, independente do status
      const response = await fetch(`/api/courses/${courseId}?admin=true`, {
        credentials: 'include' // Incluir cookies na requisição
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Curso não encontrado')
      }

      const { course } = await response.json()
      
      console.log('Curso encontrado:', course)
      
      if (!course) {
        throw new Error('Dados do curso não encontrados')
      }
      
      setCourse(course)
      setEditedCourse({
        title: course.title,
        description: course.description,
        author: course.author || "",
        category: course.category || "",
        reading_time_minutes: course.reading_time_minutes || 0,
        pages: course.pages || 0,
        cover_url: course.cover_url || "",
        is_free: course.is_free || false,
        status: course.status || "published"
      })
      
      // Carregar categorias do curso
      if (course.course_categories) {
        setSelectedCategories(course.course_categories.map((cc: any) => cc.category_id))
      }
    } catch (err) {
      console.error('Erro ao buscar curso:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Carregando curso...</span>
        </div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Curso não encontrado</h1>
          <p className="text-muted-foreground mb-4">{error || 'O curso solicitado não existe'}</p>
          <Link href="/admin/courses">
            <Button className="hover:bg-primary/90">Voltar aos Cursos</Button>
          </Link>
        </div>
      </div>
    )
  }

  const handleSave = async () => {
    try {
      console.log('🔄 Iniciando salvamento do curso...')
      console.log('📝 Dados do curso:', editedCourse)
      console.log('🏷️ Categorias selecionadas:', selectedCategories)

      // Salvar curso via API (server-side com SERVICE_ROLE_KEY)
      // IMPORTANTE: incluir credentials para enviar cookies de autenticação
      const courseResponse = await fetch(`/api/courses/${courseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Incluir cookies na requisição
        body: JSON.stringify(editedCourse)
      })

      if (!courseResponse.ok) {
        const courseResult = await courseResponse.json()
        throw new Error('Erro ao salvar curso: ' + (courseResult.error || 'Erro desconhecido'))
      }

      console.log('✅ Curso salvo com sucesso')

      // Atualizar categorias via API (server-side com SERVICE_ROLE_KEY)
      console.log('🔄 Salvando categorias via API...')
      const categoriesResponse = await fetch(`/api/courses/${courseId}/categories`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Incluir cookies na requisição
        body: JSON.stringify({
          categoryIds: selectedCategories
        })
      })

      const categoriesResult = await categoriesResponse.json()

      if (!categoriesResponse.ok) {
        console.error('❌ Erro ao salvar categorias:', categoriesResult)
        throw new Error('Erro ao salvar categorias: ' + (categoriesResult.error || 'Erro desconhecido'))
      }

      console.log('✅ Categorias salvas:', categoriesResult)

      alert("Curso salvo com sucesso!")
      await fetchCourse() // Recarregar dados
    } catch (err) {
      console.error('❌ Erro geral ao salvar:', err)
      alert('Erro ao salvar curso: ' + (err instanceof Error ? err.message : 'Erro desconhecido'))
    }
  }

  const handleAddPDF = async () => {
    try {
      // Adicionar PDF via API (server-side com SERVICE_ROLE_KEY)
      const response = await fetch(`/api/courses/${courseId}/pdfs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Incluir cookies na requisição
        body: JSON.stringify(newPDF)
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Erro ao adicionar PDF')
      }

      alert("PDF adicionado com sucesso!")
      setNewPDF({
        volume: "",
        title: "",
        url: "",
        pages: 0,
        reading_time_minutes: 0,
        text_content: "",
        use_auto_conversion: true
      })
      await fetchCourse() // Recarregar dados
    } catch (err) {
      alert('Erro ao adicionar PDF: ' + (err instanceof Error ? err.message : 'Erro desconhecido'))
    }
  }

  const handleEditPDF = (pdf: CoursePDF) => {
    setEditingPDF(pdf.id)
    setEditingPDFData({ ...pdf })
  }

  const handleSavePDF = async () => {
    if (!editingPDFData) return

    try {
      // Atualizar PDF via API (server-side com SERVICE_ROLE_KEY)
      const response = await fetch(`/api/courses/${courseId}/pdfs/${editingPDF}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Incluir cookies na requisição
        body: JSON.stringify({
          volume: editingPDFData.volume,
          title: editingPDFData.title,
          url: editingPDFData.url,
          pages: editingPDFData.pages,
          reading_time_minutes: editingPDFData.reading_time_minutes,
          text_content: editingPDFData.text_content,
          use_auto_conversion: editingPDFData.use_auto_conversion,
          cover_url: editingPDFData.cover_url || null
        })
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Erro ao salvar PDF')
      }

      alert("PDF atualizado com sucesso!")
      setEditingPDF(null)
      setEditingPDFData(null)
      await fetchCourse() // Recarregar dados
    } catch (err) {
      alert('Erro ao atualizar PDF: ' + (err instanceof Error ? err.message : 'Erro desconhecido'))
    }
  }

  const handleCancelEdit = () => {
    setEditingPDF(null)
    setEditingPDFData(null)
  }

  const handleDuplicatePDF = async (pdf: CoursePDF) => {
    try {
      // Duplicar PDF via API (server-side com SERVICE_ROLE_KEY)
      const duplicatedPDF = {
        volume: pdf.volume + '-COPY',
        title: pdf.title + ' (Cópia)',
        url: pdf.url,
        pages: pdf.pages,
        reading_time_minutes: pdf.reading_time_minutes,
        text_content: pdf.text_content,
        use_auto_conversion: pdf.use_auto_conversion,
        cover_url: pdf.cover_url
      }

      const response = await fetch(`/api/courses/${courseId}/pdfs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Incluir cookies na requisição
        body: JSON.stringify(duplicatedPDF)
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Erro ao duplicar PDF')
      }

      alert("PDF duplicado com sucesso!")
      await fetchCourse() // Recarregar dados
    } catch (err) {
      alert('Erro ao duplicar PDF: ' + (err instanceof Error ? err.message : 'Erro desconhecido'))
    }
  }

  const handleMovePDF = async (pdfId: string, direction: 'up' | 'down') => {
    try {
      const currentIndex = course.course_pdfs.findIndex(pdf => pdf.id === pdfId)
      if (currentIndex === -1) return

      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
      if (newIndex < 0 || newIndex >= course.course_pdfs.length) return

      const updatedPDFs = [...course.course_pdfs]
      const [movedPDF] = updatedPDFs.splice(currentIndex, 1)
      updatedPDFs.splice(newIndex, 0, movedPDF)

      // Atualizar display_order de cada PDF via API
      for (const [index, pdf] of updatedPDFs.entries()) {
        const response = await fetch(`/api/courses/${courseId}/pdfs/${pdf.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            volume: pdf.volume,
            title: pdf.title,
            url: pdf.url,
            pages: pdf.pages,
            reading_time_minutes: pdf.reading_time_minutes,
            text_content: pdf.text_content,
            use_auto_conversion: pdf.use_auto_conversion,
            cover_url: pdf.cover_url,
            display_order: index
          })
        })

        if (!response.ok) {
          throw new Error('Erro ao reordenar PDF')
        }
      }

      await fetchCourse() // Recarregar dados
    } catch (err) {
      alert('Erro ao reordenar PDF: ' + (err instanceof Error ? err.message : 'Erro desconhecido'))
    }
  }

  const handleDeletePDF = async (pdfId: string) => {
    const pdf = course.course_pdfs.find(p => p.id === pdfId)
    if (!confirm(`Você tem certeza que deseja remover o PDF "${pdf?.title}"?\n\nEsta ação não pode ser desfeita.`)) return

    try {
      // Remover PDF via API (server-side com SERVICE_ROLE_KEY)
      const response = await fetch(`/api/courses/${courseId}/pdfs/${pdfId}`, {
        method: 'DELETE',
        credentials: 'include' // Incluir cookies na requisição
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Erro ao remover PDF')
      }

      alert("PDF removido com sucesso!")
      await fetchCourse() // Recarregar dados
    } catch (err) {
      alert('Erro ao remover PDF: ' + (err instanceof Error ? err.message : 'Erro desconhecido'))
    }
  }

  const handleTextFileUpload = (file: File, pdfIndex: number | 'new') => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      if (pdfIndex === 'new') {
        setNewPDF(prev => ({ ...prev, text_content: text }))
      } else {
        // Aqui será implementada a edição do PDF existente quando conectado ao Supabase
        console.log(`Texto carregado para PDF ${pdfIndex}:`, text.substring(0, 100))
      }
    }
    reader.readAsText(file)
  }

  const handleImageUpload = async (file: File) => {
    try {
      console.log('🔄 Iniciando upload da capa...')
      console.log('📁 Arquivo:', file.name, file.size, file.type)
      
      // Fazer upload da imagem via API
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'cover')
      formData.append('courseId', courseId)

      console.log('📤 Enviando para API de upload...')
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()
      console.log('📥 Resposta da API:', result)

      if (!result.success) {
        throw new Error(result.error)
      }

      console.log('✅ Upload realizado, URL:', result.fileUrl)

      // Atualizar o curso com nova capa
      setEditedCourse(prev => ({ ...prev, cover_url: result.fileUrl }))
      
      // Salvar automaticamente no banco de dados
      console.log('💾 Salvando no banco de dados...')
      
      const saveResponse = await fetch(`/api/courses/${courseId}/cover`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Incluir cookies na requisição
        body: JSON.stringify({
          courseId,
          coverUrl: result.fileUrl
        })
      })

      const saveResult = await saveResponse.json()
      
      if (!saveResult.success) {
        console.error('❌ Erro ao salvar no banco:', saveResult.error)
        throw new Error('Erro ao salvar capa no banco: ' + saveResult.error)
      }
      
      console.log('✅ Capa salva no banco com sucesso!')
      alert("Capa atualizada com sucesso!")
      await fetchCourse() // Recarregar dados
    } catch (err) {
      console.error('❌ Erro no upload:', err)
      alert('Erro ao fazer upload da capa: ' + (err as Error).message)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/40 bg-background/95 backdrop-blur-xl fixed top-0 left-0 right-0 z-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/admin/courses" className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
                  <Edit className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-semibold tracking-tight">Editar Curso</span>
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/admin/courses">
                <Button variant="outline" size="sm" className="hover:bg-accent hover:text-accent-foreground hover:border-accent-foreground/20">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar aos Cursos
                </Button>
              </Link>
              <Link href={`/course/${courseId}`}>
                <Button variant="outline" size="sm" className="hover:bg-accent hover:text-accent-foreground hover:border-accent-foreground/20">
                  <Eye className="mr-2 h-4 w-4" />
                  Visualizar
                </Button>
              </Link>
              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Salvar Alterações
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 pt-24 pb-8 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Editar Curso</h1>
          <p className="text-muted-foreground">Modifique as informações do curso e gerencie os PDFs</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Course Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Curso</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Título do Curso</Label>
                  <Input
                    id="title"
                    value={editedCourse.title}
                    onChange={(e) => setEditedCourse(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="author">Autor</Label>
                  <Input
                    id="author"
                    value={editedCourse.author}
                    onChange={(e) => setEditedCourse(prev => ({ ...prev, author: e.target.value }))}
                  />
                </div>

                <div>
                  <Label>Categorias</Label>
                  <CategorySelector
                    selectedCategories={selectedCategories}
                    onChange={setSelectedCategories}
                    multiple={true}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Selecione uma ou mais categorias para este curso
                  </p>
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={editedCourse.description}
                    onChange={(e) => setEditedCourse(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <Gift className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <Label htmlFor="is_free" className="text-sm font-medium cursor-pointer">
                        Curso Gratuito
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Disponível para todos, sem necessidade de assinatura
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="is_free"
                    checked={editedCourse.is_free || false}
                    onCheckedChange={(checked) => setEditedCourse(prev => ({ ...prev, is_free: checked }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="pages">Total de Páginas</Label>
                    <Input
                      id="pages"
                      type="number"
                      value={editedCourse.pages}
                      onChange={(e) => setEditedCourse(prev => ({ ...prev, pages: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="readingTime">Tempo de Leitura (min)</Label>
                    <Input
                      id="readingTime"
                      type="number"
                      value={editedCourse.reading_time_minutes}
                      onChange={(e) => setEditedCourse(prev => ({ ...prev, reading_time_minutes: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cover Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Capa do Curso</CardTitle>
              </CardHeader>
              <CardContent>
                <ImageUpload
                  onImageSelect={handleImageUpload}
                  currentImageUrl={editedCourse.cover_url}
                />
              </CardContent>
            </Card>

            {/* PDFs Management */}
            <Card>
              <CardHeader>
                <CardTitle>Gerenciar PDFs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {course.course_pdfs.map((pdf, index) => (
                    <div key={pdf.id} className={`border rounded-lg overflow-hidden transition-all ${
                      editingPDF === pdf.id 
                        ? 'border-primary bg-primary/5 shadow-lg' 
                        : 'border-border hover:border-primary/50'
                    }`}>
                      {editingPDF === pdf.id ? (
                        // Modo de Edição
                        <div className="p-4 bg-card">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">Editando PDF</h4>
                              <div className="flex gap-2">
                                <Button size="sm" onClick={handleSavePDF}>
                                  <Save className="h-4 w-4 mr-1" />
                                  Salvar
                                </Button>
                                <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor={`edit-volume-${pdf.id}`}>Volume</Label>
                                <Input
                                  id={`edit-volume-${pdf.id}`}
                                  value={editingPDFData?.volume || ''}
                                  onChange={(e) => setEditingPDFData(prev => prev ? { ...prev, volume: e.target.value } : null)}
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor={`edit-title-${pdf.id}`}>Título</Label>
                                <Input
                                  id={`edit-title-${pdf.id}`}
                                  value={editingPDFData?.title || ''}
                                  onChange={(e) => setEditingPDFData(prev => prev ? { ...prev, title: e.target.value } : null)}
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor={`edit-url-${pdf.id}`}>URL do Google Drive</Label>
                                <Input
                                  id={`edit-url-${pdf.id}`}
                                  value={editingPDFData?.url || ''}
                                  onChange={(e) => setEditingPDFData(prev => prev ? { ...prev, url: e.target.value } : null)}
                                />
                              </div>
                              
                              {/* Upload de PDF para edição */}
                              <div className="md:col-span-2">
                                <Label>Upload de PDF ou TXT</Label>
                                <PDFUpload
                                  onFileSelect={(file) => {
                                    if (file.type === 'application/pdf') {
                                      // Simular upload para obter URL temporária local
                                      const tempUrl = URL.createObjectURL(file)
                                      setEditingPDFData(prev => prev ? { ...prev, url: tempUrl } : null)
                                      alert("PDF selecionado! (URL temporária gerada. Em uma implementação real, o PDF seria enviado para um serviço de armazenamento como o Supabase Storage e a URL permanente seria salva.)")
                                    }
                                    // Para arquivos TXT, onTextExtract irá lidar com o conteúdo
                                  }}
                                  onTextExtract={(text) => {
                                    setEditingPDFData(prev => prev ? { ...prev, text_content: text } : null)
                                    alert("Texto extraído do arquivo para o modo Kindle.")
                                  }}
                                />
                              </div>

                              {/* Upload de Capa do Volume */}
                              <div className="md:col-span-2">
                                <Label>Capa do Volume (Opcional)</Label>
                                <div className="flex items-start gap-4">
                                  {editingPDFData?.cover_url && (
                                    <div className="flex-shrink-0">
                                      <img
                                        src={editingPDFData.cover_url}
                                        alt="Capa do volume"
                                        className="w-24 h-32 object-cover rounded border"
                                      />
                                    </div>
                                  )}
                                  <div className="flex-1">
                                    <ImageUpload
                                      onFileSelect={async (file) => {
                                        try {
                                          console.log('🔄 Iniciando upload da capa do volume...')
                                          console.log('📁 Arquivo:', file.name, file.size, file.type)
                                          
                                          // Upload da capa
                                          const formData = new FormData()
                                          formData.append('file', file)
                                          formData.append('type', 'cover')
                                          formData.append('courseId', courseId)

                                          console.log('📤 Enviando para API de upload...')
                                          const response = await fetch('/api/upload', {
                                            method: 'POST',
                                            body: formData,
                                          })

                                          const result = await response.json()
                                          console.log('📥 Resposta da API:', result)

                                          if (result.success) {
                                            console.log('✅ Upload realizado, URL:', result.fileUrl)
                                            
                                            // Atualizar o estado local
                                            setEditingPDFData(prev => prev ? { ...prev, cover_url: result.fileUrl } : null)
                                            
                                            // Salvar automaticamente no banco de dados
                                            console.log('💾 Salvando capa do volume no banco de dados...')
                                            
                                            const saveResponse = await fetch(`/api/course-pdfs/${pdf.id}/cover`, {
                                              method: 'PUT',
                                              headers: {
                                                'Content-Type': 'application/json'
                                              },
                                              credentials: 'include', // Incluir cookies na requisição
                                              body: JSON.stringify({
                                                coverUrl: result.fileUrl
                                              })
                                            })

                                            const saveResult = await saveResponse.json()
                                            
                                            if (!saveResult.success) {
                                              console.error('❌ Erro ao salvar no banco:', saveResult.error)
                                              throw new Error('Erro ao salvar capa no banco: ' + saveResult.error)
                                            }
                                            
                                            console.log('✅ Capa do volume salva no banco com sucesso!')
                                            alert("Capa do volume atualizada com sucesso!")
                                          } else {
                                            throw new Error(result.error)
                                          }
                                        } catch (error) {
                                          console.error('❌ Erro no upload:', error)
                                          alert("Erro ao fazer upload da capa: " + (error as Error).message)
                                        }
                                      }}
                                      currentImageUrl={editingPDFData?.cover_url}
                                    />
                                    {editingPDFData?.cover_url && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-2"
                                        onClick={() => setEditingPDFData(prev => prev ? { ...prev, cover_url: undefined } : null)}
                                      >
                                        Remover Capa
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label htmlFor={`edit-pages-${pdf.id}`}>Páginas</Label>
                                  <Input
                                    id={`edit-pages-${pdf.id}`}
                                    type="number"
                                    value={editingPDFData?.pages || 0}
                                    onChange={(e) => setEditingPDFData(prev => prev ? { ...prev, pages: parseInt(e.target.value) || 0 } : null)}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor={`edit-minutes-${pdf.id}`}>Minutos</Label>
                                  <Input
                                    id={`edit-minutes-${pdf.id}`}
                                    type="number"
                                    value={editingPDFData?.reading_time_minutes || 0}
                                    onChange={(e) => setEditingPDFData(prev => prev ? { ...prev, reading_time_minutes: parseInt(e.target.value) || 0 } : null)}
                                  />
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <Label htmlFor={`edit-text-${pdf.id}`}>Texto para Modo Kindle</Label>
                              <Textarea
                                id={`edit-text-${pdf.id}`}
                                value={editingPDFData?.text_content || ''}
                                onChange={(e) => setEditingPDFData(prev => prev ? { ...prev, text_content: e.target.value } : null)}
                                rows={4}
                                placeholder="Cole o texto extraído do PDF para o modo Kindle..."
                              />
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Switch
                                id={`edit-auto-${pdf.id}`}
                                checked={editingPDFData?.use_auto_conversion !== false}
                                onCheckedChange={(checked) => setEditingPDFData(prev => prev ? { ...prev, use_auto_conversion: checked } : null)}
                              />
                              <Label htmlFor={`edit-auto-${pdf.id}`}>
                                Usar conversão automática de PDF
                              </Label>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Modo de Visualização
                      <div className="flex items-center justify-between p-4 bg-card">
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary">{pdf.volume}</Badge>
                          <div>
                            <p className="font-medium text-sm">{pdf.title}</p>
                            <p className="text-xs text-muted-foreground">
                                {pdf.pages} páginas • {pdf.reading_time_minutes} min
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowTextConfig(showTextConfig === index ? null : index)}
                            className="border-[#F3C77A] text-[#F3C77A] hover:bg-[#F3C77A] hover:text-black"
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Texto Kindle
                          </Button>
                            
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMovePDF(pdf.id, 'up')}
                                disabled={index === 0}
                                title="Mover para cima"
                              >
                                <ArrowUp className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMovePDF(pdf.id, 'down')}
                                disabled={index === course.course_pdfs.length - 1}
                                title="Mover para baixo"
                              >
                                <ArrowDown className="h-4 w-4" />
                              </Button>
                            </div>
                            
                          <Button
                            variant="outline"
                            size="sm"
                              onClick={() => handleEditPDF(pdf)}
                              title="Editar PDF"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                              onClick={() => handleDuplicatePDF(pdf)}
                              title="Duplicar PDF"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeletePDF(pdf.id)}
                            className="text-destructive hover:text-destructive"
                              title="Deletar PDF"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      )}

                      {/* Text Configuration Panel */}
                      {showTextConfig === index && (
                        <div className="p-4 border-t border-border bg-muted/20">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <Label className="text-base font-semibold">Configuração do Modo Kindle</Label>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Configure como o texto será exibido no modo de leitura Kindle
                                </p>
                              </div>
                              <Badge variant={pdf.use_auto_conversion !== false ? "default" : "secondary"}>
                                {pdf.text_content ? "Texto configurado" : "Não configurado"}
                              </Badge>
                            </div>

                            <div className="flex items-center space-x-2 p-3 bg-background rounded-lg border border-border">
                              <Switch
                                id={`auto-${index}`}
                                checked={pdf.use_auto_conversion !== false}
                                onCheckedChange={async (checked) => {
                                  try {
                                    // Atualizar configuração via API (server-side com SERVICE_ROLE_KEY)
                                    const response = await fetch(`/api/courses/${courseId}/pdfs/${pdf.id}`, {
                                      method: 'PUT',
                                      headers: {
                                        'Content-Type': 'application/json'
                                      },
                                      credentials: 'include', // Incluir cookies na requisição
                                      body: JSON.stringify({
                                        volume: pdf.volume,
                                        title: pdf.title,
                                        url: pdf.url,
                                        pages: pdf.pages,
                                        reading_time_minutes: pdf.reading_time_minutes,
                                        text_content: pdf.text_content,
                                        use_auto_conversion: checked,
                                        cover_url: pdf.cover_url || null
                                      })
                                    })

                                    if (!response.ok) {
                                      throw new Error('Erro ao atualizar configuração')
                                    }

                                    await fetchCourse() // Recarregar dados
                                  } catch (err) {
                                    alert('Erro ao atualizar configuração')
                                  }
                                }}
                              />
                              <Label htmlFor={`auto-${index}`} className="cursor-pointer">
                                <span className="font-medium">Conversão automática de PDF</span>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {pdf.use_auto_conversion !== false
                                    ? "O sistema tentará extrair o texto automaticamente do PDF"
                                    : "Use texto manual configurado abaixo"}
                                </p>
                              </Label>
                            </div>

                            <div>
                              <Label htmlFor={`text-${index}`}>Texto Manual (Opcional)</Label>
                              <Textarea
                                id={`text-${index}`}
                                placeholder="Cole o texto extraído do PDF ou deixe vazio para usar conversão automática..."
                                value={pdf.text_content || ""}
                                onChange={async (e) => {
                                  try {
                                    // Atualizar texto via API (server-side com SERVICE_ROLE_KEY)
                                    const response = await fetch(`/api/courses/${courseId}/pdfs/${pdf.id}`, {
                                      method: 'PUT',
                                      headers: {
                                        'Content-Type': 'application/json'
                                      },
                                      credentials: 'include', // Incluir cookies na requisição
                                      body: JSON.stringify({
                                        volume: pdf.volume,
                                        title: pdf.title,
                                        url: pdf.url,
                                        pages: pdf.pages,
                                        reading_time_minutes: pdf.reading_time_minutes,
                                        text_content: e.target.value,
                                        use_auto_conversion: pdf.use_auto_conversion,
                                        cover_url: pdf.cover_url || null
                                      })
                                    })

                                    if (!response.ok) {
                                      throw new Error('Erro ao salvar texto')
                                    }

                                    await fetchCourse() // Recarregar dados
                                  } catch (err) {
                                    alert('Erro ao salvar texto')
                                  }
                                }}
                                rows={8}
                                className="font-mono text-sm mt-2"
                              />
                              <p className="text-xs text-muted-foreground mt-2">
                                {pdf.text_content
                                  ? `${pdf.text_content.length} caracteres configurados`
                                  : "Nenhum texto manual configurado"}
                              </p>
                            </div>

                            <div className="flex gap-2">
                              <label className="flex-1">
                                <input
                                  type="file"
                                  accept=".txt"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) handleTextFileUpload(file, index)
                                  }}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="w-full"
                                  onClick={(e) => {
                                    const input = e.currentTarget.parentElement?.querySelector('input[type="file"]') as HTMLInputElement
                                    input?.click()
                                  }}
                                >
                                  <Upload className="mr-2 h-4 w-4" />
                                  Importar arquivo TXT
                                </Button>
                              </label>
                              <Button
                                variant="outline"
                                onClick={async () => {
                                  try {
                                    // Limpar texto via API (server-side com SERVICE_ROLE_KEY)
                                    const response = await fetch(`/api/courses/${courseId}/pdfs/${pdf.id}`, {
                                      method: 'PUT',
                                      headers: {
                                        'Content-Type': 'application/json'
                                      },
                                      credentials: 'include', // Incluir cookies na requisição
                                      body: JSON.stringify({
                                        volume: pdf.volume,
                                        title: pdf.title,
                                        url: pdf.url,
                                        pages: pdf.pages,
                                        reading_time_minutes: pdf.reading_time_minutes,
                                        text_content: null,
                                        use_auto_conversion: pdf.use_auto_conversion,
                                        cover_url: pdf.cover_url || null
                                      })
                                    })

                                    if (!response.ok) {
                                      throw new Error('Erro ao limpar texto')
                                    }

                                    await fetchCourse() // Recarregar dados
                                  } catch (err) {
                                    alert('Erro ao limpar texto')
                                  }
                                }}
                                disabled={!pdf.text_content}
                              >
                                Limpar Texto
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add New PDF */}
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                    <h4 className="font-medium mb-4">Adicionar Novo PDF</h4>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Informações Básicas */}
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="volume">Volume</Label>
                      <Input
                            id="volume"
                            placeholder="ex: VOL-VII"
                        value={newPDF.volume}
                        onChange={(e) => setNewPDF(prev => ({ ...prev, volume: e.target.value }))}
                      />
                        </div>
                        
                        <div>
                          <Label htmlFor="title">Título do PDF</Label>
                      <Input
                            id="title"
                        placeholder="Título do PDF"
                        value={newPDF.title}
                        onChange={(e) => setNewPDF(prev => ({ ...prev, title: e.target.value }))}
                      />
                    </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="pages">Páginas</Label>
                      <Input
                              id="pages"
                          type="number"
                              placeholder="0"
                          value={newPDF.pages}
                          onChange={(e) => setNewPDF(prev => ({ ...prev, pages: parseInt(e.target.value) || 0 }))}
                        />
                          </div>
                          <div>
                            <Label htmlFor="minutes">Minutos</Label>
                        <Input
                              id="minutes"
                          type="number"
                              placeholder="0"
                              value={newPDF.reading_time_minutes}
                              onChange={(e) => setNewPDF(prev => ({ ...prev, reading_time_minutes: parseInt(e.target.value) || 0 }))}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Upload e Link */}
                      <div className="space-y-4">
                        <GoogleDriveLink
                          value={newPDF.url}
                          onChange={(url) => setNewPDF(prev => ({ ...prev, url }))}
                        />
                        
                        <PDFUpload
                          onFileSelect={(file) => {
                            console.log('Arquivo selecionado:', file.name)
                            // Aqui você pode implementar o upload do arquivo
                          }}
                          onTextExtract={(text) => {
                            setNewPDF(prev => ({ ...prev, text_content: text }))
                          }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end mt-6">
                    <Button onClick={handleAddPDF} size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar PDF
                    </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Volume Covers Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Gerenciar Capas dos Volumes
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Personalize a capa de cada volume individualmente. Cada volume pode ter sua própria capa diferente da capa do curso.
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {course.course_pdfs.map((pdf) => (
                    <VolumeCoverUpload
                      key={pdf.id}
                      volumeId={pdf.id}
                      courseId={courseId}
                      currentCoverUrl={pdf.cover_url}
                      volumeTitle={pdf.title}
                      onUploadSuccess={(url) => {
                        console.log('Capa do volume atualizada:', url)
                        fetchCourse() // Recarregar dados
                      }}
                      onUploadError={(error) => {
                        console.error('Erro ao fazer upload da capa:', error)
                        alert('Erro ao fazer upload da capa: ' + error)
                      }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* YouTube Videos Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Youtube className="h-5 w-5 text-red-600" />
                  Gerenciar Vídeos dos Volumes
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Adicione vídeos do YouTube para cada volume. Os usuários poderão escolher entre assistir na plataforma (embed) ou abrir no YouTube.
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {course.course_pdfs.map((pdf) => (
                    <YouTubeUrlManager
                      key={pdf.id}
                      volumeId={pdf.id}
                      courseId={courseId}
                      currentYoutubeUrl={pdf.youtube_url}
                      volumeTitle={pdf.title}
                      volumeNumber={pdf.volume}
                      onUrlUpdate={(url) => {
                        console.log('URL do YouTube atualizada:', url)
                        fetchCourse() // Recarregar dados
                      }}
                      onUrlRemove={() => {
                        console.log('URL do YouTube removida')
                        fetchCourse() // Recarregar dados
                      }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Course Preview */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Preview do Curso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                    {editedCourse.cover_url ? (
                      <img 
                        src={editedCourse.cover_url} 
                        alt="Capa do curso" 
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <span className="text-muted-foreground">Capa do Curso</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">{editedCourse.title}</h3>
                    <p className="text-sm text-muted-foreground">{editedCourse.author}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {editedCourse.description}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>{course.course_pdfs.length} volumes</span>
                    <span>{editedCourse.pages} páginas</span>
                    <span>{editedCourse.reading_time_minutes} min</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estatísticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total de PDFs:</span>
                  <Badge variant="secondary">{course.course_pdfs.length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Páginas totais:</span>
                  <Badge variant="secondary">{editedCourse.pages}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Tempo de leitura:</span>
                  <Badge variant="secondary">{editedCourse.reading_time_minutes} min</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
