"use client"

import { useState } from "react"
import { LogOut, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu"
import { useCurrentUser } from "@/hooks/use-current-user"

interface LogoutButtonProps {
  user?: {
    name: string
    email: string
    role: string
  }
}

export function LogoutButton({ user }: LogoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const { signOut } = useCurrentUser()

  const handleLogout = async () => {
    setLoading(true)
    try {
      await signOut()
      // Redirecionar para login
      window.location.href = '/login'
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      // Mesmo com erro, redirecionar para login
      window.location.href = '/login'
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleLogout}>
        <LogOut className="h-5 w-5" />
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <LogOut className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleLogout} 
          className="text-red-600"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="mr-2 h-4 w-4" />
          )}
          {loading ? 'Saindo...' : 'Sair da Plataforma'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
