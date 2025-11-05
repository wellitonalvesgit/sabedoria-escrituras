import { NextRequest, NextResponse } from 'next/server'

// Importar a função de invalidação do cache
let plansCache: { data: any[], timestamp: number } | null = null

export async function POST(request: NextRequest) {
  try {
    // Limpar cache de planos
    plansCache = null

    return NextResponse.json({
      success: true,
      message: 'Cache de planos limpo com sucesso'
    })
  } catch (error) {
    console.error('Erro ao limpar cache:', error)
    return NextResponse.json(
      { error: 'Erro ao limpar cache' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Use POST para limpar o cache de planos'
  })
}
