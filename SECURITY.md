# Segurança - Sabedoria das Escrituras

## 🔒 Práticas de Segurança Implementadas

### 1. Autenticação e Autorização
- ✅ Autenticação via Supabase Auth
- ✅ Row Level Security (RLS) habilitado em todas as tabelas
- ✅ Políticas de acesso baseadas em roles (admin, moderator, student)
- ✅ Service Role Key isolado apenas para uso server-side

### 2. Proteção de Dados Sensíveis
- ✅ Variáveis de ambiente para credenciais
- ✅ `.env` excluído do controle de versão
- ✅ `.env.example` fornecido como template
- ✅ Chaves de API nunca expostas no client-side

### 3. Validação de Entrada
- ✅ Validação de tipos com TypeScript
- ✅ Validação de dados em API routes
- ✅ Sanitização de entradas de usuário

### 4. Políticas de Acesso (RLS)

#### Tabela `users`
```sql
-- Usuários podem ver todos os usuários
CREATE POLICY "Users can view all users" ON public.users
    FOR SELECT USING (true);

-- Usuários podem atualizar apenas seu próprio perfil
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid()::text = id::text);
```

#### Tabela `courses`
```sql
-- Qualquer um pode ver cursos publicados
CREATE POLICY "Anyone can view published courses" ON public.courses
    FOR SELECT USING (status = 'published');

-- Apenas admins podem gerenciar cursos
CREATE POLICY "Admins can manage courses" ON public.courses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id::text = auth.uid()::text
            AND role IN ('admin', 'moderator')
        )
    );
```

#### Tabela `user_course_progress`
```sql
-- Usuários veem apenas seu próprio progresso
CREATE POLICY "Users can view own progress" ON public.user_course_progress
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Usuários gerenciam apenas seu próprio progresso
CREATE POLICY "Users can update own progress" ON public.user_course_progress
    FOR ALL USING (auth.uid()::text = user_id::text);
```

## ⚠️ Avisos de Segurança

### NUNCA faça:
1. ❌ Commit de arquivos `.env` com credenciais reais
2. ❌ Uso de Service Role Key no client-side
3. ❌ Desabilitar RLS em produção
4. ❌ Expor dados de usuários sem autenticação
5. ❌ Hard-code de credenciais no código

### SEMPRE faça:
1. ✅ Use variáveis de ambiente para credenciais
2. ✅ Valide entrada de usuários
3. ✅ Use HTTPS em produção
4. ✅ Mantenha dependências atualizadas
5. ✅ Implemente rate limiting em APIs públicas

## 🔐 Configuração Segura

### Passo 1: Configurar Variáveis de Ambiente
```bash
cp .env.example .env
```

Edite `.env` com suas credenciais reais do Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
```

### Passo 2: Executar Migrations no Supabase
1. Acesse o Supabase Dashboard
2. Vá em SQL Editor
3. Execute os arquivos na ordem:
   - `supabase-schema.sql` (criar estrutura)
   - `supabase-migration-access-control.sql` (adicionar campos de controle)

### Passo 3: Configurar Políticas de Acesso
As políticas RLS já estão incluídas no `supabase-schema.sql`.

## 🛡️ Auditoria de Segurança

### Checklist de Deploy
- [ ] `.env` não está no repositório
- [ ] Service Role Key está seguro
- [ ] RLS habilitado em todas as tabelas
- [ ] HTTPS configurado
- [ ] CORS configurado corretamente
- [ ] Rate limiting implementado
- [ ] Logs de auditoria habilitados

## 📞 Reportar Vulnerabilidades

Se você descobrir uma vulnerabilidade de segurança, por favor:
1. **NÃO** abra uma issue pública
2. Envie um email para: [seu-email@exemplo.com]
3. Inclua detalhes técnicos e passos para reproduzir

## 📚 Recursos Adicionais

- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
