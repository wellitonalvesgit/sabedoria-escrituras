"use client"

import { useState, useEffect } from "react"
import { User, Mail, Phone, MapPin, Calendar, Shield, Key, Bell, Camera, Save, Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { useCurrentUser } from "@/hooks/use-current-user"

interface UserProfile {
  id: string
  name: string
  email: string
  cpf?: string
  phone?: string
  avatar_url?: string
  bio?: string
  birth_date?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  role: string
  status: string
  access_days?: number
  access_expires_at?: string
  preferences?: any
  notification_settings?: any
  created_at: string
}

export default function SettingsPage() {
  const { user: currentUser, loading: userLoading, sessionValid } = useCurrentUser()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    cpf: "",
    phone: "",
    bio: "",
    birth_date: "",
    address: "",
    city: "",
    state: "",
    zip_code: ""
  })

  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: ""
  })

  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    course_updates: true,
    system_announcements: true,
    marketing_emails: false,
    push_notifications: true
  })

  const [preferences, setPreferences] = useState({
    theme: "system",
    language: "pt-BR",
    timezone: "America/Sao_Paulo",
    reading_speed: "normal"
  })

  useEffect(() => {
    console.log('🔍 Settings - userLoading:', userLoading, 'currentUser:', currentUser ? 'Presente' : 'Ausente')

    if (!userLoading) {
      if (currentUser) {
        console.log('✅ Settings - Usuário encontrado, carregando perfil...')
        // Converter currentUser para UserProfile
        const userProfile: UserProfile = {
          ...currentUser,
          cpf: "",
          phone: "",
          bio: "",
          birth_date: "",
          address: "",
          city: "",
          state: "",
          zip_code: "",
          preferences: {},
          notification_settings: {}
        }

        setUser(userProfile)
        setProfileData({
          name: userProfile.name,
          email: userProfile.email,
          cpf: userProfile.cpf || "",
          phone: userProfile.phone || "",
          bio: userProfile.bio || "",
          birth_date: userProfile.birth_date || "",
          address: userProfile.address || "",
          city: userProfile.city || "",
          state: userProfile.state || "",
          zip_code: userProfile.zip_code || ""
        })
        setLoading(false)
      } else {
        console.log('❌ Settings - Usuário não encontrado')
        setError("Usuário não encontrado. Por favor, faça login novamente.")
        setLoading(false)
      }
    }
  }, [userLoading, currentUser])

  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      if (!user) {
        setError("Usuário não autenticado")
        return
      }

      // Atualizar perfil via API (server-side com SERVICE_ROLE_KEY)
      const response = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: profileData.name,
          email: profileData.email
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar perfil')
      }

      setSuccess("Perfil atualizado com sucesso!")

      // Atualizar o estado local com os novos dados
      setUser(prev => prev ? {
        ...prev,
        name: profileData.name,
        email: profileData.email
      } : null)
    } catch (err) {
      setError("Erro ao salvar perfil: " + (err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      if (passwordData.new_password !== passwordData.confirm_password) {
        setError("As senhas não coincidem")
        setSaving(false)
        return
      }

      if (passwordData.new_password.length < 6) {
        setError("A senha deve ter pelo menos 6 caracteres")
        setSaving(false)
        return
      }

      // Alterar senha via API (server-side com SERVICE_ROLE_KEY)
      const response = await fetch('/api/profile/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: passwordData.current_password,
          newPassword: passwordData.new_password
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao trocar senha')
      }

      setSuccess("Senha alterada com sucesso!")
      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_password: ""
      })
    } catch (err) {
      setError("Erro ao alterar senha: " + (err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleRequestPasswordReset = async () => {
    try {
      setSaving(true)
      setError(null)

      if (!user?.email) {
        setError("Email do usuário não encontrado")
        setSaving(false)
        return
      }

      // Enviar email de recuperação real
      const { resetPassword } = await import('@/lib/auth')
      const { error } = await resetPassword(user.email)

      if (error) {
        throw error
      }

      setSuccess("Email de recuperação enviado! Verifique sua caixa de entrada.")
    } catch (err) {
      setError("Erro ao enviar email de recuperação: " + (err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleGenerateMagicLink = async () => {
    try {
      setSaving(true)
      setError(null)

      if (!user?.email) {
        setError("Email do usuário não encontrado")
        setSaving(false)
        return
      }

      // Gerar magic link real
      const { sendMagicLink } = await import('@/lib/auth')
      const { error } = await sendMagicLink(user.email)

      if (error) {
        throw error
      }

      setSuccess("Link mágico enviado! Verifique sua caixa de entrada.")
    } catch (err) {
      setError("Erro ao gerar link mágico: " + (err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Carregando configurações...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Usuário não encontrado</h1>
          <p className="text-muted-foreground mb-4">Faça login para acessar suas configurações</p>
          <Link href="/landing">
            <Button>Fazer Login</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <span className="text-xl font-semibold tracking-tight">Configurações</span>
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  Voltar ao Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-500 bg-green-500/10">
            <AlertDescription className="text-green-600">{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="relative">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-10 w-10 text-primary" />
                    </div>
                    <Button
                      size="sm"
                      className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{user.name}</h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <Badge variant="outline" className="mt-2">
                      {user.role === 'admin' ? 'Administrador' : 
                       user.role === 'moderator' ? 'Moderador' : 'Aluno'}
                    </Badge>
                  </div>
                  <div className="w-full space-y-2 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className={user.status === 'active' ? 'text-green-600' : 'text-red-600'}>
                        {user.status === 'active' ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Acesso:</span>
                      <span>{user.access_days || 30} dias</span>
                    </div>
                    {user.access_expires_at && (
                      <div className="flex justify-between">
                        <span>Expira:</span>
                        <span>{new Date(user.access_expires_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="profile" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profile">Perfil</TabsTrigger>
                <TabsTrigger value="security">Segurança</TabsTrigger>
                <TabsTrigger value="notifications">Notificações</TabsTrigger>
                <TabsTrigger value="preferences">Preferências</TabsTrigger>
              </TabsList>

              {/* Perfil */}
              <TabsContent value="profile" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Informações Pessoais
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome Completo</Label>
                        <Input
                          id="name"
                          value={profileData.name}
                          onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cpf">CPF</Label>
                        <Input
                          id="cpf"
                          value={profileData.cpf}
                          onChange={(e) => setProfileData(prev => ({ ...prev, cpf: e.target.value }))}
                          placeholder="000.000.000-00"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefone</Label>
                        <Input
                          id="phone"
                          value={profileData.phone}
                          onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="(00) 00000-0000"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="birth_date">Data de Nascimento</Label>
                        <Input
                          id="birth_date"
                          type="date"
                          value={profileData.birth_date}
                          onChange={(e) => setProfileData(prev => ({ ...prev, birth_date: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Biografia</Label>
                      <Textarea
                        id="bio"
                        value={profileData.bio}
                        onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                        placeholder="Conte um pouco sobre você..."
                        rows={3}
                      />
                    </div>

                    <Separator />

                    <h4 className="font-semibold flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Endereço
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2 space-y-2">
                        <Label htmlFor="address">Endereço</Label>
                        <Input
                          id="address"
                          value={profileData.address}
                          onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                          placeholder="Rua, número, complemento"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="city">Cidade</Label>
                        <Input
                          id="city"
                          value={profileData.city}
                          onChange={(e) => setProfileData(prev => ({ ...prev, city: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="state">Estado</Label>
                        <Input
                          id="state"
                          value={profileData.state}
                          onChange={(e) => setProfileData(prev => ({ ...prev, state: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="zip_code">CEP</Label>
                        <Input
                          id="zip_code"
                          value={profileData.zip_code}
                          onChange={(e) => setProfileData(prev => ({ ...prev, zip_code: e.target.value }))}
                          placeholder="00000-000"
                        />
                      </div>
                    </div>

                    <Button onClick={handleSaveProfile} disabled={saving} className="w-full">
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Salvar Perfil
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Segurança */}
              <TabsContent value="security" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Alterar Senha
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current_password">Senha Atual</Label>
                      <div className="relative">
                        <Input
                          id="current_password"
                          type={showPassword ? "text" : "password"}
                          value={passwordData.current_password}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, current_password: e.target.value }))}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new_password">Nova Senha</Label>
                      <Input
                        id="new_password"
                        type="password"
                        value={passwordData.new_password}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm_password">Confirmar Nova Senha</Label>
                      <Input
                        id="confirm_password"
                        type="password"
                        value={passwordData.confirm_password}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirm_password: e.target.value }))}
                      />
                    </div>

                    <Button onClick={handleChangePassword} disabled={saving} className="w-full">
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Alterando...
                        </>
                      ) : (
                        <>
                          <Key className="mr-2 h-4 w-4" />
                          Alterar Senha
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Recuperação de Senha
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Se você esqueceu sua senha, podemos enviar um link de recuperação para seu email.
                    </p>
                    <Button onClick={handleRequestPasswordReset} disabled={saving} variant="outline" className="w-full">
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Mail className="mr-2 h-4 w-4" />
                          Enviar Link de Recuperação
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="h-5 w-5" />
                      Link Mágico
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Gere um link mágico para fazer login sem senha. O link será enviado para seu email.
                    </p>
                    <Button onClick={handleGenerateMagicLink} disabled={saving} variant="outline" className="w-full">
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Gerando...
                        </>
                      ) : (
                        <>
                          <Key className="mr-2 h-4 w-4" />
                          Gerar Link Mágico
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Notificações */}
              <TabsContent value="notifications" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      Configurações de Notificação
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Notificações por Email</h4>
                        <p className="text-sm text-muted-foreground">Receber notificações importantes por email</p>
                      </div>
                      <Switch
                        checked={notificationSettings.email_notifications}
                        onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, email_notifications: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Atualizações de Cursos</h4>
                        <p className="text-sm text-muted-foreground">Notificar sobre novos conteúdos e atualizações</p>
                      </div>
                      <Switch
                        checked={notificationSettings.course_updates}
                        onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, course_updates: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Anúncios do Sistema</h4>
                        <p className="text-sm text-muted-foreground">Receber anúncios importantes da plataforma</p>
                      </div>
                      <Switch
                        checked={notificationSettings.system_announcements}
                        onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, system_announcements: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Emails de Marketing</h4>
                        <p className="text-sm text-muted-foreground">Receber ofertas e novidades (opcional)</p>
                      </div>
                      <Switch
                        checked={notificationSettings.marketing_emails}
                        onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, marketing_emails: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Notificações Push</h4>
                        <p className="text-sm text-muted-foreground">Receber notificações no navegador</p>
                      </div>
                      <Switch
                        checked={notificationSettings.push_notifications}
                        onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, push_notifications: checked }))}
                      />
                    </div>

                    <Button onClick={handleSaveProfile} disabled={saving} className="w-full">
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Salvar Configurações
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Preferências */}
              <TabsContent value="preferences" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Preferências Gerais</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="theme">Tema</Label>
                      <Select value={preferences.theme} onValueChange={(value) => setPreferences(prev => ({ ...prev, theme: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Claro</SelectItem>
                          <SelectItem value="dark">Escuro</SelectItem>
                          <SelectItem value="system">Sistema</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="language">Idioma</Label>
                      <Select value={preferences.language} onValueChange={(value) => setPreferences(prev => ({ ...prev, language: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                          <SelectItem value="en-US">English (US)</SelectItem>
                          <SelectItem value="es-ES">Español</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="timezone">Fuso Horário</Label>
                      <Select value={preferences.timezone} onValueChange={(value) => setPreferences(prev => ({ ...prev, timezone: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="America/Sao_Paulo">São Paulo (GMT-3)</SelectItem>
                          <SelectItem value="America/New_York">New York (GMT-5)</SelectItem>
                          <SelectItem value="Europe/London">Londres (GMT+0)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reading_speed">Velocidade de Leitura</Label>
                      <Select value={preferences.reading_speed} onValueChange={(value) => setPreferences(prev => ({ ...prev, reading_speed: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="slow">Lenta</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="fast">Rápida</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button onClick={handleSaveProfile} disabled={saving} className="w-full">
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Salvar Preferências
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
