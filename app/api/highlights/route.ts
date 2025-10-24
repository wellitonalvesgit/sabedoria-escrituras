import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// GET /api/highlights - Listar marcações do usuário
export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = 'https://aqvqpkmjdtzeoclndwhj.supabase.co'
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxdnFwa21qZHR6ZW9jbG5kd2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwOTI2ODYsImV4cCI6MjA3NjY2ODY4Nn0.ZStT6hrlRhT3bigKWc3i6An_lL09R_t5gdZ4WIyyYyY'
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('course_id')
    const pdfId = searchParams.get('pdf_id')
    
    let query = supabase
      .from('highlights')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (courseId) {
      query = query.eq('course_id', courseId)
    }
    
    if (pdfId) {
      query = query.eq('pdf_id', pdfId)
    }
    
    const { data: highlights, error } = await query
    
    if (error) {
      console.error('Erro ao buscar marcações:', error)
      return NextResponse.json({ error: 'Erro ao buscar marcações' }, { status: 500 })
    }
    
    return NextResponse.json({ highlights })
  } catch (error) {
    console.error('Erro na API de marcações:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// POST /api/highlights - Criar nova marcação
export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = 'https://aqvqpkmjdtzeoclndwhj.supabase.co'
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxdnFwa21qZHR6ZW9jbG5kd2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwOTI2ODYsImV4cCI6MjA3NjY2ODY4Nn0.ZStT6hrlRhT3bigKWc3i6An_lL09R_t5gdZ4WIyyYyY'
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    const body = await request.json()
    const { 
      course_id, 
      pdf_id, 
      page_number, 
      text_content, 
      start_position, 
      end_position, 
      highlight_color = 'yellow', 
      note 
    } = body
    
    const { data: highlight, error } = await supabase
      .from('highlights')
      .insert({
        course_id,
        pdf_id,
        page_number,
        text_content,
        start_position,
        end_position,
        highlight_color,
        note
      })
      .select()
      .single()
    
    if (error) {
      console.error('Erro ao criar marcação:', error)
      return NextResponse.json({ error: 'Erro ao criar marcação' }, { status: 500 })
    }
    
    return NextResponse.json({ highlight }, { status: 201 })
  } catch (error) {
    console.error('Erro na API de criação de marcação:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
