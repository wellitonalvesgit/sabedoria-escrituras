"use client"

import { useState, useEffect } from "react"
import { BookOpen, Plus, Edit, Save, X, DollarSign, Calendar, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import Link from "next/link"

interface SubscriptionPlan {
  id: string
  name: string
  display_name: string
  description: string
  price_monthly: number
  price_yearly: number
  trial_days: number
  duration_days: number | null
  features: string[]
  is_active: boolean
  sort_order: number
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/plans')
      if (response.ok) {
        const data = await response.json()
        setPlans(data.plans || [])
      }
    } catch (error) {
      console.error('Erro ao carregar planos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingPlan({ ...plan })
  }

  const handleCancel = () => {
    setEditingPlan(null)
  }

  const handleSave = async () => {
    if (!editingPlan) return

    try {
      setSaving(true)
      const response = await fetch('/api/admin/plans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPlan)
      })

      if (response.ok) {
        await fetchPlans()
        setEditingPlan(null)
        alert('Plano atualizado com sucesso!')
      } else {
        alert('Erro ao atualizar plano')
      }
    } catch (error) {
      console.error('Erro ao salvar plano:', error)
      alert('Erro ao salvar plano')
    } finally {
      setSaving(false)
    }
  }

  const updateEditingPlan = (field: keyof SubscriptionPlan, value: any) => {
    if (!editingPlan) return
    setEditingPlan({ ...editingPlan, [field]: value })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          <span>Carregando planos...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/admin" className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
                  <BookOpen className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-semibold tracking-tight">As Cartas de Paulo</span>
              </Link>
              <Badge variant="secondary" className="bg-[#F3C77A] text-black">
                Gerenciar Planos
              </Badge>
            </div>
            <Link href="/admin">
              <Button variant="outline" size="sm" className="hover:bg-primary/10 hover:text-primary hover:border-primary/30">
                Voltar ao Admin
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 pt-8 pb-8 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Gerenciar Planos de Assinatura</h1>
          <p className="text-muted-foreground">Configure os planos, preços, durações e recursos disponíveis</p>
        </div>

        {/* Planos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isEditing = editingPlan?.id === plan.id
            const currentPlan = isEditing ? editingPlan : plan

            return (
              <Card key={plan.id} className={isEditing ? 'border-primary shadow-lg' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {isEditing ? (
                        <Input
                          value={currentPlan.display_name}
                          onChange={(e) => updateEditingPlan('display_name', e.target.value)}
                          className="text-xl font-bold mb-2"
                        />
                      ) : (
                        <CardTitle className="text-2xl">{currentPlan.display_name}</CardTitle>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        {currentPlan.is_active ? (
                          <Badge className="bg-green-500/10 text-green-600">Ativo</Badge>
                        ) : (
                          <Badge className="bg-gray-500/10 text-gray-600">Inativo</Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {currentPlan.name}
                        </Badge>
                      </div>
                    </div>
                    {!isEditing && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(plan)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {isEditing ? (
                    <Textarea
                      value={currentPlan.description}
                      onChange={(e) => updateEditingPlan('description', e.target.value)}
                      rows={3}
                      className="mt-2"
                    />
                  ) : (
                    <CardDescription className="mt-2">{currentPlan.description}</CardDescription>
                  )}
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Preços */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <Label>Preço Mensal</Label>
                    </div>
                    {isEditing ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={currentPlan.price_monthly}
                        onChange={(e) => updateEditingPlan('price_monthly', parseFloat(e.target.value))}
                        placeholder="R$ 0.00"
                      />
                    ) : (
                      <p className="text-2xl font-bold">R$ {currentPlan.price_monthly.toFixed(2)}</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <Label>Preço Anual</Label>
                    </div>
                    {isEditing ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={currentPlan.price_yearly}
                        onChange={(e) => updateEditingPlan('price_yearly', parseFloat(e.target.value))}
                        placeholder="R$ 0.00"
                      />
                    ) : (
                      <p className="text-2xl font-bold">R$ {currentPlan.price_yearly.toFixed(2)}</p>
                    )}
                  </div>

                  {/* Duração */}
                  <div className="space-y-3 border-t pt-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <Label>Duração do Plano</Label>
                    </div>
                    {isEditing ? (
                      <div className="space-y-2">
                        <Input
                          type="number"
                          value={currentPlan.duration_days || ''}
                          onChange={(e) => updateEditingPlan('duration_days', e.target.value ? parseInt(e.target.value) : null)}
                          placeholder="Deixe vazio para ilimitado"
                        />
                        <p className="text-xs text-muted-foreground">
                          Dias de acesso. Deixe vazio para ILIMITADO
                        </p>
                      </div>
                    ) : (
                      <p className="text-lg font-semibold">
                        {currentPlan.duration_days ? (
                          <>{currentPlan.duration_days} dias</>
                        ) : (
                          <Badge className="bg-purple-500/10 text-purple-600">♾️ ILIMITADO</Badge>
                        )}
                      </p>
                    )}
                  </div>

                  {/* Trial */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-muted-foreground" />
                      <Label>Período de Trial</Label>
                    </div>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={currentPlan.trial_days}
                        onChange={(e) => updateEditingPlan('trial_days', parseInt(e.target.value))}
                        placeholder="0"
                      />
                    ) : (
                      <p className="text-lg">{currentPlan.trial_days} dias</p>
                    )}
                  </div>

                  {/* Status */}
                  <div className="space-y-3 border-t pt-3">
                    <div className="flex items-center justify-between">
                      <Label>Plano Ativo</Label>
                      {isEditing ? (
                        <Switch
                          checked={currentPlan.is_active}
                          onCheckedChange={(checked) => updateEditingPlan('is_active', checked)}
                        />
                      ) : (
                        <Switch checked={currentPlan.is_active} disabled />
                      )}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-2 border-t pt-3">
                    <Label>Recursos ({currentPlan.features.length})</Label>
                    <ul className="text-sm space-y-1">
                      {currentPlan.features.slice(0, 3).map((feature, idx) => (
                        <li key={idx} className="text-muted-foreground">• {feature}</li>
                      ))}
                      {currentPlan.features.length > 3 && (
                        <li className="text-muted-foreground italic">
                          + {currentPlan.features.length - 3} recursos...
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* Ações */}
                  {isEditing && (
                    <div className="flex gap-2 pt-3 border-t">
                      <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 bg-[#F3C77A] text-black hover:bg-[#FFD88A]"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? 'Salvando...' : 'Salvar'}
                      </Button>
                      <Button
                        onClick={handleCancel}
                        variant="outline"
                        disabled={saving}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Instruções */}
        <Card className="mt-8 border-dashed">
          <CardHeader>
            <CardTitle>💡 Instruções</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• <strong>Duração:</strong> Deixe vazio para acesso ILIMITADO, ou defina número de dias (ex: 60 = 2 meses)</p>
            <p>• <strong>Trial:</strong> Período de teste gratuito em dias (ex: 7, 30)</p>
            <p>• <strong>Preço Anual:</strong> Se zero, o plano não terá opção anual</p>
            <p>• <strong>Ativo/Inativo:</strong> Apenas planos ativos aparecem na página de pricing</p>
            <p className="pt-2 border-t">
              <strong>⚠️ Importante:</strong> Para adicionar a coluna duration_days no banco, execute no SQL do Supabase:
              <code className="block mt-2 p-2 bg-muted rounded text-xs">
                ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS duration_days INTEGER;
              </code>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
