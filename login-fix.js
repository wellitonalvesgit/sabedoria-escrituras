// Script para testar e corrigir o login
// Execute este script no console do navegador na página de login

// 1. Limpar completamente o localStorage
console.log('🧹 Limpando localStorage...');
localStorage.clear();

// 2. Verificar se há cookies relacionados ao Supabase
console.log('🔍 Verificando cookies...');
document.cookie.split(';').forEach(cookie => {
  if (cookie.includes('sb-') || cookie.includes('supabase')) {
    console.log('🍪 Cookie encontrado:', cookie);
  }
});

// 3. Criar uma função para fazer login diretamente
async function loginDirect() {
  console.log('🔑 Tentando login direto...');
  
  // Obter URL e chave do Supabase
  const supabaseUrl = 'https://aqvqpkmjdtzeoclndwhj.supabase.co';
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxdnFwa21qZHR6ZW9jbG5kd2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwOTI2ODYsImV4cCI6MjA3NjY2ODY4Nn0.ZStT6hrlRhT3bigKWc3i6An_lL09R_t5gdZ4WIyyYyY';
  
  // Criar cliente Supabase diretamente
  const { createClient } = supabase;
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
      storageKey: 'sb-auth-token',
      flowType: 'pkce'
    }
  });
  
  try {
    // Fazer login
    const { data, error } = await client.auth.signInWithPassword({
      email: 'geisonhoehr.ai@gmail.com',
      password: '123456'
    });
    
    if (error) {
      console.error('❌ Erro no login:', error.message);
      return;
    }
    
    console.log('✅ Login bem-sucedido!');
    console.log('📊 Dados da sessão:', data);
    
    // Verificar se a sessão foi armazenada corretamente
    setTimeout(async () => {
      const { data: sessionData } = await client.auth.getSession();
      console.log('📊 Sessão após login:', sessionData);
      
      // Redirecionar para o dashboard
      if (sessionData.session) {
        console.log('🔄 Redirecionando para o dashboard...');
        window.location.href = '/dashboard';
      }
    }, 1000);
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

// 4. Executar a função de login
loginDirect();
