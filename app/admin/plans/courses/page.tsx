"use client"

import { useState, useEffect } from "react"
import { BookOpen, Save, ArrowLeft, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"

interface Course {
  id: string
  title: string
  description: string | null
  is_free: boolean
}

interface Plan {
  id: string
  name: string
  display_name: string
  allowed_courses: string[] | null
}

export default function AdminPlanCoursesPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Buscar planos
      const plansRes = await fetch('/api/admin/plans')
      if (plansRes.ok) {
        const plansData = await plansRes.json()
        setPlans(plansData.plans || [])
        if (plansData.plans && plansData.plans.length > 0) {
          const basicPlan = plansData.plans.find((p: Plan) => p.name === 'basico')
          if (basicPlan) {
            setSelectedPlan(basicPlan)
            setSelectedCourses(basicPlan.allowed_courses || [])
          }
        }
      }

      // Buscar cursos
      const coursesRes = await fetch('/api/admin/courses')
      if (coursesRes.ok) {
        const coursesData = await coursesRes.json()
        setCourses(coursesData.courses || [])
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleCourse = (courseId: string) => {
    setSelectedCourses(prev => {
      if (prev.includes(courseId)) {
        return prev.filter(id => id !== courseId)
      } else {
        return [...prev, courseId]
      }
    })
  }

  const handleSave = async () => {
    if (!selectedPlan) return

    try {
      setSaving(true)

      const response = await fetch('/api/admin/plans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedPlan.id,
          allowed_courses: selectedCourses
        })
      })

      if (response.ok) {
        alert('Cursos do plano atualizados com sucesso!')
        await fetchData()
      } else {
        alert('Erro ao atualizar cursos do plano')
      }
    } catch (error) {
      console.error('Erro ao salvar:', error)
      alert('Erro ao salvar cursos do plano')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          <span>Carregando...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/admin" className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
                  <BookOpen className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-semibold tracking-tight">As Cartas de Paulo</span>
              </Link>
              <Badge variant="secondary" className="bg-[#F3C77A] text-black">
                Cursos por Plano
              </Badge>
            </div>
            <Link href="/admin/plans">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar aos Planos
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 pt-8 pb-8 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
            Configurar Cursos por Plano
          </h1>
          <p className="text-muted-foreground">
            Selecione quais cursos estarão disponíveis em cada plano
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar: Seletor de Plano */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Selecionar Plano</CardTitle>
                <CardDescription>Escolha o plano para configurar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {plans.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => {
                      setSelectedPlan(plan)
                      setSelectedCourses(plan.allowed_courses || [])
                    }}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedPlan?.id === plan.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="font-semibold">{plan.display_name}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {plan.allowed_courses === null
                        ? 'Todos os cursos'
                        : `${plan.allowed_courses.length} curso(s) selecionado(s)`}
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            {selectedPlan && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-sm">Informação</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p>
                    <strong>NULL</strong> = Todos os cursos
                  </p>
                  <p>
                    <strong>Lista vazia []</strong> = Nenhum curso
                  </p>
                  <p>
                    <strong>Lista com IDs</strong> = Cursos específicos
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main: Lista de Cursos */}
          <div className="lg:col-span-2">
            {selectedPlan ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Cursos Disponíveis</CardTitle>
                      <CardDescription>
                        Configure quais cursos estarão no plano <strong>{selectedPlan.display_name}</strong>
                      </CardDescription>
                    </div>
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Salvar
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedPlan.name === 'premium' ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-lg font-semibold mb-2">Plano Premium</p>
                      <p>Este plano tem acesso a TODOS os cursos automaticamente.</p>
                      <p className="text-sm mt-2">Não é necessário configurar cursos específicos.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {courses.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          Nenhum curso encontrado
                        </div>
                      ) : (
                        courses.map((course) => (
                          <div
                            key={course.id}
                            className="flex items-start gap-3 p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                          >
                            <Checkbox
                              id={course.id}
                              checked={selectedCourses.includes(course.id)}
                              onCheckedChange={() => handleToggleCourse(course.id)}
                            />
                            <label
                              htmlFor={course.id}
                              className="flex-1 cursor-pointer"
                            >
                              <div className="font-semibold">{course.title}</div>
                              {course.description && (
                                <div className="text-sm text-muted-foreground mt-1">
                                  {course.description}
                                </div>
                              )}
                              {course.is_free && (
                                <Badge variant="secondary" className="mt-2">
                                  Curso Gratuito
                                </Badge>
                              )}
                            </label>
                            {selectedCourses.includes(course.id) && (
                              <Check className="h-5 w-5 text-primary" />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Selecione um plano para configurar os cursos
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
