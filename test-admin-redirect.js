// Teste específico para verificar o problema do usuário admin
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://aqvqpkmjdtzeoclndwhj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxdnFwa21qZHR6ZW9jbG5kd2hqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTA5MjY4NiwiZXhwIjoyMDc2NjY4Njg2fQ.0sBklMOxA7TsCiCP8_8oxjumxK43jj8PRia1LE_Mybs'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAdminRedirect() {
  console.log('🔍 Testando redirecionamento admin para geisonhoehr@gmail.com...')
  
  try {
    // 1. Fazer login
    console.log('\n1. Fazendo login...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'geisonhoehr@gmail.com',
      password: 'Geison@252'
    })
    
    if (authError) {
      console.error('❌ Erro no login:', authError)
      return
    }
    
    console.log('✅ Login realizado!')
    console.log('📊 User ID:', authData.user?.id)
    
    // 2. Verificar dados do usuário
    console.log('\n2. Verificando dados do usuário...')
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, role, status')
      .eq('id', authData.user?.id)
      .single()
    
    if (userError) {
      console.error('❌ Erro ao buscar usuário:', userError)
      return
    }
    
    console.log('✅ Dados do usuário:', userData)
    
    // 3. Simular lógica de redirecionamento
    console.log('\n3. Simulando lógica de redirecionamento...')
    
    if (userData.role === 'admin') {
      console.log('✅ Usuário é admin - deveria ir para /admin')
      console.log('🔗 URL de destino: /admin')
    } else {
      console.log('❌ Usuário NÃO é admin - vai para /dashboard')
      console.log('🔗 URL de destino: /dashboard')
    }
    
    // 4. Verificar se há algum problema com o cache
    console.log('\n4. Verificando se há problemas de cache...')
    
    // Simular múltiplas consultas para ver se há inconsistência
    for (let i = 1; i <= 3; i++) {
      const { data: testData, error: testError } = await supabase
        .from('users')
        .select('id, email, role, status')
        .eq('id', authData.user?.id)
        .single()
      
      console.log(`📊 Consulta ${i}:`, testData?.role, testData?.status)
      
      if (testError) {
        console.error(`❌ Erro na consulta ${i}:`, testError)
      }
    }
    
    // 5. Fazer logout
    console.log('\n5. Fazendo logout...')
    await supabase.auth.signOut()
    console.log('✅ Logout realizado')
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

testAdminRedirect()
