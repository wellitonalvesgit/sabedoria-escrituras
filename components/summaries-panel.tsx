"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  BookOpen, 
  FileText, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye,
  Calendar,
  Highlighter
} from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"

interface Highlight {
  id: string
  text_content: string
  highlight_color: string
  note?: string
  page_number: number
  created_at: string
}

interface Summary {
  id: string
  title: string
  content: string
  highlight_ids: string[]
  created_at: string
  courses?: {
    title: string
    slug: string
  }
  course_pdfs?: {
    title: string
    volume: string
  }
}

interface SummariesPanelProps {
  courseId: string
  pdfId: string
  highlights: Highlight[]
  onClose: () => void
}

export const SummariesPanel = ({
  courseId,
  pdfId,
  highlights,
  onClose
}: SummariesPanelProps) => {
  const [summaries, setSummaries] = useState<Summary[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingSummary, setEditingSummary] = useState<Summary | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    selectedHighlights: [] as string[]
  })

  useEffect(() => {
    fetchSummaries()
  }, [courseId, pdfId])

  const fetchSummaries = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/summaries?course_id=${courseId}&pdf_id=${pdfId}`)
      if (response.ok) {
        const data = await response.json()
        setSummaries(data.summaries || [])
      }
    } catch (error) {
      console.error('Erro ao carregar resumos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSummary = async () => {
    try {
      const response = await fetch('/api/summaries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          course_id: courseId,
          pdf_id: pdfId,
          title: formData.title,
          content: formData.content,
          highlight_ids: formData.selectedHighlights
        })
      })

      if (response.ok) {
        await fetchSummaries()
        setShowCreateForm(false)
        setFormData({ title: '', content: '', selectedHighlights: [] })
      }
    } catch (error) {
      console.error('Erro ao criar resumo:', error)
    }
  }

  const handleUpdateSummary = async (id: string) => {
    try {
      const response = await fetch(`/api/summaries/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          highlight_ids: formData.selectedHighlights
        })
      })

      if (response.ok) {
        await fetchSummaries()
        setEditingSummary(null)
        setFormData({ title: '', content: '', selectedHighlights: [] })
      }
    } catch (error) {
      console.error('Erro ao atualizar resumo:', error)
    }
  }

  const handleDeleteSummary = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este resumo?')) return

    try {
      const response = await fetch(`/api/summaries/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchSummaries()
      }
    } catch (error) {
      console.error('Erro ao deletar resumo:', error)
    }
  }

  const toggleHighlight = (highlightId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedHighlights: prev.selectedHighlights.includes(highlightId)
        ? prev.selectedHighlights.filter(id => id !== highlightId)
        : [...prev.selectedHighlights, highlightId]
    }))
  }

  const startEdit = (summary: Summary) => {
    setEditingSummary(summary)
    setFormData({
      title: summary.title,
      content: summary.content,
      selectedHighlights: summary.highlight_ids
    })
    setShowCreateForm(true)
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F3C77A] mx-auto"></div>
            <p className="mt-2">Carregando resumos...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[80vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[#F3C77A]" />
            Meus Resumos
          </CardTitle>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setShowCreateForm(true)
                setEditingSummary(null)
                setFormData({ title: '', content: '', selectedHighlights: [] })
              }}
              className="bg-[#F3C77A] text-black hover:bg-[#FFD88A]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Resumo
            </Button>
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </CardHeader>

        <CardContent className="overflow-y-auto max-h-[60vh]">
          {showCreateForm ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Título do Resumo</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Principais conceitos do capítulo 1"
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Conteúdo do Resumo</label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Escreva seu resumo aqui..."
                  className="mt-1 min-h-[120px]"
                />
              </div>

              {highlights.length > 0 && (
                <div>
                  <label className="text-sm font-medium">Marcações Incluídas</label>
                  <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                    {highlights.map((highlight) => (
                      <div
                        key={highlight.id}
                        className={`p-2 rounded-lg border cursor-pointer transition-colors ${
                          formData.selectedHighlights.includes(highlight.id)
                            ? 'bg-[#F3C77A]/20 border-[#F3C77A]'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                        onClick={() => toggleHighlight(highlight.id)}
                      >
                        <div className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            checked={formData.selectedHighlights.includes(highlight.id)}
                            onChange={() => toggleHighlight(highlight.id)}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm line-clamp-2">{highlight.text_content}</p>
                            {highlight.note && (
                              <p className="text-xs text-gray-500 mt-1">Nota: {highlight.note}</p>
                            )}
                            <Badge variant="outline" className="mt-1 text-xs">
                              Página {highlight.page_number}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={editingSummary ? () => handleUpdateSummary(editingSummary.id) : handleCreateSummary}
                  className="flex-1 bg-[#F3C77A] text-black hover:bg-[#FFD88A]"
                >
                  {editingSummary ? 'Atualizar' : 'Criar'} Resumo
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false)
                    setEditingSummary(null)
                    setFormData({ title: '', content: '', selectedHighlights: [] })
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {summaries.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum resumo criado ainda</p>
                  <p className="text-sm text-gray-400">Crie seu primeiro resumo para organizar seus estudos</p>
                </div>
              ) : (
                summaries.map((summary) => (
                  <Card key={summary.id} className="border-l-4 border-l-[#F3C77A]">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2">{summary.title}</h3>
                          <p className="text-gray-600 mb-3 line-clamp-3">{summary.content}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(summary.created_at).toLocaleDateString('pt-BR')}
                            </span>
                            {summary.highlight_ids.length > 0 && (
                              <span className="flex items-center gap-1">
                                <Highlighter className="h-4 w-4" />
                                {summary.highlight_ids.length} marcação(ões)
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 ml-4">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEdit(summary)}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteSummary(summary.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
