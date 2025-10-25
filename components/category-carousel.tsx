"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight, BookOpen, Clock, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface Course {
  id: string
  slug: string
  title: string
  description: string | null
  thumbnail_url: string | null
  instructor_name: string | null
  duration_hours: number | null
  level: string | null
  rating: number | null
  students_count: number
}

interface CategoryCarouselProps {
  courses: Course[]
  categoryName: string
  categorySlug: string
}

export function CategoryCarousel({ courses, categoryName, categorySlug }: CategoryCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [slidesPerView, setSlidesPerView] = useState(3)

  // Responsividade
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setSlidesPerView(1)
      } else if (window.innerWidth < 1024) {
        setSlidesPerView(2)
      } else {
        setSlidesPerView(3)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const maxIndex = Math.max(0, courses.length - slidesPerView)

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => Math.max(0, prev - 1))
  }, [])

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1))
  }, [maxIndex])

  const visibleCourses = courses.slice(currentIndex, currentIndex + slidesPerView)

  if (courses.length === 0) {
    return null
  }

  return (
    <div className="mb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">{categoryName}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {courses.length} {courses.length === 1 ? 'curso disponível' : 'cursos disponíveis'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Navigation Buttons */}
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="h-9 w-9"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNext}
            disabled={currentIndex >= maxIndex}
            className="h-9 w-9"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* View All Link */}
          <Link href={`/courses?category=${categorySlug}`}>
            <Button variant="ghost" size="sm" className="ml-2">
              Ver todos
            </Button>
          </Link>
        </div>
      </div>

      {/* Carousel */}
      <div className="relative">
        <div className="overflow-hidden">
          <div
            className="flex gap-6 transition-transform duration-300 ease-out"
            style={{
              transform: `translateX(-${currentIndex * (100 / slidesPerView + 2)}%)`,
            }}
          >
            {courses.map((course) => (
              <div
                key={course.id}
                className="flex-shrink-0"
                style={{ width: `calc(${100 / slidesPerView}% - ${(slidesPerView - 1) * 24 / slidesPerView}px)` }}
              >
                <Link href={`/courses/${course.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer group">
                    {/* Thumbnail */}
                    <div className="aspect-video w-full bg-gradient-to-br from-primary/20 to-primary/5 relative overflow-hidden">
                      {course.thumbnail_url ? (
                        <img
                          src={course.thumbnail_url}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="h-16 w-16 text-primary/40" />
                        </div>
                      )}

                      {/* Level Badge */}
                      {course.level && (
                        <div className="absolute top-3 right-3">
                          <Badge variant="secondary" className="backdrop-blur-sm bg-background/80">
                            {course.level === 'beginner' ? 'Iniciante' :
                             course.level === 'intermediate' ? 'Intermediário' : 'Avançado'}
                          </Badge>
                        </div>
                      )}
                    </div>

                    <CardContent className="p-5">
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {course.title}
                      </h3>

                      {course.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                          {course.description}
                        </p>
                      )}

                      {/* Instructor */}
                      {course.instructor_name && (
                        <p className="text-xs text-muted-foreground mb-3">
                          Por {course.instructor_name}
                        </p>
                      )}

                      {/* Meta Info */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {course.duration_hours && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{course.duration_hours}h</span>
                          </div>
                        )}

                        {course.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                            <span>{course.rating.toFixed(1)}</span>
                          </div>
                        )}

                        {course.students_count > 0 && (
                          <div className="flex items-center gap-1">
                            <span>{course.students_count} alunos</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Progress Indicators */}
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-1.5 rounded-full transition-all ${
                index === currentIndex
                  ? 'w-8 bg-primary'
                  : 'w-1.5 bg-muted hover:bg-muted-foreground/50'
              }`}
              aria-label={`Ir para página ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
