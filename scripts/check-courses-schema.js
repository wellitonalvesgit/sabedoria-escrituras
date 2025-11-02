/**
 * Script para verificar schema da tabela courses
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkSchema() {
  console.log('🔍 Verificando estrutura da tabela courses...\n')

  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .limit(1)
    .single()

  if (error) {
    console.error('❌ Erro:', error.message)
    return
  }

  console.log('📋 Campos disponíveis:\n')
  Object.keys(data).forEach(key => {
    console.log(`- ${key}: ${typeof data[key]} = ${data[key]}`)
  })

  console.log('\n🔍 Procurando campo de controle de acesso...\n')

  const accessFields = Object.keys(data).filter(key =>
    key.includes('access') ||
    key.includes('free') ||
    key.includes('type') ||
    key.includes('premium')
  )

  if (accessFields.length > 0) {
    console.log('✅ Campos encontrados:')
    accessFields.forEach(field => {
      console.log(`  - ${field}: ${data[field]}`)
    })
  } else {
    console.log('⚠️  Nenhum campo de acesso encontrado')
    console.log('💡 Sugestão: Adicionar campo "access_type" (free, premium, livre)')
  }
}

checkSchema()
