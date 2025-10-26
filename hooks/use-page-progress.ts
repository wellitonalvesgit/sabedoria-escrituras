"use client"

import { useState, useEffect, useCallback } from 'react'

interface PageProgress {
  currentPage: number
  pdfId: string | null
  progressPercentage: number
  status: 'not_started' | 'in_progress' | 'completed'
}

interface UsePageProgressReturn {
  currentPage: number
  pdfId: string | null
  progressPercentage: number
  status: string
  isLoading: boolean
  savePageProgress: (courseId: string, pdfId: string | null, currentPage: number, totalPages: number) => Promise<boolean>
  loadPageProgress: (courseId: string, pdfId?: string | null) => Promise<void>
}

/**
 * Hook para gerenciar o progresso de páginas do usuário
 * Permite salvar e carregar a última página lida
 */
export function usePageProgress(): UsePageProgressReturn {
  const [currentPage, setCurrentPage] = useState(1)
  const [pdfId, setPdfId] = useState<string | null>(null)
  const [progressPercentage, setProgressPercentage] = useState(0)
  const [status, setStatus] = useState<string>('not_started')
  const [isLoading, setIsLoading] = useState(false)

  /**
   * Salva a página atual do usuário
   */
  const savePageProgress = useCallback(async (
    courseId: string, 
    pdfId: string | null, 
    currentPage: number, 
    totalPages: number
  ): Promise<boolean> => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/progress/save-page', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId,
          pdfId,
          currentPage,
          totalPages
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('Erro ao salvar progresso:', error)
        return false
      }

      const result = await response.json()
      
      if (result.success) {
        setCurrentPage(currentPage)
        setPdfId(pdfId)
        setProgressPercentage(result.data.progressPercentage)
        console.log(`✅ Página ${currentPage} salva com sucesso!`)
        return true
      }

      return false
    } catch (error) {
      console.error('Erro ao salvar progresso da página:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Carrega a última página lida do usuário
   */
  const loadPageProgress = useCallback(async (
    courseId: string, 
    pdfId?: string | null
  ): Promise<void> => {
    try {
      setIsLoading(true)
      
      const params = new URLSearchParams({
        courseId,
        ...(pdfId && { pdfId })
      })

      const response = await fetch(`/api/progress/save-page?${params}`)

      if (!response.ok) {
        const error = await response.json()
        console.error('Erro ao carregar progresso:', error)
        return
      }

      const result = await response.json()
      
      if (result.success) {
        const data: PageProgress = result.data
        setCurrentPage(data.currentPage)
        setPdfId(data.pdfId)
        setProgressPercentage(data.progressPercentage)
        setStatus(data.status)
        
        console.log(`📖 Última página lida: ${data.currentPage} (${data.progressPercentage.toFixed(1)}%)`)
      }
    } catch (error) {
      console.error('Erro ao carregar progresso da página:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    currentPage,
    pdfId,
    progressPercentage,
    status,
    isLoading,
    savePageProgress,
    loadPageProgress,
  }
}
