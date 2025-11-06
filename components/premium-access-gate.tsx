"use client"

import { useState, useEffect } from "react"
import { Lock, Zap, CheckCircle2, Crown, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { CoursePurchaseButton } from "@/components/course-purchase-button"

interface AccessCheckResult {
  canAccess: boolean
  reason?: 'free_course' | 'premium_access' | 'trial_access' | 'admin_access' | 'no_access'
  message?: string
  category?: string
  course?: {
    id: string
    title: string
    is_free: boolean
    price?: number | null
  }
  subscription?: {
    status: string
    trial_ends_at?: string
    current_period_end?: string
  }
}

interface PremiumAccessGateProps {
  courseId: string
  course?: {
    id: string
    title: string
    price?: number
    course_categories?: Array<{
      categories: {
        slug: string
      }
    }>
  }
  children: React.ReactNode
}

// Cache em memória para otimização de performance
const accessCache = new Map<string, { result: AccessCheckResult, timestamp: number }>()
const CACHE_TTL = 2 * 1000 // 2 segundos (reduzido para atualização rápida de permissões)

export function PremiumAccessGate({ courseId, course, children }: PremiumAccessGateProps) {
  const [checking, setChecking] = useState(true)
  const [accessResult, setAccessResult] = useState<AccessCheckResult | null>(null)

  useEffect(() => {
    checkAccess()
  }, [courseId])

  const checkAccess = async () => {
    try {
      setChecking(true)

      // Verificar cache primeiro
      const cached = accessCache.get(courseId)
      if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
        setAccessResult(cached.result)
        setChecking(false)
        return
      }

      // Requisição com timeout de 10 segundos
      // IMPORTANTE: Não usar getSession() - cookies HTTP-only são enviados automaticamente
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      try {
        const response = await fetch(`/api/courses/${courseId}/access`, {
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include', // CRÍTICO: Envia cookies automaticamente
          signal: controller.signal
        })

        clearTimeout(timeoutId)
        const data = await response.json()

        // Armazenar no cache
        accessCache.set(courseId, { result: data, timestamp: Date.now() })
        setAccessResult(data)
      } catch (fetchError: any) {
        clearTimeout(timeoutId)
        if (fetchError.name === 'AbortError') {
          setAccessResult({
            canAccess: false,
            reason: 'no_access',
            message: 'Timeout na verificação'
          })
        } else {
          throw fetchError
        }
      }
    } catch (error) {
      console.error('[PremiumAccessGate] Erro ao verificar acesso:', error)
      setAccessResult({
        canAccess: false,
        reason: 'no_access',
        message: 'Erro ao verificar acesso'
      })
    } finally {
      setChecking(false)
    }
  }

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Verificando acesso...</p>
        </div>
      </div>
    )
  }

  // Se tem acesso, mostrar conteúdo
  if (accessResult?.canAccess) {
    return (
      <>
        {/* Badge de status */}
        {accessResult.reason === 'admin_access' && (
          <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
            <div className="flex items-center gap-3">
              <Crown className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-purple-600">Acesso Administrativo</p>
                <p className="text-xs text-purple-600/80">
                  Você tem acesso total como administrador
                </p>
              </div>
            </div>
          </div>
        )}

        {accessResult.reason === 'trial_access' && accessResult.subscription?.trial_ends_at && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-yellow-600">Período de Teste</p>
                <p className="text-xs text-yellow-600/80">
                  Seu teste gratuito termina em{' '}
                  {new Date(accessResult.subscription.trial_ends_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <Link href="/pricing" className="ml-auto">
                <Button size="sm" variant="outline" className="text-yellow-600 border-yellow-600/20">
                  Assinar Agora
                </Button>
              </Link>
            </div>
          </div>
        )}

        {accessResult.reason === 'free_course' && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-600">Curso Gratuito</p>
                <p className="text-xs text-green-600/80">
                  Este curso está disponível gratuitamente para todos os usuários
                </p>
              </div>
            </div>
          </div>
        )}

        {children}
      </>
    )
  }

  // Se não tem acesso, mostrar bloqueio
  const categorySlug = accessResult?.category || course?.course_categories?.[0]?.categories?.slug
  const isArsenalEspiritual = categorySlug === 'arsenal-espiritual'
  const coursePrice = course?.price ?? accessResult?.course?.price

  return (
    <div className="flex items-center justify-center min-h-[600px] p-6">
      <Card className="max-w-2xl w-full border-2 border-dashed">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <Lock className="h-12 w-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">
            {isArsenalEspiritual ? 'Curso Vendido Separadamente' : 'Conteúdo Premium'}
          </CardTitle>
          <CardDescription className="text-base">
            {accessResult?.message || 'Este curso requer uma assinatura premium para acesso'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Se for Arsenal Espiritual, mostrar opção de compra individual */}
          {isArsenalEspiritual && coursePrice && (
            <div className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
              <div className="text-center space-y-4">
                <h3 className="text-2xl font-bold">Compre este curso</h3>
                <p className="text-3xl font-bold text-primary">
                  R$ {coursePrice.toFixed(2).replace('.', ',')}
                </p>
                <p className="text-sm text-muted-foreground">
                  Acesso vitalício após a compra
                </p>
                <CoursePurchaseButton
                  courseId={courseId}
                  courseTitle={course?.title || accessResult?.course?.title || 'Curso'}
                  price={coursePrice}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* Benefícios */}
          {!isArsenalEspiritual && (
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-500" />
                Com a Assinatura Premium você tem:
              </h3>
              <ul className="space-y-2">
                {[
                  'Acesso ilimitado a todos os cursos premium',
                  'Novos cursos adicionados mensalmente',
                  'Sistema de marcação e resumos (tipo Kindle)',
                  'Sistema de gamificação e pontos',
                  'Certificados de conclusão'
                ].map((benefit, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}


          {/* Preço e Botões */}
          {!isArsenalEspiritual && (
            <div className="text-center space-y-4">
              <div>
                <p className="text-3xl font-bold">R$ 19,97</p>
                <p className="text-sm text-muted-foreground mt-1">Pagamento único • Acesso vitalício</p>
              </div>

              {/* Mensagem especial para usuários com plano básico tentando acessar categoria bonus */}
              {accessResult?.reason === 'upgrade_required' && (
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-left">
                  <p className="text-sm font-semibold text-blue-600 mb-2">
                    💡 Faça upgrade para Premium e tenha acesso:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                    <li>• Acesso a <strong>todos os cursos da categoria Bônus</strong></li>
                    <li>• Acesso <strong>vitalício</strong> a todos os cursos premium</li>
                    <li>• Novos cursos adicionados mensalmente</li>
                  </ul>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/pricing" className="flex-1">
                  <Button size="lg" className="w-full">
                    <Crown className="mr-2 h-5 w-5" />
                    Fazer Upgrade para Premium
                  </Button>
                </Link>
                <Link href="/dashboard" className="flex-1">
                  <Button size="lg" variant="outline" className="w-full">
                    Voltar ao Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Footer */}
          {isArsenalEspiritual && (
            <p className="text-xs text-center text-muted-foreground">
              Pagamento seguro via Korvex • Acesso vitalício após confirmação
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
