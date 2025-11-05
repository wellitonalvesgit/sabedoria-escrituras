"use client"

import { useEffect } from "react"

export default function Home() {
  // Redirecionar para login
  useEffect(() => {
    window.location.href = '/login'
  }, [])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex items-center gap-2">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        <span>Redirecionando para login...</span>
      </div>
    </div>
  )
}