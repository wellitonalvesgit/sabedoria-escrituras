"use client"

import { useGamification } from "@/contexts/gamification-context"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

export function AchievementsPanel() {
  const { stats } = useGamification()

  const unlockedCount = stats.achievements.filter((a) => a.unlocked).length
  const totalCount = stats.achievements.length
  const progressPercent = (unlockedCount / totalCount) * 100

  const categories = {
    reading: "Reading",
    completion: "Completion",
    streak: "Streak",
    social: "Social",
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-foreground">Achievements</h3>
          <span className="text-sm text-muted-foreground">
            {unlockedCount} / {totalCount}
          </span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      <div className="space-y-4">
        {Object.entries(categories).map(([key, label]) => {
          const categoryAchievements = stats.achievements.filter((a) => a.category === key)
          if (categoryAchievements.length === 0) return null

          return (
            <div key={key}>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">{label}</h4>
              <div className="grid grid-cols-1 gap-3">
                {categoryAchievements.map((achievement) => (
                  <Card
                    key={achievement.id}
                    className={`p-4 transition-all duration-300 ${
                      achievement.unlocked
                        ? "bg-card border-primary/50 shadow-lg shadow-primary/10"
                        : "bg-muted/30 opacity-60"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`text-4xl ${achievement.unlocked ? "grayscale-0" : "grayscale opacity-40"}`}>
                        {achievement.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="font-semibold text-foreground text-balance">{achievement.title}</h5>
                          <Badge variant={achievement.unlocked ? "default" : "secondary"} className="shrink-0">
                            {achievement.points} pts
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{achievement.description}</p>
                        {achievement.unlocked && achievement.unlockedAt && (
                          <p className="text-xs text-primary mt-2">
                            Unlocked {achievement.unlockedAt.toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
