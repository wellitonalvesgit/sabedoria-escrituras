import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const config = {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configurada' : '❌ Não configurada',
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Configurada' : '❌ Não configurada',
      supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Configurada' : '❌ Não configurada',
      resendApiKey: process.env.RESEND_API_KEY ? '✅ Configurada' : '❌ Não configurada',
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || '❌ Não configurada',
      nodeEnv: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      message: 'Configurações do servidor',
      config
    })

  } catch (error) {
    console.error('❌ Erro ao verificar configurações:', error)
    return NextResponse.json(
      { error: 'Erro ao verificar configurações' },
      { status: 500 }
    )
  }
}
