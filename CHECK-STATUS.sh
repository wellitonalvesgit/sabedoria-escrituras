#!/bin/bash

echo "================================"
echo "🔍 VERIFICAÇÃO DE STATUS"
echo "================================"
echo ""

echo "📁 Arquivos de Correção:"
echo "---"
if [ -f "fix-authentication-rls-complete.sql" ]; then
    echo "✅ fix-authentication-rls-complete.sql"
else
    echo "❌ fix-authentication-rls-complete.sql NÃO ENCONTRADO"
fi

if [ -f "LEIA-ME-PRIMEIRO.md" ]; then
    echo "✅ LEIA-ME-PRIMEIRO.md"
else
    echo "❌ LEIA-ME-PRIMEIRO.md NÃO ENCONTRADO"
fi

if [ -f "GUIA-CORRECAO-AUTENTICACAO.md" ]; then
    echo "✅ GUIA-CORRECAO-AUTENTICACAO.md"
else
    echo "❌ GUIA-CORRECAO-AUTENTICACAO.md NÃO ENCONTRADO"
fi

if [ -f "RESUMO-CORRECOES.md" ]; then
    echo "✅ RESUMO-CORRECOES.md"
else
    echo "❌ RESUMO-CORRECOES.md NÃO ENCONTRADO"
fi

echo ""
echo "📝 Arquivos Modificados:"
echo "---"
if [ -f "middleware.ts" ]; then
    echo "✅ middleware.ts"
else
    echo "❌ middleware.ts NÃO ENCONTRADO"
fi

if [ -f "lib/auth.ts" ]; then
    echo "✅ lib/auth.ts"
else
    echo "❌ lib/auth.ts NÃO ENCONTRADO"
fi

if [ -f "lib/session.ts" ]; then
    echo "✅ lib/session.ts"
else
    echo "❌ lib/session.ts NÃO ENCONTRADO"
fi

echo ""
echo "🔑 Variáveis de Ambiente:"
echo "---"
if [ -f ".env.local" ]; then
    if grep -q "SUPABASE_SERVICE_ROLE_KEY" .env.local; then
        echo "✅ SUPABASE_SERVICE_ROLE_KEY presente no .env.local"
    else
        echo "⚠️  SUPABASE_SERVICE_ROLE_KEY NÃO ENCONTRADA no .env.local"
        echo "   → Execute o PASSO 2 do LEIA-ME-PRIMEIRO.md"
    fi
else
    echo "❌ .env.local NÃO ENCONTRADO"
    echo "   → Crie o arquivo .env.local com as variáveis necessárias"
fi

echo ""
echo "================================"
echo "📋 PRÓXIMOS PASSOS:"
echo "================================"
echo ""
echo "1. Execute o script SQL no Supabase"
echo "   → Arquivo: fix-authentication-rls-complete.sql"
echo ""
echo "2. Adicione SUPABASE_SERVICE_ROLE_KEY no .env.local"
echo "   → Veja instruções em: LEIA-ME-PRIMEIRO.md"
echo ""
echo "3. Reinicie o servidor"
echo "   → npm run dev"
echo ""
echo "4. Teste o login"
echo "   → Email: geisonhoehr.ai@gmail.com"
echo "   → Senha: 123456"
echo ""
