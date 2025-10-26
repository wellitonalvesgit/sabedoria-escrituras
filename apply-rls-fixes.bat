@echo off
echo ================================
echo APLICANDO CORRECOES DE RLS
echo ================================
echo.

echo Verificando se Supabase CLI esta instalado...
where supabase >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [AVISO] Supabase CLI nao encontrado
    echo.
    echo Por favor, execute manualmente:
    echo 1. Acesse: https://app.supabase.com/project/aqvqpkmjdtzeoclndwhj/sql
    echo 2. Copie o conteudo de: fix-authentication-rls-complete.sql
    echo 3. Cole e execute no SQL Editor
    echo.
    pause
    exit /b 1
)

echo.
echo Executando script SQL...
supabase db execute --file fix-authentication-rls-complete.sql --project-ref aqvqpkmjdtzeoclndwhj

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ================================
    echo SUCESSO!
    echo ================================
    echo.
    echo Proximos passos:
    echo 1. Reinicie o servidor: npm run dev
    echo 2. Teste o login com: geisonhoehr.ai@gmail.com
    echo 3. Acesse: /dashboard, /profile, /settings
    echo.
) else (
    echo.
    echo ================================
    echo ERRO AO EXECUTAR
    echo ================================
    echo.
    echo Execute manualmente no Supabase Dashboard
    echo.
)

pause
