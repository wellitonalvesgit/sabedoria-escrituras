/**
 * Script para verificar schema da tabela users
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkSchema() {
  // Buscar um usuário para ver os campos disponíveis
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .limit(1)
    .single()

  if (error) {
    console.error('Erro:', error)
    return
  }

  console.log('📋 Campos disponíveis na tabela users:\n')
  console.log(JSON.stringify(data, null, 2))

  console.log('\n📊 Campos relacionados a assinatura/pagamento:\n')

  const subscriptionFields = Object.keys(data).filter(key =>
    key.includes('subscription') ||
    key.includes('plan') ||
    key.includes('trial') ||
    key.includes('payment') ||
    key.includes('access') ||
    key.includes('expires')
  )

  subscriptionFields.forEach(field => {
    console.log(`- ${field}: ${data[field]}`)
  })
}

checkSchema()
