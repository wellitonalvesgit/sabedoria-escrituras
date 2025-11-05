require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function disableFreePlan() {
  console.log('\n🔧 DESATIVANDO PLANO GRATUITO\n')
  console.log('='  .repeat(60))

  // Desativar plano free-trial
  console.log('\n1️⃣ Desativando plano gratuito (free-trial)...')
  const { data, error } = await supabase
    .from('subscription_plans')
    .update({ is_active: false })
    .eq('name', 'free-trial')
    .select()

  if (error) {
    console.log('   ❌ Erro ao desativar plano:', error.message)
  } else if (data && data.length > 0) {
    console.log('   ✅ Plano "free-trial" desativado com sucesso')
  } else {
    console.log('   ⚠️  Plano "free-trial" não encontrado')
  }

  // Listar planos ativos
  console.log('\n2️⃣ Listando planos ativos...')
  const { data: activePlans, error: listError } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (listError) {
    console.log('   ❌ Erro ao listar planos:', listError.message)
  } else {
    console.log('\n📋 PLANOS ATIVOS (APENAS PAGOS):\n')
    activePlans.forEach((plan, idx) => {
      console.log(`${idx + 1}. ${plan.display_name}`)
      console.log(`   Nome técnico: ${plan.name}`)
      console.log(`   Preço: R$ ${plan.price_monthly}`)
      console.log(`   Duração: ${plan.duration_days ? plan.duration_days + ' dias' : 'VITALÍCIO ♾️'}`)
      console.log()
    })
  }

  console.log('='  .repeat(60))
  console.log('\n✅ Desativação concluída!\n')
  console.log('ℹ️  Apenas', activePlans.length, 'plano(s) pago(s) ativo(s).')
}

disableFreePlan().catch(console.error)
