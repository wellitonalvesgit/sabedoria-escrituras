"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ImageUpload } from "@/components/image-upload"
import { CategorySelector } from "@/components/category-selector"
import Link from "next/link"

export default function NewCoursePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [courseData, setCourseData] = useState({
    title: "",
    description: "",
    author: "",
    category: "",
    pages: 0,
    reading_time_minutes: 0,
    cover_url: ""
  })

  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  const handleImageUpload = async (file: File) => {
    try {
      // Upload da imagem
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'cover')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error)
      }

      setCourseData(prev => ({ ...prev, cover_url: result.fileUrl }))
    } catch (err) {
      console.error('Erro no upload:', err)
      alert('Erro ao fazer upload da capa: ' + (err as Error).message)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)

      // Validação básica
      if (!courseData.title.trim()) {
        setError("O título é obrigatório")
        setSaving(false)
        return
      }

      if (!courseData.description.trim()) {
        setError("A descrição é obrigatória")
        setSaving(false)
        return
      }

      // Usar a API para criar o curso (que usa SERVICE_ROLE_KEY)
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: courseData.title,
          description: courseData.description,
          author: courseData.author || null,
          category: courseData.category || null,
          pages: courseData.pages || 0,
          reading_time_minutes: courseData.reading_time_minutes || 0,
          cover_url: courseData.cover_url || null,
          category_ids: selectedCategories.length > 0 ? selectedCategories : undefined
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar curso')
      }

      if (!result.course) {
        throw new Error('Curso criado mas não retornado pela API')
      }

      // Invalidar cache da API
      try {
        await fetch('/api/courses?admin=true', { method: 'GET', cache: 'no-store' })
      } catch (cacheError) {
        console.error('Erro ao invalidar cache:', cacheError)
      }

      alert("Curso criado com sucesso!")

      // Redirecionar para edição do curso para adicionar PDFs
      router.push(`/admin/courses/${result.course.id}`)
    } catch (err) {
      setError((err as Error).message)
      console.error('Erro ao salvar curso:', err)
    } finally {
      setSaving(false)
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
                  <Plus className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-semibold tracking-tight">Novo Curso</span>
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/admin/courses">
                <Button variant="outline" size="sm" className="hover:bg-primary/10 hover:text-primary hover:border-primary/30">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
              </Link>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Criar Curso
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 pt-24 pb-8 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Criar Novo Curso</h1>
          <p className="text-muted-foreground">Preencha as informações básicas do curso. Você poderá adicionar PDFs após a criação.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Course Info */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Curso</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Título do Curso *</Label>
                  <Input
                    id="title"
                    value={courseData.title}
                    onChange={(e) => setCourseData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: Panorama Bíblico - Novo Testamento"
                  />
                </div>

                <div>
                  <Label htmlFor="author">Autor</Label>
                  <Input
                    id="author"
                    value={courseData.author}
                    onChange={(e) => setCourseData(prev => ({ ...prev, author: e.target.value }))}
                    placeholder="Ex: Pr. João Silva"
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
                  <Label htmlFor="description">Descrição *</Label>
                  <Textarea
                    id="description"
                    value={courseData.description}
                    onChange={(e) => setCourseData(prev => ({ ...prev, description: e.target.value }))}
                    rows={6}
                    placeholder="Descreva o conteúdo e objetivos do curso..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="pages">Total de Páginas</Label>
                    <Input
                      id="pages"
                      type="number"
                      value={courseData.pages}
                      onChange={(e) => setCourseData(prev => ({ ...prev, pages: parseInt(e.target.value) || 0 }))}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="readingTime">Tempo de Leitura (min)</Label>
                    <Input
                      id="readingTime"
                      type="number"
                      value={courseData.reading_time_minutes}
                      onChange={(e) => setCourseData(prev => ({ ...prev, reading_time_minutes: parseInt(e.target.value) || 0 }))}
                      placeholder="0"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cover Upload */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Capa do Curso</CardTitle>
              </CardHeader>
              <CardContent>
                <ImageUpload
                  onImageSelect={handleImageUpload}
                  currentImageUrl={courseData.cover_url}
                />
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {courseData.cover_url ? (
                    <img
                      src={courseData.cover_url}
                      alt="Capa"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center">
                      <span className="text-muted-foreground text-sm">Sem capa</span>
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-lg">
                      {courseData.title || "Título do curso"}
                    </h3>
                    {courseData.author && (
                      <p className="text-sm text-muted-foreground">{courseData.author}</p>
                    )}
                    {courseData.description && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                        {courseData.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>0 volumes</span>
                    <span>{courseData.pages} páginas</span>
                    <span>{courseData.reading_time_minutes} min</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Próximos Passos</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="text-sm space-y-2 text-muted-foreground">
                  <li>1. Preencha as informações básicas</li>
                  <li>2. Clique em "Criar Curso"</li>
                  <li>3. Adicione PDFs ao curso</li>
                  <li>4. Configure o texto para Modo Kindle</li>
                  <li>5. Publique o curso</li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
