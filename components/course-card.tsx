"use client"

import Link from "next/link"
import { motion } from "framer-motion"

interface CourseSummary {
  id: string
  slug: string
  title: string
  description: string
  readingTimeMinutes: number
  coverUrl?: string
  tags?: string[]
}

interface CourseCardProps {
  course: CourseSummary
  index: number
}

export const CourseCard = ({ course, index }: CourseCardProps) => {
  const coverUrl = course.coverUrl || "/placeholder.svg?height=600&width=400"
  
  // Debug: log para verificar se a URL está chegando
  console.log('CourseCard - course:', course.title, 'coverUrl:', course.coverUrl)

  // Função para obter a cor da tag
  const getTagColor = (tag: string) => {
    switch (tag.toUpperCase()) {
      case 'EBOOK':
        return 'bg-blue-600 text-white'
      case 'WORKS':
        return 'bg-orange-600 text-white'
      case 'SLIDES':
        return 'bg-pink-600 text-white'
      case 'BÔNUS':
        return 'bg-emerald-600 text-white'
      case 'BLACKFRIDAY':
        return 'bg-red-600 text-white'
      case 'DESTAQUE':
        return 'bg-purple-600 text-white'
      case 'NOVO':
        return 'bg-green-600 text-white'
      default:
        return 'bg-gray-600 text-white'
    }
  }

  return (
    <motion.article
      className="group relative overflow-hidden rounded-3xl border border-[#2A241C] bg-[#12100D] p-6 transition-colors duration-300 hover:border-[#F3C77A]"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay: index * 0.05 }}
    >
      {/* Tags */}
      {course.tags && course.tags.length > 0 && (
        <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2">
          {course.tags.map((tag, tagIndex) => (
            <span
              key={tagIndex}
              className={`rounded-full px-2 py-1 text-xs font-semibold ${getTagColor(tag)}`}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="relative overflow-hidden rounded-2xl">
        {course.coverUrl ? (
          <div
            className="aspect-[4/5] w-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
            style={{ backgroundImage: `url(${coverUrl})` }}
          />
        ) : (
          <div className="aspect-[4/5] w-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
            <div className="text-center text-primary/60">
              <div className="w-16 h-16 mx-auto mb-2 bg-primary/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">📚</span>
              </div>
              <p className="text-sm font-medium">Sem capa</p>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-[#F3C77A]">PDF Premium</p>
            <h3 className="mt-1 text-xl font-semibold">{course.title}</h3>
          </div>
          <span className="rounded-full bg-[#F3C77A] px-3 py-1 text-xs font-semibold text-[#12100D]">
            {course.readingTimeMinutes} min
          </span>
        </div>
      </div>
      <p className="mt-6 text-sm text-[#B3A690]">{course.description}</p>
      <Link
        href={`/course/${course.slug}`}
        className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#3A3126] px-5 py-3 text-sm font-medium text-[#F3C77A] transition-colors duration-300 hover:bg-[#F3C77A]/10"
      >
        Abrir curso
        <span className="text-lg">→</span>
      </Link>
    </motion.article>
  )
}
