"use client"

import { useState, useEffect } from "react"
import { Eye, EyeOff, BookOpen, Mail, Lock, ArrowRight, Loader2, CheckCircle, XCircle, Sparkles, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { signIn, signUp, resetPassword, sendMagicLink } from "@/lib/auth"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [magicLinkLoading, setMagicLinkLoading] = useState(false)
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false)
  const [registerLoading, setRegisterLoading] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null)


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setAlert(null)

    try {
      const result = await signIn(email, password)
      if (result.success) {
        setAlert({ type: 'success', message: 'Login realizado com sucesso!' })
        // Redirecionar para dashboard após um breve delay
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 1000)
      } else {
        setAlert({ type: 'error', message: result.error || 'Erro ao fazer login' })
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Erro inesperado ao fazer login' })
    } finally {
      setLoading(false)
    }
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setMagicLinkLoading(true)
    setAlert(null)

    try {
      const result = await sendMagicLink(email)
      if (result.success) {
        setAlert({ type: 'success', message: 'Link mágico enviado! Verifique seu email.' })
      } else {
        setAlert({ type: 'error', message: result.error || 'Erro ao enviar link mágico' })
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Erro inesperado ao enviar link mágico' })
    } finally {
      setMagicLinkLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotPasswordLoading(true)
    setAlert(null)

    try {
      const result = await resetPassword(email)
      if (result.success) {
        setAlert({ type: 'success', message: 'Email de recuperação enviado!' })
        setShowForgotPassword(false)
      } else {
        setAlert({ type: 'error', message: result.error || 'Erro ao enviar email de recuperação' })
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Erro inesperado ao enviar email de recuperação' })
    } finally {
      setForgotPasswordLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegisterLoading(true)
    setAlert(null)

    try {
      const result = await signUp(email, password, name)
      if (result.success) {
        setAlert({ type: 'success', message: 'Conta criada com sucesso! Verifique seu email para confirmar.' })
      } else {
        setAlert({ type: 'error', message: result.error || 'Erro ao criar conta' })
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Erro inesperado ao criar conta' })
    } finally {
      setRegisterLoading(false)
    }
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2c3e50] via-[#34495e] to-[#2c3e50] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <BookOpen className="h-12 w-12 text-[#F3C77A] mr-3" />
            <h1 className="text-3xl font-bold text-white">Sabedoria das Escrituras</h1>
          </div>
          <p className="text-gray-300">Acesse sua conta e continue sua jornada espiritual</p>
        </div>

        {/* Alert */}
        {alert && (
          <Alert className={`mb-6 ${alert.type === 'success' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
            <div className="flex items-center">
              {alert.type === 'success' ? (
                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600 mr-2" />
              )}
              <AlertDescription className={alert.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                {alert.message}
              </AlertDescription>
            </div>
          </Alert>
        )}

        {/* Login Form */}
        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-[#2c3e50] flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-[#F3C77A] mr-2" />
              Acesso à Plataforma
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="login" className="text-sm">Login</TabsTrigger>
                <TabsTrigger value="register" className="text-sm">Cadastro</TabsTrigger>
                <TabsTrigger value="magic" className="text-sm">Link Mágico</TabsTrigger>
              </TabsList>

              {/* Login com Senha */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[#2c3e50] font-medium">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 bg-white border-gray-200 focus:border-[#F3C77A] focus:ring-[#F3C77A]"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-[#2c3e50] font-medium">
                      Senha
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Sua senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 bg-white border-gray-200 focus:border-[#F3C77A] focus:ring-[#F3C77A]"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm text-[#F3C77A] hover:text-[#e6b366] transition-colors"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-[#F3C77A] hover:bg-[#e6b366] text-[#2c3e50] font-medium py-2.5"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <ArrowRight className="h-4 w-4 mr-2" />
                    )}
                    {loading ? "Entrando..." : "Entrar"}
                  </Button>
                </form>
              </TabsContent>


              {/* Cadastro */}
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name" className="text-[#2c3e50] font-medium">
                      Nome Completo
                    </Label>
                    <div className="relative">
                      <UserPlus className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="register-name"
                        type="text"
                        placeholder="Seu nome completo"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-10 bg-white border-gray-200 focus:border-[#F3C77A] focus:ring-[#F3C77A]"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email" className="text-[#2c3e50] font-medium">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 bg-white border-gray-200 focus:border-[#F3C77A] focus:ring-[#F3C77A]"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="text-[#2c3e50] font-medium">
                      Senha
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="register-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Mínimo 6 caracteres"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 bg-white border-gray-200 focus:border-[#F3C77A] focus:ring-[#F3C77A]"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-800">
                      <strong>Benefícios:</strong> Acesso completo a todos os cursos, 
                      progresso salvo automaticamente e suporte prioritário.
                    </p>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-[#F3C77A] hover:bg-[#e6b366] text-[#2c3e50] font-medium py-2.5"
                    disabled={registerLoading}
                  >
                    {registerLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <UserPlus className="h-4 w-4 mr-2" />
                    )}
                    {registerLoading ? "Criando conta..." : "Criar Conta"}
                  </Button>
                </form>
              </TabsContent>

              {/* Link Mágico */}
              <TabsContent value="magic">
                <form onSubmit={handleMagicLink} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="magic-email" className="text-[#2c3e50] font-medium">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="magic-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 bg-white border-gray-200 focus:border-[#F3C77A] focus:ring-[#F3C77A]"
                        required
                      />
                    </div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>Como funciona:</strong> Enviaremos um link especial para seu email cadastrado. 
                      Clique no link para fazer login automaticamente, sem precisar de senha.
                    </p>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-[#F3C77A] hover:bg-[#e6b366] text-[#2c3e50] font-medium py-2.5"
                    disabled={magicLinkLoading}
                  >
                    {magicLinkLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Mail className="h-4 w-4 mr-2" />
                    )}
                    {magicLinkLoading ? "Enviando..." : "Enviar Link Mágico"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-400 text-sm">
            Precisa de ajuda?{" "}
            <Link href="/support" className="text-[#F3C77A] hover:text-[#e6b366] transition-colors">
              Entre em contato
            </Link>
          </p>
        </div>
      </div>

      {/* Modal de Recuperação de Senha */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-white">
            <CardHeader>
              <CardTitle className="text-center text-[#2c3e50]">Recuperar Senha</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email" className="text-[#2c3e50] font-medium">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-white border-gray-200 focus:border-[#F3C77A] focus:ring-[#F3C77A]"
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForgotPassword(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-[#F3C77A] hover:bg-[#e6b366] text-[#2c3e50]"
                    disabled={forgotPasswordLoading}
                  >
                    {forgotPasswordLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Enviar"
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
