"use client"

import type React from "react"
import { Trophy, Award, Target, Flame, Star, Zap, Crown, Medal } from "lucide-react"
import { cn } from "@/lib/utils"
import { useGamification } from "@/contexts/gamification-context"

interface Achievement {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  progress: number
  total: number
  unlocked: boolean
  points: number
}

export function GamificationPanel() {
  const { stats } = useGamification()

  const progressPercentage = ((stats.totalPoints % 100) / 100) * 100
  const nextLevelPoints = stats.level * 100

  const iconMap: Record<string, React.ReactNode> = {
    "first-page": <Star className="h-5 w-5" />,
    "page-turner": <Zap className="h-5 w-5" />,
    bookworm: <Crown className="h-5 w-5" />,
    "first-course": <Award className="h-5 w-5" />,
    "dedicated-learner": <Medal className="h-5 w-5" />,
    "week-streak": <Flame className="h-5 w-5" />,
    "month-streak": <Trophy className="h-5 w-5" />,
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-foreground">Level {stats.level}</h3>
            <p className="text-sm text-muted-foreground">
              {stats.totalPoints} / {nextLevelPoints} XP
            </p>
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Trophy className="h-8 w-8 text-primary" />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="h-3 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl bg-muted/50 p-4 text-center">
            <div className="mb-1 flex items-center justify-center">
              <Flame className="h-5 w-5 text-orange-500" />
            </div>
            <div className="text-2xl font-bold text-foreground">{stats.currentStreak}</div>
            <div className="text-xs text-muted-foreground">Day Streak</div>
          </div>
          <div className="rounded-xl bg-muted/50 p-4 text-center">
            <div className="mb-1 flex items-center justify-center">
              <Award className="h-5 w-5 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              {stats.achievements.filter((a) => a.unlocked).length}
            </div>
            <div className="text-xs text-muted-foreground">Achievements</div>
          </div>
          <div className="rounded-xl bg-muted/50 p-4 text-center">
            <div className="mb-1 flex items-center justify-center">
              <Target className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-foreground">{stats.coursesCompleted}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="mb-4 text-xl font-bold text-foreground">Achievements</h3>
        <div className="space-y-3">
          {stats.achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={cn(
                "group relative overflow-hidden rounded-xl border p-4 transition-all duration-300",
                achievement.unlocked
                  ? "border-primary/30 bg-primary/5 hover:border-primary/50 hover:bg-primary/10"
                  : "border-border bg-muted/30 hover:bg-muted/50",
              )}
            >
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 text-3xl",
                    achievement.unlocked ? "grayscale-0" : "grayscale opacity-40",
                  )}
                >
                  {achievement.icon}
                </div>
                <div className="flex-1">
                  <div className="mb-1 flex items-center justify-between">
                    <h4
                      className={cn(
                        "font-semibold",
                        achievement.unlocked ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {achievement.title}
                    </h4>
                    <span
                      className={cn(
                        "text-xs font-bold",
                        achievement.unlocked ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      +{achievement.points} XP
                    </span>
                  </div>
                  <p className="mb-2 text-sm text-muted-foreground">{achievement.description}</p>
                  {achievement.unlocked && (
                    <div className="flex items-center gap-1 text-xs font-medium text-primary">
                      <Award className="h-3 w-3" />
                      <span>Unlocked</span>
                    </div>
                  )}
                </div>
              </div>

              {achievement.unlocked && (
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
