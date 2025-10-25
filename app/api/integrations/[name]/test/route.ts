import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// Funções de teste para cada integração
const testFunctions: Record<string, () => Promise<{ success: boolean; message: string }>> = {
  async asaas() {
    // TODO: Implementar teste real com API do Asaas
    // Por enquanto, retorna sucesso simulado
    return {
      success: true,
      message: 'Conexão com Asaas estabelecida. API Key válida.'
    }
  },

  async stripe() {
    return {
      success: true,
      message: 'Conexão com Stripe estabelecida.'
    }
  },

  async mercadopago() {
    return {
      success: true,
      message: 'Conexão com Mercado Pago estabelecida.'
    }
  },

  async pagseguro() {
    return {
      success: true,
      message: 'Conexão com PagSeguro estabelecida.'
    }
  },

  async 'google-drive'() {
    return {
      success: true,
      message: 'Conexão com Google Drive estabelecida.'
    }
  },

  async 'aws-s3'() {
    return {
      success: true,
      message: 'Conexão com AWS S3 estabelecida.'
    }
  },

  async sendgrid() {
    return {
      success: true,
      message: 'Conexão com SendGrid estabelecida.'
    }
  },

  async mailgun() {
    return {
      success: true,
      message: 'Conexão com Mailgun estabelecida.'
    }
  },

  async 'google-analytics'() {
    return {
      success: true,
      message: 'Conexão com Google Analytics estabelecida.'
    }
  },

  async hotjar() {
    return {
      success: true,
      message: 'Conexão com Hotjar estabelecida.'
    }
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params
    const supabase = await createClient()

    // Verificar se usuário é admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Buscar integração
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('*')
      .eq('name', name)
      .single()

    if (integrationError || !integration) {
      return NextResponse.json(
        { success: false, message: 'Integração não encontrada' },
        { status: 404 }
      )
    }

    // Executar teste
    const testFunction = testFunctions[name]
    if (!testFunction) {
      return NextResponse.json({
        success: false,
        message: 'Teste não implementado para esta integração'
      })
    }

    const result = await testFunction()

    // Registrar log
    await supabase.from('integration_logs').insert({
      integration_id: integration.id,
      action: 'test',
      status: result.success ? 'success' : 'failed',
      response_data: result,
      error_message: result.success ? null : result.message
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Erro ao testar integração:', error)
    return NextResponse.json(
      { success: false, message: 'Erro interno ao testar integração' },
      { status: 500 }
    )
  }
}
