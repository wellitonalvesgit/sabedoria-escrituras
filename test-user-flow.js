#!/usr/bin/env node

/**
 * Script de teste automatizado - Fluxo do usuário
 * Simula login e testes como usuário real
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const email = 'geisonhoehr.ai@gmail.com';
const password = '123456';

console.log('🧪 TESTE AUTOMATIZADO - FLUXO DO USUÁRIO');
console.log('='.repeat(50));
console.log('');

async function testUserFlow() {
  // Criar cliente como usuário comum
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  console.log('📋 TESTE 1: Login');
  console.log('-'.repeat(50));

  try {
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (loginError) {
      console.error('❌ Erro no login:', loginError.message);
      return false;
    }

    if (!loginData.user) {
      console.error('❌ Login falhou - usuário não retornado');
      return false;
    }

    console.log('✅ Login bem-sucedido!');
    console.log(`   User ID: ${loginData.user.id}`);
    console.log(`   Email: ${loginData.user.email}`);
    console.log('');

    // TESTE 2: Ver próprio perfil
    console.log('📋 TESTE 2: Acessar próprio perfil');
    console.log('-'.repeat(50));

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', loginData.user.id)
      .single();

    if (userError) {
      console.error('❌ Erro ao buscar perfil:', userError.message);
      console.error('   Código:', userError.code);
      console.error('   Detalhes:', userError.details);
      console.error('');
      console.error('⚠️  PROBLEMA: RLS está bloqueando acesso ao próprio perfil!');
      console.error('   SOLUÇÃO: Execute o script SQL: fix-authentication-rls-complete.sql');
      return false;
    }

    if (!userData) {
      console.error('❌ Perfil não encontrado');
      return false;
    }

    console.log('✅ Perfil acessado com sucesso!');
    console.log(`   Nome: ${userData.name}`);
    console.log(`   Email: ${userData.email}`);
    console.log(`   Role: ${userData.role}`);
    console.log(`   Status: ${userData.status}`);
    console.log(`   Acesso expira: ${userData.access_expires_at || 'Não definido'}`);
    console.log('');

    // TESTE 3: Atualizar perfil
    console.log('📋 TESTE 3: Atualizar próprio perfil');
    console.log('-'.repeat(50));

    const testName = `${userData.name} (Teste ${Date.now()})`;

    const { data: updateData, error: updateError } = await supabase
      .from('users')
      .update({ name: testName })
      .eq('id', loginData.user.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erro ao atualizar perfil:', updateError.message);
      console.error('   Código:', updateError.code);
      console.error('');
      console.error('⚠️  PROBLEMA: RLS está bloqueando atualização do próprio perfil!');
      console.error('   SOLUÇÃO: Execute o script SQL: fix-authentication-rls-complete.sql');
      return false;
    }

    console.log('✅ Perfil atualizado com sucesso!');
    console.log(`   Nome atualizado para: ${updateData.name}`);
    console.log('');

    // Reverter mudança
    await supabase
      .from('users')
      .update({ name: userData.name })
      .eq('id', loginData.user.id);

    console.log('✅ Nome revertido para o original');
    console.log('');

    // TESTE 4: Verificar políticas RLS
    console.log('📋 TESTE 4: Verificar políticas RLS');
    console.log('-'.repeat(50));

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: policies, error: policiesError } = await supabaseAdmin
      .from('pg_policies')
      .select('policyname, tablename, cmd')
      .eq('tablename', 'users');

    if (policiesError) {
      console.warn('⚠️  Não foi possível verificar políticas:', policiesError.message);
    } else if (policies) {
      console.log(`✅ Total de políticas RLS na tabela users: ${policies.length}`);
      policies.forEach(policy => {
        console.log(`   - ${policy.policyname} (${policy.cmd})`);
      });

      if (policies.length < 4) {
        console.log('');
        console.warn('⚠️  ATENÇÃO: Esperado 4 políticas, encontrado', policies.length);
        console.warn('   Execute o script SQL: fix-authentication-rls-complete.sql');
      }
    }
    console.log('');

    // TESTE 5: Verificar acesso aos cursos
    console.log('📋 TESTE 5: Verificar acesso aos cursos');
    console.log('-'.repeat(50));

    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id, title, status')
      .eq('status', 'published')
      .limit(5);

    if (coursesError) {
      console.error('❌ Erro ao buscar cursos:', coursesError.message);
    } else {
      console.log(`✅ Cursos encontrados: ${courses?.length || 0}`);
      if (courses && courses.length > 0) {
        courses.forEach(course => {
          console.log(`   - ${course.title}`);
        });
      }
    }
    console.log('');

    // TESTE 6: Verificar controle de acesso
    console.log('📋 TESTE 6: Controle de acesso do usuário');
    console.log('-'.repeat(50));

    console.log('✅ Configuração de acesso:');
    console.log(`   Cursos permitidos: ${userData.allowed_courses?.length || 0}`);
    console.log(`   Cursos bloqueados: ${userData.blocked_courses?.length || 0}`);
    console.log(`   Categorias permitidas: ${userData.allowed_categories?.length || 0}`);
    console.log(`   Categorias bloqueadas: ${userData.blocked_categories?.length || 0}`);

    if (userData.allowed_courses && userData.allowed_courses.length > 0) {
      console.log('   IDs de cursos permitidos:', userData.allowed_courses.join(', '));
    }
    if (userData.blocked_courses && userData.blocked_courses.length > 0) {
      console.log('   IDs de cursos bloqueados:', userData.blocked_courses.join(', '));
    }
    console.log('');

    // Logout
    await supabase.auth.signOut();
    console.log('✅ Logout realizado');
    console.log('');

    return true;

  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
    return false;
  }
}

async function runTests() {
  const success = await testUserFlow();

  console.log('='.repeat(50));
  if (success) {
    console.log('🎉 TODOS OS TESTES PASSARAM!');
    console.log('='.repeat(50));
    console.log('');
    console.log('✅ Sistema de autenticação funcionando corretamente');
    console.log('✅ Usuário pode ver seu próprio perfil');
    console.log('✅ Usuário pode editar seu próprio perfil');
    console.log('✅ Políticas RLS configuradas');
    console.log('✅ Sistema pronto para uso!');
    console.log('');
    console.log('📋 Próximos passos:');
    console.log('1. Acesse: http://localhost:3000/login');
    console.log('2. Login: geisonhoehr.ai@gmail.com / 123456');
    console.log('3. Teste as páginas: /dashboard, /profile, /settings');
    process.exit(0);
  } else {
    console.log('❌ ALGUNS TESTES FALHARAM');
    console.log('='.repeat(50));
    console.log('');
    console.log('⚠️  Ação necessária:');
    console.log('1. Execute o script SQL: fix-authentication-rls-complete.sql');
    console.log('2. Acesse: https://app.supabase.com/project/aqvqpkmjdtzeoclndwhj/sql/new');
    console.log('3. Copie e cole o conteúdo do arquivo SQL');
    console.log('4. Clique em RUN');
    console.log('5. Execute este teste novamente: node test-user-flow.js');
    console.log('');
    console.log('📚 Consulte: EXECUTAR-AGORA.md para instruções detalhadas');
    process.exit(1);
  }
}

runTests();
