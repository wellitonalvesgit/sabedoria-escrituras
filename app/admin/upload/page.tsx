"use client"

import { useState, useEffect } from "react"
import { Upload, FileText, X, Check, ArrowLeft, Plus, Image } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileUpload } from "@/components/file-upload"
import Link from "next/link"

interface Course {
  id: string
  title: string
}

export default function AdminUploadPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string>("")
  const [coverUrl, setCoverUrl] = useState<string>("")
  const [newVolume, setNewVolume] = useState({
    volume: "",
    title: "",
    description: "",
    pdfUrl: ""
  })

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses')
      if (response.ok) {
        const data = await response.json()
        setCourses(data.courses || [])
      }
    } catch (error) {
      console.error('Erro ao carregar cursos:', error)
    }
  }

  const handleCoverUpload = (fileUrl: string, fileName: string) => {
    setCoverUrl(fileUrl)
    console.log("Cover uploaded:", fileUrl, fileName)
  }

  const handlePDFUpload = (fileUrl: string, fileName: string) => {
    setNewVolume(prev => ({ ...prev, pdfUrl: fileUrl }))
    console.log("PDF uploaded:", fileUrl, fileName)
  }

  const handleUploadError = (error: string) => {
    alert(`Erro no upload: ${error}`)
  }

  const handleSubmit = () => {
    // Aqui seria implementada a lógica de salvar no banco de dados
    console.log("Saving volume:", {
      course: selectedCourse,
      volume: newVolume,
      coverUrl: coverUrl,
      pdfUrl: newVolume.pdfUrl
    })
    alert("Volume salvo com sucesso!")
    
    // Reset form
    setSelectedCourse("")
    setCoverUrl("")
    setNewVolume({
      volume: "",
      title: "",
      description: "",
      pdfUrl: ""
    })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/admin" className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
                  <Upload className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-semibold tracking-tight">Upload de PDFs</span>
              </Link>
            </div>
            <Link href="/admin">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Upload de PDFs</h1>
          <p className="text-muted-foreground">Faça upload de novos PDFs para os cursos existentes</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Volume</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="course">Curso</Label>
                  <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um curso" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="volume">Volume (ex: VOL-I, VOL-II)</Label>
                  <Input
                    id="volume"
                    placeholder="VOL-I"
                    value={newVolume.volume}
                    onChange={(e) => setNewVolume(prev => ({ ...prev, volume: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="title">Título do Volume</Label>
                  <Input
                    id="title"
                    placeholder="Título completo do volume"
                    value={newVolume.title}
                    onChange={(e) => setNewVolume(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    placeholder="Descrição do conteúdo do volume"
                    value={newVolume.description}
                    onChange={(e) => setNewVolume(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Upload de Capa */}
            <FileUpload
              type="cover"
              courseId={selectedCourse || "temp"}
              onUploadSuccess={handleCoverUpload}
              onUploadError={handleUploadError}
            />

            {/* Upload de PDF */}
            <FileUpload
              type="pdf"
              courseId={selectedCourse || "temp"}
              onUploadSuccess={handlePDFUpload}
              onUploadError={handleUploadError}
            />

          </div>

          {/* Upload Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Resumo do Upload</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Curso selecionado:</span>
                  <Badge variant="secondary">
                    {courses.find(c => c.id === selectedCourse)?.title || "Não selecionado"}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Capa:</span>
                  <Badge variant={coverUrl ? "default" : "secondary"}>
                    {coverUrl ? "Enviada" : "Não enviada"}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">PDF:</span>
                  <Badge variant={newVolume.pdfUrl ? "default" : "secondary"}>
                    {newVolume.pdfUrl ? "Enviado" : "Não enviado"}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Volume:</span>
                  <Badge variant="secondary">
                    {newVolume.volume || "Não definido"}
                  </Badge>
                </div>
                
                <Button 
                  onClick={handleSubmit}
                  className="w-full"
                  disabled={!selectedCourse || !coverUrl || !newVolume.pdfUrl}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Salvar Volume
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
