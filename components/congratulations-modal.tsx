"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, BookOpen, Clock, Target, Sparkles, Share2 } from "lucide-react"
import { checkCourseCompletion, markCourseAsCompleted, hasUserBeenCongratulated, generateCongratulationsMessage } from "@/lib/course-completion"
import { useCurrentUser } from "@/hooks/use-current-user"

interface CongratulationsModalProps {
  courseId: string
  courseTitle: string
  isOpen: boolean
  onClose: () => void
}

export function CongratulationsModal({ 
  courseId, 
  courseTitle, 
  isOpen, 
  onClose 
}: CongratulationsModalProps) {
  const { user } = useCurrentUser()
  const [completionData, setCompletionData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sharing, setSharing] = useState(false)

  useEffect(() => {
    if (isOpen && user && courseId) {
      loadCompletionData()
    }
  }, [isOpen, user, courseId])

  const loadCompletionData = async () => {
    if (!user) return

    setLoading(true)
    try {
      const data = await checkCourseCompletion(user.id, courseId)
      if (data && data.isCompleted) {
        setCompletionData(data)
        
        // Verificar se já foi parabenizado
        const alreadyCongratulated = await hasUserBeenCongratulated(user.id, courseId)
        
        if (!alreadyCongratulated) {
          // Marcar como concluído
          await markCourseAsCompleted(user.id, courseId)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados de conclusão:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async () => {
    setSharing(true)
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Concluí o curso "${courseTitle}"!`,
          text: `Acabei de concluir o curso "${courseTitle}" na plataforma As Cartas de Paulo! 🎓`,
          url: window.location.origin
        })
      } else {
        // Fallback para copiar para clipboard
        const text = `Concluí o curso "${courseTitle}" na As Cartas de Paulo! 🎓`
        await navigator.clipboard.writeText(text)
        alert('Link copiado para a área de transferência!')
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error)
    } finally {
      setSharing(false)
    }
  }

  if (!completionData) {
    return null
  }

  const congratulations = generateCongratulationsMessage(courseTitle, completionData)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-gradient-to-br from-[#F3C77A] to-[#FFD88A] border-0">
        <DialogHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
                <Trophy className="w-10 h-10 text-[#F3C77A]" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
          
          <DialogTitle className="text-3xl font-bold text-black mb-2">
            {congratulations.title}
          </DialogTitle>
          
          <p className="text-lg text-gray-800 leading-relaxed">
            {congratulations.message}
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Estatísticas de Conclusão */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-black mb-4 text-center">
                📊 Suas Estatísticas
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-[#F3C77A]/20 rounded-lg">
                  <BookOpen className="w-8 h-8 text-[#F3C77A] mx-auto mb-2" />
                  <p className="text-2xl font-bold text-black">
                    {completionData.pagesRead}
                  </p>
                  <p className="text-sm text-gray-700">
                    de {completionData.totalPages} páginas
                  </p>
                </div>
                
                <div className="text-center p-4 bg-[#F3C77A]/20 rounded-lg">
                  <Clock className="w-8 h-8 text-[#F3C77A] mx-auto mb-2" />
                  <p className="text-2xl font-bold text-black">
                    {Math.round(completionData.minutesRead)}
                  </p>
                  <p className="text-sm text-gray-700">
                    minutos de estudo
                  </p>
                </div>
              </div>
              
              <div className="mt-4 text-center">
                <Badge variant="secondary" className="bg-[#F3C77A] text-black px-4 py-2 text-lg">
                  <Target className="w-4 h-4 mr-2" />
                  {Math.round(completionData.completionPercentage)}% Concluído
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Mensagem de Incentivo */}
          <div className="text-center p-6 bg-white/80 rounded-lg">
            <h4 className="text-lg font-semibold text-black mb-2">
              🎯 Continue sua jornada de estudos!
            </h4>
            <p className="text-gray-700">
              Cada curso concluído é um passo importante no seu crescimento espiritual. 
              Que tal explorar outros cursos disponíveis?
            </p>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-4 justify-center">
            <Button
              onClick={handleShare}
              disabled={sharing}
              className="bg-white text-[#F3C77A] hover:bg-gray-100 border-2 border-[#F3C77A] px-6 py-3"
            >
              <Share2 className="w-4 h-4 mr-2" />
              {sharing ? 'Compartilhando...' : 'Compartilhar Conquista'}
            </Button>
            
            <Button
              onClick={onClose}
              className="bg-[#F3C77A] text-black hover:bg-[#FFD88A] px-8 py-3 font-semibold"
            >
              Continuar Estudando
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
