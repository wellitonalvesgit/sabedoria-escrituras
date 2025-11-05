// Script de teste para verificar dados do usuário
// Execute com: node test-user-access.js

const { createClient } = require('@supabase/supabase-js')

// Configure com suas credenciais
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function testUserAccess() {
  console.log('🔍 Testando acesso do usuário aluno@teste.com...\n')

  try {
    // 1. Buscar usuário por email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'aluno@teste.com')
      .single()

    if (userError) {
      console.error('❌ Erro ao buscar usuário:', userError)
      return
    }

    console.log('✅ Usuário encontrado:')
    console.log('   ID:', user.id)
    console.log('   Email:', user.email)
    console.log('   Nome:', user.name)
    console.log('   Status:', user.status)
    console.log('   Role:', user.role)
    console.log('\n📅 Informações de acesso:')
    console.log('   access_days:', user.access_days)
    console.log('   access_expires_at:', user.access_expires_at)
    console.log('\n📚 Cursos permitidos (allowed_courses):')
    console.log('   Tipo:', typeof user.allowed_courses, Array.isArray(user.allowed_courses) ? '(array)' : '(não é array)')
    console.log('   Valor:', JSON.stringify(user.allowed_courses, null, 2))
    console.log('   Quantidade:', user.allowed_courses?.length || 0)

    console.log('\n🚫 Cursos bloqueados (blocked_courses):')
    console.log('   Tipo:', typeof user.blocked_courses, Array.isArray(user.blocked_courses) ? '(array)' : '(não é array)')
    console.log('   Valor:', JSON.stringify(user.blocked_courses, null, 2))
    console.log('   Quantidade:', user.blocked_courses?.length || 0)

    // 2. Buscar cursos "Kit da Mulher"
    console.log('\n\n🔍 Buscando cursos "Kit da Mulher"...')
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id, title')
      .ilike('title', '%Kit da Mulher%')

    if (coursesError) {
      console.error('❌ Erro ao buscar cursos:', coursesError)
      return
    }

    console.log('✅ Cursos encontrados:')
    courses.forEach(course => {
      const isAllowed = user.allowed_courses?.includes(course.id)
      const isBlocked = user.blocked_courses?.includes(course.id)
      console.log(`   - ${course.title}`)
      console.log(`     ID: ${course.id}`)
      console.log(`     Permitido: ${isAllowed ? '✅ SIM' : '❌ NÃO'}`)
      console.log(`     Bloqueado: ${isBlocked ? '🚫 SIM' : '✅ NÃO'}`)
    })

    // 3. Verificar período de acesso
    console.log('\n\n⏰ Verificando período de acesso:')
    if (user.access_expires_at) {
      const expirationDate = new Date(user.access_expires_at)
      const now = new Date()
      const isValid = expirationDate > now
      const daysRemaining = Math.ceil((expirationDate - now) / (1000 * 60 * 60 * 24))

      console.log(`   Expira em: ${expirationDate.toLocaleString('pt-BR')}`)
      console.log(`   Agora: ${now.toLocaleString('pt-BR')}`)
      console.log(`   Válido: ${isValid ? '✅ SIM' : '❌ NÃO (expirado)'}`)
      console.log(`   Dias restantes: ${daysRemaining}`)
    } else {
      console.log('   ⚠️  Sem data de expiração definida')
    }

    // 4. Testar lógica de acesso
    console.log('\n\n🧪 Testando lógica de acesso para cada curso "Kit da Mulher":')
    courses.forEach(course => {
      console.log(`\n   Curso: ${course.title} (${course.id})`)

      const isBlocked = user.blocked_courses?.includes(course.id)
      console.log(`   1. Está bloqueado? ${isBlocked ? '🚫 SIM (ACESSO NEGADO)' : '✅ NÃO'}`)

      if (!isBlocked) {
        if (user.access_expires_at) {
          const expirationDate = new Date(user.access_expires_at)
          const now = new Date()
          const hasValidPeriod = expirationDate > now
          console.log(`   2. Período de acesso válido? ${hasValidPeriod ? '✅ SIM (ACESSO CONCEDIDO)' : '❌ NÃO'}`)
        }

        const isAllowed = user.allowed_courses?.includes(course.id)
        console.log(`   3. Está em allowed_courses? ${isAllowed ? '✅ SIM (ACESSO CONCEDIDO)' : '❌ NÃO'}`)

        if (!isAllowed) {
          const hasNoSpecificCourses = !user.allowed_courses || user.allowed_courses.length === 0
          console.log(`   4. Sem cursos específicos (acesso geral)? ${hasNoSpecificCourses ? '✅ SIM (ACESSO CONCEDIDO)' : '❌ NÃO (ACESSO NEGADO)'}`)
        }
      }
    })

    console.log('\n\n✅ Teste concluído!')

  } catch (error) {
    console.error('❌ Erro durante o teste:', error)
  }
}

testUserAccess()
