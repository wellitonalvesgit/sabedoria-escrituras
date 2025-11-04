/**
 * Serviço de integração com Korvex
 * Gateway de pagamento para infoprodutores
 * Documentação: https://app.korvex.com.br/docs
 */

interface KorvexConfig {
  publicKey: string
  secretKey: string
  apiUrl: string
  sandbox: boolean
}

interface KorvexClient {
  name: string
  email: string
  phone: string
  document: string
  address?: {
    country: string
    state: string
    city: string
    neighborhood: string
    zipCode: string
    street: string
    number: string
    complement?: string
  }
}

interface KorvexProduct {
  id: string
  name: string
  quantity: number
  price: number
}

interface KorvexPaymentRequest {
  identifier: string // Identificador único da transação (criado pela aplicação)
  amount: number // Valor total da transação
  shippingFee?: number
  extraFee?: number
  discount?: number
  client: KorvexClient
  products?: KorvexProduct[]
  splits?: Array<{
    producerId: string
    amount: number
  }>
  dueDate?: string // YYYY-MM-DD
  metadata?: Record<string, any> | string
  callbackUrl?: string
}

interface KorvexCardPaymentRequest extends KorvexPaymentRequest {
  clientIp: string // IPv4 do cliente
  card: {
    number: string
    owner: string
    expiresAt: string // YYYY-MM
    cvv: string
  }
  installments?: number
}

export class KorvexService {
  private config: KorvexConfig

  constructor(config?: Partial<KorvexConfig>) {
    this.config = {
      publicKey: config?.publicKey || process.env.KORVEX_PUBLIC_KEY || '',
      secretKey: config?.secretKey || process.env.KORVEX_PRIVATE_KEY || '',
      apiUrl: config?.apiUrl || process.env.KORVEX_API_URL || 'https://app.korvex.com.br/api/v1',
      sandbox: config?.sandbox ?? (process.env.KORVEX_SANDBOX === 'true')
    }

    if (!this.config.publicKey || !this.config.secretKey) {
      console.warn('⚠️ KORVEX_PUBLIC_KEY ou KORVEX_PRIVATE_KEY não configuradas')
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.apiUrl}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-public-key': this.config.publicKey,
        'x-secret-key': this.config.secretKey,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(
        error.message ||
        error.errorDescription ||
        `Korvex API Error: ${response.status} ${response.statusText}`
      )
    }

    return response.json()
  }

  /**
   * Receber pagamento via PIX
   */
  async receivePix(data: KorvexPaymentRequest) {
    try {
      return await this.request<any>('/gateway/pix/receive', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    } catch (error) {
      console.error('Erro ao criar pagamento PIX:', error)
      throw error
    }
  }

  /**
   * Receber pagamento via Cartão de Crédito
   */
  async receiveCard(data: KorvexCardPaymentRequest) {
    try {
      return await this.request<any>('/gateway/card/receive', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    } catch (error) {
      console.error('Erro ao criar pagamento Cartão:', error)
      throw error
    }
  }

  /**
   * Receber pagamento via Boleto
   */
  async receiveBoleto(data: KorvexPaymentRequest) {
    try {
      return await this.request<any>('/gateway/boleto/receive', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    } catch (error) {
      console.error('Erro ao criar pagamento Boleto:', error)
      throw error
    }
  }

  /**
   * Buscar transação por ID
   */
  async getTransaction(transactionId: string, clientIdentifier?: string) {
    try {
      const params = new URLSearchParams({ id: transactionId })
      if (clientIdentifier) {
        params.append('clientIdentifier', clientIdentifier)
      }
      
      return await this.request<any>(`/gateway/transactions?${params.toString()}`)
    } catch (error) {
      console.error('Erro ao buscar transação:', error)
      throw error
    }
  }

  /**
   * Buscar assinaturas
   */
  async getSubscriptions(filters: {
    transactionId?: string
    subscriptionId?: string
    orderId?: string
    clientIdentifier?: string
    clientEmail?: string
  } = {}) {
    try {
      const params = new URLSearchParams()
      if (filters.transactionId) params.append('transactionId', filters.transactionId)
      if (filters.subscriptionId) params.append('subscriptionId', filters.subscriptionId)
      if (filters.orderId) params.append('orderId', filters.orderId)
      if (filters.clientIdentifier) params.append('clientIdentifier', filters.clientIdentifier)
      if (filters.clientEmail) params.append('clientEmail', filters.clientEmail)

      return await this.request<any>(`/gateway/subscriptions?${params.toString()}`)
    } catch (error) {
      console.error('Erro ao buscar assinaturas:', error)
      throw error
    }
  }

  /**
   * Criar pagamento (wrapper que escolhe o método baseado no tipo)
   */
  async createPayment(
    data: KorvexPaymentRequest | KorvexCardPaymentRequest,
    paymentMethod: 'PIX' | 'BOLETO' | 'CREDIT_CARD'
  ) {
    switch (paymentMethod) {
      case 'PIX':
        return await this.receivePix(data)
      case 'BOLETO':
        return await this.receiveBoleto(data)
      case 'CREDIT_CARD':
        if (!('card' in data) || !('clientIp' in data)) {
          throw new Error('Dados do cartão e clientIp são obrigatórios para pagamento com cartão')
        }
        return await this.receiveCard(data as KorvexCardPaymentRequest)
      default:
        throw new Error(`Método de pagamento não suportado: ${paymentMethod}`)
    }
  }

  /**
   * Gerar QR Code PIX (busca da transação)
   */
  async getPixQrCode(transactionId: string, clientIdentifier?: string) {
    try {
      const transaction = await this.getTransaction(transactionId, clientIdentifier)
      return {
        encodedImage: transaction.pixInformation?.base64,
        payload: transaction.pixInformation?.qrCode,
        image: transaction.pixInformation?.image || transaction.pixInformation?.qrCode
      }
    } catch (error) {
      console.error('Erro ao gerar QR Code PIX:', error)
      throw error
    }
  }

  /**
   * Buscar URL do boleto
   */
  async getBoletoUrl(transactionId: string, clientIdentifier?: string) {
    try {
      const transaction = await this.getTransaction(transactionId, clientIdentifier)
      return transaction.boletoInformation?.url || transaction.order?.url
    } catch (error) {
      console.error('Erro ao buscar URL do boleto:', error)
      throw error
    }
  }

  /**
   * Testar conexão com a API
   */
  async testConnection() {
    try {
      // Tentar buscar uma transação inválida para testar autenticação
      // Se autenticação estiver OK, retornará erro 404, se não, retornará 401
      try {
        await this.getTransaction('test-connection')
      } catch (error: any) {
        if (error.message?.includes('401') || error.message?.includes('UNAUTHORIZED')) {
          return {
            success: false,
            message: 'Erro de autenticação - verifique as chaves',
            sandbox: this.config.sandbox
          }
        }
        // Se for 404, significa que autenticação está OK
        return {
          success: true,
          message: 'Conexão com Korvex estabelecida com sucesso',
          sandbox: this.config.sandbox
        }
      }
      return {
        success: true,
        message: 'Conexão com Korvex estabelecida com sucesso',
        sandbox: this.config.sandbox
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        sandbox: this.config.sandbox
      }
    }
  }
}

// Singleton instance
let korvexInstance: KorvexService | null = null

export function getKorvexService(): KorvexService {
  if (!korvexInstance) {
    korvexInstance = new KorvexService()
  }
  return korvexInstance
}
