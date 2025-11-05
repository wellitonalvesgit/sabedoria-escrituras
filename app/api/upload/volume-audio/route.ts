import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData()
    const file: File | null = data.get('file') as unknown as File
    const volumeId: string = data.get('volumeId') as string
    const courseId: string = data.get('courseId') as string

    if (!file) {
      return NextResponse.json({ success: false, error: 'Nenhum arquivo enviado' })
    }

    if (!volumeId || !courseId) {
      return NextResponse.json({ success: false, error: 'ID do volume e curso são obrigatórios' })
    }

    // Validar se é um arquivo de áudio
    const validAudioTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg']
    if (!validAudioTypes.includes(file.type)) {
      return NextResponse.json({
        success: false,
        error: 'Arquivo deve ser um áudio MP3, WAV ou OGG'
      })
    }

    // Validar tamanho máximo (50MB)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return NextResponse.json({
        success: false,
        error: 'Arquivo muito grande. Máximo 50MB'
      })
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const fileName = `volume_${volumeId}_${timestamp}.${fileExtension}`
    const filePath = `volume-audios/${fileName}`

    // Converter arquivo para buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload para Supabase Storage
    // Tentar primeiro o bucket 'course-audios', se não existir, usar 'course-files'
    let bucketName = 'course-audios'
    let { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false
      })

    // Se o bucket não existir, tentar 'course-files'
    if (uploadError && (uploadError.message?.includes('not found') || uploadError.message?.includes('Bucket'))) {
      console.log('⚠️ Bucket course-audios não encontrado, tentando course-files...')
      bucketName = 'course-files'
      const retry = await supabaseAdmin.storage
        .from(bucketName)
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: false
        })
      uploadData = retry.data
      uploadError = retry.error
    }

    if (uploadError) {
      console.error('❌ Erro no upload para Supabase:', uploadError)
      return NextResponse.json({
        success: false,
        error: 'Erro ao fazer upload do arquivo: ' + uploadError.message
      })
    }

    console.log('✅ Upload realizado com sucesso no bucket:', bucketName, 'Caminho:', filePath)

    // Obter URL pública do arquivo
    // IMPORTANTE: Se o bucket não for público, getPublicUrl ainda gera a URL,
    // mas o acesso pode requerer autenticação. Para buckets públicos, funciona normalmente.
    const { data: urlData } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(filePath)
    
    console.log('📎 URL pública gerada:', urlData.publicUrl)
    
    // Verificar se a URL foi gerada corretamente
    if (!urlData?.publicUrl) {
      console.error('❌ Erro: URL pública não foi gerada')
      return NextResponse.json({
        success: false,
        error: 'Erro ao gerar URL pública do arquivo'
      })
    }

    // Atualizar o volume com o novo áudio
    const { error: updateError } = await supabaseAdmin
      .from('course_pdfs')
      .update({ audio_url: urlData.publicUrl })
      .eq('id', volumeId)
      .eq('course_id', courseId)

    if (updateError) {
      console.error('Erro ao atualizar áudio do volume:', updateError)
      return NextResponse.json({
        success: false,
        error: 'Erro ao salvar áudio no banco de dados'
      })
    }

    return NextResponse.json({
      success: true,
      fileUrl: urlData.publicUrl,
      fileName: fileName,
      filePath: filePath,
      fileSize: file.size,
      fileType: file.type,
      volumeId: volumeId
    })

  } catch (error) {
    console.error('Erro no upload do áudio do volume:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
}
