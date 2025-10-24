const { createClient } = require('@supabase/supabase-js')

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aqvqpkmjdtzeoclndwhj.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxdnFwa21qZHR6ZW9jbG5kd2hqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDY3NDgwMCwiZXhwIjoyMDUwMjUwODAwfQ.ServiceRoleKeyServiceRoleKeyServiceRoleKeyServiceRoleKeyServiceRoleKey'

const supabase = createClient(supabaseUrl, supabaseKey)

async function seedDatabase() {
  console.log('Iniciando seed do banco de dados...')

  // 1. Inserir curso de exemplo
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .insert({
      id: 'panorama-parabolas-jesus',
      slug: 'panorama-parabolas-jesus',
      title: 'Panorama das Parábolas de Jesus',
      description: 'Análise completa das parábolas de Jesus Cristo com contexto histórico e aplicações práticas.',
      author: 'Pr. Welliton Alves Dos Santos',
      category: 'Panorama Bíblico',
      pages: 120,
      reading_time_minutes: 180,
      cover_url: '/bible-study-books-parabolas.jpg',
      status: 'published',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (courseError) {
    console.error('Erro ao inserir curso:', courseError)
    return
  }

  console.log('✅ Curso inserido:', course.title)

  // 2. Inserir PDFs do curso
  const pdfs = [
    {
      course_id: course.id,
      volume: 'VOL-I',
      title: 'Panorama Bíblico - Desvendando as Parábolas de Jesus - Parte 01',
      url: 'https://drive.google.com/file/d/1EbjfK--R591qRxg06HddKjr095qEZO6p/preview',
      pages: 20,
      reading_time_minutes: 30,
      text_content: null,
      use_auto_conversion: true,
      display_order: 0
    },
    {
      course_id: course.id,
      volume: 'VOL-II',
      title: 'Panorama Bíblico - Desvendando as Parábolas de Jesus - Parte 02',
      url: 'https://drive.google.com/file/d/1EbjfK--R591qRxg06HddKjr095qEZO6p/preview',
      pages: 20,
      reading_time_minutes: 30,
      text_content: null,
      use_auto_conversion: true,
      display_order: 1
    }
  ]

  const { error: pdfsError } = await supabase
    .from('course_pdfs')
    .insert(pdfs)

  if (pdfsError) {
    console.error('Erro ao inserir PDFs:', pdfsError)
  } else {
    console.log('✅ PDFs inseridos:', pdfs.length)
  }

  // 3. Inserir usuários de exemplo
  const users = [
    {
      id: '43f29360-cfff-4f67-8c6e-70503e4194b9',
      name: 'Aluno Teste',
      email: 'aluno@teste.com',
      role: 'student',
      status: 'active',
      total_points: 150,
      total_reading_minutes: 120,
      courses_enrolled: 1,
      courses_completed: 0,
      current_level: 2,
      access_days: 30,
      access_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      allowed_categories: [],
      blocked_categories: [],
      allowed_courses: [],
      blocked_courses: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_active_at: new Date().toISOString()
    },
    {
      id: 'admin-user-id',
      name: 'Admin Teste',
      email: 'admin@teste.com',
      role: 'admin',
      status: 'active',
      total_points: 500,
      total_reading_minutes: 300,
      courses_enrolled: 5,
      courses_completed: 3,
      current_level: 5,
      access_days: 365,
      access_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      allowed_categories: [],
      blocked_categories: [],
      allowed_courses: [],
      blocked_courses: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_active_at: new Date().toISOString()
    }
  ]

  const { error: usersError } = await supabase
    .from('users')
    .insert(users)

  if (usersError) {
    console.error('Erro ao inserir usuários:', usersError)
  } else {
    console.log('✅ Usuários inseridos:', users.length)
  }

  console.log('🎉 Seed do banco de dados concluído!')
}

// Executar seed
seedDatabase().catch(console.error)

