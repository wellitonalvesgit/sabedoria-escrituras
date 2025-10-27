import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('=== TESTE DE CONEXÃO SUPABASE ===')
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('Supabase Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Present' : 'Missing')
    console.log('Service Role Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Present' : 'Missing')
    
    // Teste 1: Cliente público
    console.log('Testando cliente público...')
    const { data: publicTest, error: publicError } = await supabase
      .from('courses')
      .select('count')
      .limit(1)
    
    console.log('Cliente público resultado:', { data: publicTest, error: publicError })
    
    // Teste 2: Cliente admin (se disponível)
    let adminTest = null
    let adminError = null
    
    if (supabaseAdmin) {
      console.log('Testando cliente admin...')
      const result = await supabaseAdmin
        .from('courses')
        .select('count')
        .limit(1)
      
      adminTest = result.data
      adminError = result.error
      console.log('Cliente admin resultado:', { data: adminTest, error: adminError })
    } else {
      console.log('Cliente admin não disponível')
    }
    
    return NextResponse.json({
      success: true,
      tests: {
        public: {
          data: publicTest,
          error: publicError?.message || null,
          success: !publicError
        },
        admin: {
          data: adminTest,
          error: adminError?.message || null,
          success: !adminError,
          available: !!supabaseAdmin
        }
      },
      environment: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      }
    })
    
  } catch (error) {
    console.error('Erro no teste de conexão:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : null
    }, { status: 500 })
  }
}
