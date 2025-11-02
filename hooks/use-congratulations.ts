"use client"

import { useState, useEffect, useCallback } from "react"
import { checkCourseCompletion, hasUserBeenCongratulated } from "@/lib/course-completion"
import { useCurrentUser } from "@/hooks/use-current-user"

interface CongratulationsState {
  showModal: boolean
  courseId: string | null
  courseTitle: string | null
  completionData: any | null
}

export function useCongratulations() {
  const { user } = useCurrentUser()
  const [state, setState] = useState<CongratulationsState>({
    showModal: false,
    courseId: null,
    courseTitle: null,
    completionData: null
  })

  const checkForCompletion = useCallback(async (courseId: string, courseTitle: string) => {
    if (!user) return

    try {
      // Verificar se já foi parabenizado recentemente
      const alreadyCongratulated = await hasUserBeenCongratulated(user.id, courseId)
      if (alreadyCongratulated) return

      // Verificar conclusão do curso
      const completionData = await checkCourseCompletion(user.id, courseId)
      
      if (completionData && completionData.isCompleted) {
        setState({
          showModal: true,
          courseId,
          courseTitle,
          completionData
        })
      }
    } catch (error) {
      console.error('Erro ao verificar conclusão:', error)
    }
  }, [user])

  const closeModal = useCallback(() => {
    setState(prev => ({
      ...prev,
      showModal: false,
      courseId: null,
      courseTitle: null,
      completionData: null
    }))
  }, [])

  // Verificar conclusão quando o usuário muda
  useEffect(() => {
    if (user) {
      // Aqui você pode adicionar lógica para verificar todos os cursos do usuário
      // Por exemplo, quando o usuário faz login ou volta à página
    }
  }, [user])

  return {
    ...state,
    checkForCompletion,
    closeModal
  }
}
