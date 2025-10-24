import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// GET /api/summaries - Listar resumos do usuário
export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = 'https://aqvqpkmjdtzeoclndwhj.supabase.co'
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxdnFwa21qZHR6ZW9jbG5kd2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwOTI2ODYsImV4cCI6MjA3NjY2ODY4Nn0.ZStT6hrlRhT3bigKWc3i6An_lL09R_t5gdZ4WIyyYyY'
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('course_id')
    const pdfId = searchParams.get('pdf_id')
    
    let query = supabase
      .from('summaries')
      .select(`
        *,
        courses (
          id,
          title,
          slug
        ),
        course_pdfs (
          id,
          title,
          volume
        )
      `)
      .order('created_at', { ascending: false })
    
    if (courseId) {
      query = query.eq('course_id', courseId)
    }
    
    if (pdfId) {
      query = query.eq('pdf_id', pdfId)
    }
    
    const { data: summaries, error } = await query
    
    if (error) {
      console.error('Erro ao buscar resumos:', error)
      return NextResponse.json({ error: 'Erro ao buscar resumos' }, { status: 500 })
    }
    
    return NextResponse.json({ summaries })
  } catch (error) {
    console.error('Erro na API de resumos:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// POST /api/summaries - Criar novo resumo
export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = 'https://aqvqpkmjdtzeoclndwhj.supabase.co'
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxdnFwa21qZHR6ZW9jbG5kd2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwOTI2ODYsImV4cCI6MjA3NjY2ODY4Nn0.ZStT6hrlRhT3bigKWc3i6An_lL09R_t5gdZ4WIyyYyY'
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    const body = await request.json()
    const { 
      course_id, 
      pdf_id, 
      title, 
      content, 
      highlight_ids = [] 
    } = body
    
    const { data: summary, error } = await supabase
      .from('summaries')
      .insert({
        course_id,
        pdf_id,
        title,
        content,
        highlight_ids
      })
      .select(`
        *,
        courses (
          id,
          title,
          slug
        ),
        course_pdfs (
          id,
          title,
          volume
        )
      `)
      .single()
    
    if (error) {
      console.error('Erro ao criar resumo:', error)
      return NextResponse.json({ error: 'Erro ao criar resumo' }, { status: 500 })
    }
    
    return NextResponse.json({ summary }, { status: 201 })
  } catch (error) {
    console.error('Erro na API de criação de resumo:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
