"use client"

/**
 * ✅ OTIMIZAÇÃO FASE 3: Skeleton loading para CourseCard
 * Melhora a percepção de performance enquanto carrega
 */

export function CourseCardSkeleton() {
  return (
    <article className="group relative overflow-hidden rounded-3xl border border-[#2A241C] bg-[#12100D] p-6">
      {/* Skeleton da imagem */}
      <div className="relative overflow-hidden rounded-2xl">
        <div className="aspect-[4/5] w-full bg-gradient-to-br from-[#2A241C] to-[#1A1612] animate-pulse" />
      </div>

      {/* Skeleton do título e descrição */}
      <div className="mt-6 space-y-3">
        <div className="h-5 bg-[#2A241C] rounded animate-pulse w-3/4" />
        <div className="h-4 bg-[#2A241C] rounded animate-pulse w-full" />
        <div className="h-4 bg-[#2A241C] rounded animate-pulse w-5/6" />
      </div>

      {/* Skeleton do botão */}
      <div className="mt-6 h-10 bg-[#2A241C] rounded-full animate-pulse" />
    </article>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-12">
      {/* Skeleton de uma seção de categoria */}
      {[1, 2].map((section) => (
        <div key={section} className="space-y-4">
          {/* Título da seção */}
          <div className="h-8 bg-[#2A241C] rounded animate-pulse w-48" />

          {/* Grid de cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((card) => (
              <CourseCardSkeleton key={card} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
