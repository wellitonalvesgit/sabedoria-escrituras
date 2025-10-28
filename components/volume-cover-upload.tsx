"use client"

import { useState } from "react"
import { Upload, X, Check, Image, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface VolumeCoverUploadProps {
  volumeId: string
  courseId: string
  currentCoverUrl?: string
  volumeTitle: string
  onUploadSuccess?: (url: string) => void
  onUploadError?: (error: string) => void
  className?: string
}

export const VolumeCoverUpload = ({ 
  volumeId, 
  courseId, 
  currentCoverUrl, 
  volumeTitle,
  onUploadSuccess,
  onUploadError,
  className 
}: VolumeCoverUploadProps) => {
  const [uploading, setUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<{ url: string; name: string } | null>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      onUploadError?.('Por favor, selecione uma imagem válida')
      return
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      onUploadError?.('A imagem deve ter no máximo 5MB')
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('volumeId', volumeId)
      formData.append('courseId', courseId)

      const response = await fetch('/api/upload/volume-cover', {
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
    // Aqui você pode implementar a lógica para remover a capa do banco de dados
  }

  const displayImage = uploadedFile?.url || currentCoverUrl

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Capa do Volume</h3>
          <p className="text-sm text-muted-foreground mb-4">{volumeTitle}</p>
          
          {displayImage ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <img 
                  src={displayImage} 
                  alt={`Capa ${volumeTitle}`} 
                  className="w-32 h-40 object-cover rounded-lg border-2 border-border shadow-lg"
                />
              </div>
              <div>
                <h3 className="font-semibold text-green-800">
                  {uploadedFile ? 'Capa atualizada com sucesso!' : 'Capa atual'}
                </h3>
                <p className="text-sm text-green-600">
                  {uploadedFile?.name || 'Capa do volume'}
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
                  onClick={() => window.open(displayImage, '_blank')}
                >
                  <Image className="mr-2 h-4 w-4" />
                  Visualizar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center w-16 h-16 mx-auto bg-gray-100 rounded-full">
                <Image className="h-8 w-8 text-gray-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Nenhuma capa definida</h3>
                <p className="text-sm text-gray-600">
                  Faça upload de uma imagem para personalizar a capa deste volume
                </p>
              </div>
              <div className="flex justify-center">
                <label htmlFor={`volume-cover-${volumeId}`}>
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
                        Escolher Imagem
                      </>
                    )}
                  </Button>
                </label>
                <input
                  id={`volume-cover-${volumeId}`}
                  type="file"
                  accept="image/*"
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
