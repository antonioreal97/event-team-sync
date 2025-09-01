-- Script para inserir usuário admin com senha hash correta
-- Senha: admin123

-- Primeiro, vamos limpar o usuário admin existente (se houver)
DELETE FROM users WHERE email = 'admin@frela.com';

-- Inserir usuário admin com senha hash correta
-- A senha 'admin123' foi hasheada com bcrypt (12 rounds)
INSERT INTO users (id, name, email, password_hash, role, is_active, created_at, updated_at) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440000', 
    'Administrador', 
    'admin@frela.com', 
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5w6.q', 
    'gestor', 
    true, 
    CURRENT_TIMESTAMP, 
    CURRENT_TIMESTAMP
);

-- Verificar se foi inserido
SELECT id, name, email, role, is_active, created_at FROM users WHERE email = 'admin@frela.com';





