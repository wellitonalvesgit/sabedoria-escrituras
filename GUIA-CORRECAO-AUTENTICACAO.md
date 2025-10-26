# Guia de Correção do Sistema de Autenticação

## Problemas Identificados

1. **Usuário comum não consegue ver seu próprio perfil**
   - Causa: Políticas RLS (Row Level Security) mal configuradas
   - Sintoma: Erro "Usuário não encontrado" ao acessar /profile ou /settings

2. **Middleware bloqueando acesso**
   - Causa: Middleware usando ANON_KEY e sendo bloqueado pelo RLS
   - Sintoma: Redirecionamento para /login mesmo estando autenticado

3. **Controle de acesso aos cursos**
   - Os usuários devem ver TODOS os cursos no dashboard
   - Mas só podem acessar os cursos liberados para eles

## Correções Implementadas

### 1. Script SQL de Correção RLS

Arquivo: `fix-authentication-rls-complete.sql`

Este script:
- Remove políticas RLS antigas e conflitantes
- Cria novas políticas corretas que permitem:
  - Usuários verem e editarem seu próprio perfil
  - Admins verem e editarem todos os perfis
- Corrige dados do usuário teste (geisonhoehr.ai@gmail.com)

### 2. Correções no Código

#### Middleware (middleware.ts)
- **Mudança**: Agora usa `SUPABASE_SERVICE_ROLE_KEY` em vez de `ANON_KEY`
- **Motivo**: Service Role bypassa RLS, permitindo verificação de usuário
- **Segurança**: Isso é seguro porque o middleware roda no servidor

#### Lib Auth (lib/auth.ts)
- Importa `supabaseAdmin` para usar quando necessário
- Mantém uso do cliente regular para operações normais

#### Lib Session (lib/session.ts)
- Adiciona logs melhores para debug
- Mantém uso do cliente regular (RLS permite ver próprio perfil)

## Como Executar as Correções

### Passo 1: Executar o Script SQL no Supabase

#### Opção A: Via Dashboard do Supabase (Recomendado)

1. Acesse https://app.supabase.com
2. Selecione seu projeto
3. No menu lateral, clique em **SQL Editor**
4. Clique em **New Query**
5. Copie todo o conteúdo do arquivo `fix-authentication-rls-complete.sql`
6. Cole no editor SQL
7. Clique em **Run** (ou pressione Ctrl+Enter)
8. Verifique os logs no console:
   - Deve mostrar "✅ Políticas RLS criadas com sucesso!"
   - Deve mostrar dados do usuário teste

#### Opção B: Via CLI do Supabase

```bash
# Certifique-se de estar autenticado
supabase login

# Execute o script
supabase db push --file fix-authentication-rls-complete.sql
```

#### Opção C: Via psql

```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres" \
  -f fix-authentication-rls-complete.sql
```

### Passo 2: Verificar Variáveis de Ambiente

Certifique-se de que seu arquivo `.env.local` contém:

```env
NEXT_PUBLIC_SUPABASE_URL=https://[seu-projeto].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[sua-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[sua-service-role-key]
```

**IMPORTANTE**: A `SUPABASE_SERVICE_ROLE_KEY` é crítica agora!

Para obter as chaves:
1. Vá para https://app.supabase.com
2. Selecione seu projeto
3. Vá em **Settings** > **API**
4. Copie:
   - **URL**: `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role**: `SUPABASE_SERVICE_ROLE_KEY` (⚠️ **NUNCA** exponha essa chave no client-side!)

### Passo 3: Reiniciar o Servidor de Desenvolvimento

```bash
# Parar o servidor (Ctrl+C)
# Iniciar novamente
npm run dev
```

### Passo 4: Testar o Sistema

#### Teste 1: Login
1. Acesse http://localhost:3000/login
2. Faça login com:
   - Email: `geisonhoehr.ai@gmail.com`
   - Senha: `123456`
3. Deve redirecionar para /dashboard sem erros

#### Teste 2: Acesso ao Perfil
1. Após login, clique no ícone de usuário (User)
2. Ou acesse diretamente: http://localhost:3000/profile
3. Deve mostrar seus dados de perfil
4. Tente editar o nome
5. Deve salvar com sucesso

#### Teste 3: Configurações
1. Acesse http://localhost:3000/settings
2. Deve carregar todos os dados
3. Tente alterar informações pessoais
4. Tente alterar a senha
5. Todas as operações devem funcionar

#### Teste 4: Dashboard e Cursos
1. Acesse http://localhost:3000/dashboard
2. Deve ver TODOS os cursos disponíveis
3. Cursos liberados: aparecem normais
4. Cursos bloqueados: devem ter indicador visual (cadeado ou badge)
5. Ao clicar em curso LIBERADO: deve abrir normalmente
6. Ao clicar em curso BLOQUEADO: deve mostrar mensagem de acesso restrito

## Verificação de RLS

Para verificar se as políticas estão corretas, execute no SQL Editor:

```sql
-- Ver todas as políticas da tabela users
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'users';

