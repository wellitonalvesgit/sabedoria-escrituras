require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkCoursePdfsColumns() {
  console.log('\n🔍 VERIFICANDO ESTRUTURA DA TABELA course_pdfs\n')
  console.log('='  .repeat(60))

  try {
    // Query para verificar as colunas da tabela
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'course_pdfs'
        ORDER BY ordinal_position;
      `
    })

    if (error) {
      console.log('⚠️  RPC não disponível, tentando consulta direta...\n')

      // Tentar buscar um registro para ver as colunas
      const { data: sampleData, error: sampleError } = await supabase
        .from('course_pdfs')
        .select('*')
        .limit(1)
        .single()

      if (sampleError && sampleError.code !== 'PGRST116') {
        console.error('❌ Erro:', sampleError.message)
        return
      }

      console.log('📋 COLUNAS EXISTENTES (baseado em um registro):\n')

      if (sampleData) {
        Object.keys(sampleData).forEach((column, idx) => {
          const value = sampleData[column]
          const type = typeof value
          console.log(`${idx + 1}. ${column}`)
          console.log(`   Tipo: ${type}`)
          console.log(`   Valor: ${value !== null ? String(value).substring(0, 50) : 'NULL'}`)
          console.log()
        })
      }

      // Verificar campos específicos
      console.log('🎯 VERIFICAÇÃO DOS CAMPOS DE MÍDIA:\n')

      const requiredFields = ['cover_url', 'youtube_url', 'audio_url']

      requiredFields.forEach(field => {
        const exists = sampleData && field in sampleData
        console.log(`${exists ? '✅' : '❌'} ${field}: ${exists ? 'EXISTE' : 'NÃO EXISTE'}`)
      })

    } else {
      console.log('📋 COLUNAS DA TABELA course_pdfs:\n')

      data.forEach((col, idx) => {
        console.log(`${idx + 1}. ${col.column_name}`)
        console.log(`   Tipo: ${col.data_type}`)
        console.log(`   Nullable: ${col.is_nullable}`)
        console.log(`   Default: ${col.column_default || 'N/A'}`)
        console.log()
      })

      // Verificar campos específicos
      console.log('🎯 VERIFICAÇÃO DOS CAMPOS DE MÍDIA:\n')

      const requiredFields = ['cover_url', 'youtube_url', 'audio_url']

      requiredFields.forEach(field => {
        const exists = data.some(col => col.column_name === field)
        console.log(`${exists ? '✅' : '❌'} ${field}: ${exists ? 'EXISTE' : 'NÃO EXISTE'}`)
      })
    }

    // Contar registros com cada tipo de mídia
    console.log('\n📊 ESTATÍSTICAS DE MÍDIA:\n')

    const { data: stats, error: statsError } = await supabase
      .from('course_pdfs')
      .select('cover_url, youtube_url, audio_url')

    if (!statsError && stats) {
      const total = stats.length
      const withCover = stats.filter(r => r.cover_url).length
      const withYoutube = stats.filter(r => r.youtube_url).length
      const withAudio = stats.filter(r => r.audio_url).length
      const complete = stats.filter(r => r.cover_url && r.youtube_url && r.audio_url).length

      console.log(`Total de volumes: ${total}`)
      console.log(`Com capa: ${withCover} (${((withCover/total)*100).toFixed(1)}%)`)
      console.log(`Com vídeo: ${withYoutube} (${((withYoutube/total)*100).toFixed(1)}%)`)
      console.log(`Com áudio: ${withAudio} (${((withAudio/total)*100).toFixed(1)}%)`)
      console.log(`Completos (capa+vídeo+áudio): ${complete} (${((complete/total)*100).toFixed(1)}%)`)
    }

  } catch (error) {
    console.error('❌ Erro:', error.message)
  }

  console.log('\n' + '='  .repeat(60))
  console.log('\n✅ Verificação concluída!\n')
}

checkCoursePdfsColumns().catch(console.error)
