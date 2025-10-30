"use client"

import { useState } from "react"
import { BookOpen, Check, Star, Users, Award, Clock, Shield, ArrowRight, Eye, Target, Heart, Wrench, Compass } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"
import { LoginModal } from "@/components/login-modal"

export default function LandingPage() {
  const [showLogin, setShowLogin] = useState(false)

  const features = [
    {
      icon: <Eye className="h-6 w-6" />,
      title: "Compreensão Imediata",
      description: "Entenda cada versículo em linguagem simples. Pare de 'pular' textos difíceis."
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: "Aplicação Diária",
      description: "Transforme ensino em ação: decisões, hábitos e relacionamentos guiados pela Palavra."
    },
    {
      icon: <BookOpen className="h-6 w-6" />,
      title: "Dúvidas Resolvidas",
      description: "Respostas diretas para os textos mais desafiadores. Menos incerteza, mais segurança."
    },
    {
      icon: <Heart className="h-6 w-6" />,
      title: "Aprofundamento Espiritual",
      description: "Fortaleça sua fé com clareza. Sinta-se mais próximo de Cristo a cada estudo."
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Ferramentas para Grupos",
      description: "Lidere estudos com confiança. Roteiros e perguntas prontas para discussões ricas."
    },
    {
      icon: <Compass className="h-6 w-6" />,
      title: "Visão de Conjunto",
      description: "Veja como cada versículo se conecta ao plano maior do Evangelho — sem teologia complicada."
    }
  ]

  const testimonials = [
    {
      name: "Maria Silva",
      text: "Finalmente consegui entender as Cartas de Paulo! As explicações são claras e práticas.",
      rating: 5
    },
    {
      name: "João Santos",
      text: "Transformou completamente minha leitura da Bíblia. Recomendo para todos!",
      rating: 5
    },
    {
      name: "Ana Costa",
      text: "Perfeito para quem quer estudar a Palavra com profundidade e clareza.",
      rating: 5
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
                <BookOpen className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-semibold tracking-tight">Sabedoria das Escrituras</span>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Button variant="ghost" className="hover:bg-primary/10 hover:text-primary" onClick={() => setShowLogin(true)}>
                Entrar
              </Button>
              <Button onClick={() => setShowLogin(true)}>
                Começar Agora
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
          <div className="text-center">
            <Badge variant="secondary" className="mb-4 bg-[#F3C77A] text-black">
              PARA HOMENS E MULHERES DE DEUS
            </Badge>
            <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
              O que Paulo quis dizer de verdade,{" "}
              <span className="text-primary">revelado versículo por versículo</span>
            </h1>
            <p className="mt-6 text-xl text-muted-foreground max-w-3xl mx-auto">
              Entenda as Cartas de Paulo com explicações simples, contexto histórico e aplicações práticas — mesmo que você nunca tenha feito teologia.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 py-4 hover:bg-primary/90" onClick={() => setShowLogin(true)}>
                QUERO AS CARTAS DE PAULO AGORA MESMO!
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-4 hover:bg-primary hover:text-primary-foreground" onClick={() => setShowLogin(true)}>
                QUERO AS CARTAS DE PAULO AGORA MESMO!
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              É ideal para você que deseja:
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-lg hover:border-primary/20 transition-all duration-300">
                <CardContent className="p-0">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                  </div>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Content Preview */}
      <section className="py-24 bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground mb-4">
              POR DENTRO DO CONTEÚDO
            </h2>
            <p className="text-xl text-muted-foreground">
              <strong>13 cartas. 1 método.</strong> Explicações objetivas • Contexto histórico • Aplicação prática.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              { title: "Filemom", description: "Perdão que restaura relações e quebra barreiras sociais." },
              { title: "1 Timóteo", description: "Liderança saudável e igreja organizada sem legalismo." },
              { title: "1 Tessalonicenses", description: "Esperança no retorno de Cristo e vida santa no cotidiano." },
              { title: "2 Tessalonicenses", description: "Discernimento sobre falsos ensinos e trabalho diligente." },
              { title: "Colossenses", description: "Cristo acima de tudo — centro e razão da vida." },
              { title: "Filipenses", description: "Alegria que não depende das circunstâncias." },
              { title: "Efésios", description: "A graça que une e fortalece a igreja." },
              { title: "Romanos", description: "A base da fé cristã — salvação pela graça." },
              { title: "1 Coríntios", description: "Unidade e maturidade em meio ao caos." },
              { title: "2 Coríntios", description: "Força espiritual nas fraquezas humanas." },
              { title: "1 Pedro", description: "Liderança que inspira e serve." },
              { title: "2 Pedro", description: "Perseverança até o fim da caminhada." }
            ].map((course, index) => (
              <Card key={index} className="p-6 hover:shadow-lg hover:border-primary/20 transition-all duration-300">
                <CardContent className="p-0">
                  <h3 className="text-lg font-semibold text-foreground mb-2">{course.title}</h3>
                  <p className="text-muted-foreground">{course.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground mb-4">
              NOSSO PRODUTO É 100% RECOMENDADO
            </h2>
            <div className="flex justify-center items-center gap-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-6 w-6 fill-yellow-400 text-yellow-400" />
              ))}
              <span className="ml-2 text-lg font-semibold">5/5</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6 hover:shadow-lg hover:border-primary/20 transition-all duration-300">
                <CardContent className="p-0">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4">"{testimonial.text}"</p>
                  <p className="font-semibold text-foreground">— {testimonial.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Guarantee */}
      <section className="py-24 bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center">
            <Shield className="h-16 w-16 text-primary mx-auto mb-6" />
            <h2 className="text-3xl font-bold tracking-tight text-foreground mb-4">
              Zero risco. Tudo a ganhar.
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Se dentro de 7 dias você sentir que As Cartas de Paulo não te ajudaram a entender a Bíblia com mais clareza, devolvemos 100% do seu dinheiro, sem perguntas, sem burocracia.
            </p>
            <p className="text-lg font-semibold text-foreground">
              A confiança é total — ou você transforma sua leitura da Palavra, ou não paga nada.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 bg-primary/5">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold tracking-tight text-foreground mb-6">
              Acesso liberado em segundos
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Comece seus estudos ainda hoje — sem esperas, sem complicação.
            </p>
            <Button size="lg" className="text-lg px-8 py-4 hover:bg-primary/90" onClick={() => setShowLogin(true)}>
              QUERO AS CARTAS DE PAULO AGORA MESMO!
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <BookOpen className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold">Sabedoria das Escrituras</span>
            </div>
            <p className="text-muted-foreground">
              Feito com ❤ Para Você e Sua Família!
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  )
}
