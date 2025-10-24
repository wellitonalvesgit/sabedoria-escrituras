import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// PUT /api/highlights/[id] - Atualizar marcação
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabaseUrl = 'https://aqvqpkmjdtzeoclndwhj.supabase.co'
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxdnFwa21qZHR6ZW9jbG5kd2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwOTI2ODYsImV4cCI6MjA3NjY2ODY4Nn0.ZStT6hrlRhT3bigKWc3i6An_lL09R_t5gdZ4WIyyYyY'
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    const { id } = await params
    const body = await request.json()
    const { text_content, highlight_color, note } = body
    
    const { data: highlight, error } = await supabase
      .from('highlights')
      .update({
        text_content,
        highlight_color,
        note,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Erro ao atualizar marcação:', error)
      return NextResponse.json({ error: 'Erro ao atualizar marcação' }, { status: 500 })
    }
    
    return NextResponse.json({ highlight })
  } catch (error) {
    console.error('Erro na API de atualização de marcação:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// DELETE /api/highlights/[id] - Deletar marcação
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabaseUrl = 'https://aqvqpkmjdtzeoclndwhj.supabase.co'
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxdnFwa21qZHR6ZW9jbG5kd2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwOTI2ODYsImV4cCI6MjA3NjY2ODY4Nn0.ZStT6hrlRhT3bigKWc3i6An_lL09R_t5gdZ4WIyyYyY'
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    const { id } = await params
    
    const { error } = await supabase
      .from('highlights')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Erro ao deletar marcação:', error)
      return NextResponse.json({ error: 'Erro ao deletar marcação' }, { status: 500 })
    }
    
    return NextResponse.json({ message: 'Marcação deletada com sucesso' })
  } catch (error) {
    console.error('Erro na API de exclusão de marcação:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
