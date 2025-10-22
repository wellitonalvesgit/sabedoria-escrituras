export interface LeaderboardEntry {
  userId: string
  displayName: string
  photoUrl?: string
  totalDurationSeconds: number
  totalSessions: number
}

export interface CourseSummary {
  id: string
  slug: string
  title: string
  description: string
  readingTimeMinutes: number
  coverUrl?: string
}
