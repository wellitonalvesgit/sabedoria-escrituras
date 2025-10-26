# 🔍 Debug - Problema de Criação de Usuários em Produção

## 🚨 Problema Identificado

- **Erro:** 500 Internal Server Error na criação de usuários
- **Local:** URL de produção (não localhost)
- **API:** `/api/users/create`

## 🔧 Soluções Implementadas

### 1. ✅ Logs de Debug Adicionados

A API agora inclui logs detalhados para identificar o problema:

```typescript
// Verificação de configurações
console.log('🔧 Configuração Supabase:')
console.log('URL:', supabaseUrl ? '✅ Configurada' : '❌ Não configurada')
console.log('Service Key:', supabaseServiceRoleKey ? '✅ Configurada' : '❌ Não configurada')

// Logs de erro detalhados
console.error('❌ Erro ao criar usuário no Auth:', authError)
console.error('❌ Detalhes do erro:', JSON.stringify(authError, null, 2))
```

### 2. ✅ API de Teste de Configuração

Nova API para verificar configurações em produção:

**URL:** `https://sua-url.com/api/test-config`

**Resposta esperada:**
```json
{
  "success": true,
  "message": "Configurações do servidor",
  "config": {
    "supabaseUrl": "✅ Configurada",
    "supabaseAnonKey": "✅ Configurada", 
    "supabaseServiceKey": "✅ Configurada",
    "resendApiKey": "✅ Configurada",
    "siteUrl": "https://sua-url.com",
    "nodeEnv": "production",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## 🧪 Como Testar e Debugar

### Passo 1: Verificar Configurações
1. Acesse: `https://sua-url.com/api/test-config`
2. Verifique se todas as configurações estão ✅
3. Se alguma estiver ❌, configure as variáveis de ambiente

### Passo 2: Testar Criação de Usuário
1. Acesse: `https://sua-url.com/admin/users`
2. Clique em "Adicionar Usuário"
3. Preencha os dados
4. Clique em "Criar Usuário"
5. Verifique os logs do servidor

### Passo 3: Verificar Logs
Os logs agora mostram:
- ✅ Configurações do Supabase
- ✅ Processo de criação no Auth
- ✅ Processo de criação na tabela users
- ❌ Detalhes completos de erros

## 🔍 Possíveis Causas do Erro 500

### 1. **Variáveis de Ambiente Não Configuradas**
```bash
# Verificar se estão configuradas:
NEXT_PUBLIC_SUPABASE_URL=https://aqvqpkmjdtzeoclndwhj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. **Problemas com Supabase Auth**
- Service Role Key inválida
- Configurações de Auth incorretas
- Limitações de rate limiting

### 3. **Problemas com Tabela Users**
- RLS (Row Level Security) bloqueando inserção
- Estrutura da tabela incorreta
- Permissões insuficientes

### 4. **Problemas de CORS**
- Configurações de CORS incorretas
- Headers de requisição inválidos

## 🛠️ Como Resolver

### Se `supabaseServiceKey` estiver ❌:
1. Acesse o dashboard do Supabase
2. Vá em Settings > API
3. Copie a Service Role Key
4. Configure na Vercel/plataforma de deploy

### Se `supabaseUrl` estiver ❌:
1. Acesse o dashboard do Supabase
2. Vá em Settings > API
3. Copie a Project URL
4. Configure na Vercel/plataforma de deploy

### Se houver erro de RLS:
1. Acesse o dashboard do Supabase
2. Vá em Authentication > Policies
3. Verifique se há políticas que bloqueiam inserção
4. Ajuste as políticas ou use Service Role Key

## 📊 Status Atual

- ✅ **Logs de debug:** Implementados
- ✅ **API de teste:** Criada
- ✅ **Validações:** Adicionadas
- ✅ **Deploy:** Enviado para produção
- 🔄 **Teste:** Aguardando verificação

## 🎯 Próximos Passos

1. **Teste a API de configuração** em produção
2. **Verifique os logs** do servidor
3. **Identifique a causa específica** do erro 500
4. **Configure as variáveis** se necessário
5. **Teste a criação de usuários** novamente

## 📞 Suporte

Se o problema persistir:
1. Acesse `/api/test-config` e compartilhe o resultado
2. Verifique os logs do servidor em produção
3. Confirme se as variáveis de ambiente estão configuradas
4. Teste com um email diferente para descartar duplicatas
