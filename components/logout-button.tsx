"use client"

import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu"

interface LogoutButtonProps {
  user?: {
    name: string
    email: string
    role: string
  }
}

export function LogoutButton({ user }: LogoutButtonProps) {
  const handleLogout = () => {
    // Limpar dados do usuário
    localStorage.removeItem('user')
    sessionStorage.clear()
    
    // Redirecionar para landing page
    window.location.href = '/landing'
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
        <DropdownMenuItem onClick={handleLogout} className="text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          Sair da Plataforma
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
