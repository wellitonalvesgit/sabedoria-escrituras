# 🤖 Guia de Integração Claude API

Este projeto está configurado para usar a API do Claude (Anthropic).

## 📦 Instalação

O SDK do Claude já foi adicionado ao `package.json`. Para instalar:

```bash
npm install
# ou
pnpm install
```

## 🔑 Configuração

1. **Obtenha uma API Key:**
   - Acesse https://console.anthropic.com/
   - Faça login ou crie uma conta
   - Vá em "API Keys" e crie uma nova chave
   - Copie a chave (começa com `sk-ant-...`)

2. **Adicione ao `.env`:**
   ```env
   ANTHROPIC_API_KEY=sk-ant-sua-chave-aqui
   ```

3. **Reinicie o servidor:**
   ```bash
   npm run dev
   ```

## 🚀 Como Usar

### Método 1: Funções Helper (Recomendado)

```typescript
import { askClaude, generateSummary, askQuestionAboutContext } from '@/lib/claude'

// Fazer uma pergunta simples
const response = await askClaude('Explique o que é React')
console.log(response)

// Gerar resumo de texto
const summary = await generateSummary('Texto muito longo aqui...', 100)
console.log(summary)

// Fazer pergunta sobre um contexto específico
const answer = await askQuestionAboutContext(
  'Qual é o tema principal?',
  'Aqui vai o texto completo...'
)
console.log(answer)
```

### Método 2: API Route

**Verificar configuração:**
```bash
GET /api/claude
```

**Fazer pergunta:**
```bash
POST /api/claude
Content-Type: application/json

{
  "type": "ask",
  "prompt": "Explique o que é Next.js"
}
```

**Gerar resumo:**
```bash
POST /api/claude
Content-Type: application/json

{
  "type": "summary",
  "text": "Texto muito longo aqui...",
  "options": {
    "maxLength": 100
  }
}
```

**Fazer pergunta sobre contexto:**
```bash
POST /api/claude
Content-Type: application/json

{
  "type": "question",
  "question": "Qual é o tema principal?",
  "context": "Texto completo aqui..."
}
```

### Método 3: Cliente Direto (Avançado)

```typescript
import { getClient } from '@/lib/claude'
import Anthropic from '@anthropic-ai/sdk'

const client = getClient()

const response = await client.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 1024,
  messages: [
    {
      role: 'user',
      content: 'Sua pergunta aqui'
    }
  ]
})
```

## 📚 Modelos Disponíveis

- `claude-3-5-sonnet-20241022` - Melhor equilíbrio (padrão)
- `claude-3-5-haiku-20241022` - Mais rápido e econômico
- `claude-3-opus-20240229` - Mais poderoso (mais caro)

## 🎯 Casos de Uso

### 1. Gerar Resumos Automáticos de PDFs
```typescript
import { generateSummary } from '@/lib/claude'

const pdfText = await extractTextFromPDF(pdfFile)
const summary = await generateSummary(pdfText, 200)
```

### 2. Responder Perguntas dos Usuários
```typescript
import { askQuestionAboutContext } from '@/lib/claude'

const answer = await askQuestionAboutContext(
  userQuestion,
  courseContent
)
```

### 3. Análise de Conteúdo
```typescript
import { askClaude } from '@/lib/claude'

const analysis = await askClaude(
  'Analise este texto e identifique os principais pontos: ' + text,
  {
    model: 'claude-3-5-sonnet-20241022',
    maxTokens: 2000
  }
)
```

## ⚙️ Opções Avançadas

```typescript
await askClaude(prompt, {
  model: 'claude-3-5-sonnet-20241022',
  maxTokens: 2048,
  system: 'Você é um assistente especializado em...'
})
```

## 🔍 Verificação

Teste se está configurado corretamente:

```bash
# Via curl
curl http://localhost:3000/api/claude

# Resposta esperada:
# { "configured": true, "message": "Claude API está configurada corretamente" }
```

## 🐛 Troubleshooting

### Erro: "ANTHROPIC_API_KEY não está configurada"
- Verifique se a chave está no arquivo `.env`
- Reinicie o servidor após adicionar a chave
- Certifique-se de que a chave começa com `sk-ant-`

### Erro: "Invalid API Key"
- Verifique se a chave está correta
- Confirme que a chave não expirou
- Certifique-se de copiar a chave completa

### Resposta vazia
- Verifique os logs do servidor
- Confirme que há créditos disponíveis na conta Anthropic
- Tente com um prompt mais simples primeiro

## 📖 Documentação Oficial

- [Anthropic API Docs](https://docs.anthropic.com/)
- [SDK TypeScript](https://github.com/anthropics/anthropic-sdk-typescript)

## 💡 Exemplos de Integração

### Integração com Sistema de Resumos
Você pode atualizar `app/api/summaries/route.ts` para usar Claude:

```typescript
import { generateSummary } from '@/lib/claude'

// Ao criar um resumo, gerar automaticamente com Claude
const autoSummary = await generateSummary(pdfContent)
```

### Integração com Sistema de Perguntas
Crie um endpoint para perguntas sobre o conteúdo:

```typescript
// app/api/ai/ask/route.ts
import { askQuestionAboutContext } from '@/lib/claude'

export async function POST(request: NextRequest) {
  const { question, courseId } = await request.json()
  const courseContent = await getCourseContent(courseId)
  
  const answer = await askQuestionAboutContext(question, courseContent)
  return NextResponse.json({ answer })
}
```

---

**✅ Claude API configurada e pronta para uso!**

