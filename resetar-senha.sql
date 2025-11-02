-- Script para resetar a senha do usuário geisonhoehr.ai@gmail.com para '123456'
-- ATENÇÃO: Este script deve ser executado com permissões de administrador

-- Resetar senha para '123456'
-- A senha é armazenada como hash, então usamos a função auth.set_user_password
SELECT auth.set_user_password(
    (SELECT id FROM auth.users WHERE email = 'geisonhoehr.ai@gmail.com'),
    '123456'
);