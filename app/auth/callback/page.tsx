"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, XCircle, ArrowRight } from "lucide-react"
import Link from "next/link"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    handleAuthCallback()
  }, [])

  const handleAuthCallback = async () => {
    try {
      setStatus('loading')
      setMessage('Processando autenticação...')

      // Verificar se há um código de autorização na URL
      const code = searchParams.get('code')
      const error = searchParams.get('error')
      const errorDescription = searchParams.get('error_description')

      if (error) {
        throw new Error(errorDescription || error)
      }

      if (!code) {
        throw new Error('Código de autorização não encontrado')
      }

      // Trocar o código por uma sessão
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        throw exchangeError
      }

      if (!data.user) {
        throw new Error('Usuário não encontrado após autenticação')
      }

      setUser(data.user)
      setStatus('success')
      setMessage('Login realizado com sucesso! Redirecionando...')

      // Buscar dados completos do usuário
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (userError) {
        console.error('Erro ao buscar dados do usuário:', userError)
      }

      // Redirecionar baseado no role do usuário
      setTimeout(() => {
        if (userData?.role === 'admin') {
          router.push('/admin')
        } else {
          router.push('/dashboard')
        }
      }, 2000)

    } catch (error) {
      console.error('Erro no callback de autenticação:', error)
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Erro desconhecido')
    }
  }

  const handleRetry = () => {
    router.push('/landing')
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Processando Login</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {status === 'loading' && (
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center space-y-4">
              <CheckCircle className="h-8 w-8 mx-auto text-green-500" />
              <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                <AlertDescription className="text-green-800 dark:text-green-200">
                  {message}
                </AlertDescription>
              </Alert>
              {user && (
                <div className="text-sm text-muted-foreground">
                  <p>Bem-vindo, <strong>{user.email}</strong>!</p>
                </div>
              )}
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-4">
              <XCircle className="h-8 w-8 mx-auto text-red-500" />
              <Alert variant="destructive">
                <AlertDescription>{message}</AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Button onClick={handleRetry} className="w-full">
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Tentar Novamente
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/landing">
                    Voltar ao Início
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
