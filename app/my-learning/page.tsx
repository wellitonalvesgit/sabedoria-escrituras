"use client"

import { BookOpen, Search, User, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { PointsDisplay } from "@/components/points-display"
import Link from "next/link"
import { GamificationPanel } from "@/components/gamification-panel"

export default function MyLearningPage() {
  const enrolledCourses = [
    {
      id: 1,
      title: "Advanced Leadership Strategies",
      instructor: "Dr. Sarah Johnson",
      progress: 65,
      image: "/professional-business-leadership-course.jpg",
      lastAccessed: "2 hours ago",
    },
    {
      id: 2,
      title: "Digital Marketing Mastery",
      instructor: "Michael Chen",
      progress: 40,
      image: "/digital-marketing-dashboard.png",
      lastAccessed: "1 day ago",
    },
    {
      id: 3,
      title: "Data Science Fundamentals",
      instructor: "Prof. Emily Rodriguez",
      progress: 85,
      image: "/data-science-visualization-graphs.jpg",
      lastAccessed: "3 days ago",
    },
  ]

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
                <span className="text-xl font-semibold tracking-tight">Academy</span>
              </Link>

              <div className="hidden md:flex items-center gap-6">
                <Link
                  href="/"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Courses
                </Link>
                <Link
                  href="/ranking"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Ranking
                </Link>
                <Link
                  href="/my-learning"
                  className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                >
                  My Learning
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
          <h1 className="text-4xl font-bold tracking-tight text-foreground">My Learning</h1>
          <p className="mt-2 text-lg text-muted-foreground">Track your progress and achievements</p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="mb-4 text-2xl font-bold text-foreground">Continue Learning</h2>
              <div className="space-y-4">
                {enrolledCourses.map((course) => (
                  <Link
                    key={course.id}
                    href={`/course/${course.id}`}
                    className="group flex gap-4 rounded-xl border border-border bg-muted/30 p-4 transition-all duration-300 hover:border-primary/30 hover:bg-muted/50 hover:shadow-lg"
                  >
                    <div className="relative h-24 w-32 flex-shrink-0 overflow-hidden rounded-lg">
                      <img
                        src={course.image || "/placeholder.svg"}
                        alt={course.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {course.title}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">{course.instructor}</p>
                      <div className="mt-3 space-y-1">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{course.progress}% complete</span>
                          <span>Last accessed {course.lastAccessed}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-500"
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <GamificationPanel />
          </div>
        </div>
      </div>
    </div>
  )
}
