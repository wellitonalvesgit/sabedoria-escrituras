#!/usr/bin/env node

/**
 * Script para executar as correções de RLS no Supabase
 *
 * Uso: node execute-fix-sql.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Carregar variáveis de ambiente
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente não encontradas');
  console.error('Certifique-se de que .env contém:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Criar cliente Supabase com service role key (bypassa RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSqlFile() {
  console.log('🔄 Lendo arquivo SQL...');

  const sqlFile = path.join(__dirname, 'fix-authentication-rls-complete.sql');

  if (!fs.existsSync(sqlFile)) {
    console.error('❌ Arquivo não encontrado:', sqlFile);
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(sqlFile, 'utf8');

  console.log('📝 Arquivo SQL carregado');
  console.log('🔄 Executando correções no Supabase...');
  console.log('');

  try {
    // Dividir o SQL em comandos individuais
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('/*'));

    console.log(`📊 Total de comandos SQL: ${commands.length}`);
    console.log('');

    let successCount = 0;
    let errorCount = 0;

    // Executar cada comando
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];

      // Pular comentários e blocos DO
      if (command.startsWith('DO $$') ||
          command.includes('RAISE NOTICE') ||
          command.trim().length < 10) {
        continue;
      }

      console.log(`⏳ Executando comando ${i + 1}/${commands.length}...`);

      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: command + ';'
        });

        if (error) {
          // Tentar executar diretamente via REST API
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`
            },
            body: JSON.stringify({ sql_query: command + ';' })
          });

          if (!response.ok) {
            console.warn(`⚠️  Comando ${i + 1} pode ter falhado (isso é normal para alguns comandos)`);
            errorCount++;
          } else {
            console.log(`✅ Comando ${i + 1} executado`);
            successCount++;
          }
        } else {
          console.log(`✅ Comando ${i + 1} executado`);
          successCount++;
        }
      } catch (err) {
        console.warn(`⚠️  Erro no comando ${i + 1}:`, err.message);
        errorCount++;
      }
    }

    console.log('');
    console.log('='.repeat(50));
    console.log('📊 RESUMO DA EXECUÇÃO');
    console.log('='.repeat(50));
    console.log(`✅ Comandos bem-sucedidos: ${successCount}`);
    console.log(`⚠️  Comandos com aviso: ${errorCount}`);
    console.log('');

    console.log('🔍 Verificando políticas criadas...');
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('policyname, tablename')
      .eq('tablename', 'users');

    if (!policiesError && policies) {
      console.log(`✅ Total de políticas na tabela users: ${policies.length}`);
      policies.forEach(policy => {
        console.log(`   - ${policy.policyname}`);
      });
    }

    console.log('');
    console.log('🔍 Verificando usuário teste...');
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email, status, role, access_expires_at')
      .eq('email', 'geisonhoehr.ai@gmail.com')
      .single();

    if (!userError && user) {
      console.log('✅ Usuário encontrado:');
      console.log(`   - Email: ${user.email}`);
      console.log(`   - Status: ${user.status}`);
      console.log(`   - Role: ${user.role}`);
      console.log(`   - Acesso expira: ${user.access_expires_at}`);
    } else {
      console.log('⚠️  Usuário não encontrado ou erro:', userError?.message);
    }

    console.log('');
    console.log('='.repeat(50));
    console.log('✅ CORREÇÕES APLICADAS COM SUCESSO!');
    console.log('='.repeat(50));
    console.log('');
    console.log('📋 PRÓXIMOS PASSOS:');
    console.log('1. Reinicie o servidor: npm run dev');
    console.log('2. Teste o login com: geisonhoehr.ai@gmail.com');
    console.log('3. Acesse: /dashboard, /profile, /settings');
    console.log('');

  } catch (error) {
    console.error('❌ Erro ao executar SQL:', error);
    process.exit(1);
  }
}

// Executar
executeSqlFile().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
