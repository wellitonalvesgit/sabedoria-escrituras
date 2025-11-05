/**
 * Script de teste para compra de curso
 * 
 * Como usar:
 * 1. Abra o console do navegador (F12)
 * 2. Certifique-se de estar logado na plataforma
 * 3. Cole este script no console e execute
 */

async function testarCompraCurso(emailOpcional = null) {
  console.log('🧪 Iniciando teste de compra de curso...\n');

  try {
    const response = await fetch('/api/test-course-purchase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: emailOpcional || undefined
      })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      console.log('✅ Teste executado com sucesso!\n');
      console.log('📦 Compra criada:');
      console.log('   - Usuário:', data.purchase.user);
      console.log('   - Curso:', data.purchase.course);
      console.log('   - Valor: R$', data.purchase.amount.toFixed(2).replace('.', ','));
      console.log('\n📧 Email:');
      console.log('   - Status:', data.email.sent ? '✅ Enviado' : '❌ Falhou');
      console.log('   - Destinatário:', data.email.to);
      console.log('   - Assunto:', data.email.subject);
      
      if (data.email.sent) {
        console.log('\n📬 Verifique sua caixa de entrada! O email deve ter chegado em alguns segundos.');
      } else {
        console.log('\n⚠️ Erro ao enviar email. Verifique os logs do servidor.');
      }
      
      console.log('\n📄 Dados completos:', JSON.stringify(data, null, 2));
    } else {
      console.error('❌ Erro no teste:', data.error || 'Erro desconhecido');
      console.log('📄 Detalhes:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
    console.log('\n💡 Dicas:');
    console.log('   - Certifique-se de estar logado na plataforma');
    console.log('   - Verifique se o servidor está rodando');
    console.log('   - Verifique se a URL está correta');
  }
}

// Exemplo de uso:
// testarCompraCurso() // Usa o primeiro usuário do banco
// testarCompraCurso('seu-email@exemplo.com') // Especifica um email

// Executar automaticamente
testarCompraCurso();

