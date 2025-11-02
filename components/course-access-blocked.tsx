"use client"

import { Lock, Crown, Clock, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

interface CourseAccessBlockedProps {
  reason: string
  isTrialExpired?: boolean
  isInTrial?: boolean
  trialDaysLeft?: number
  courseTitle?: string
}

export function CourseAccessBlocked({
  reason,
  isTrialExpired,
  isInTrial,
  trialDaysLeft,
  courseTitle
}: CourseAccessBlockedProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-background to-muted/20">
      <Card className="max-w-2xl w-full border-2">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            {isTrialExpired ? (
              <Clock className="h-10 w-10 text-destructive" />
            ) : (
              <Lock className="h-10 w-10 text-muted-foreground" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold">
            {isTrialExpired ? "🚫 Trial Expirado" : "🔒 Acesso Restrito"}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Mensagem principal */}
          <div className="text-center">
            <p className="text-muted-foreground text-lg mb-2">
              {reason}
            </p>
            {courseTitle && (
              <p className="text-sm text-muted-foreground mt-4">
                Curso: <span className="font-semibold">{courseTitle}</span>
              </p>
            )}
          </div>

          {/* Info do trial se estiver ativo */}
          {isInTrial && trialDaysLeft !== undefined && trialDaysLeft > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-500">
                <Clock className="h-5 w-5" />
                <p className="font-semibold">
                  Você ainda tem {trialDaysLeft} dia{trialDaysLeft !== 1 ? 's' : ''} de trial gratuito!
                </p>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Aproveite para explorar todos os cursos marcados como "Gratuito" durante seu período de teste.
              </p>
            </div>
          )}

          {/* CTA para upgrade */}
          <div className="space-y-3">
            <Link href="/pricing" className="block">
              <Button size="lg" className="w-full bg-gradient-to-r from-[#F3C77A] to-[#FFD88A] text-black hover:opacity-90">
                <Crown className="mr-2 h-5 w-5" />
                {isTrialExpired ? "Fazer Upgrade Agora" : "Ver Planos Premium"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>

            <Link href="/dashboard" className="block">
              <Button variant="outline" size="lg" className="w-full">
                Voltar ao Dashboard
              </Button>
            </Link>
          </div>

          {/* Benefícios Premium */}
          <div className="border-t pt-6">
            <h3 className="font-semibold text-center mb-4">
              💎 Benefícios da Assinatura Premium
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Acesso ilimitado a TODOS os cursos
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Novos cursos adicionados mensalmente
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Certificados de conclusão
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Suporte prioritário
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Sem anúncios
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
