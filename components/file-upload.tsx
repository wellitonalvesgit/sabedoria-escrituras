"use client"

import { useState, useRef } from "react"
import { Upload, X, Check, FileText, Image, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface FileUploadProps {
  type: 'cover' | 'pdf'
  courseId: string
  onUploadSuccess: (fileUrl: string, fileName: string) => void
  onUploadError: (error: string) => void
  className?: string
  currentImageUrl?: string
  onImageSelect?: (file: File) => void
}

export const FileUpload = ({ 
  type, 
  courseId, 
  onUploadSuccess, 
  onUploadError, 
  className,
  currentImageUrl,
  onImageSelect
}: FileUploadProps) => {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<{ url: string; name: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Se for imagem e tiver callback personalizado, usar ele
    if (type === 'cover' && onImageSelect) {
      onImageSelect(file)
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)
      formData.append('courseId', courseId)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        setUploadedFile({ url: result.fileUrl, name: result.fileName })
        onUploadSuccess(result.fileUrl, result.fileName)
      } else {
        onUploadError(result.error)
      }
    } catch (error) {
      onUploadError('Erro no upload do arquivo')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveFile = () => {
    setUploadedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const isImage = type === 'cover'
  const acceptTypes = isImage ? 'image/*' : '.pdf'
  const maxSize = isImage ? '5MB' : '50MB'

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-6">
        <div className="text-center">
          {uploadedFile || (type === 'cover' && currentImageUrl) ? (
            <div className="space-y-4">
              {type === 'cover' && (uploadedFile?.url || currentImageUrl) ? (
                <div className="flex justify-center">
                  <div className="relative w-32 h-32 rounded-lg border-2 border-border overflow-hidden">
                    <Image 
                      src={uploadedFile?.url || currentImageUrl} 
                      alt="Capa do curso" 
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center w-16 h-16 mx-auto bg-green-100 rounded-full">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
              )}
              <div>
                <h3 className="font-semibold text-green-800">
                  {uploadedFile ? 'Arquivo enviado com sucesso!' : 'Imagem atual'}
                </h3>
                <p className="text-sm text-green-600">
                  {uploadedFile?.name || 'Capa do curso'}
                </p>
              </div>
              <div className="flex gap-2">
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
                  onClick={() => window.open(uploadedFile?.url || currentImageUrl, '_blank')}
                >
                  Visualizar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center w-16 h-16 mx-auto bg-primary/10 rounded-full">
                {isImage ? (
                  <Image className="h-8 w-8 text-primary" />
                ) : (
                  <FileText className="h-8 w-8 text-primary" />
                )}
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-2">
                  {isImage ? 'Upload da Capa' : 'Upload do PDF'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {isImage 
                    ? 'Selecione uma imagem para a capa do curso' 
                    : 'Selecione um arquivo PDF para o volume'
                  }
                </p>
                <Badge variant="secondary" className="mb-4">
                  Máximo: {maxSize}
                </Badge>
              </div>

              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 hover:border-muted-foreground/50 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={acceptTypes}
                  onChange={handleFileSelect}
                  className="hidden"
                  id={`file-upload-${type}`}
                  disabled={isUploading}
                />
                <label 
                  htmlFor={`file-upload-${type}`}
                  className="cursor-pointer"
                >
                  {isUploading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enviando...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Selecionar {isImage ? 'Imagem' : 'PDF'}
                    </div>
                  )}
                </label>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
