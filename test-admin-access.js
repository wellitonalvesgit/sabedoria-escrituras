// Script para testar acesso admin do usuário geisonhoehr@gmail.com
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://aqvqpkmjdtzeoclndwhj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxdnFwa21qZHR6ZW9jbG5kd2hqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTA5MjY4NiwiZXhwIjoyMDc2NjY4Njg2fQ.0sBklMOxA7TsCiCP8_8oxjumxK43jj8PRia1LE_Mybs'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAdminAccess() {
  console.log('🔍 Testando acesso admin para geisonhoehr@gmail.com...')
  
  try {
    // 1. Verificar dados do usuário no banco
    console.log('\n1. Verificando dados do usuário no banco...')
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, role, status')
      .eq('email', 'geisonhoehr@gmail.com')
      .single()
    
    if (userError) {
      console.error('❌ Erro ao buscar usuário:', userError)
      return
    }
    
    console.log('✅ Dados do usuário:', userData)
    
    // 2. Tentar fazer login
    console.log('\n2. Tentando fazer login...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'geisonhoehr@gmail.com',
      password: 'Geison@252'
    })
    
    if (authError) {
      console.error('❌ Erro no login:', authError)
      return
    }
    
    console.log('✅ Login realizado com sucesso!')
    console.log('📊 Dados da sessão:', {
      userId: authData.user?.id,
      email: authData.user?.email,
      role: userData.role,
      status: userData.status
    })
    
    // 3. Verificar se o usuário tem acesso admin
    console.log('\n3. Verificando acesso admin...')
    if (userData.role === 'admin' && userData.status === 'active') {
      console.log('✅ Usuário tem permissões de admin!')
      console.log('🔗 Deveria conseguir acessar: /admin')
    } else {
      console.log('❌ Usuário NÃO tem permissões de admin')
      console.log('📊 Role:', userData.role, 'Status:', userData.status)
    }
    
    // 4. Fazer logout
    console.log('\n4. Fazendo logout...')
    await supabase.auth.signOut()
    console.log('✅ Logout realizado')
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

testAdminAccess()
