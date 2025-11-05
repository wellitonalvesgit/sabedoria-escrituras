"use client"

import { useState } from "react"
import { Upload, X, Volume2, Loader2, Music } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface VolumeAudioUploadProps {
  volumeId: string
  courseId: string
  currentAudioUrl?: string
  volumeTitle: string
  onUploadSuccess?: (url: string) => void
  onUploadError?: (error: string) => void
  className?: string
}

export const VolumeAudioUpload = ({
  volumeId,
  courseId,
  currentAudioUrl,
  volumeTitle,
  onUploadSuccess,
  onUploadError,
  className
}: VolumeAudioUploadProps) => {
  const [uploading, setUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<{ url: string; name: string } | null>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg']
    if (!validTypes.includes(file.type)) {
      onUploadError?.('Por favor, selecione um arquivo de áudio válido (MP3, WAV ou OGG)')
      return
    }

    // Validar tamanho (máximo 50MB)
    if (file.size > 50 * 1024 * 1024) {
      onUploadError?.('O arquivo de áudio deve ter no máximo 50MB')
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('volumeId', volumeId)
      formData.append('courseId', courseId)

      const response = await fetch('/api/upload/volume-audio', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error)
      }

      setUploadedFile({
        url: result.fileUrl,
        name: file.name
      })

      onUploadSuccess?.(result.fileUrl)
    } catch (error) {
      console.error('Erro no upload:', error)
      onUploadError?.((error as Error).message)
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveFile = () => {
    setUploadedFile(null)
    // Aqui você pode implementar a lógica para remover o áudio do banco de dados
  }

  const displayAudio = uploadedFile?.url || currentAudioUrl

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2 flex items-center justify-center gap-2">
            <Volume2 className="h-5 w-5" />
            Áudio do Volume
          </h3>
          <p className="text-sm text-muted-foreground mb-4">{volumeTitle}</p>

          {displayAudio ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="w-full max-w-md">
                  <audio
                    controls
                    className="w-full"
                    src={displayAudio}
                  >
                    Seu navegador não suporta o elemento de áudio.
                  </audio>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-green-800">
                  {uploadedFile ? 'Áudio atualizado com sucesso!' : 'Áudio atual'}
                </h3>
                <p className="text-sm text-green-600">
                  {uploadedFile?.name || 'Áudio do volume'}
                </p>
              </div>
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveFile}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="mr-2 h-4 w-4" />
                  Remover
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(displayAudio, '_blank')}
                >
                  <Music className="mr-2 h-4 w-4" />
                  Abrir Áudio
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center w-16 h-16 mx-auto bg-gray-100 rounded-full">
                <Volume2 className="h-8 w-8 text-gray-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Nenhum áudio definido</h3>
                <p className="text-sm text-gray-600">
                  Faça upload de um arquivo MP3 para adicionar narração a este volume
                </p>
              </div>
              <div className="flex justify-center">
                <label htmlFor={`volume-audio-${volumeId}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="cursor-pointer"
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Escolher Áudio
                      </>
                    )}
                  </Button>
                </label>
                <input
                  id={`volume-audio-${volumeId}`}
                  type="file"
                  accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={uploading}
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
