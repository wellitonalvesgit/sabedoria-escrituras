"use client"

import { useState, useEffect } from "react"
import { BookOpen, Search, User, Menu, Crown, Medal, Award, TrendingUp, TrendingDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { PointsDisplay } from "@/components/points-display"
import { useGamification } from "@/contexts/gamification-context"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface LeaderboardEntry {
  userId: string
  displayName: string
  photoUrl: string
  totalDurationSeconds: number
  totalSessions: number
}

interface LeaderboardUser {
  rank: number
  name: string
  avatar: string
  points: number
  level: number
  coursesCompleted: number
  streak: number
  change: number
}

const LeaderboardCard = ({ entry, index }: { entry: LeaderboardEntry; index: number }) => {
  const rank = index + 1
  const points = Math.floor(entry.totalDurationSeconds / 60)
  const level = Math.floor(points / 100)
  const coursesCompleted = entry.totalSessions
  const streak = 0 // TODO: Implementar dados reais de streak
  const change = 0 // TODO: Implementar dados reais de mudança

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />
      default:
        return null
    }
  }

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white"
      case 2:
        return "bg-gradient-to-br from-gray-300 to-gray-500 text-white"
      case 3:
        return "bg-gradient-to-br from-amber-500 to-amber-700 text-white"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <li
      className={cn(
        "group flex items-center gap-4 rounded-xl border p-4 transition-all duration-300",
        rank <= 3
          ? "border-primary/20 bg-primary/5 hover:bg-primary/10"
          : "border-border bg-muted/30 hover:bg-muted/50",
      )}
    >
      <div
        className={cn(
          "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl font-bold",
          getRankBadgeColor(rank),
        )}
      >
        {rank <= 3 ? getRankIcon(rank) : <span className="text-lg">#{rank}</span>}
      </div>

      <img
        src={entry.photoUrl || "/placeholder.svg"}
        alt={entry.displayName}
        className="h-12 w-12 rounded-full border-2 border-border object-cover"
      />

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-foreground">{entry.displayName}</h3>
          <span className="text-xs text-muted-foreground">Level {level}</span>
        </div>
        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
          <span>{coursesCompleted} cursos</span>
          <span>•</span>
          <span>{streak} dias seguidos</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="font-bold text-foreground">{points.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">XP</div>
        </div>
        {change !== 0 && (
          <div
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-1",
              change > 0 ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600",
            )}
          >
            {change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span className="text-xs font-medium">{Math.abs(change)}</span>
          </div>
        )}
      </div>
    </li>
  )
}

