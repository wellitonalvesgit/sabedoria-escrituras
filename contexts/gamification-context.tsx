"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  points: number
  unlocked: boolean
  unlockedAt?: Date
  category: "reading" | "completion" | "streak" | "social"
}

export interface UserStats {
  totalPoints: number
  level: number
  coursesCompleted: number
  pagesRead: number
  currentStreak: number
  longestStreak: number
  achievements: Achievement[]
}

interface GamificationContextType {
  stats: UserStats
  addPoints: (points: number, reason: string) => void
  unlockAchievement: (achievementId: string) => void
  incrementPagesRead: () => void
  completeCourse: () => void
  updateStreak: () => void
}

const defaultAchievements: Achievement[] = [
  {
    id: "first-page",
    title: "First Steps",
    description: "Read your first page",
    icon: "📖",
    points: 10,
    unlocked: false,
    category: "reading",
  },
  {
    id: "page-turner",
    title: "Page Turner",
    description: "Read 50 pages",
    icon: "📚",
    points: 50,
    unlocked: false,
    category: "reading",
  },
  {
    id: "bookworm",
    title: "Bookworm",
    description: "Read 200 pages",
    icon: "🐛",
    points: 200,
    unlocked: false,
    category: "reading",
  },
  {
    id: "first-course",
    title: "Course Starter",
    description: "Complete your first course",
    icon: "🎓",
    points: 100,
    unlocked: false,
    category: "completion",
  },
  {
    id: "dedicated-learner",
    title: "Dedicated Learner",
    description: "Complete 5 courses",
    icon: "⭐",
    points: 500,
    unlocked: false,
    category: "completion",
  },
  {
    id: "week-streak",
    title: "Week Warrior",
    description: "Maintain a 7-day learning streak",
    icon: "🔥",
    points: 150,
    unlocked: false,
    category: "streak",
  },
  {
    id: "month-streak",
    title: "Monthly Master",
    description: "Maintain a 30-day learning streak",
    icon: "💎",
    points: 500,
    unlocked: false,
    category: "streak",
  },
]

const GamificationContext = createContext<GamificationContextType | undefined>(undefined)

export function GamificationProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast()
  const [stats, setStats] = useState<UserStats>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("gamification-stats")
      if (saved) {
        const parsed = JSON.parse(saved)
        return {
          ...parsed,
          achievements: parsed.achievements.map((a: Achievement) => ({
            ...a,
            unlockedAt: a.unlockedAt ? new Date(a.unlockedAt) : undefined,
          })),
        }
      }
    }
    return {
      totalPoints: 0,
      level: 1,
      coursesCompleted: 0,
      pagesRead: 0,
      currentStreak: 0,
      longestStreak: 0,
      achievements: defaultAchievements,
    }
  })

  useEffect(() => {
    localStorage.setItem("gamification-stats", JSON.stringify(stats))
  }, [stats])

  const calculateLevel = (points: number) => {
    return Math.floor(points / 100) + 1
  }

  const addPoints = (points: number, reason: string) => {
    setStats((prev) => {
      const newPoints = prev.totalPoints + points
      const newLevel = calculateLevel(newPoints)
      const leveledUp = newLevel > prev.level

      if (leveledUp) {
        toast({
          title: "🎉 Level Up!",
          description: `You've reached level ${newLevel}!`,
        })
      }

      toast({
        title: `+${points} Points`,
        description: reason,
      })

      return {
        ...prev,
        totalPoints: newPoints,
        level: newLevel,
      }
    })
  }

  const unlockAchievement = (achievementId: string) => {
    setStats((prev) => {
      const achievement = prev.achievements.find((a) => a.id === achievementId)
      if (!achievement || achievement.unlocked) return prev

      const updatedAchievements = prev.achievements.map((a) =>
        a.id === achievementId ? { ...a, unlocked: true, unlockedAt: new Date() } : a,
      )

      toast({
        title: `🏆 Achievement Unlocked!`,
        description: `${achievement.icon} ${achievement.title} - ${achievement.description}`,
      })

      return {
        ...prev,
        totalPoints: prev.totalPoints + achievement.points,
        achievements: updatedAchievements,
      }
    })
  }

  const incrementPagesRead = () => {
    setStats((prev) => {
      const newPagesRead = prev.pagesRead + 1

      // Check for page-reading achievements
      if (newPagesRead === 1) {
        unlockAchievement("first-page")
      } else if (newPagesRead === 50) {
        unlockAchievement("page-turner")
      } else if (newPagesRead === 200) {
        unlockAchievement("bookworm")
      }

      return {
        ...prev,
        pagesRead: newPagesRead,
      }
    })

    addPoints(5, "Read a page")
  }

  const completeCourse = () => {
    setStats((prev) => {
      const newCoursesCompleted = prev.coursesCompleted + 1

      // Check for course completion achievements
      if (newCoursesCompleted === 1) {
        unlockAchievement("first-course")
      } else if (newCoursesCompleted === 5) {
        unlockAchievement("dedicated-learner")
      }

      return {
        ...prev,
        coursesCompleted: newCoursesCompleted,
      }
    })

    addPoints(100, "Completed a course!")
  }

  const updateStreak = () => {
    setStats((prev) => {
      const newStreak = prev.currentStreak + 1
      const newLongestStreak = Math.max(newStreak, prev.longestStreak)

      // Check for streak achievements
      if (newStreak === 7) {
        unlockAchievement("week-streak")
      } else if (newStreak === 30) {
        unlockAchievement("month-streak")
      }

      return {
        ...prev,
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
      }
    })
  }

  return (
    <GamificationContext.Provider
      value={{
        stats,
        addPoints,
        unlockAchievement,
        incrementPagesRead,
        completeCourse,
        updateStreak,
      }}
    >
      {children}
    </GamificationContext.Provider>
  )
}

export function useGamification() {
  const context = useContext(GamificationContext)
  if (!context) {
    throw new Error("useGamification must be used within a GamificationProvider")
  }
  return context
}
