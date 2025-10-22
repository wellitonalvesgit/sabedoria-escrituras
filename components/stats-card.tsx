"use client"

import { useGamification } from "@/contexts/gamification-context"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Trophy, BookOpen, Flame, Award } from "lucide-react"

export function StatsCard() {
  const { stats } = useGamification()

  const pointsToNextLevel = stats.level * 100 - stats.totalPoints
  const progressToNextLevel = ((stats.totalPoints % 100) / 100) * 100

  const statItems = [
    {
      icon: Trophy,
      label: "Total Points",
      value: stats.totalPoints.toLocaleString(),
      color: "text-primary",
    },
    {
      icon: BookOpen,
      label: "Pages Read",
      value: stats.pagesRead.toLocaleString(),
      color: "text-chart-2",
    },
    {
      icon: Flame,
      label: "Current Streak",
      value: `${stats.currentStreak} days`,
      color: "text-chart-4",
    },
    {
      icon: Award,
      label: "Courses Completed",
      value: stats.coursesCompleted.toString(),
      color: "text-chart-5",
    },
  ]

  return (
    <Card className="p-6 space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-2xl font-bold text-foreground">Level {stats.level}</h3>
            <p className="text-sm text-muted-foreground">{pointsToNextLevel} points to next level</p>
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 border-2 border-primary">
            <span className="text-2xl font-bold text-primary">{stats.level}</span>
          </div>
        </div>
        <Progress value={progressToNextLevel} className="h-2" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {statItems.map((item) => (
          <div key={item.label} className="space-y-2">
            <div className="flex items-center gap-2">
              <item.icon className={`h-4 w-4 ${item.color}`} />
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </div>
            <p className="text-xl font-bold text-foreground">{item.value}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}
