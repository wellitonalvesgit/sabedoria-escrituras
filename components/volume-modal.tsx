"use client"

import { useState, useEffect } from "react"
import { Save, Upload, Volume2, Youtube, FileText, Loader2, BookOpen, Video, Music, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { PDFUpload } from "@/components/pdf-upload"
import { GoogleDriveLink } from "@/components/google-drive-link"
import { ImageUpload } from "@/components/image-upload"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"

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
}

interface VolumeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  volume: CoursePDF | null
  courseId: string
  onSave: () => Promise<void>
  mode: 'edit' | 'create'
}

export function VolumeModal({ open, onOpenChange, volume, courseId, onSave, mode }: VolumeModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<CoursePDF>>({
    volume: "",
    title: "",
    url: "",
    pages: 0,
    text_content: "",
    use_auto_conversion: true,
    cover_url: "",
    youtube_url: "",
    audio_url: ""
  })

  useEffect(() => {
    if (volume && mode === 'edit') {
      setFormData({
        volume: volume.volume || "",
        title: volume.title || "",
        url: volume.url || "",
        pages: volume.pages || 0,
        text_content: volume.text_content || "",
        use_auto_conversion: volume.use_auto_conversion !== false,
        cover_url: volume.cover_url || "",
        youtube_url: volume.youtube_url || "",
        audio_url: volume.audio_url || ""
      })
    } else {
      setFormData({
        volume: "",
        title: "",
        url: "",
        pages: 0,
        text_content: "",
        use_auto_conversion: true,
        cover_url: "",
        youtube_url: "",
        audio_url: ""
      })
    }
  }, [volume, mode, open])

  const handleSave = async () => {
    try {
      setLoading(true)

      if (mode === 'create') {
        const response = await fetch(`/api/courses/${courseId}/pdfs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            volume: formData.volume,
            title: formData.title,
            url: formData.url,
            pages: formData.pages,
            reading_time_minutes: 0,
            text_content: formData.text_content,
            use_auto_conversion: formData.use_auto_conversion,
            cover_url: formData.cover_url || null,
            youtube_url: formData.youtube_url || null,
            audio_url: formData.audio_url || null
          })
        })

        if (!response.ok) {
          const result = await response.json()
          throw new Error(result.error || 'Erro ao criar volume')
        }
      } else {
        if (!volume?.id) return

        const response = await fetch(`/api/courses/${courseId}/pdfs/${volume.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            volume: formData.volume,
            title: formData.title,
            url: formData.url,
            pages: formData.pages,
            reading_time_minutes: 0,
            text_content: formData.text_content,
            use_auto_conversion: formData.use_auto_conversion,
            cover_url: formData.cover_url || null,
            youtube_url: formData.youtube_url || null,
            audio_url: formData.audio_url || null
          })
        })

        if (!response.ok) {
          const result = await response.json()
          throw new Error(result.error || 'Erro ao salvar volume')
        }
      }

      await onSave()
      onOpenChange(false)
      alert(mode === 'create' ? "Volume criado com sucesso!" : "Volume atualizado com sucesso!")
    } catch (err) {
      alert('Erro ao salvar: ' + (err instanceof Error ? err.message : 'Erro desconhecido'))
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'cover')
      formData.append('courseId', courseId)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error)
      }

      setFormData(prev => ({ ...prev, cover_url: result.fileUrl }))
      alert("Capa atualizada com sucesso!")
    } catch (err) {
      alert('Erro ao fazer upload da capa: ' + (err as Error).message)
    }
  }

  const handleAudioUpload = async (file: File) => {
    try {
      const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg']
      if (!validTypes.includes(file.type)) {
        alert('Por favor, selecione um arquivo de áudio válido (MP3, WAV ou OGG)')
        return
      }

      if (file.size > 50 * 1024 * 1024) {
        alert('O arquivo de áudio deve ter no máximo 50MB')
        return
      }

      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      uploadFormData.append('volumeId', volume?.id || 'new')
      uploadFormData.append('courseId', courseId)

      const response = await fetch('/api/upload/volume-audio', {
        method: 'POST',
        body: uploadFormData,
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error)
      }

      setFormData(prev => ({ ...prev, audio_url: result.fileUrl }))
      alert("Áudio do volume atualizado com sucesso!")
    } catch (err) {
      alert('Erro ao fazer upload do áudio: ' + (err as Error).message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-5 w-5 text-primary" />
            {mode === 'create' ? 'Criar Novo Volume' : 'Editar Volume'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Preencha as informações para criar um novo volume' 
              : 'Modifique as informações do volume'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basico" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basico" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Básico
            </TabsTrigger>
            <TabsTrigger value="arquivo" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Arquivo
            </TabsTrigger>
            <TabsTrigger value="midia" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              Mídia
            </TabsTrigger>
            <TabsTrigger value="kindle" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Kindle
            </TabsTrigger>
          </TabsList>

          {/* Tab: Informações Básicas */}
          <TabsContent value="basico" className="space-y-4 mt-4">
            <Card className="p-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="volume" className="text-sm font-medium">Volume *</Label>
                    <Input
                      id="volume"
                      placeholder="ex: VOL-I, VOL-II"
                      value={formData.volume}
                      onChange={(e) => setFormData(prev => ({ ...prev, volume: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="title" className="text-sm font-medium">Título do Volume *</Label>
                    <Input
                      id="title"
                      placeholder="Título do volume"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="pages" className="text-sm font-medium">Total de Páginas</Label>
                  <Input
                    id="pages"
                    type="number"
                    value={formData.pages}
                    onChange={(e) => setFormData(prev => ({ ...prev, pages: parseInt(e.target.value) || 0 }))}
                    className="mt-1 max-w-xs"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">Capa do Volume (Opcional)</Label>
                  <div className="mt-2">
                    <ImageUpload
                      onImageSelect={handleImageUpload}
                      currentImageUrl={formData.cover_url}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Tab: Arquivo PDF */}
          <TabsContent value="arquivo" className="space-y-4 mt-4">
            <Card className="p-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="url" className="text-sm font-medium">URL do Google Drive</Label>
                  <div className="mt-2">
                    <GoogleDriveLink
                      value={formData.url || ""}
                      onChange={(url) => setFormData(prev => ({ ...prev, url }))}
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Upload de PDF ou TXT</Label>
                  <div className="mt-2">
                    <PDFUpload
                      onFileSelect={(file) => {
                        if (file.type === 'application/pdf') {
                          const tempUrl = URL.createObjectURL(file)
                          setFormData(prev => ({ ...prev, url: tempUrl }))
                          alert("PDF selecionado! (URL temporária gerada. Em uma implementação real, o PDF seria enviado para um serviço de armazenamento.)")
                        }
                      }}
                      onTextExtract={(text) => {
                        setFormData(prev => ({ ...prev, text_content: text }))
                      }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Tab: Mídia Adicional */}
          <TabsContent value="midia" className="space-y-4 mt-4">
            <Card className="p-4">
              <div className="space-y-6">
                <div>
                  <Label htmlFor="youtube_url" className="text-sm font-medium flex items-center gap-2">
                    <Youtube className="h-4 w-4" />
                    URL do YouTube (Opcional)
                  </Label>
                  <Input
                    id="youtube_url"
                    value={formData.youtube_url || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, youtube_url: e.target.value }))}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Cole a URL do vídeo do YouTube relacionado a este volume
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    Áudio MP3 do Volume (Opcional)
                  </Label>
                  <div className="space-y-2 mt-2">
                    {formData.audio_url && (
                      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border">
                        <Volume2 className="h-4 w-4 text-primary" />
                        <span className="text-sm flex-1">Áudio configurado</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(formData.audio_url, '_blank')}
                        >
                          Ouvir
                        </Button>
                      </div>
                    )}
                    <div>
                      <input
                        type="file"
                        id="audio-upload"
                        accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleAudioUpload(file)
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          const input = document.getElementById('audio-upload') as HTMLInputElement
                          input?.click()
                        }}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        {formData.audio_url ? 'Trocar Áudio' : 'Enviar Áudio MP3'}
                      </Button>
                    </div>
                    {formData.audio_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-destructive hover:text-destructive"
                        onClick={() => setFormData(prev => ({ ...prev, audio_url: undefined }))}
                      >
                        Remover Áudio
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Tab: Modo Kindle */}
          <TabsContent value="kindle" className="space-y-4 mt-4">
            <Card className="p-4">
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-4 bg-muted/50 rounded-lg border">
                  <Switch
                    id="use_auto_conversion"
                    checked={formData.use_auto_conversion !== false}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, use_auto_conversion: checked }))}
                  />
                  <div className="flex-1">
                    <Label htmlFor="use_auto_conversion" className="cursor-pointer">
                      <span className="font-medium block">Usar conversão automática de PDF</span>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formData.use_auto_conversion !== false
                          ? "O sistema tentará extrair o texto automaticamente do PDF"
                          : "Use texto manual configurado abaixo"}
                      </p>
                    </Label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="text_content" className="text-sm font-medium">Texto Manual (Opcional)</Label>
                  <Textarea
                    id="text_content"
                    placeholder="Cole o texto extraído do PDF ou deixe vazio para usar conversão automática..."
                    value={formData.text_content || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, text_content: e.target.value }))}
                    rows={8}
                    className="font-mono text-sm mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {formData.text_content
                      ? `${formData.text_content.length} caracteres configurados`
                      : "Nenhum texto manual configurado"}
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

