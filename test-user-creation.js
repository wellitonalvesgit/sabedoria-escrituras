require('dotenv').config({ path: '.env' });

async function testUserCreation() {
  console.log('🧪 Testando criação de usuário e envio de email...\n');

  const email = 'geisonveiga511@gmail.com';
  const name = 'Geison Veiga';

  console.log('📧 Email:', email);
  console.log('👤 Nome:', name);
  console.log('');

  try {
    console.log('📡 Conectando ao servidor local...');
    const response = await fetch('http://localhost:3000/api/test-webhook-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name })
    });

    console.log('✅ Resposta recebida. Status:', response.status);
    console.log('');

    const data = await response.json();

    if (data.success) {
      console.log('✅ SUCESSO!\n');
      console.log('Mensagem:', data.message);
      console.log('');
      console.log('👤 Usuário:');
      console.log('  - ID:', data.user.id);
      console.log('  - Nome:', data.user.name);
      console.log('  - Email:', data.user.email);
      console.log('  - Novo?:', data.user.isNew ? 'SIM' : 'NÃO');
      console.log('');

      if (data.credentials) {
        console.log('═══════════════════════════════════════════');
        console.log('🔑 CREDENCIAIS DE ACESSO');
        console.log('═══════════════════════════════════════════');
        console.log('');
        console.log('  Email: ' + data.credentials.email);
        console.log('  Senha: ' + data.credentials.temporaryPassword);
        console.log('');
        console.log('═══════════════════════════════════════════');
        console.log('');
      }

      if (data.email) {
        console.log('📧 Email:');
        console.log('  - Enviado?:', data.email.sent ? '✅ SIM' : '❌ NÃO');
        if (data.email.to) console.log('  - Para:', data.email.to);
        if (data.email.subject) console.log('  - Assunto:', data.email.subject);
        if (data.email.error) {
          console.log('  - ❌ Erro:', data.email.error);
        }
        console.log('');
      }

      console.log('🎉 Teste concluído com sucesso!');
      console.log('');
      console.log('📱 Próximos passos:');
      console.log('1. Verifique seu email:', email);
      console.log('2. Procure por email com assunto sobre "Bem-vindo"');
      if (data.credentials) {
        console.log('3. Use a senha acima para fazer login');
      }
      console.log('4. Acesse: https://app.paulocartas.com.br/login');
    } else {
      console.log('❌ ERRO:', data.error);
    }
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
    console.log('');
    console.log('⚠️ Certifique-se que o servidor está rodando:');
    console.log('');
    console.log('  Terminal 1: npm run dev');
    console.log('  Terminal 2: node test-user-creation.js');
  }
}

console.log('');
console.log('═══════════════════════════════════════════');
console.log('   TESTE DE CRIAÇÃO DE USUÁRIO');
console.log('   Sistema de Checkout - As Cartas de Paulo');
console.log('═══════════════════════════════════════════');
console.log('');

testUserCreation();
