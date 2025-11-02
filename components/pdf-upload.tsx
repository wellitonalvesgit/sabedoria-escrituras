"use client"

import { useState } from "react"
import { Upload, FileText, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface PDFUploadProps {
  onFileSelect: (file: File) => void
  onTextExtract: (text: string) => void
  className?: string
}

export function PDFUpload({ onFileSelect, onTextExtract, className }: PDFUploadProps) {
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
    if (!file.type.includes('pdf') && !file.type.includes('text')) {
      alert('Por favor, selecione um arquivo PDF ou TXT')
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
          onFileSelect(file)
          return 100
        }
        return prev + 10
      })
    }, 100)

    // Se for um arquivo de texto, extrair conteúdo
    if (file.type.includes('text')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        onTextExtract(text)
      }
      reader.readAsText(file)
    }
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
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Upload de PDF</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Arraste e solte um arquivo PDF ou TXT, ou clique para selecionar
            </p>

            {!uploadedFile ? (
              <div
                className={`border-2 border-dashed rounded-lg p-8 transition-colors ${
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
                  accept=".pdf,.txt"
                  onChange={handleFileInput}
                  className="hidden"
                  id="pdf-upload"
                />
                <label htmlFor="pdf-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                      <Upload className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Clique para selecionar ou arraste aqui</p>
                      <p className="text-sm text-muted-foreground">
                        Suporta PDF e arquivos de texto (.txt)
                      </p>
                    </div>
                  </div>
                </label>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-medium">{uploadedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
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
                      <span>Processando arquivo...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}

                {!uploading && uploadProgress === 100 && (
                  <div className="flex items-center gap-2 text-green-600">
                    <Check className="h-4 w-4" />
                    <span className="text-sm">Arquivo processado com sucesso!</span>
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
