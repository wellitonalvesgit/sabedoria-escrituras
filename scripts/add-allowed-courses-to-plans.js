require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function addAllowedCoursesToPlans() {
  console.log('\n🔧 ADICIONANDO CAMPO allowed_courses AOS PLANOS\n')
  console.log('='  .repeat(60))

  // Nota: A adição da coluna precisa ser feita via SQL direto no Supabase
  // Este script apenas configura os valores iniciais

  console.log('\n⚠️  IMPORTANTE:')
  console.log('Execute primeiro o SQL no Supabase SQL Editor:')
  console.log('scripts/add-allowed-courses-to-plans.sql')
  console.log()

  // Verificar se a coluna existe
  const { data: plans, error } = await supabase
    .from('subscription_plans')
    .select('id, name, display_name, allowed_courses')
    .eq('is_active', true)

  if (error) {
    console.log('❌ Erro:', error.message)
    console.log('\n⚠️  A coluna allowed_courses ainda não existe.')
    console.log('Execute o SQL: scripts/add-allowed-courses-to-plans.sql')
    return
  }

  console.log('✅ Coluna allowed_courses existe!\n')
  console.log('📋 PLANOS CONFIGURADOS:\n')

  plans.forEach((plan) => {
    console.log(`- ${plan.display_name} (${plan.name})`)
    if (plan.allowed_courses === null) {
      console.log('  ✅ Acesso: TODOS OS CURSOS')
    } else if (plan.allowed_courses.length === 0) {
      console.log('  ⚠️  Acesso: NENHUM CURSO (configure via admin)')
    } else {
      console.log(`  ✅ Acesso: ${plan.allowed_courses.length} curso(s) específico(s)`)
    }
    console.log()
  })

  console.log('='  .repeat(60))
  console.log('\n📝 Próximos passos:')
  console.log('1. Acesse /admin/plans')
  console.log('2. Configure quais cursos o plano Básico pode acessar')
  console.log('3. Plano Premium mantém acesso total (NULL)')
  console.log()
}

addAllowedCoursesToPlans().catch(console.error)
