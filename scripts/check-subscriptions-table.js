/**
 * Script para verificar tabela de subscriptions
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkSubscriptions() {
  console.log('🔍 Verificando tabela subscriptions...\n')

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .limit(5)

  if (error) {
    console.error('❌ Erro ao acessar subscriptions:', error.message)
    console.log('\n⚠️  Tabela subscriptions pode não existir ou não ter dados\n')
  } else {
    console.log('✅ Tabela subscriptions encontrada!')
    console.log(`📊 Total de registros encontrados: ${data.length}\n`)

    if (data.length > 0) {
      console.log('📋 Exemplo de registro:\n')
      console.log(JSON.stringify(data[0], null, 2))
    }
  }

  console.log('\n🔍 Verificando tabela subscription_plans...\n')

  const { data: plans, error: plansError } = await supabase
    .from('subscription_plans')
    .select('*')

  if (plansError) {
    console.error('❌ Erro ao acessar subscription_plans:', plansError.message)
  } else {
    console.log('✅ Tabela subscription_plans encontrada!')
    console.log(`📊 Total de planos: ${plans.length}\n`)

    plans.forEach(plan => {
      console.log(`- ${plan.name}: R$ ${plan.price} (${plan.duration_days} dias)`)
    })
  }
}

checkSubscriptions()
