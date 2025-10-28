import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const pdfId = params.id
    const { coverUrl } = await request.json()

    if (!pdfId || !coverUrl) {
      return NextResponse.json({ success: false, error: 'ID do PDF e URL da capa são obrigatórios' }, { status: 400 })
    }

    console.log(`🔄 Atualizando capa do volume ${pdfId} para: ${coverUrl}`)

    const { error } = await supabaseAdmin
      .from('course_pdfs')
      .update({ cover_url: coverUrl })
      .eq('id', pdfId)

    if (error) {
      console.error('❌ Erro ao atualizar capa do volume no banco de dados:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    console.log(`✅ Capa do volume ${pdfId} atualizada com sucesso no banco de dados.`)
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('❌ Erro interno do servidor ao atualizar capa do volume:', error)
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 })
  }
}