export default function RankingPage() {
  const { stats } = useGamification()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [currentUser, setCurrentUser] = useState({
    rank: 0,
    name: "Você",
    avatar: "/placeholder.svg?height=40&width=40",
    points: stats.totalPoints,
    level: stats.level,
    coursesCompleted: stats.coursesCompleted,
    streak: stats.currentStreak,
    change: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRanking()
  }, [])

  const fetchRanking = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/ranking')
      if (response.ok) {
        const data = await response.json()
        setLeaderboard(data.leaderboard || [])
        
        // Encontrar posição do usuário atual
        const userIndex = data.leaderboard.findIndex((entry: any) => entry.userId === 'current-user')
        if (userIndex !== -1) {
          setCurrentUser(prev => ({
            ...prev,
            rank: userIndex + 1,
            points: data.leaderboard[userIndex].totalPoints,
            level: data.leaderboard[userIndex].level,
            coursesCompleted: data.leaderboard[userIndex].totalSessions
          }))
        }
      }
    } catch (error) {
      console.error('Erro ao carregar ranking:', error)
    } finally {
      setLoading(false)
    }
  }

  const nextLevelXP = stats.level * 100
  const xpNeeded = nextLevelXP - stats.totalPoints

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          <span>Carregando ranking...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
                  <BookOpen className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-semibold tracking-tight">Sabedoria das Escrituras</span>
              </Link>

              <div className="hidden md:flex items-center gap-6">
                <Link
                  href="/"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cursos
                </Link>
                <Link
                  href="/ranking"
                  className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                >
                  Ranking
                </Link>
                <Link
                  href="/my-learning"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Meu Aprendizado
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="h-9 w-9 hidden md:flex">
                <Search className="h-5 w-5" />
              </Button>
              <ThemeToggle />
              <PointsDisplay />
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <User className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Ranking Global</h1>
          <p className="mt-2 text-lg text-muted-foreground">Compita com estudantes de todo o mundo</p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Leaderboard */}
          <div className="lg:col-span-2 space-y-6">
            {/* Top 3 Podium */}
            {leaderboard.length >= 3 && (
              <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-background to-accent/5 p-8">
                <h2 className="mb-6 text-2xl font-bold text-foreground flex items-center gap-2">
                  <Crown className="h-6 w-6 text-primary" />
                  Melhores Desempenhos
                </h2>
                <div className="flex items-end justify-center gap-4">
                  {/* 2nd Place */}
                  <div className="flex flex-col items-center">
                    <div className="relative mb-3">
                      <img
                        src={leaderboard[1].photoUrl || "/placeholder.svg"}
                        alt={leaderboard[1].displayName}
                        className="h-20 w-20 rounded-full border-4 border-gray-400 object-cover"
                      />
                      <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-gray-300 to-gray-500 shadow-lg">
                        <span className="text-sm font-bold text-white">2</span>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-border bg-card p-4 text-center w-32">
                      <p className="font-semibold text-foreground text-sm truncate">{leaderboard[1].displayName}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {Math.floor(leaderboard[1].totalDurationSeconds / 60).toLocaleString()} XP
                      </p>
                    </div>
                  </div>

                  {/* 1st Place */}
                  <div className="flex flex-col items-center -mt-8">
                    <div className="relative mb-3">
                      <img
                        src={leaderboard[0].photoUrl || "/placeholder.svg"}
                        alt={leaderboard[0].displayName}
                        className="h-24 w-24 rounded-full border-4 border-yellow-500 object-cover shadow-xl shadow-yellow-500/20"
                      />
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Crown className="h-8 w-8 text-yellow-500 drop-shadow-lg" />
                      </div>
                      <div className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg">
                        <span className="text-base font-bold text-white">1</span>
                      </div>
                    </div>
                    <div className="rounded-2xl border-2 border-yellow-500/30 bg-card p-4 text-center w-36 shadow-lg">
                      <p className="font-bold text-foreground truncate">{leaderboard[0].displayName}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {Math.floor(leaderboard[0].totalDurationSeconds / 60).toLocaleString()} XP
                      </p>
                    </div>
                  </div>

                  {/* 3rd Place */}
                  <div className="flex flex-col items-center">
                    <div className="relative mb-3">
                      <img
                        src={leaderboard[2].photoUrl || "/placeholder.svg"}
                        alt={leaderboard[2].displayName}
                        className="h-20 w-20 rounded-full border-4 border-amber-600 object-cover"
                      />
                      <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-amber-700 shadow-lg">
                        <span className="text-sm font-bold text-white">3</span>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-border bg-card p-4 text-center w-32">
                      <p className="font-semibold text-foreground text-sm truncate">{leaderboard[2].displayName}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {Math.floor(leaderboard[2].totalDurationSeconds / 60).toLocaleString()} XP
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Full Rankings */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="mb-4 text-xl font-bold text-foreground">Todos os Rankings</h2>
              {leaderboard.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Nenhum usuário no ranking ainda.</p>
                  <p className="text-sm text-muted-foreground">Comece a estudar para aparecer no ranking!</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {leaderboard.map((entry, index) => (
                    <LeaderboardCard key={entry.userId} entry={entry} index={index} />
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Sidebar - Your Rank */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <div className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-accent/10 p-6">
                <h3 className="mb-4 text-xl font-bold text-foreground">Seu Ranking</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Posição Atual</span>
                    <div className="flex items-center gap-2">
                      <span className="text-3xl font-bold text-foreground">#{currentUser.rank}</span>
                      {currentUser.change > 0 && (
                        <div className="flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-1 text-green-600">
                          <TrendingUp className="h-3 w-3" />
                          <span className="text-xs font-medium">{currentUser.change}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 rounded-xl bg-background/50 p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">XP Total</span>
                      <span className="font-bold text-foreground">{currentUser.points.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Nível</span>
                      <span className="font-bold text-foreground">{currentUser.level}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Cursos</span>
                      <span className="font-bold text-foreground">{currentUser.coursesCompleted}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Sequência</span>
                      <span className="font-bold text-foreground">{currentUser.streak} dias</span>
                    </div>
                  </div>

                  <div className="rounded-xl bg-muted/50 p-4">
                    <p className="text-xs text-muted-foreground mb-2">Próximo Marco</p>
                    <p className="text-sm font-medium text-foreground">
                      Ganhe <span className="text-primary font-bold">{xpNeeded} XP a mais</span> para alcançar o Nível{" "}
                      {stats.level + 1}
                    </p>
                  </div>

                  <Link href="/my-learning">
                    <Button className="w-full" size="lg">
                      Continue Estudando
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="mb-4 text-lg font-bold text-foreground">Informações do Ranking</h3>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>Os rankings são atualizados em tempo real com base na sua atividade de aprendizado.</p>
                  <p>Ganhe XP completando cursos, mantendo sequências e desbloqueando conquistas.</p>
                  <p className="text-xs pt-2 border-t border-border">Última atualização: Agora mesmo</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
