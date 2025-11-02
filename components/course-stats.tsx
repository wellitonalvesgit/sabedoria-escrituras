"use client"

import { BookOpen, FileText, Clock, User } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { courses } from "@/lib/courses-data"

export function CourseStats() {
  const totalCourses = courses.length
  const totalPDFs = courses.reduce((acc, course) => acc + course.pdfs.length, 0)
  const totalPages = courses.reduce((acc, course) => acc + (course.pages || 0), 0)
  const totalReadingTime = courses.reduce((acc, course) => acc + course.readingTimeMinutes, 0)

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Cursos</CardTitle>
          <BookOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalCourses}</div>
          <p className="text-xs text-muted-foreground">Cursos disponíveis</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de PDFs</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalPDFs}</div>
          <p className="text-xs text-muted-foreground">Arquivos PDF</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Páginas Totais</CardTitle>
          <BookOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalPages}</div>
          <p className="text-xs text-muted-foreground">Páginas de conteúdo</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tempo de Leitura</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{Math.round(totalReadingTime / 60)}h</div>
          <p className="text-xs text-muted-foreground">Horas de estudo</p>
        </CardContent>
      </Card>
    </div>
  )
}
