# Configuração de URLs no Supabase Dashboard

## 🎯 Problema:
A confirmação de email está redirecionando para `localhost:3000` em vez do domínio de produção.

## 🛠️ Solução:

### 1. Acesse o Dashboard do Supabase
- Vá para: https://supabase.com/dashboard/project/aqvqpkmjdtzeoclndwhj

### 2. Configure Authentication URLs
- No menu lateral, clique em **"Authentication"**
- Clique em **"URL Configuration"** (ou "Settings" > "URL Configuration")

### 3. Configure as URLs:
```
Site URL: https://app.paulocartas.com.br

Redirect URLs (adicione todas estas):
- https://app.paulocartas.com.br/**
- https://app.paulocartas.com.br/auth/callback
- https://app.paulocartas.com.br/login
- https://app.paulocartas.com.br/dashboard
```

### 4. Salve as Configurações
- Clique em **"Save"** ou **"Update"**

## ✅ Resultado Esperado:
Após essa configuração, os links de confirmação de email irão redirecionar para:
`https://app.paulocartas.com.br/#access_token=...`

Em vez de:
`http://localhost:3000/#access_token=...`

## 🧪 Teste:
1. Envie um novo link mágico para `geisonhoehr.ai@gmail.com`
2. Verifique se o link agora aponta para `app.paulocartas.com.br`
3. Teste o login no domínio de produção
