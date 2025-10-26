"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Crown, Lock, Star, CheckCircle, ArrowRight } from "lucide-react"
import Link from "next/link"

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  courseTitle: string
  courseAuthor?: string
}

export function UpgradeModal({ isOpen, onClose, courseTitle, courseAuthor }: UpgradeModalProps) {
  const benefits = [
    "Acesso a todos os cursos premium",
    "Conteúdo exclusivo e atualizado",
    "Suporte prioritário",
    "Certificados de conclusão",
    "Comunidade VIP",
    "Novos cursos mensais"
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
            <Crown className="w-10 h-10 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold text-foreground">
            Desbloqueie Este Curso Premium
          </DialogTitle>
          <DialogDescription className="text-lg text-muted-foreground">
            <strong className="text-foreground">{courseTitle}</strong>
            {courseAuthor && (
              <span className="block text-sm mt-1">por {courseAuthor}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Benefícios */}
          <div className="bg-background/50 rounded-lg p-6 border border-border/50">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-primary" />
              O que você ganha com o upgrade:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center space-y-4">
            <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
              <p className="text-sm text-muted-foreground mb-2">
                Aproveite nossa oferta especial de lançamento:
              </p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-3xl font-bold text-primary">R$ 97</span>
                <span className="text-lg text-muted-foreground line-through">R$ 197</span>
                <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                  50% OFF
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Pagamento único • Acesso vitalício • Garantia de 7 dias
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/pricing" className="flex-1">
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-lg font-semibold">
                  <Crown className="w-5 h-5 mr-2" />
                  Fazer Upgrade Agora
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Button 
                variant="outline" 
                onClick={onClose}
                className="flex-1 h-12 text-lg"
              >
                Ver Mais Detalhes
              </Button>
            </div>
          </div>

          {/* Garantia */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              <Lock className="w-4 h-4 inline mr-1" />
              Pagamento 100% seguro • Garantia de 7 dias • Suporte 24/7
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
