"use client"

import { useState } from "react"
import { X, Menu, User, Settings, LogOut, BookOpen, Trophy, Award, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { PointsDisplay } from "@/components/points-display"
import { LogoutButton } from "@/components/logout-button"
import Link from "next/link"

interface MobileDrawerProps {
  user?: {
    name: string
    email: string
    role: string
  }
  currentPath?: string
}

export function MobileDrawer({ user, currentPath = "/dashboard" }: MobileDrawerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const navigationItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: BookOpen,
      description: "Seus cursos e progresso"
    },
    {
      name: "Meu Aprendizado",
      href: "/my-learning",
      icon: Award,
      description: "Continue seus estudos"
    },
    {
      name: "Ranking",
      href: "/ranking",
      icon: Trophy,
      description: "Veja sua posição"
    }
  ]

  const handleLogout = () => {
    localStorage.removeItem('user')
    sessionStorage.clear()
    window.location.href = '/login'
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <div className="flex flex-col h-full">
          {/* Header do Drawer */}
          <SheetHeader className="pb-4">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-left">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary">
                    <BookOpen className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <span className="text-lg font-semibold">As Cartas de Paulo</span>
                </div>
              </SheetTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>

          {/* Conteúdo do Drawer */}
          <div className="flex-1 overflow-y-auto">
            {/* Informações do Usuário */}
            {user && (
              <div className="mb-6 p-4 bg-muted/50 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {user.role === 'admin' ? 'Admin' : 'Aluno'}
                  </Badge>
                </div>
                <PointsDisplay />
              </div>
            )}

            {/* Navegação Principal */}
            <div className="space-y-2 mb-6">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-2">
                Navegação
              </h3>
              {navigationItems.map((item) => {
                const Icon = item.icon
                const isActive = currentPath === item.href
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                      isActive 
                        ? 'bg-primary/10 text-primary border border-primary/20' 
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 bg-primary rounded-full" />
                    )}
                  </Link>
                )
              })}
            </div>

            <Separator className="my-6" />

            {/* Configurações e Ações */}
            <div className="space-y-2 mb-6">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-2">
                Configurações
              </h3>
              
              <Link
                href="/settings"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
              >
                <Settings className="h-5 w-5" />
                <div className="flex-1">
                  <p className="font-medium">Configurações</p>
                  <p className="text-sm text-muted-foreground">Perfil e preferências</p>
                </div>
              </Link>

              <div className="flex items-center gap-3 p-3 rounded-xl">
                <div className="h-5 w-5 flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-primary/20" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Tema</p>
                  <p className="text-sm text-muted-foreground">Claro ou escuro</p>
                </div>
                <ThemeToggle />
              </div>
            </div>

            <Separator className="my-6" />

            {/* Logout */}
            <div className="space-y-2">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors w-full text-left"
              >
                <LogOut className="h-5 w-5" />
                <div className="flex-1">
                  <p className="font-medium">Sair da Plataforma</p>
                  <p className="text-sm text-muted-foreground">Fazer logout</p>
                </div>
              </button>
            </div>
          </div>

          {/* Footer do Drawer */}
          <div className="pt-4 border-t">
            <p className="text-xs text-center text-muted-foreground">
              As Cartas de Paulo © 2024
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
