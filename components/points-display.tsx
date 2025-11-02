"use client"

import { Trophy } from "lucide-react"
import { useGamification } from "@/contexts/gamification-context"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useEffect, useState } from "react"

export function PointsDisplay() {
  const { stats } = useGamification()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <Link href="/my-learning">
        <Button variant="ghost" className="h-9 gap-2 px-3 hidden md:flex">
          <Trophy className="h-5 w-5 text-primary" />
          <div className="flex flex-col items-start">
            <span className="text-xs font-bold text-foreground leading-none">0</span>
            <span className="text-[10px] text-muted-foreground leading-none">Level 1</span>
          </div>
        </Button>
      </Link>
    )
  }

  return (
    <Link href="/my-learning">
      <Button variant="ghost" className="h-9 gap-2 px-3 hidden md:flex">
        <Trophy className="h-5 w-5 text-primary" />
        <div className="flex flex-col items-start">
          <span className="text-xs font-bold text-foreground leading-none">{stats.totalPoints}</span>
          <span className="text-[10px] text-muted-foreground leading-none">Level {stats.level}</span>
        </div>
      </Button>
    </Link>
  )
}
