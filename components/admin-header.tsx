"use client"

import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface AdminHeaderProps {
  title: string
  icon: React.ReactNode
  showBackButton?: boolean
  backHref?: string
  backLabel?: string
}

export function AdminHeader({ 
  title, 
  icon, 
  showBackButton = true, 
  backHref = "/admin", 
  backLabel = "Voltar ao Dashboard" 
}: AdminHeaderProps) {
  return (
    <div className="border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
                {icon}
              </div>
              <span className="text-xl font-semibold tracking-tight">{title}</span>
            </Link>
            <Badge variant="secondary" className="bg-[#F3C77A] text-black">
              Área Administrativa
            </Badge>
          </div>
          
          <div className="flex items-center gap-4">
            {showBackButton && (
              <Link href={backHref}>
                <Button variant="outline" size="sm" className="hover:bg-primary/10 hover:border-primary">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {backLabel}
                </Button>
              </Link>
            )}
            <Link href="/">
              <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary">
                Ver Site
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
