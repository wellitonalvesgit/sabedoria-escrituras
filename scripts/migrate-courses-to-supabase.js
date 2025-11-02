const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config()

// Configuração do Supabase - OBRIGATÓRIO usar variáveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Validar variáveis obrigatórias
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERRO: Variáveis de ambiente não configuradas!')
  console.error('Configure no arquivo .env:')
  console.error('  NEXT_PUBLIC_SUPABASE_URL=sua_url')
  console.error('  SUPABASE_SERVICE_ROLE_KEY=sua_chave')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Ler dados dos cursos do arquivo local
const coursesDataPath = path.join(__dirname, '../lib/courses-data.ts')
const coursesDataContent = fs.readFileSync(coursesDataPath, 'utf8')

// Extrair dados dos cursos usando regex (simplificado)
const coursesMatch = coursesDataContent.match(/export const courses: Course\[\] = (\[[\s\S]*?\])/);
if (!coursesMatch) {
  console.error('Não foi possível extrair dados dos cursos')
  process.exit(1)
}

let courses
try {
  // Remover comentários e converter para JSON válido
  const coursesJson = coursesMatch[1]
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comentários de bloco
    .replace(/\/\/.*$/gm, '') // Remove comentários de linha
    .replace(/(\w+):/g, '"$1":') // Adiciona aspas nas chaves
    .replace(/'/g, '"') // Substitui aspas simples por duplas
  
  courses = JSON.parse(coursesJson)
} catch (error) {
  console.error('Erro ao fazer parse dos cursos:', error)
  process.exit(1)
}

async function migrateCourses() {
  console.log(`Iniciando migração de ${courses.length} cursos...`)

  for (const course of courses) {
    try {
      console.log(`Migrando curso: ${course.title}`)

      // Inserir curso
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .insert({
          id: course.id,
          slug: course.slug,
          title: course.title,
          description: course.description,
          author: course.author,
          category: course.category,
          pages: course.pages,
          reading_time_minutes: course.readingTimeMinutes,
          cover_url: course.coverUrl,
          status: 'published',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (courseError) {
        console.error(`Erro ao inserir curso ${course.title}:`, courseError)
        continue
      }

      // Inserir PDFs do curso
      if (course.pdfs && course.pdfs.length > 0) {
        const pdfsToInsert = course.pdfs.map((pdf, index) => ({
          course_id: courseData.id,
          volume: pdf.volume,
          title: pdf.title,
          url: pdf.url,
          pages: pdf.pages,
          reading_time_minutes: pdf.readingTimeMinutes,
          text_content: null,
          use_auto_conversion: true,
          display_order: index
        }))

        const { error: pdfsError } = await supabase
          .from('course_pdfs')
          .insert(pdfsToInsert)

        if (pdfsError) {
          console.error(`Erro ao inserir PDFs do curso ${course.title}:`, pdfsError)
        } else {
          console.log(`✅ Curso ${course.title} migrado com sucesso (${course.pdfs.length} PDFs)`)
        }
      }

    } catch (error) {
      console.error(`Erro ao migrar curso ${course.title}:`, error)
    }
  }

  console.log('Migração concluída!')
}

// Executar migração
migrateCourses().catch(console.error)



