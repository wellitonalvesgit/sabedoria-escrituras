# Correção de Problemas de Autenticação

## Problema Identificado
O sistema não está funcionando corretamente devido à falta da chave `SUPABASE_SERVICE_ROLE_KEY` válida no arquivo `.env`. 

No console, aparece a mensagem: "Service Role Key: Missing", o que confirma que o sistema não consegue acessar essa chave.

## Solução

### 1. Obter a Service Role Key do Supabase

1. Acesse o [Dashboard do Supabase](https://app.supabase.io)
2. Selecione seu projeto
3. Vá para "Settings" (Configurações) > "API"
4. Na seção "Project API keys", copie o valor de "service_role key" (é a chave secreta que começa com "ey...")

### 2. Atualizar o arquivo .env

Abra o arquivo `.env` na raiz do projeto e substitua a linha:

```
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui
```

pela linha com a chave real que você copiou:

```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Reiniciar o servidor

Após atualizar o arquivo `.env`, reinicie o servidor:

```bash
npm run dev
```

### 4. Limpar dados do navegador

- Abra as ferramentas de desenvolvedor (F12)
- Vá para a aba "Application" (Aplicativo)
- Na seção "Storage", selecione "Clear site data" (Limpar dados do site)
- Feche e abra o navegador novamente

### 5. Fazer login novamente

Faça login novamente com as credenciais:
- Email: geisonhoehr.ai@gmail.com
- Senha: 123456

## Por que isso resolve o problema?

O middleware e vários componentes do sistema usam a `SUPABASE_SERVICE_ROLE_KEY` para bypassar as políticas RLS e acessar dados diretamente. Sem essa chave configurada corretamente:

1. O middleware não consegue verificar a sessão do usuário
2. As APIs não conseguem verificar o acesso aos cursos
3. O sistema não consegue buscar dados do usuário

Após configurar a chave corretamente, o sistema poderá:
- Autenticar o usuário corretamente
- Verificar o acesso aos cursos
- Exibir o conteúdo liberado
