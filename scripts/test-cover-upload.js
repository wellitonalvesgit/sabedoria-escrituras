require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testCoverUpload() {
  console.log('\n🧪 TESTANDO UPLOAD DE CAPA\n')
  console.log('='  .repeat(60))

  // 1. Verificar se bucket existe
  console.log('\n1️⃣ Verificando bucket "course-covers"...')
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

  if (bucketsError) {
    console.log('❌ Erro ao listar buckets:', bucketsError.message)
    return
  }

  const courseCoversBucket = buckets.find(b => b.name === 'course-covers')
  console.log(courseCoversBucket ? '✅ Bucket "course-covers" existe' : '❌ Bucket "course-covers" NÃO existe')

  if (!courseCoversBucket) {
    console.log('\n⚠️  SOLUÇÃO: Criar bucket "course-covers" no Supabase Storage')
    console.log('   1. Acesse o Supabase Dashboard')
    console.log('   2. Vá em Storage')
    console.log('   3. Clique em "New bucket"')
    console.log('   4. Nome: course-covers')
    console.log('   5. Public bucket: true')
    return
  }

  // 2. Testar permissões de escrita
  console.log('\n2️⃣ Testando permissões de escrita no bucket...')
  const testFileName = `test-${Date.now()}.txt`
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('course-covers')
    .upload(`test/${testFileName}`, 'test content', {
      contentType: 'text/plain'
    })

  if (uploadError) {
    console.log('❌ Erro ao fazer upload:', uploadError.message)
    console.log('\n⚠️  SOLUÇÃO: Configurar permissões do bucket')
    console.log('   1. Acesse Storage > course-covers')
    console.log('   2. Policies > New Policy')
    console.log('   3. Nome: Allow public uploads')
    console.log('   4. Target roles: public')
    console.log('   5. Operation: INSERT')
  } else {
    console.log('✅ Upload funcionando! Arquivo:', uploadData.path)

    // Deletar arquivo de teste
    await supabase.storage.from('course-covers').remove([uploadData.path])
    console.log('✅ Arquivo de teste deletado')
  }

  // 3. Testar update na tabela
  console.log('\n3️⃣ Testando update de cover_url na tabela...')

  const { data: volumes, error: volumesError } = await supabase
    .from('course_pdfs')
    .select('id, title, cover_url')
    .limit(1)

  if (volumesError) {
    console.log('❌ Erro ao buscar volume:', volumesError.message)
    return
  }

  if (volumes && volumes.length > 0) {
    const volume = volumes[0]
    console.log(`\nTestando com volume: ${volume.title}`)
    console.log(`Cover atual: ${volume.cover_url || 'NULL'}`)

    const testUrl = 'https://example.com/test-cover.jpg'

    const { data: updateData, error: updateError } = await supabase
      .from('course_pdfs')
      .update({ cover_url: testUrl })
      .eq('id', volume.id)
      .select()

    if (updateError) {
      console.log('❌ Erro ao atualizar cover_url:', updateError.message)
      console.log('\n⚠️  PROBLEMA: RLS pode estar bloqueando')
      console.log('   Execute no SQL Editor:')
      console.log('   ALTER TABLE course_pdfs DISABLE ROW LEVEL SECURITY;')
    } else {
      console.log('✅ Update funcionando!')

      // Reverter para valor original
      await supabase
        .from('course_pdfs')
        .update({ cover_url: volume.cover_url })
        .eq('id', volume.id)

      console.log('✅ Cover_url revertido para valor original')
    }
  }

  console.log('\n' + '='  .repeat(60))
  console.log('\n✅ Teste concluído!\n')
}

testCoverUpload().catch(console.error)
