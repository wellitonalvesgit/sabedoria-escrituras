// Script para corrigir o metadata do usuário admin no Supabase Auth
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

async function fixAdminUser() {
  const email = 'geisonhoehr@gmail.com'

  console.log(`🔧 Corrigindo usuário admin: ${email}\n`)

  // 1. Buscar dados na tabela users
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (userError || !user) {
    console.error('❌ Erro ao buscar usuário:', userError?.message || 'Não encontrado')
    return
  }

  console.log('📊 Dados atuais na tabela users:')
  console.log(`   Role: ${user.role}`)
  console.log(`   Status: ${user.status}`)
  console.log(`   Nome: ${user.name}\n`)

  if (user.role !== 'admin') {
    console.log('⚠️  Role não é admin! Corrigindo...')
    const { error: updateError } = await supabase
      .from('users')
      .update({ role: 'admin' })
      .eq('id', user.id)

    if (updateError) {
      console.error('❌ Erro ao atualizar role:', updateError.message)
      return
    }
    console.log('✅ Role corrigido para admin\n')
  }

  // 2. Atualizar metadata no Supabase Auth
  console.log('🔄 Atualizando metadata no Supabase Auth...')

  const { data: authData, error: authError } = await supabase.auth.admin.updateUserById(
    user.id,
    {
      user_metadata: {
        name: user.name,
        role: 'admin',  // Corrigir role para admin
        email_verified: true
      }
    }
  )

  if (authError) {
    console.error('❌ Erro ao atualizar metadata:', authError.message)
    return
  }

  console.log('✅ Metadata atualizado com sucesso!\n')

  // 3. Verificar resultado
  const { data: authUsers } = await supabase.auth.admin.listUsers()
  const authUser = authUsers.users.find(u => u.email === email)

  if (authUser) {
    console.log('📧 Novo metadata no Supabase Auth:')
    console.log('━'.repeat(50))
    console.log(`Email: ${authUser.email}`)
    console.log(`Metadata:`, JSON.stringify(authUser.user_metadata, null, 2))
    console.log('━'.repeat(50))
  }

  console.log('\n✅ Correção completa!')
  console.log('\n💡 Agora o usuário geisonhoehr@gmail.com deve ter acesso admin.')
}

fixAdminUser()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Erro:', err)
    process.exit(1)
  })
