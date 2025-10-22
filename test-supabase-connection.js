// Script simples para testar conexão com Supabase
// Execute: node test-supabase-connection.js

const url = 'https://aqvqpkmjdtzeoclndwhj.supabase.co/rest/v1/courses?select=*&limit=1';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxdnFwa21qZHR6ZW9jbG5kd2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwOTI2ODYsImV4cCI6MjA3NjY2ODY4Nn0.ZStT6hrlRhT3bigKWc3i6An_lL09R_t5gdZ4WIyyYyY';

console.log('🔍 Testando conexão com Supabase...\n');

fetch(url, {
  headers: {
    'apikey': anonKey,
    'Authorization': `Bearer ${anonKey}`
  }
})
  .then(response => {
    console.log(`📡 Status: ${response.status} ${response.statusText}`);
    return response.json();
  })
  .then(data => {
    if (Array.isArray(data)) {
      console.log(`✅ Conexão OK! Encontrados ${data.length} curso(s)`);
      if (data.length > 0) {
        console.log('\n📚 Primeiro curso:');
        console.log(JSON.stringify(data[0], null, 2));
      } else {
        console.log('\n⚠️  Tabela "courses" existe mas está vazia.');
        console.log('   Execute o script de migração para popular os dados!');
      }
    } else if (data.message) {
      console.log(`❌ Erro: ${data.message}`);
      if (data.message.includes('relation "public.courses" does not exist')) {
        console.log('\n⛔ A tabela "courses" NÃO existe no Supabase!');
        console.log('📋 Você precisa executar o SQL do arquivo "supabase-schema.sql"');
        console.log('🔗 Acesse: https://supabase.com/dashboard/project/aqvqpkmjdtzeoclndwhj/sql');
      }
    } else {
      console.log('🔍 Resposta:', data);
    }
  })
  .catch(error => {
    console.log(`❌ Erro na conexão: ${error.message}`);
  });
