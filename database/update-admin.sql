-- Atualizar usuário admin com senha hash correto
-- Senha: admin123

-- Primeiro, vamos limpar o usuário admin existente
DELETE FROM users WHERE email = 'admin@frela.com';

-- Inserir usuário admin com senha hash correto
INSERT INTO users (id, name, email, password_hash, role, is_active, created_at, updated_at) VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'Administrador',
    'admin@frela.com',
    '$2b$12$J5yCGgqW/TMsTKqOJCvhUeuCAaIdh/skbD0bvUIk/L09X.JfzUd8q',
    'gestor',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Verificar se foi inserido
SELECT id, name, email, role, is_active, created_at FROM users WHERE email = 'admin@frela.com';





