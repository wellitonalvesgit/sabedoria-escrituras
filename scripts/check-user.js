// Script para verificar dados do usuário no banco
const { createClient } = require('@supabase/supabase-js')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Variáveis de ambiente não carregadas!')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'OK' : 'MISSING')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'OK' : 'MISSING')
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkUser(email) {
  console.log(`\n🔍 Verificando usuário: ${email}\n`)

  // Buscar na tabela users
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (error) {
    console.error('❌ Erro ao buscar usuário:', error.message)
    return
  }

  if (!user) {
    console.log('❌ Usuário não encontrado')
    return
  }

  console.log('✅ Usuário encontrado:')
  console.log('━'.repeat(50))
  console.log(`ID: ${user.id}`)
  console.log(`Email: ${user.email}`)
  console.log(`Nome: ${user.name}`)
  console.log(`Role: ${user.role}`)
  console.log(`Status: ${user.status}`)
  console.log(`Criado em: ${user.created_at}`)
  console.log(`Último acesso: ${user.last_active_at}`)
  console.log('━'.repeat(50))

  // Verificar no Supabase Auth
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

  if (!authError && authUsers) {
    const authUser = authUsers.users.find(u => u.email === email)
    if (authUser) {
      console.log('\n📧 Dados no Supabase Auth:')
      console.log('━'.repeat(50))
      console.log(`ID: ${authUser.id}`)
      console.log(`Email: ${authUser.email}`)
      console.log(`Email confirmado: ${authUser.email_confirmed_at ? 'Sim' : 'Não'}`)
      console.log(`Metadata:`, JSON.stringify(authUser.user_metadata, null, 2))
      console.log('━'.repeat(50))
    }
  }

  return user
}

// Verificar ambos os emails
async function main() {
  console.log('🚀 Iniciando verificação...\n')

  await checkUser('geisonhoehr@gmail.com')
  console.log('\n' + '='.repeat(50) + '\n')
  await checkUser('geisonhoehr.ai@gmail.com')

  console.log('\n✅ Verificação completa!')
  process.exit(0)
}

main().catch(err => {
  console.error('❌ Erro:', err)
  process.exit(1)
})
