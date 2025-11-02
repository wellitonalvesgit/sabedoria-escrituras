import Anthropic from '@anthropic-ai/sdk'

/**
 * Cliente Claude API
 * 
 * Para usar, você precisa adicionar a chave da API no arquivo .env:
 * ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 * 
 * Obtenha sua chave em: https://console.anthropic.com/
 */

let anthropicClient: Anthropic | null = null

function getClaudeClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    
    if (!apiKey) {
      throw new Error(
        'ANTHROPIC_API_KEY não está configurada. ' +
        'Adicione ANTHROPIC_API_KEY no arquivo .env'
      )
    }
    
    anthropicClient = new Anthropic({
      apiKey: apiKey,
    })
  }
  
  return anthropicClient
}

/**
 * Envia uma mensagem para o Claude e retorna a resposta
 * 
 * @param prompt - O texto da pergunta/comando para o Claude
 * @param model - Modelo a ser usado (padrão: 'claude-3-5-sonnet-20241022')
 * @param maxTokens - Número máximo de tokens na resposta (padrão: 1024)
 * @returns A resposta do Claude
 */
export async function askClaude(
  prompt: string,
  options?: {
    model?: 'claude-3-5-sonnet-20241022' | 'claude-3-opus-20240229' | 'claude-3-5-haiku-20241022'
    maxTokens?: number
    system?: string
  }
): Promise<string> {
  try {
    const client = getClaudeClient()
    
    const response = await client.messages.create({
      model: options?.model || 'claude-3-5-sonnet-20241022',
      max_tokens: options?.maxTokens || 1024,
      system: options?.system,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })
    
    // Extrai o texto da resposta
    const textContent = response.content.find(
      (item): item is { type: 'text'; text: string } => item.type === 'text'
    )
    
    if (!textContent) {
      throw new Error('Resposta vazia do Claude')
    }
    
    return textContent.text
  } catch (error) {
    console.error('Erro ao chamar Claude API:', error)
    throw error
  }
}

/**
 * Gera um resumo de texto usando Claude
 */
export async function generateSummary(text: string, maxLength?: number): Promise<string> {
  const prompt = maxLength
    ? `Resuma o seguinte texto em no máximo ${maxLength} palavras:\n\n${text}`
    : `Faça um resumo conciso do seguinte texto:\n\n${text}`
  
  return await askClaude(prompt, {
    model: 'claude-3-5-haiku-20241022', // Modelo mais rápido e econômico para resumos
    maxTokens: 500,
  })
}

/**
 * Responde perguntas sobre um contexto específico
 */
export async function askQuestionAboutContext(
  question: string,
  context: string
): Promise<string> {
  const prompt = `Com base no seguinte contexto, responda a pergunta.\n\nContexto:\n${context}\n\nPergunta: ${question}`
  
  return await askClaude(prompt, {
    maxTokens: 512,
  })
}

/**
 * Exporta o cliente direto (para casos avançados)
 */
export function getClient(): Anthropic {
  return getClaudeClient()
}

