"use client"

import { useState, useEffect } from "react"
import { use } from "react"
import { ArrowLeft, Save, Plus, Trash2, Edit, Eye, FileText, Upload, Download, Loader2, Copy, ArrowUp, ArrowDown, Gift, Youtube, Volume2 } from "lucide-react"
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
import { VolumeModal } from "@/components/volume-modal"
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
  audio_url?: string
  parent_volume_id?: string | null
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
    category: "",
    pages: 0,
    cover_url: "",
    checkout_url: "",
    is_free: false,
    status: "published"
  })

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedVolume, setSelectedVolume] = useState<CoursePDF | null>(null)
  const [drawerMode, setDrawerMode] = useState<'edit' | 'create'>('create')
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
        category: course.category || "",
        pages: course.pages || 0,
        cover_url: course.cover_url || "",
        checkout_url: (course as any).checkout_url || "",
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

  const handleOpenCreateModal = () => {
    setSelectedVolume(null)
    setDrawerMode('create')
    setModalOpen(true)
  }

  const handleOpenEditModal = (pdf: CoursePDF) => {
    setSelectedVolume(pdf)
    setDrawerMode('edit')
    setModalOpen(true)
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
                <Button variant="outline" size="sm" className="hover:bg-primary/10 hover:text-primary hover:border-primary/30">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar aos Cursos
                </Button>
              </Link>
              <Link href={`/course/${courseId}`}>
                <Button variant="outline" size="sm" className="hover:bg-primary/10 hover:text-primary hover:border-primary/30">
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
            <Card className="border-2">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Informações do Curso
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div>
                  <Label htmlFor="title">Título do Curso</Label>
                  <Input
                    id="title"
                    value={editedCourse.title}
                    onChange={(e) => setEditedCourse(prev => ({ ...prev, title: e.target.value }))}
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

                <div>
                  <Label htmlFor="checkout_url">URL de Checkout (Corvex/Stripe/etc)</Label>
                  <Input
                    id="checkout_url"
                    type="url"
                    value={editedCourse.checkout_url}
                    onChange={(e) => setEditedCourse(prev => ({ ...prev, checkout_url: e.target.value }))}
                    placeholder="https://checkout.corvex.com.br/..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    URL para compra do curso ou upgrade de plano. Será usada nos botões de "Comprar" ou "Fazer Upgrade"
                  </p>
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

                <div>
                  <Label htmlFor="pages">Total de Páginas</Label>
                  <Input
                    id="pages"
                    type="number"
                    value={editedCourse.pages}
                    onChange={(e) => setEditedCourse(prev => ({ ...prev, pages: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Cover Upload */}
            <Card className="border-2">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  Capa do Curso
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ImageUpload
                  onImageSelect={handleImageUpload}
                  currentImageUrl={editedCourse.cover_url}
                />
              </CardContent>
            </Card>

            {/* PDFs Management */}
            <Card className="border-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 bg-gradient-to-r from-primary/5 to-primary/10 border-b">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Gerenciar Volumes
                </CardTitle>
                <Button onClick={handleOpenCreateModal} size="sm" className="bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Volume
                </Button>
              </CardHeader>
              <CardContent>
                {course.course_pdfs.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">Nenhum volume cadastrado ainda</p>
                    <Button onClick={handleOpenCreateModal} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeiro Volume
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(() => {
                      // Organizar volumes em hierarquia
                      const rootVolumes = course.course_pdfs.filter(p => !p.parent_volume_id)
                      const getSubvolumes = (parentId: string) => 
                        course.course_pdfs.filter(p => p.parent_volume_id === parentId)
                      
                      const renderVolume = (pdf: CoursePDF, level: number = 0) => {
                        const subvolumes = getSubvolumes(pdf.id)
                        const index = course.course_pdfs.findIndex(p => p.id === pdf.id)
                        
                        return (
                          <div key={pdf.id}>
                            <div
                              className={`flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors group ${
                                level > 0 ? 'ml-6 border-l-2 border-primary/30' : ''
                              }`}
                            >
                              <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {level > 0 && (
                                    <span className="text-primary text-xs">└─</span>
                                  )}
                                  <Badge variant={level > 0 ? "outline" : "secondary"}>
                                    {pdf.volume}
                                  </Badge>
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => handleMovePDF(pdf.id, 'up')}
                                      disabled={index === 0}
                                      title="Mover para cima"
                                    >
                                      <ArrowUp className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => handleMovePDF(pdf.id, 'down')}
                                      disabled={index === course.course_pdfs.length - 1}
                                      title="Mover para baixo"
                                    >
                                      <ArrowDown className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                
                                {pdf.cover_url && (
                                  <div className="flex-shrink-0">
                                    <img
                                      src={pdf.cover_url}
                                      alt={pdf.title}
                                      className="w-16 h-20 object-cover rounded border"
                                    />
                                  </div>
                                )}
                                
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-sm truncate">{pdf.title}</h4>
                                  <div className="flex items-center gap-3 mt-1">
                                    <p className="text-xs text-muted-foreground">
                                      {pdf.pages || 0} páginas • {pdf.reading_time_minutes || 0} min
                                    </p>
                                    <div className="flex items-center gap-2">
                                      {pdf.youtube_url && (
                                        <Badge variant="outline" className="text-xs">
                                          <Youtube className="h-3 w-3 mr-1" />
                                          YouTube
                                        </Badge>
                                      )}
                                      {pdf.audio_url && (
                                        <Badge variant="outline" className="text-xs">
                                          <Volume2 className="h-3 w-3 mr-1" />
                                          Áudio
                                        </Badge>
                                      )}
                                      {pdf.text_content && (
                                        <Badge variant="outline" className="text-xs">
                                          <FileText className="h-3 w-3 mr-1" />
                                          Kindle
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenEditModal(pdf)}
                                  title="Editar"
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Editar
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDuplicatePDF(pdf)}
                                  title="Duplicar"
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeletePDF(pdf.id)}
                                  className="text-destructive hover:text-destructive"
                                  title="Deletar"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            {/* Renderizar subvolumes */}
                            {subvolumes.length > 0 && (
                              <div className="ml-4 mt-2 space-y-2">
                                {subvolumes.map(sub => renderVolume(sub, level + 1))}
                              </div>
                            )}
                          </div>
                        )
                      }
                      
                      return rootVolumes.map(vol => renderVolume(vol))
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Volume Modal */}
        <VolumeModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          volume={selectedVolume}
          courseId={courseId}
          onSave={fetchCourse}
          mode={drawerMode}
          availableVolumes={course?.course_pdfs || []}
        />


          </div>

          {/* Course Preview */}
          <div className="space-y-6">
            <Card className="border-2 sticky top-24">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  Preview do Curso
                </CardTitle>
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
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {editedCourse.description}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>{course.course_pdfs.length} volumes</span>
                    <span>{editedCourse.pages} páginas</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Estatísticas
                </CardTitle>
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
