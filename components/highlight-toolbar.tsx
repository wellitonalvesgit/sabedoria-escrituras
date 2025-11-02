"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Highlighter, 
  Palette, 
  BookOpen, 
  FileText, 
  Trash2, 
  Edit3,
  Save,
  X
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

interface HighlightToolbarProps {
  selectedText: string
  pageNumber: number
  onHighlight: (color: string, note?: string) => void
  onCancel: () => void
  existingHighlights: Highlight[]
  onDeleteHighlight: (id: string) => void
  onUpdateHighlight: (id: string, note: string) => void
}

const highlightColors = [
  { name: 'Amarelo', value: 'yellow', class: 'bg-yellow-200 text-yellow-900' },
  { name: 'Verde', value: 'green', class: 'bg-green-200 text-green-900' },
  { name: 'Azul', value: 'blue', class: 'bg-blue-200 text-blue-900' },
  { name: 'Rosa', value: 'pink', class: 'bg-pink-200 text-pink-900' },
  { name: 'Laranja', value: 'orange', class: 'bg-orange-200 text-orange-900' },
  { name: 'Roxo', value: 'purple', class: 'bg-purple-200 text-purple-900' }
]

export const HighlightToolbar = ({
  selectedText,
  pageNumber,
  onHighlight,
  onCancel,
  existingHighlights,
  onDeleteHighlight,
  onUpdateHighlight
}: HighlightToolbarProps) => {
  const [selectedColor, setSelectedColor] = useState('yellow')
  const [note, setNote] = useState('')
  const [showNoteInput, setShowNoteInput] = useState(false)

  const handleHighlight = () => {
    onHighlight(selectedColor, note || undefined)
    setNote('')
    setShowNoteInput(false)
  }

  const pageHighlights = existingHighlights.filter(h => h.page_number === pageNumber)

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <Card className="bg-white shadow-lg border-2 border-[#F3C77A]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Highlighter className="h-5 w-5 text-[#F3C77A]" />
              Marcar Texto
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Texto selecionado */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Texto selecionado:</p>
            <p className="text-sm font-medium line-clamp-3">{selectedText}</p>
          </div>

          {/* Cores de marcação */}
          <div>
            <p className="text-sm font-medium mb-2">Escolha a cor:</p>
            <div className="grid grid-cols-3 gap-2">
              {highlightColors.map((color) => (
                <Button
                  key={color.value}
                  variant={selectedColor === color.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedColor(color.value)}
                  className={`${color.class} ${
                    selectedColor === color.value 
                      ? 'ring-2 ring-[#F3C77A]' 
                      : 'hover:opacity-80'
                  }`}
                >
                  {color.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Nota opcional */}
          {!showNoteInput ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNoteInput(true)}
              className="w-full"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Adicionar Nota
            </Button>
          ) : (
            <div className="space-y-2">
              <Textarea
                placeholder="Adicione uma nota para este trecho..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="min-h-[80px]"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => setShowNoteInput(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowNoteInput(false)}
                  className="flex-1"
                >
                  OK
                </Button>
              </div>
            </div>
          )}

          {/* Botões de ação */}
          <div className="flex gap-2">
            <Button
              onClick={handleHighlight}
              className="flex-1 bg-[#F3C77A] text-black hover:bg-[#FFD88A]"
            >
              <Save className="h-4 w-4 mr-2" />
              Marcar
            </Button>
            <Button
              onClick={onCancel}
              variant="outline"
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>

          {/* Marcações existentes na página */}
          {pageHighlights.length > 0 && (
            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-2">Marcações nesta página:</p>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {pageHighlights.map((highlight) => (
                  <div
                    key={highlight.id}
                    className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {highlight.text_content}
                      </p>
                      {highlight.note && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                          Nota: {highlight.note}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onUpdateHighlight(highlight.id, highlight.note || '')}
                        className="h-6 w-6 p-0"
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDeleteHighlight(highlight.id)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
