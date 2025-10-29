"use client"

import { useState } from "react"
import { Youtube, Play, ExternalLink, X, Check, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface YouTubeUrlManagerProps {
  volumeId: string
  courseId: string
  currentYoutubeUrl?: string
  volumeTitle: string
  volumeNumber: string
  onUrlUpdate?: (url: string) => void
  onUrlRemove?: () => void
  className?: string
}

export const YouTubeUrlManager = ({ 
  volumeId, 
  courseId, 
  currentYoutubeUrl, 
  volumeTitle,
  volumeNumber,
  onUrlUpdate,
  onUrlRemove,
  className 
}: YouTubeUrlManagerProps) => {
  const [youtubeUrl, setYoutubeUrl] = useState(currentYoutubeUrl || "")
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState<'embed' | 'external'>('embed')

  // Validar URL do YouTube
  const isValidYouTubeUrl = (url: string): boolean => {
    const regex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)[\w-]+/
    return regex.test(url)
  }

  // Extrair ID do vídeo
  const getYouTubeVideoId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    const match = url.match(regex)
    return match ? match[1] : null
  }

  const videoId = youtubeUrl ? getYouTubeVideoId(youtubeUrl) : null
  const isValid = youtubeUrl ? isValidYouTubeUrl(youtubeUrl) : true

  const handleSave = async () => {
    if (!isValid) {
      setError("URL do YouTube inválida")
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      // Atualizar no banco de dados
      const { getSupabaseClient } = await import('@/lib/supabase-admin')
      const supabase = getSupabaseClient()

      const { error: updateError } = await supabase
        .from('course_pdfs')
        .update({ youtube_url: youtubeUrl || null })
        .eq('id', volumeId)
        .eq('course_id', courseId)

      if (updateError) {
        throw new Error('Erro ao salvar URL do YouTube: ' + updateError.message)
      }

      setIsEditing(false)
      onUrlUpdate?.(youtubeUrl)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemove = async () => {
    setIsSaving(true)
    setError(null)

    try {
      const { getSupabaseClient } = await import('@/lib/supabase-admin')
      const supabase = getSupabaseClient()

      const { error: updateError } = await supabase
        .from('course_pdfs')
        .update({ youtube_url: null })
        .eq('id', volumeId)
        .eq('course_id', courseId)

      if (updateError) {
        throw new Error('Erro ao remover URL do YouTube: ' + updateError.message)
      }

      setYoutubeUrl("")
      setIsEditing(false)
      onUrlRemove?.()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setYoutubeUrl(currentYoutubeUrl || "")
    setIsEditing(false)
    setError(null)
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Youtube className="h-5 w-5 text-red-600" />
          Vídeo do YouTube
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {volumeNumber} - {volumeTitle}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!isEditing ? (
          // Modo de Visualização
          <div className="space-y-3">
            {currentYoutubeUrl ? (
              <>
                {/* Preview do Vídeo */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-red-600 border-red-600">
                      <Youtube className="h-3 w-3 mr-1" />
                      Vídeo Configurado
                    </Badge>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewMode('embed')}
                        className={previewMode === 'embed' ? 'bg-red-50 border-red-200' : ''}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Embed
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewMode('external')}
                        className={previewMode === 'external' ? 'bg-red-50 border-red-200' : ''}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Link
                      </Button>
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    {previewMode === 'embed' ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0`}
                        title={`Preview ${volumeTitle}`}
                        className="w-full h-full"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <div className="relative w-full h-full group cursor-pointer">
                        <img
                          src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                          alt={`Thumbnail ${volumeTitle}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition-colors">
                          <div className="text-center text-white">
                            <div className="bg-red-600 rounded-full p-3 mx-auto mb-2">
                              <Play className="h-6 w-6 fill-white" />
                            </div>
                            <p className="text-sm font-medium">Abrir no YouTube</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* URL Atual */}
                  <div className="p-2 bg-muted rounded text-xs font-mono break-all">
                    {currentYoutubeUrl}
                  </div>
                </div>

                {/* Ações */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="flex-1"
                  >
                    <Youtube className="h-4 w-4 mr-2" />
                    Editar URL
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(currentYoutubeUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemove}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              // Sem vídeo configurado
              <div className="text-center py-8 text-muted-foreground">
                <Youtube className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm mb-2">Nenhum vídeo configurado</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Youtube className="h-4 w-4 mr-2" />
                  Adicionar Vídeo
                </Button>
              </div>
            )}
          </div>
        ) : (
          // Modo de Edição
          <div className="space-y-4">
            <div>
              <Label htmlFor="youtube-url">URL do YouTube</Label>
              <Input
                id="youtube-url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                className={!isValid ? 'border-destructive' : ''}
              />
              {!isValid && youtubeUrl && (
                <p className="text-xs text-destructive mt-1">
                  URL do YouTube inválida
                </p>
              )}
            </div>

            {/* Preview da URL */}
            {youtubeUrl && isValid && videoId && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <img
                    src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                    alt="Preview do vídeo"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            {/* Ações */}
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={!isValid || isSaving}
                className="flex-1"
              >
                {isSaving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Salvar
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

