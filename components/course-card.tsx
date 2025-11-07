"use client"

import Link from "next/link"
import Image from "next/image"

interface CourseSummary {
  id: string
  slug: string
  title: string
  description: string
  readingTimeMinutes: number
  coverUrl?: string
  tags?: string[]
  userHasAccess?: boolean // Novo campo para indicar acesso
}

interface CourseCardProps {
  course: CourseSummary
  index: number
}

export const CourseCard = ({ course, index }: CourseCardProps) => {
  const coverUrl = course.coverUrl || "/placeholder.svg?height=600&width=400"

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
    <Link href={`/course/${course.slug}`}>
      <article
        className="group relative overflow-hidden rounded-3xl border border-[#2A241C] bg-[#12100D] p-6 transition-colors duration-300 hover:border-[#F3C77A] cursor-pointer animate-fade-in-up"
        style={{ animationDelay: `${index * 50}ms` }}
      >
      {/* Tags e Indicador de Acesso */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2">
        {/* Indicador de Acesso */}
        {course.userHasAccess !== undefined && (
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              course.userHasAccess 
                ? 'bg-green-600 text-white' 
                : 'bg-red-600 text-white'
            }`}
          >
            {course.userHasAccess ? '🔓 Liberado' : '🔒 Restrito'}
          </span>
        )}
        
        {/* Tags do curso */}
        {course.tags && course.tags.length > 0 && (
          <>
            {course.tags.map((tag, tagIndex) => (
              <span
                key={tagIndex}
                className={`rounded-full px-2 py-1 text-xs font-semibold ${getTagColor(tag)}`}
              >
                {tag}
              </span>
            ))}
          </>
        )}
      </div>

      <div className="relative overflow-hidden rounded-2xl">
        {course.coverUrl ? (
          <div className="relative aspect-[4/5] w-full overflow-hidden">
            <Image
              src={coverUrl}
              alt={course.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
          </div>
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
      
      {/* Botão de acesso baseado na permissão */}
      <div className={`mt-6 inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-medium transition-colors duration-300 w-full justify-center ${
        course.userHasAccess 
          ? 'border-[#3A3126] text-[#F3C77A] hover:bg-[#F3C77A]/10' 
          : 'border-red-600/50 text-red-400 bg-red-600/10'
      }`}>
        {course.userHasAccess ? (
          <>
            Abrir curso
            <span className="text-lg">→</span>
          </>
        ) : (
          <>
            🔒 Ver detalhes do curso
            <span className="text-lg">→</span>
          </>
        )}
      </div>
      </article>
    </Link>
  )
}
