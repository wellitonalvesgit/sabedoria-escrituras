"use client"

import { useCurrentUser } from '@/hooks/use-current-user'
import { sessionManager } from '@/lib/session'
import { useEffect, useState } from 'react'

export default function AdminTestPage() {
  const { user, loading } = useCurrentUser()
  const [refreshCount, setRefreshCount] = useState(0)

  const handleRefreshUserData = async () => {
    await sessionManager.refreshUserData()
    setRefreshCount(prev => prev + 1)
  }

  const handleInvalidateCache = () => {
    sessionManager.invalidateCache()
    setRefreshCount(prev => prev + 1)
  }

  if (loading) {
    return <div className="p-8">Carregando...</div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Teste de Acesso Administrativo</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">Dados do Usuário Atual:</h2>
        <pre className="text-sm">
          {JSON.stringify({
            id: user?.id,
            email: user?.email,
            role: user?.role,
            status: user?.status,
            refreshCount
          }, null, 2)}
        </pre>
      </div>

      <div className="space-y-4">
        <button
          onClick={handleRefreshUserData}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Atualizar Dados do Usuário
        </button>
        
        <button
          onClick={handleInvalidateCache}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 ml-4"
        >
          Limpar Cache
        </button>
      </div>

      <div className="mt-6">
        {user?.role === 'admin' ? (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            ✅ Usuário tem acesso administrativo
          </div>
        ) : (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            ❌ Usuário NÃO tem acesso administrativo (Role: {user?.role})
          </div>
        )}
      </div>

      <div className="mt-6">
        <a 
          href="/admin" 
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
        >
          Ir para /admin
        </a>
      </div>
    </div>
  )
}
