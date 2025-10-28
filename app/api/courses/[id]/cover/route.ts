import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function PUT(request: NextRequest) {
  try {
    const { courseId, coverUrl } = await request.json()

    if (!courseId || !coverUrl) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID do curso e URL da capa são obrigatórios' 
      })
    }

    console.log('🔄 Atualizando capa do curso:', { courseId, coverUrl })

    // Atualizar capa usando service role key (bypassa RLS)
    const { error } = await supabaseAdmin
      .from('courses')
      .update({ cover_url: coverUrl })
      .eq('id', courseId)

    if (error) {
      console.error('❌ Erro ao atualizar capa:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao atualizar capa: ' + error.message 
      })
    }

    console.log('✅ Capa atualizada com sucesso!')
    return NextResponse.json({ 
      success: true, 
      message: 'Capa atualizada com sucesso' 
    })

  } catch (error) {
    console.error('❌ Erro geral:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor: ' + (error as Error).message 
    })
  }
}
