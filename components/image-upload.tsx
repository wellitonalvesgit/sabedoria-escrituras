"use client"

import { useState } from "react"
import { Upload, X, Check, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import Image from "next/image"

interface ImageUploadProps {
  onImageSelect: (file: File) => void
  currentImageUrl?: string
  className?: string
}

export function ImageUpload({ onImageSelect, currentImageUrl, className }: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem')
      return
    }

    // Verificar tamanho do arquivo (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('O arquivo deve ter no máximo 5MB')
      return
    }

    setUploading(true)
    setUploadedFile(file)
    setUploadProgress(0)

    // Simular progresso de upload
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          setUploading(false)
          return 100
        }
        return prev + 10
      })
    }, 100)

    // Chamar onImageSelect após o upload simulado
    setTimeout(() => {
      onImageSelect(file)
    }, 1000)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const resetUpload = () => {
    setUploadedFile(null)
    setUploadProgress(0)
    setUploading(false)
  }

  return (
    <div className={className}>
      <Card>
        <CardContent className="p-4">
          <div className="text-center">
            <h4 className="text-sm font-medium mb-3">Upload de Capa</h4>
            
            {currentImageUrl && !uploadedFile && (
              <div className="mb-4">
                <div className="relative w-full h-32 rounded-lg border border-border overflow-hidden">
                  <Image 
                    src={currentImageUrl} 
                    alt="Capa atual" 
                    fill
                    className="object-cover"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">Capa atual</p>
              </div>
            )}

            {!uploadedFile ? (
              <div
                className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
                  dragActive 
                    ? 'border-primary bg-primary/5' 
                    : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileInput}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <ImageIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Clique para selecionar ou arraste aqui</p>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG, JPEG até 5MB
                      </p>
                    </div>
                  </div>
                </label>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <ImageIcon className="h-6 w-6 text-primary" />
                    <div>
                      <p className="font-medium text-sm">{uploadedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetUpload}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {uploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Processando imagem...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}

                {!uploading && uploadProgress === 100 && (
                  <div className="flex items-center gap-2 text-green-600">
                    <Check className="h-4 w-4" />
                    <span className="text-sm">Imagem processada com sucesso!</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
