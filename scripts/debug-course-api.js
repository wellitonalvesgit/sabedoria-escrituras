require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function debugCourseApi() {
  console.log('\n🔍 DEBUG: API de Cursos Admin\n')
  console.log('='  .repeat(60))

  // 1. Listar todos os cursos
  console.log('\n1️⃣ Listando todos os cursos no banco...')
  const { data: allCourses, error: listError } = await supabase
    .from('courses')
    .select('id, title, slug, status')
    .order('created_at', { ascending: false })

  if (listError) {
    console.log('❌ Erro ao listar cursos:', listError.message)
    return
  }

  console.log(`\n✅ Encontrados ${allCourses.length} curso(s):\n`)

  allCourses.forEach((course, idx) => {
    console.log(`${idx + 1}. ${course.title}`)
    console.log(`   ID: ${course.id}`)
    console.log(`   Slug: ${course.slug}`)
    console.log(`   Status: ${course.status}`)
    console.log()
  })

  // 2. Testar busca de um curso específico com todos os campos
  if (allCourses.length > 0) {
    const firstCourse = allCourses[0]
    console.log(`2️⃣ Testando busca completa do curso: "${firstCourse.title}"\n`)

    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select(`
        *,
        course_pdfs (
          id,
          volume,
          title,
          url,
          pages,
          reading_time_minutes,
          text_content,
          use_auto_conversion,
          display_order,
          cover_url,
          youtube_url,
          audio_url
        ),
        course_categories (
          category_id,
          categories (
            id,
            name,
            slug,
            color
          )
        )
      `)
      .eq('id', firstCourse.id)
      .single()

    if (courseError) {
      console.log('❌ Erro ao buscar curso:', courseError.message)
      console.log('Código do erro:', courseError.code)
      console.log('Detalhes:', courseError.details)
      console.log('Hint:', courseError.hint)
    } else {
      console.log('✅ Curso encontrado com sucesso!')
      console.log(`   Título: ${course.title}`)
      console.log(`   PDFs: ${course.course_pdfs?.length || 0}`)
      console.log(`   Categorias: ${course.course_categories?.length || 0}`)

      if (course.course_pdfs && course.course_pdfs.length > 0) {
        console.log('\n   📚 Volumes:')
        course.course_pdfs.forEach(pdf => {
          console.log(`   - ${pdf.volume}: ${pdf.title}`)
          console.log(`     Cover: ${pdf.cover_url ? '✅' : '❌'}`)
          console.log(`     YouTube: ${pdf.youtube_url ? '✅' : '❌'}`)
          console.log(`     Audio: ${pdf.audio_url ? '✅' : '❌'}`)
        })
      }
    }
  }

  // 3. Verificar RLS
  console.log('\n3️⃣ Verificando Row Level Security...')
  const { data: rlsInfo, error: rlsError } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT
        schemaname,
        tablename,
        rowsecurity
      FROM pg_tables
      WHERE tablename IN ('courses', 'course_pdfs', 'course_categories');
    `
  })

  if (rlsError) {
    console.log('⚠️  Não foi possível verificar RLS (esperado)')
  } else if (rlsInfo) {
    console.log('\nStatus RLS:')
    rlsInfo.forEach(table => {
      console.log(`   ${table.tablename}: ${table.rowsecurity ? '🔒 Ativado' : '🔓 Desativado'}`)
    })
  }

  // 4. Testar URL da API
  console.log('\n4️⃣ Testando URL da API local...')
  try {
    const response = await fetch('http://localhost:3000/api/courses?admin=true')
    console.log(`   Status HTTP: ${response.status}`)

    if (response.ok) {
      const data = await response.json()
      console.log(`   ✅ API respondendo! ${data.courses?.length || 0} curso(s) retornados`)
    } else {
      const error = await response.json()
      console.log(`   ❌ Erro da API: ${error.error || 'Erro desconhecido'}`)
    }
  } catch (fetchError) {
    console.log(`   ⚠️  Servidor local não está rodando ou não está acessível`)
    console.log(`   Execute: npm run dev`)
  }

  console.log('\n' + '='  .repeat(60))
  console.log('\n✅ Debug concluído!\n')
}

debugCourseApi().catch(console.error)
