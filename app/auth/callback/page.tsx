'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const code = searchParams.get('code')
        
        if (!code) {
          setStatus('error')
          setMessage('Código de confirmação não encontrado')
          return
        }

        // Processar o callback de confirmação
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: code,
          type: 'email'
        })
        
        if (error) {
          console.error('Erro na confirmação:', error)
          setStatus('error')
          setMessage('Erro ao confirmar email: ' + error.message)
          return
        }

        if (data.session) {
          setStatus('success')
          setMessage('Email confirmado com sucesso! Redirecionando...')
          
          // Redirecionar para o dashboard após 2 segundos
          setTimeout(() => {
            router.push('/dashboard')
          }, 2000)
        } else {
          setStatus('error')
          setMessage('Sessão não criada após confirmação')
        }
      } catch (error) {
        console.error('Erro inesperado:', error)
        setStatus('error')
        setMessage('Erro inesperado durante a confirmação')
      }
    }

    handleAuthCallback()
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Confirmando Email...
              </h2>
              <p className="text-gray-600">
                Aguarde enquanto processamos sua confirmação
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Email Confirmado!
              </h2>
              <p className="text-gray-600">
                {message}
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Erro na Confirmação
              </h2>
              <p className="text-gray-600 mb-4">
                {message}
              </p>
              <button
                onClick={() => router.push('/login')}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Voltar ao Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}