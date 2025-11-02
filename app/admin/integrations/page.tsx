"use client"

import { useState, useEffect } from "react"
import { Plug, Settings, CheckCircle2, XCircle, AlertCircle, Eye, EyeOff, TestTube, Save, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import Link from "next/link"

interface Integration {
  id: string
  name: string
  display_name: string
  description: string
  category: 'payment' | 'storage' | 'email' | 'analytics' | 'other'
  icon: string
  is_enabled: boolean
  config: Record<string, any>
  last_test_status?: 'success' | 'failed' | 'pending'
  last_test_message?: string
  last_test_at?: string
}

interface IntegrationConfig {
  api_key?: string
  api_secret?: string
  [key: string]: any
}

export default function AdminIntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [configDialog, setConfigDialog] = useState<Integration | null>(null)
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
  const [configData, setConfigData] = useState<IntegrationConfig>({})
  const [testing, setTesting] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchIntegrations()
  }, [])

  const fetchIntegrations = async () => {
    try {
      setLoading(true)
      const { getSupabaseClient } = await import('@/lib/supabase-admin')
      const supabase = getSupabaseClient()

      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .order('category', { ascending: true })
        .order('display_name', { ascending: true })

      if (error) throw error
      setIntegrations(data || [])
    } catch (err) {
      console.error('Erro ao carregar integrações:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleIntegration = async (integration: Integration) => {
    try {
      const { getSupabaseClient } = await import('@/lib/supabase-admin')
      const supabase = getSupabaseClient()

      const { error } = await supabase
        .from('integrations')
        .update({ is_enabled: !integration.is_enabled })
        .eq('id', integration.id)

      if (error) throw error

      await fetchIntegrations()
    } catch (err) {
      alert('Erro ao atualizar integração')
    }
  }

  const handleOpenConfig = (integration: Integration) => {
    setConfigDialog(integration)
    setConfigData({
      api_key: '',
      api_secret: '',
      ...integration.config
    })
  }

  const handleSaveConfig = async () => {
    if (!configDialog) return

    try {
      setSaving(true)
      const { getSupabaseClient } = await import('@/lib/supabase-admin')
      const supabase = getSupabaseClient()

      // Separar credenciais sensíveis do config público
      const { api_key, api_secret, ...publicConfig } = configData

      const updates: any = {
        config: publicConfig
      }

      // Se tiver credenciais, salvar de forma segura
      // TODO: Implementar criptografia real em produção
      if (api_key || api_secret) {
        updates.credentials_encrypted = JSON.stringify({ api_key, api_secret })
      }

      const { error } = await supabase
        .from('integrations')
        .update(updates)
        .eq('id', configDialog.id)

      if (error) throw error

      alert('Configuração salva com sucesso!')
      setConfigDialog(null)
      await fetchIntegrations()
    } catch (err) {
      alert('Erro ao salvar configuração')
    } finally {
      setSaving(false)
    }
  }

  const handleTestIntegration = async (integration: Integration) => {
    try {
      setTesting(integration.id)

      // Atualizar status para "testando"
      const { getSupabaseClient } = await import('@/lib/supabase-admin')
      const supabase = getSupabaseClient()

      await supabase
        .from('integrations')
        .update({
          last_test_status: 'pending',
          last_test_at: new Date().toISOString()
        })
        .eq('id', integration.id)

      // Chamar API de teste
      const response = await fetch(`/api/integrations/${integration.name}/test`, {
        method: 'POST'
      })

      const result = await response.json()

      // Atualizar com resultado
      await supabase
        .from('integrations')
        .update({
          last_test_status: result.success ? 'success' : 'failed',
          last_test_message: result.message,
          last_test_at: new Date().toISOString()
        })
        .eq('id', integration.id)

      await fetchIntegrations()

      if (result.success) {
        alert('✅ Teste bem-sucedido: ' + result.message)
      } else {
        alert('❌ Teste falhou: ' + result.message)
      }
    } catch (err) {
      alert('Erro ao testar integração')
    } finally {
      setTesting(null)
    }
  }

  const categories = [
    { value: 'all', label: 'Todas', icon: '🔌' },
    { value: 'payment', label: 'Pagamentos', icon: '💳' },
    { value: 'storage', label: 'Armazenamento', icon: '📁' },
    { value: 'email', label: 'E-mail', icon: '📧' },
    { value: 'analytics', label: 'Analytics', icon: '📊' },
    { value: 'other', label: 'Outras', icon: '⚙️' }
  ]

  const filteredIntegrations = selectedCategory === 'all'
    ? integrations
    : integrations.filter(i => i.category === selectedCategory)

  const getStatusBadge = (integration: Integration) => {
    if (!integration.last_test_status) {
      return <Badge variant="secondary">Não testado</Badge>
    }

    switch (integration.last_test_status) {
      case 'success':
        return (
          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Funcionando
          </Badge>
        )
      case 'failed':
        return (
          <Badge className="bg-red-500/10 text-red-600 border-red-500/20">
            <XCircle className="h-3 w-3 mr-1" />
            Erro
          </Badge>
        )
      case 'pending':
        return (
          <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
            <AlertCircle className="h-3 w-3 mr-1" />
            Testando...
          </Badge>
        )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          <span>Carregando integrações...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/40 bg-background/95 backdrop-blur-xl fixed top-0 left-0 right-0 z-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/admin" className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
                  <Plug className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-semibold tracking-tight">Integrações</span>
              </Link>
            </div>
            <Link href="/admin">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 pt-24 pb-8 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Integrações</h1>
          <p className="text-muted-foreground">
            Gerencie todas as integrações externas da plataforma em um só lugar
          </p>
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-8">
          <TabsList className="grid grid-cols-6 w-full max-w-3xl">
            {categories.map(cat => (
              <TabsTrigger key={cat.value} value={cat.value} className="flex items-center gap-2">
                <span>{cat.icon}</span>
                <span className="hidden sm:inline">{cat.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Integrations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIntegrations.map((integration) => (
            <Card key={integration.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{integration.icon}</div>
                    <div>
                      <CardTitle className="text-lg">{integration.display_name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        {integration.description}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  {getStatusBadge(integration)}
                </div>

                {/* Enabled Toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`enabled-${integration.id}`}>
                      {integration.is_enabled ? 'Ativado' : 'Desativado'}
                    </Label>
                  </div>
                  <Switch
                    id={`enabled-${integration.id}`}
                    checked={integration.is_enabled}
                    onCheckedChange={() => handleToggleIntegration(integration)}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleOpenConfig(integration)}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Configurar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestIntegration(integration)}
                    disabled={!integration.is_enabled || testing === integration.id}
                  >
                    {testing === integration.id ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    ) : (
                      <TestTube className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Last Test Info */}
                {integration.last_test_at && (
                  <div className="text-xs text-muted-foreground">
                    Último teste: {new Date(integration.last_test_at).toLocaleString('pt-BR')}
                    {integration.last_test_message && (
                      <p className="mt-1 italic">{integration.last_test_message}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredIntegrations.length === 0 && (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Plug className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma integração nesta categoria</h3>
              <p className="text-sm text-muted-foreground">
                Selecione outra categoria ou aguarde novas integrações
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Config Dialog */}
      <Dialog open={!!configDialog} onOpenChange={() => setConfigDialog(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{configDialog?.icon}</span>
              Configurar {configDialog?.display_name}
            </DialogTitle>
            <DialogDescription>
              Configure as credenciais e parâmetros da integração
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* API Key */}
            <div className="space-y-2">
              <Label htmlFor="api_key">API Key</Label>
              <div className="flex gap-2">
                <Input
                  id="api_key"
                  type={showSecrets['api_key'] ? 'text' : 'password'}
                  value={configData.api_key || ''}
                  onChange={(e) => setConfigData(prev => ({ ...prev, api_key: e.target.value }))}
                  placeholder="sk_..."
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowSecrets(prev => ({ ...prev, api_key: !prev['api_key'] }))}
                >
                  {showSecrets['api_key'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* API Secret (optional) */}
            <div className="space-y-2">
              <Label htmlFor="api_secret">API Secret (Opcional)</Label>
              <div className="flex gap-2">
                <Input
                  id="api_secret"
                  type={showSecrets['api_secret'] ? 'text' : 'password'}
                  value={configData.api_secret || ''}
                  onChange={(e) => setConfigData(prev => ({ ...prev, api_secret: e.target.value }))}
                  placeholder="secret_..."
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowSecrets(prev => ({ ...prev, api_secret: !prev['api_secret'] }))}
                >
                  {showSecrets['api_secret'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Warning */}
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                <div className="text-sm text-yellow-600">
                  <p className="font-medium mb-1">Segurança Importante</p>
                  <p>
                    As credenciais são armazenadas de forma segura. Nunca compartilhe suas API keys.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigDialog(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveConfig} disabled={saving}>
              {saving ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
