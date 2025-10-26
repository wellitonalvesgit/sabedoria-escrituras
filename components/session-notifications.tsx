"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Clock, AlertTriangle, X } from "lucide-react"
import { useCurrentUser } from "@/hooks/use-current-user"

export function SessionNotifications() {
  const { 
    user, 
    sessionValid, 
    timeUntilExpiration, 
    getFormattedTimeUntilExpiration,
    getAccessDaysRemaining,
    isAccessExpired,
    refreshSession 
  } = useCurrentUser()

  const [showWarning, setShowWarning] = useState(false)
  const [showExpired, setShowExpired] = useState(false)

  useEffect(() => {
    if (!user) return

    // Verificar se o acesso expirou
    if (isAccessExpired()) {
      setShowExpired(true)
      return
    }

    // Mostrar aviso quando restam menos de 7 dias
    const daysRemaining = getAccessDaysRemaining()
    if (daysRemaining <= 7 && daysRemaining > 0) {
      setShowWarning(true)
    }

    // Mostrar aviso quando restam menos de 30 minutos de sessão
    if (timeUntilExpiration && timeUntilExpiration < 30 * 60 * 1000) {
      setShowWarning(true)
    }
  }, [user, timeUntilExpiration, getAccessDaysRemaining, isAccessExpired])

  if (!user || !sessionValid) return null

  // Notificação de acesso expirado
  if (showExpired) {
    return (
      <Alert className="mb-4 border-red-500 bg-red-500/10">
        <AlertTriangle className="h-4 w-4 text-red-500" />
        <AlertDescription className="text-red-600">
          <div className="flex items-center justify-between">
            <div>
              <strong>Seu acesso expirou!</strong>
              <p className="text-sm mt-1">
                Entre em contato com o administrador para renovar seu acesso.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExpired(false)}
              className="ml-4"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  // Notificação de aviso de expiração
  if (showWarning) {
    const daysRemaining = getAccessDaysRemaining()
    const timeFormatted = getFormattedTimeUntilExpiration()

    return (
      <Alert className="mb-4 border-orange-500 bg-orange-500/10">
        <Clock className="h-4 w-4 text-orange-500" />
        <AlertDescription className="text-orange-600">
          <div className="flex items-center justify-between">
            <div>
              <strong>Atenção!</strong>
              <p className="text-sm mt-1">
                {daysRemaining > 0 ? (
                  <>Seu acesso expira em <strong>{daysRemaining} dias</strong>.</>
                ) : (
                  <>Sua sessão expira em <strong>{timeFormatted}</strong>.</>
                )}
                {daysRemaining > 0 && (
                  <> Entre em contato com o administrador para renovar.</>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshSession}
                className="text-orange-600 border-orange-300 hover:bg-orange-100"
              >
                Atualizar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowWarning(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  return null
}
