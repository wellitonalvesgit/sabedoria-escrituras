require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function diagnoseAdminAccess() {
  const email = 'geisonhoehr@gmail.com'

  console.log('\n🔍 DIAGNÓSTICO COMPLETO - ACESSO ADMIN\n')
  console.log('='  .repeat(60))

  // 1. Verificar database
  console.log('\n1️⃣ VERIFICANDO TABELA USERS:')
  const { data: dbUser } = await supabase
    .from('users')
    .select('id, email, name, role, status')
    .eq('email', email)
    .single()

  if (dbUser) {
    console.log('✅ Database:')
    console.log(`   Role: ${dbUser.role}`)
    console.log(`   Status: ${dbUser.status}`)
  } else {
    console.log('❌ Usuário não encontrado no database')
  }

  // 2. Verificar Auth Metadata
  console.log('\n2️⃣ VERIFICANDO AUTH METADATA:')
  const { data: authData } = await supabase.auth.admin.listUsers()
  const authUser = authData.users.find(u => u.email === email)

  if (authUser) {
    console.log('✅ Auth Metadata:')
    console.log(`   Role no metadata: ${authUser.user_metadata?.role || 'NÃO DEFINIDO'}`)
    console.log(`   Metadata completo:`, JSON.stringify(authUser.user_metadata, null, 2))
  } else {
    console.log('❌ Usuário não encontrado no Auth')
  }

  // 3. Comparar
  console.log('\n3️⃣ COMPARAÇÃO:')
  if (dbUser && authUser) {
    const dbRole = dbUser.role
    const authRole = authUser.user_metadata?.role

    if (dbRole === authRole && dbRole === 'admin') {
      console.log('✅ TUDO CORRETO - Role é "admin" em ambos')
      console.log('\n💡 SOLUÇÃO:')
      console.log('   O problema é CACHE! O usuário precisa:')
      console.log('   1. Fazer LOGOUT completo')
      console.log('   2. Fazer LOGIN novamente')
      console.log('   3. Isso vai limpar:')
      console.log('      - Cache do Middleware (30s)')
      console.log('      - Cache do SessionManager (5min)')
      console.log('      - Cache do PremiumAccessGate (5min)')
    } else {
      console.log('❌ INCONSISTÊNCIA DETECTADA:')
      console.log(`   Database: ${dbRole}`)
      console.log(`   Auth Metadata: ${authRole}`)
      console.log('\n💡 SOLUÇÃO: Executar script de correção')
    }
  }

  // 4. Verificar últimas sessões
  console.log('\n4️⃣ VERIFICANDO SESSÕES ATIVAS:')
  if (authUser) {
    const sessions = authUser.identities || []
    console.log(`   Total de identities: ${sessions.length}`)
    console.log(`   Último login: ${authUser.last_sign_in_at}`)
  }

  console.log('\n' + '='.repeat(60))
  console.log('\n✅ Diagnóstico completo!\n')
}

diagnoseAdminAccess().catch(console.error)
