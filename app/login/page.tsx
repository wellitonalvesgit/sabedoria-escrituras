"use client"

import { useState, useEffect } from "react"
import { Eye, EyeOff, BookOpen, Mail, Lock, ArrowRight, Loader2, CheckCircle, XCircle, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { signIn, resetPassword } from "@/lib/auth"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [activeTab, setActiveTab] = useState("password")
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("")
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false)

  // Countdown para reenvio de link mágico
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const { user, error } = await signIn(email, password)

      if (error) {
        setError(error.message)
        return
      }

      if (user) {
        // Verificar se o usuário tem todos os dados necessários
        if (!user.role || !user.status) {
          setError("Dados do usuário incompletos. Entre em contato com o administrador.")
          return
        }

        setSuccess("Login realizado com sucesso! Redirecionando...")
        
        // Redirecionar baseado no role do usuário
        const redirectPath = user.role === 'admin' ? '/admin' : '/dashboard'
        console.log('🔄 Redirecionando para:', redirectPath)
        
        setTimeout(() => {
          window.location.href = redirectPath
        }, 1500)
      }
    } catch (err) {
      setError("Erro ao fazer login")
    } finally {
      setLoading(false)
    }
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(data.message)
        setMagicLinkSent(true)
        setCountdown(60) // 60 segundos de cooldown
      } else {
        setError(data.error || 'Erro ao enviar link mágico')
      }
    } catch (err) {
      setError("Erro ao enviar link mágico")
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotPasswordLoading(true)
    setError("")
    setSuccess("")

    try {
      const { error } = await resetPassword(forgotPasswordEmail)

      if (error) {
        setError(error.message)
      } else {
        setSuccess("Email de recuperação enviado! Verifique sua caixa de entrada.")
        setShowForgotPassword(false)
        setForgotPasswordEmail("")
      }
    } catch (err) {
      setError("Erro ao enviar email de recuperação")
    } finally {
      setForgotPasswordLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-[#F3C77A] to-[#FFD88A] shadow-lg">
              <BookOpen className="h-6 w-6 text-gray-800" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Sabedoria das Escrituras
              </h1>
              <p className="text-sm text-muted-foreground">Plataforma de Estudos Bíblicos</p>
            </div>
          </div>
          <CardTitle className="text-3xl font-bold mb-2">Bem-vindo de volta!</CardTitle>
          <p className="text-muted-foreground">
            Escolha sua forma preferida de acesso
          </p>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-100 dark:bg-gray-800">
              <TabsTrigger value="password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Senha
              </TabsTrigger>
              <TabsTrigger value="magic" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Link Mágico
              </TabsTrigger>
            </TabsList>

            {/* Login com Senha */}
            <TabsContent value="password" className="space-y-6">
              <form onSubmit={handleLogin} className="space-y-6">
                {error && (
                  <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-950">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription className="text-green-800 dark:text-green-200">
                      {success}
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 border-gray-200 focus:border-[#F3C77A] focus:ring-[#F3C77A]"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Sua senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-12 border-gray-200 focus:border-[#F3C77A] focus:ring-[#F3C77A]"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-[#F3C77A] to-[#FFD88A] hover:from-[#FFD88A] hover:to-[#F3C77A] text-gray-800 font-semibold shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verificando credenciais...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Entrar na Plataforma
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <Button
                    type="button"
                    variant="link"
                    className="text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => setShowForgotPassword(true)}
                  >
                    Esqueci minha senha
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* Login com Link Mágico */}
            <TabsContent value="magic" className="space-y-6">
              <form onSubmit={handleMagicLink} className="space-y-6">
                {error && (
                  <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-950">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription className="text-green-800 dark:text-green-200">
                      {success}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-3">
                  <Label htmlFor="magic-email" className="text-sm font-medium">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="magic-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 border-gray-200 focus:border-[#F3C77A] focus:ring-[#F3C77A]"
                      required
                    />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Sparkles className="h-4 w-4" />
                    <span>Enviaremos um link de acesso seguro para seu email</span>
                  </div>
                </div>

                {magicLinkSent && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-medium">Link enviado com sucesso!</span>
                    </div>
                    <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                      Verifique sua caixa de entrada e spam. O link expira em 1 hora.
                    </p>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold shadow-lg transition-all duration-200" 
                  disabled={loading || countdown > 0}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : countdown > 0 ? (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Reenviar em {countdown}s
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Enviar Link Mágico
                    </>
                  )}
                </Button>

                {countdown > 0 && (
                  <div className="text-center">
                    <Badge variant="secondary" className="text-xs">
                      Aguarde {countdown} segundos para reenviar
                    </Badge>
                  </div>
                )}
              </form>
            </TabsContent>
          </Tabs>


          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center space-y-4">
              <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
                <Link href="/landing" className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 rotate-180" />
                  Voltar ao Início
                </Link>
              </Button>
              
              <div className="text-xs text-muted-foreground">
                <p>Problemas para acessar? Entre em contato conosco</p>
                <p className="mt-1">
                  <span className="font-medium">Suporte:</span> ascartasdepailoo@gmail.com
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal Esqueci Senha */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Recuperar Senha</CardTitle>
              <p className="text-muted-foreground">
                Digite seu email para receber instruções de recuperação
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription className="text-green-800 dark:text-green-200">
                      {success}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="forgot-email">Email</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowForgotPassword(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={forgotPasswordLoading}
                  >
                    {forgotPasswordLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      'Enviar Email'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
