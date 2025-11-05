require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function cleanupOldPlans() {
  console.log('\n🗑️  LIMPANDO PLANOS INATIVOS DO BANCO\n')
  console.log('='  .repeat(60))

  // Listar todos os planos antes da limpeza
  console.log('\n1️⃣ Listando todos os planos...')
  const { data: allPlans } = await supabase
    .from('subscription_plans')
    .select('*')
    .order('sort_order', { ascending: true })

  console.log('\n📋 PLANOS NO BANCO (ANTES DA LIMPEZA):\n')
  allPlans.forEach((plan, idx) => {
    console.log(`${idx + 1}. ${plan.display_name} (${plan.name})`)
    console.log(`   Status: ${plan.is_active ? '✅ Ativo' : '❌ Inativo'}`)
  })

  // Deletar planos inativos
  console.log('\n2️⃣ Deletando planos inativos...')
  const { data: deletedPlans, error } = await supabase
    .from('subscription_plans')
    .delete()
    .eq('is_active', false)
    .select()

  if (error) {
    console.log('   ❌ Erro ao deletar planos inativos:', error.message)
    console.log('   ℹ️  Isso pode acontecer se existem assinaturas vinculadas aos planos antigos.')
    console.log('   ℹ️  Neste caso, os planos inativos não serão exibidos aos usuários.')
  } else if (deletedPlans && deletedPlans.length > 0) {
    console.log(`   ✅ ${deletedPlans.length} plano(s) inativo(s) deletado(s) com sucesso`)
    deletedPlans.forEach(plan => {
      console.log(`      - ${plan.display_name} (${plan.name})`)
    })
  } else {
    console.log('   ℹ️  Nenhum plano inativo encontrado para deletar')
  }

  // Listar planos finais
  console.log('\n3️⃣ Listando planos finais (apenas ativos)...')
  const { data: finalPlans } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  console.log('\n📋 PLANOS ATIVOS (APÓS LIMPEZA):\n')
  finalPlans.forEach((plan, idx) => {
    console.log(`${idx + 1}. ${plan.display_name}`)
    console.log(`   Nome técnico: ${plan.name}`)
    console.log(`   Preço: R$ ${plan.price_monthly}`)
    console.log(`   Duração: ${plan.duration_days ? plan.duration_days + ' dias' : 'ILIMITADO ♾️'}`)
    console.log()
  })

  console.log('='  .repeat(60))
  console.log('\n✅ Limpeza concluída!\n')
  console.log('ℹ️  Apenas', finalPlans.length, 'plano(s) ativo(s) serão exibidos aos usuários.')
}

cleanupOldPlans().catch(console.error)
