require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function deactivateOldPlans() {
  console.log('\n🔧 DESATIVANDO PLANOS ANTIGOS\n')
  console.log('='  .repeat(60))

  // Planos antigos que devem ser desativados
  const oldPlanNames = ['free', 'premium-monthly', 'premium-yearly']

  console.log('\n1️⃣ Desativando planos antigos...')

  for (const planName of oldPlanNames) {
    const { data, error } = await supabase
      .from('subscription_plans')
      .update({ is_active: false })
      .eq('name', planName)
      .select()

    if (error) {
      console.log(`   ❌ Erro ao desativar plano "${planName}":`, error.message)
    } else if (data && data.length > 0) {
      console.log(`   ✅ Plano "${planName}" desativado com sucesso`)
    } else {
      console.log(`   ⚠️  Plano "${planName}" não encontrado`)
    }
  }

  // Listar todos os planos ativos
  console.log('\n2️⃣ Listando planos ativos...')
  const { data: activePlans, error: listError } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (listError) {
    console.log('   ❌ Erro ao listar planos:', listError.message)
  } else {
    console.log('\n📋 PLANOS ATIVOS:\n')
    activePlans.forEach((plan, idx) => {
      console.log(`${idx + 1}. ${plan.display_name}`)
      console.log(`   Nome técnico: ${plan.name}`)
      console.log(`   Preço: R$ ${plan.price_monthly}`)
      console.log(`   Duração: ${plan.duration_days ? plan.duration_days + ' dias' : 'ILIMITADO ♾️'}`)
      console.log()
    })
  }

  console.log('='  .repeat(60))
  console.log('\n✅ Desativação concluída!\n')
}

deactivateOldPlans().catch(console.error)
