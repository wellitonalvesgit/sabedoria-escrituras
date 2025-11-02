/**
 * Serviço de integração com Asaas
 * Documentação: https://docs.asaas.com
 */

interface AsaasConfig {
  apiKey: string
  apiUrl: string
  sandbox: boolean
}

interface AsaasCustomer {
  name: string
  email: string
  cpfCnpj?: string
  phone?: string
  mobilePhone?: string
  address?: string
  addressNumber?: string
  complement?: string
  province?: string
  postalCode?: string
}

interface AsaasPayment {
  customer: string // ID do cliente
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX'
  value: number
  dueDate: string // YYYY-MM-DD
  description?: string
  externalReference?: string
  installmentCount?: number
  installmentValue?: number
}

interface AsaasSubscription {
  customer: string // ID do cliente
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX'
  cycle: 'MONTHLY' | 'YEARLY'
  value: number
  nextDueDate: string // YYYY-MM-DD
  description?: string
  externalReference?: string
}

export class AsaasService {
  private config: AsaasConfig

  constructor(config?: Partial<AsaasConfig>) {
    this.config = {
      apiKey: config?.apiKey || process.env.ASAAS_API_KEY || '',
      apiUrl: config?.apiUrl || process.env.ASAAS_API_URL || 'https://www.asaas.com/api/v3',
      sandbox: config?.sandbox ?? (process.env.ASAAS_SANDBOX === 'true')
    }

    if (!this.config.apiKey) {
      console.warn('⚠️ ASAAS_API_KEY não configurada')
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
        'access_token': this.config.apiKey,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(
        error.errors?.[0]?.description ||
        error.message ||
        `Asaas API Error: ${response.status}`
      )
    }

    return response.json()
  }

  /**
   * Criar ou atualizar cliente no Asaas
   */
  async createOrUpdateCustomer(data: AsaasCustomer & { externalReference?: string }) {
    try {
      // Verificar se cliente já existe pelo externalReference (user_id)
      if (data.externalReference) {
        const existing = await this.request<any>(
          `/customers?externalReference=${data.externalReference}`
        )

        if (existing.data && existing.data.length > 0) {
          // Atualizar cliente existente
          return await this.request<any>(
            `/customers/${existing.data[0].id}`,
            {
              method: 'POST',
              body: JSON.stringify(data),
            }
          )
        }
      }

      // Criar novo cliente
      return await this.request<any>('/customers', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    } catch (error) {
      console.error('Erro ao criar/atualizar cliente Asaas:', error)
      throw error
    }
  }

  /**
   * Criar cobrança única (pagamento avulso)
   */
  async createPayment(data: AsaasPayment) {
    try {
      return await this.request<any>('/payments', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    } catch (error) {
      console.error('Erro ao criar cobrança Asaas:', error)
      throw error
    }
  }

  /**
   * Criar assinatura recorrente
   */
  async createSubscription(data: AsaasSubscription) {
    try {
      return await this.request<any>('/subscriptions', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    } catch (error) {
      console.error('Erro ao criar assinatura Asaas:', error)
      throw error
    }
  }

  /**
   * Cancelar assinatura
   */
  async cancelSubscription(subscriptionId: string) {
    try {
      return await this.request<any>(`/subscriptions/${subscriptionId}`, {
        method: 'DELETE',
      })
    } catch (error) {
      console.error('Erro ao cancelar assinatura Asaas:', error)
      throw error
    }
  }

  /**
   * Buscar cobrança por ID
   */
  async getPayment(paymentId: string) {
    try {
      return await this.request<any>(`/payments/${paymentId}`)
    } catch (error) {
      console.error('Erro ao buscar cobrança Asaas:', error)
      throw error
    }
  }

  /**
   * Buscar assinatura por ID
   */
  async getSubscription(subscriptionId: string) {
    try {
      return await this.request<any>(`/subscriptions/${subscriptionId}`)
    } catch (error) {
      console.error('Erro ao buscar assinatura Asaas:', error)
      throw error
    }
  }

  /**
   * Gerar QR Code PIX
   */
  async getPixQrCode(paymentId: string) {
    try {
      return await this.request<any>(`/payments/${paymentId}/pixQrCode`)
    } catch (error) {
      console.error('Erro ao gerar QR Code PIX:', error)
      throw error
    }
  }

  /**
   * Buscar URL do boleto
   */
  async getBoletoUrl(paymentId: string) {
    try {
      const payment = await this.getPayment(paymentId)
      return payment.bankSlipUrl || payment.invoiceUrl
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
      await this.request('/customers?limit=1')
      return {
        success: true,
        message: 'Conexão com Asaas estabelecida com sucesso',
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
let asaasInstance: AsaasService | null = null

export function getAsaasService(): AsaasService {
  if (!asaasInstance) {
    asaasInstance = new AsaasService()
  }
  return asaasInstance
}
