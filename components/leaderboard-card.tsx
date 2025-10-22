"use client"

import { motion } from "framer-motion"
import clsx from "clsx"
import type { LeaderboardEntry } from "../types"

interface LeaderboardCardProps {
  entry: LeaderboardEntry
  index: number
}

const rankBadges = ["🥇", "🥈", "🥉"]

export const LeaderboardCard = ({ entry, index }: LeaderboardCardProps) => {
  const durationMinutes = Math.round(entry.totalDurationSeconds / 60)
  const isTop = index < 3

  return (
    <motion.li
      className={clsx(
        "flex items-center justify-between rounded-2xl border px-6 py-4",
        "border-[#2A241C] bg-[#14110D] text-[#EDE3D0]",
        isTop && "border-[#F3C77A] bg-[#1E1A14]",
      )}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[#2F271D] text-lg font-semibold">
            {entry.photoUrl ? (
              <img src={entry.photoUrl} alt={entry.displayName} className="h-full w-full object-cover" />
            ) : (
              entry.displayName.slice(0, 2).toUpperCase()
            )}
          </div>
          {isTop && <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-xl">{rankBadges[index]}</span>}
        </div>
        <div>
          <p className="text-lg font-medium">{entry.displayName}</p>
          <p className="text-sm text-[#9C8F7B]">
            {entry.totalSessions} sessões • {durationMinutes} min
          </p>
        </div>
      </div>
      <div className="text-right text-sm text-[#C9BFAE]">
        {Math.round((entry.totalDurationSeconds / 3600) * 10) / 10} h lidas
      </div>
    </motion.li>
  )
}
