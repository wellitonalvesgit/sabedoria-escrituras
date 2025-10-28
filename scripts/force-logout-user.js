// Script para forçar logout de um usuário específico
const { createClient } = require('@supabase/supabase-js')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Variáveis de ambiente não carregadas!')
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function forceLogout(email) {
  console.log(`🔓 Forçando logout do usuário: ${email}\n`)

  // 1. Buscar usuário
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, email, name, role')
    .eq('email', email)
    .single()

  if (userError || !user) {
    console.error('❌ Usuário não encontrado:', userError?.message)
    return
  }

  console.log('👤 Usuário encontrado:')
  console.log(`   ID: ${user.id}`)
  console.log(`   Email: ${user.email}`)
  console.log(`   Nome: ${user.name}`)
  console.log(`   Role: ${user.role}`)
  console.log('')

  // 2. Revogar todas as sessões ativas do usuário
  console.log('🔄 Revogando todas as sessões ativas...')

  const { error: signOutError } = await supabase.auth.admin.signOut(user.id)

  if (signOutError) {
    console.error('❌ Erro ao revogar sessões:', signOutError.message)
    return
  }

  console.log('✅ Todas as sessões foram revogadas!')
  console.log('')
  console.log('📝 INSTRUÇÕES:')
  console.log('━'.repeat(50))
  console.log('O usuário precisa fazer LOGIN NOVAMENTE para:')
  console.log('1. Obter nova sessão')
  console.log('2. Carregar dados atualizados (role: admin)')
  console.log('3. Ser redirecionado para /admin')
  console.log('━'.repeat(50))
  console.log('')
  console.log(`✅ Pronto! O usuário ${email} foi desconectado.`)
  console.log('   Ao fazer login novamente, verá o painel admin.')
}

// Email do usuário admin
const adminEmail = 'geisonhoehr@gmail.com'

forceLogout(adminEmail)
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Erro:', err)
    process.exit(1)
  })
