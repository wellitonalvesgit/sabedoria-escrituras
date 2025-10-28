import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData()
    const file: File | null = data.get('file') as unknown as File
    const type: string = data.get('type') as string // 'cover' ou 'pdf'
    const courseId: string | null = data.get('courseId') as string | null

    if (!file) {
      return NextResponse.json({ success: false, error: 'Nenhum arquivo enviado' })
    }

    if (!type) {
      return NextResponse.json({ success: false, error: 'Tipo é obrigatório' })
    }

    // Validar tipo de arquivo
    if (type === 'cover') {
      if (!file.type.startsWith('image/')) {
        return NextResponse.json({ success: false, error: 'Arquivo deve ser uma imagem' })
      }
    } else if (type === 'pdf') {
      if (file.type !== 'application/pdf') {
        return NextResponse.json({ success: false, error: 'Arquivo deve ser um PDF' })
      }
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(7)
    const fileExtension = file.name.split('.').pop()
    // Se não tem courseId, usar timestamp + random para nome único
    const fileName = courseId
      ? `${courseId}_${timestamp}.${fileExtension}`
      : `temp_${timestamp}_${randomStr}.${fileExtension}`
    const filePath = `${type === 'cover' ? 'covers' : 'pdfs'}/${fileName}`

    // Converter arquivo para buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload para Supabase Storage
    const bucketName = type === 'cover' ? 'course-covers' : 'course-pdfs'
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Erro no upload para Supabase:', uploadError)
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao fazer upload do arquivo' 
      })
    }

    // Obter URL pública do arquivo
    const { data: urlData } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(filePath)

    return NextResponse.json({ 
      success: true, 
      fileUrl: urlData.publicUrl,
      fileName: fileName,
      filePath: filePath,
      fileSize: file.size,
      fileType: file.type
    })

  } catch (error) {
    console.error('Erro no upload:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    })
  }
}
