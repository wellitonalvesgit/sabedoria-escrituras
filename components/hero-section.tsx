"use client"

import { motion } from "framer-motion"

export const HeroSection = () => {
  const featuredCourse = {
    title: "Esboço do Livro de Ezequiel",
    description: "Explore o livro de Ezequiel com esboços detalhados, contexto histórico e aplicações práticas.",
    coverUrl: "/professional-business-leadership-training.jpg",
  }

  return (
    <section className="relative overflow-hidden rounded-3xl bg-[#0E0C0A] px-8 py-16 text-white shadow-[0_40px_120px_rgba(0,0,0,0.4)]">
      <motion.div
        className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-br from-[#F3C77A] via-[#B68D52] to-[#463A28] opacity-40 blur-3xl"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 12, repeat: Number.POSITIVE_INFINITY }}
      />
      <div className="relative z-10 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <motion.h1
            className="text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl"
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            Formação bíblica premium com experiência de revista digital
          </motion.h1>
          <motion.p
            className="text-lg text-[#D6CBB8] sm:text-xl"
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            Acesse seus cursos em PDF com efeito flipbook, gamificação e ranking em tempo real para estimular a
            comunidade a permanecer mergulhada nos estudos.
          </motion.p>
          <motion.div
            className="flex flex-wrap items-center gap-4"
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <a
              href="#cursos"
              className="rounded-full bg-[#F3C77A] px-8 py-3 text-base font-semibold text-black shadow-[0_20px_60px_rgba(243,199,122,0.35)] transition-transform duration-300 hover:-translate-y-1"
            >
              Explorar cursos
            </a>
            <div className="flex items-center gap-3 rounded-full border border-[#3B3327] bg-[#161310] px-5 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F3C77A] text-[#161310]">
                ★
              </div>
              <div>
                <p className="text-sm uppercase tracking-widest text-[#7F735E]">Curso em destaque</p>
                <p className="text-base font-medium text-white">{featuredCourse.title}</p>
              </div>
            </div>
          </motion.div>
        </div>
        <motion.div
          className="relative hidden aspect-[3/4] rounded-3xl bg-cover bg-center bg-no-repeat shadow-2xl lg:block"
          style={{
            backgroundImage: `url(${featuredCourse.coverUrl})`,
          }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2 }}
        >
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 rounded-2xl bg-black/40 p-6 backdrop-blur">
            <p className="text-sm uppercase tracking-[0.4em] text-[#F3C77A]">PDF interativo</p>
            <p className="mt-2 text-2xl font-semibold">{featuredCourse.title}</p>
            <p className="mt-1 text-sm text-[#D6CBB8]">{featuredCourse.description}</p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
