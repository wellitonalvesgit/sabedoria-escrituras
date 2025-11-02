// Este é um script para testar o login diretamente com a API do Supabase
// Execute com: node test-login-direct.js

const { createClient } = require('@supabase/supabase-js');

// Estas são as mesmas credenciais do .env
const supabaseUrl = 'https://aqvqpkmjdtzeoclndwhj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxdnFwa21qZHR6ZW9jbG5kd2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwOTI2ODYsImV4cCI6MjA3NjY2ODY4Nn0.ZStT6hrlRhT3bigKWc3i6An_lL09R_t5gdZ4WIyyYyY';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxdnFwa21qZHR6ZW9jbG5kd2hqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTA5MjY4NiwiZXhwIjoyMDc2NjY4Njg2fQ.0sBklMOxA7TsCiCP8_8oxjumxK43jj8PRia1LE_Mybs';

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Função para fazer login
async function testLogin() {
  console.log('🔍 Testando login direto com a API do Supabase...');
  
  try {
    // Tentar fazer login
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'geisonhoehr.ai@gmail.com',
      password: '123456',
    });
    
    if (error) {
      console.error('❌ Erro no login:', error.message);
      return;
    }
    
    console.log('✅ Login bem-sucedido!');
    console.log('📊 Dados da sessão:');
    console.log('- User ID:', data.user.id);
    console.log('- Email:', data.user.email);
    console.log('- Session expira em:', new Date(data.session.expires_at));
    
    // Criar cliente com service role para buscar dados do usuário
    const adminSupabase = createClient(supabaseUrl, serviceRoleKey);
    
    // Buscar dados do usuário
    const { data: userData, error: userError } = await adminSupabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();
      
    if (userError) {
      console.error('❌ Erro ao buscar dados do usuário:', userError.message);
      return;
    }
    
    console.log('✅ Dados do usuário encontrados:');
    console.log('- Nome:', userData.name);
    console.log('- Status:', userData.status);
    console.log('- Acesso expira em:', userData.access_expires_at);
    console.log('- Cursos permitidos:', userData.allowed_courses?.length || 0);
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

// Executar o teste
testLogin();