-- Verificar se RLS está habilitado
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'users';
```

## Estrutura de Permissões

### Usuário Comum (role = 'student')
- ✅ Ver seu próprio perfil
- ✅ Editar seu próprio perfil
- ✅ Ver todos os cursos no dashboard
- ✅ Acessar cursos liberados
- ❌ Acessar cursos bloqueados
- ❌ Ver perfis de outros usuários
- ❌ Acessar área admin

### Administrador (role = 'admin')
- ✅ Ver todos os perfis
- ✅ Editar todos os perfis
- ✅ Ver todos os cursos
- ✅ Acessar todos os cursos
- ✅ Acessar área admin
- ✅ Gerenciar usuários

## Controle de Acesso aos Cursos

O sistema funciona assim:

1. **Dashboard mostra TODOS os cursos**
   - Cursos liberados: sem restrições visuais
   - Cursos bloqueados: com badge/cadeado "Bloqueado" ou "Premium"

2. **Ao clicar em um curso**:
   - Liberado: abre normalmente
   - Bloqueado: mostra `<PremiumAccessGate>` com mensagem

3. **Verificação de acesso** (em ordem):
   - Admin? → Acesso total
   - Curso está em `blocked_courses`? → Bloqueado
   - Curso está em `allowed_courses`? → Liberado
   - Categoria está em `blocked_categories`? → Bloqueado
   - Categoria está em `allowed_categories`? → Liberado
   - Sem listas específicas? → Liberado (padrão)

## Logs de Debug

O sistema agora tem logs detalhados. Abra o Console do navegador (F12) e procure por:

- 🔐 Login
- 🔒 Sessão
- ✅ Sucesso
- ❌ Erro
- 👤 Usuário
- 📊 Dados
- 🔍 Busca

Exemplo de log saudável:
```
🔄 Inicializando sessão...
✅ Supabase disponível, verificando sessão...
📊 Dados da sessão: { hasSession: true, hasUser: true, ... }
👤 Usuário encontrado na sessão: xxx-xxx-xxx
✅ Sessão válida, buscando dados do usuário...
📊 Dados do usuário na tabela: { hasUserData: true, ... }
✅ Usuário carregado com sucesso: user@example.com
```

## Troubleshooting

### Problema: "Usuário não encontrado"
**Solução**: Execute o script SQL novamente

### Problema: "Redirecionando para login" em loop
**Soluções**:
1. Limpe os cookies do navegador
2. Verifique se `SUPABASE_SERVICE_ROLE_KEY` está no `.env.local`
3. Reinicie o servidor após adicionar a chave

### Problema: "RLS policy violation"
**Soluções**:
1. Execute o script SQL
2. Verifique se as políticas foram criadas:
   ```sql
   SELECT COUNT(*) FROM pg_policies WHERE tablename = 'users';
   ```
3. Deve retornar 4 (select, update, insert, delete para own_or_admin)

### Problema: Não consegue ver cursos
**Soluções**:
1. Verifique os dados do usuário:
   ```sql
   SELECT
     email,
     status,
     role,
     access_expires_at,
     allowed_courses,
     blocked_courses
   FROM users
   WHERE email = 'geisonhoehr.ai@gmail.com';
   ```
2. Status deve ser 'active'
3. access_expires_at deve ser no futuro

## Resumo das Mudanças

### Arquivos Modificados
1. ✅ `middleware.ts` - Usa SERVICE_ROLE_KEY
2. ✅ `lib/auth.ts` - Importa supabaseAdmin
3. ✅ `lib/session.ts` - Melhores logs

### Arquivos Criados
1. ✅ `fix-authentication-rls-complete.sql` - Script de correção
2. ✅ `GUIA-CORRECAO-AUTENTICACAO.md` - Este guia

### Banco de Dados
1. ✅ Novas políticas RLS na tabela `users`
2. ✅ Dados do usuário teste corrigidos

## Próximos Passos

Após executar as correções:

1. ✅ Testar login
2. ✅ Testar acesso ao perfil
3. ✅ Testar edição de perfil
4. ✅ Testar dashboard
5. ✅ Testar acesso aos cursos
6. 🚀 Fazer deploy em produção

## Suporte

Se encontrar problemas:
1. Verifique os logs do console (F12)
2. Verifique os logs do servidor (terminal)
3. Verifique as políticas RLS no Supabase
4. Entre em contato com o desenvolvedor

---

**Data de criação**: 26 de Outubro de 2025
**Versão**: 1.0
