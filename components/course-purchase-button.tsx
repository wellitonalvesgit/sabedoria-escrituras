"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface CoursePurchaseButtonProps {
  courseId: string
  courseTitle: string
  price: number
  className?: string
}

export function CoursePurchaseButton({ courseId, courseTitle, price, className }: CoursePurchaseButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handlePurchase = async () => {
    setLoading(true)
    try {
      // Buscar dados do usuário
      const userResponse = await fetch('/api/auth/me')
      if (!userResponse.ok) {
        router.push('/login?redirect=' + encodeURIComponent(window.location.pathname))
        return
      }

      const { user } = await userResponse.json()

      // Criar checkout
      const response = await fetch(`/api/courses/${courseId}/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_method: 'PIX',
          client: {
            name: user.name,
            email: user.email,
            cpf: '',
            phone: ''
          }
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar checkout')
      }

      // Se tem URL do checkout, redirecionar
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl
        return
      }

      // Se é PIX, redirecionar para página de pagamento
      if (result.pix) {
        router.push(`/checkout/pix?transactionId=${result.transactionId}&identifier=${result.identifier}&courseId=${courseId}`)
        return
      }

      // Fallback: redirecionar para callback
      router.push(`/checkout/course/callback?transactionId=${result.transactionId}&identifier=${result.identifier}&courseId=${courseId}`)
    } catch (error) {
      console.error('Erro ao processar compra:', error)
      alert(error instanceof Error ? error.message : 'Erro ao processar compra')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handlePurchase}
      disabled={loading}
      className={className}
      size="lg"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processando...
        </>
      ) : (
        <>
          <ShoppingCart className="mr-2 h-4 w-4" />
          Comprar por R$ {price.toFixed(2).replace('.', ',')}
        </>
      )}
    </Button>
  )
}

