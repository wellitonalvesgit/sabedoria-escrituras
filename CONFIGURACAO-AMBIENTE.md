# Configuração das Variáveis de Ambiente

## Arquivo .env

Adicione estas variáveis ao seu arquivo `.env` na raiz do projeto:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://aqvqpkmjdtzeoclndwhj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxdnFwa21qZHR6ZW9jbG5kd2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwOTI2ODYsImV4cCI6MjA3NjY2ODY4Nn0.ZStT6hrlRhT3bigKWc3i6An_lL09R_t5gdZ4WIyyYyY
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxdnFwa21qZHR6ZW9jbG5kd2hqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTA5MjY4NiwiZXhwIjoyMDc2NjY4Njg2fQ.0sBklMOxA7TsCiCP8_8oxjumxK43jj8PRia1LE_Mybs

# Resend API Configuration
RESEND_API_KEY=re_BfCFPuAB_CKMsfpzJqTSwkWuQ18quM5PY

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Instruções

1. **Copie o conteúdo acima** para seu arquivo `.env`
2. **Salve o arquivo** na raiz do projeto
3. **Reinicie o servidor** com `npm run dev`
4. **Teste as funcionalidades** de login

## Verificação

Para verificar se as configurações estão corretas:

1. **Console do navegador** deve mostrar:
   - ✅ Supabase URL: Configurada
   - ✅ Supabase Anon Key: Configurada
   - ✅ Service Role Key: Configurada

2. **Teste de email** deve funcionar:
   - Cadastro de usuário
   - Link mágico
   - Código de acesso
   - Recuperação de senha

## Problemas Comuns

### **"Service Role Key: Missing"**
- Verifique se `SUPABASE_SERVICE_ROLE_KEY` está no `.env`
- Reinicie o servidor após alterar o `.env`

### **"Erro ao enviar email"**
- Verifique se `RESEND_API_KEY` está correto
- Confirme se a chave do Resend é válida

### **"Código não encontrado"**
- Verifique se o localStorage está habilitado
- Teste em aba normal (não anônima)

---

**✅ Com essas configurações, todas as funcionalidades de login devem funcionar perfeitamente!**
