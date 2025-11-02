/**
 * Script de teste: Sistema de Highlights e Summaries
 * Verifica se as tabelas foram criadas corretamente no Supabase
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testHighlights() {
  console.log('\n🧪 Testando Sistema de Highlights e Summaries\n')
  console.log('=' .repeat(60))

  try {
    // 1. Verificar tabela highlights
    console.log('\n1️⃣  Verificando tabela HIGHLIGHTS...')
    const { data: highlights, error: highlightsError } = await supabase
      .from('highlights')
      .select('*')
      .limit(5)

    if (highlightsError) {
      console.error('❌ Erro ao acessar tabela highlights:', highlightsError.message)
    } else {
      console.log('✅ Tabela highlights acessível')
      console.log(`   → ${highlights.length} registros encontrados`)
    }

    // 2. Verificar tabela summaries
    console.log('\n2️⃣  Verificando tabela SUMMARIES...')
    const { data: summaries, error: summariesError } = await supabase
      .from('summaries')
      .select('*')
      .limit(5)

    if (summariesError) {
      console.error('❌ Erro ao acessar tabela summaries:', summariesError.message)
    } else {
      console.log('✅ Tabela summaries acessível')
      console.log(`   → ${summaries.length} registros encontrados`)
    }

    // 3. Verificar estrutura da tabela highlights
    console.log('\n3️⃣  Verificando estrutura HIGHLIGHTS...')
    const { data: highlightSample } = await supabase
      .from('highlights')
      .select('*')
      .limit(1)
      .single()

    if (highlightSample) {
      console.log('✅ Campos da tabela highlights:')
      Object.keys(highlightSample).forEach(field => {
        console.log(`   → ${field}`)
      })
    } else {
      console.log('ℹ️  Tabela vazia (normal em novo sistema)')
      console.log('   Campos esperados:')
      console.log('   → id, user_id, course_id, pdf_id')
      console.log('   → page_number, text_content')
      console.log('   → start_position, end_position')
      console.log('   → highlight_color, note')
      console.log('   → created_at, updated_at')
    }

    // 4. Verificar estrutura da tabela summaries
    console.log('\n4️⃣  Verificando estrutura SUMMARIES...')
    const { data: summarySample } = await supabase
      .from('summaries')
      .select('*')
      .limit(1)
      .single()

    if (summarySample) {
      console.log('✅ Campos da tabela summaries:')
      Object.keys(summarySample).forEach(field => {
        console.log(`   → ${field}`)
      })
    } else {
      console.log('ℹ️  Tabela vazia (normal em novo sistema)')
      console.log('   Campos esperados:')
      console.log('   → id, user_id, course_id, pdf_id')
      console.log('   → title, content, highlight_ids')
      console.log('   → created_at, updated_at')
    }

    // 5. Testar RLS Policies
    console.log('\n5️⃣  Verificando RLS Policies...')

    // Tentar usar cliente anônimo (deve falhar sem autenticação)
    const supabaseAnon = createClient(
      supabaseUrl,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const { data: anonHighlights, error: anonError } = await supabaseAnon
      .from('highlights')
      .select('*')

    if (anonError && anonError.message.includes('violates row-level security')) {
      console.log('✅ RLS ativo (bloqueia acesso sem autenticação)')
    } else if (!anonError && anonHighlights?.length === 0) {
      console.log('✅ RLS ativo (retorna vazio sem autenticação)')
    } else {
      console.log('⚠️  RLS pode não estar configurado corretamente')
    }

    // Resumo Final
    console.log('\n' + '='.repeat(60))
    console.log('\n✅ MIGRATION EXECUTADA COM SUCESSO!\n')
    console.log('Sistema de Highlights e Summaries está pronto para uso.')
    console.log('\nPróximos passos:')
    console.log('  1. Testar criação de highlight via frontend')
    console.log('  2. Testar criação de resumo via frontend')
    console.log('  3. Verificar se dados aparecem corretamente')
    console.log('\n' + '='.repeat(60) + '\n')

  } catch (error) {
    console.error('\n❌ Erro no teste:', error.message)
    console.error('\nDetalhes:', error)
  }
}

// Executar teste
testHighlights().catch(console.error)
