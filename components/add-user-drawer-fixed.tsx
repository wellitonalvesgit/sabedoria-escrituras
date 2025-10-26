"use client"

import { useState, useEffect } from "react"
import { X, UserPlus, Mail, User, Shield, Calendar, Loader2, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AddUserDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUserAdded: () => void
}

export function AddUserDrawerFixed({ open, onOpenChange, onUserAdded }: AddUserDrawerProps) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [generatedPassword, setGeneratedPassword] = useState("")

  // Form state
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("student")
  const [accessDays, setAccessDays] = useState("30")
  const [sendEmail, setSendEmail] = useState(true)

  // Debug logs
  console.log('🔍 AddUserDrawerFixed renderizado com open:', open)

  const handleClose = () => {
    // Reset form
    setName("")
    setEmail("")
    setRole("student")
    setAccessDays("30")
    setSendEmail(true)
    setError("")
    setSuccess(false)
    setGeneratedPassword("")
    onOpenChange(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)
    setGeneratedPassword("")

    try {
      console.log('🔄 Criando novo usuário...')
      console.log('📝 Dados:', { name, email, role, accessDays, sendEmail })

      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          email,
          role,
          access_days: parseInt(accessDays),
          send_email: sendEmail
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar usuário')
      }

      console.log('✅ Usuário criado:', data)

      setSuccess(true)
      setGeneratedPassword(data.temporary_password)

      // Esperar 3 segundos e fechar
      setTimeout(() => {
        handleClose()
        onUserAdded()
      }, 3000)
    } catch (err) {
      console.error('❌ Erro ao criar usuário:', err)
      setError(err instanceof Error ? err.message : 'Erro ao criar usuário')
    } finally {
      setLoading(false)
    }
  }

  // Se não estiver aberto, não renderizar nada
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-background border border-border rounded-lg shadow-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Adicionar Novo Usuário</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6">
          {/* Success Message */}
          {success && (
            <Alert className="mb-6 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                <div className="space-y-2">
                  <p className="font-semibold">Usuário criado com sucesso!</p>
                  {sendEmail ? (
                    <p className="text-sm">
                      Um email com a senha provisória foi enviado para <strong>{email}</strong>
                    </p>
                  ) : (
                    <div className="text-sm space-y-1">
                      <p>Senha provisória gerada:</p>
                      <code className="block p-2 bg-green-100 dark:bg-green-900 rounded font-mono text-green-900 dark:text-green-100">
                        {generatedPassword}
                      </code>
                      <p className="text-xs text-green-600">
                        Copie esta senha e envie para o usuário
                      </p>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Error Message */}
          {error && (
            <Alert className="mb-6 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
              <AlertDescription className="text-red-800 dark:text-red-200">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="name">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nome Completo
                </div>
              </Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="João da Silva"
                required
                disabled={loading || success}
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </div>
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="joao@exemplo.com"
                required
                disabled={loading || success}
              />
              <p className="text-xs text-muted-foreground">
                Será usado para login
              </p>
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="role">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Tipo de Usuário
                </div>
              </Label>
              <Select value={role} onValueChange={setRole} disabled={loading || success}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Aluno</SelectItem>
                  <SelectItem value="teacher">Professor</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dias de Acesso */}
            <div className="space-y-2">
              <Label htmlFor="accessDays">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Dias de Acesso
                </div>
              </Label>
              <Select value={accessDays} onValueChange={setAccessDays} disabled={loading || success}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 dias (Trial)</SelectItem>
                  <SelectItem value="30">30 dias</SelectItem>
                  <SelectItem value="90">90 dias (3 meses)</SelectItem>
                  <SelectItem value="180">180 dias (6 meses)</SelectItem>
                  <SelectItem value="365">365 dias (1 ano)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Período de acesso à plataforma
              </p>
            </div>

            {/* Enviar Email */}
            <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary" />
                <div>
                  <Label htmlFor="sendEmail" className="text-sm font-medium cursor-pointer">
                    Enviar Email com Senha
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Enviar senha provisória por email
                  </p>
                </div>
              </div>
              <input
                id="sendEmail"
                type="checkbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                disabled={loading || success}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading || success}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : success ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Criado!
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Criar Usuário
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
              ℹ️ Informações Importantes
            </h4>
            <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Uma senha provisória de 8 caracteres será gerada</li>
              <li>• O usuário receberá um email para trocar a senha</li>
              <li>• Status inicial: <strong>Ativo</strong></li>
              <li>• O usuário poderá fazer login imediatamente</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
