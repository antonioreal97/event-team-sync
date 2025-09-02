-- Script para inserir dados de teste para o sistema FRELA
-- Este script cria eventos e alocações de equipe para testar a funcionalidade

-- Inserir usuário freelancer de teste
INSERT INTO users (id, name, email, password_hash, role, is_active, created_at, updated_at) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440001', 
    'João Silva', 
    'joao.silva@teste.com', 
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5w6.q', 
    'freelancer', 
    true, 
    CURRENT_TIMESTAMP, 
    CURRENT_TIMESTAMP
);

-- Inserir perfil do freelancer
INSERT INTO freelancer_profiles (id, user_id, team_type, phone, city, state, experience_level, audio_visual_roles) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440001',
    'equipe_a',
    '(11) 99999-9999',
    'São Paulo',
    'SP',
    'intermediario',
    ARRAY['cameraman', 'iluminador']
);

-- Inserir eventos de teste
INSERT INTO events (id, title, description, location, start_date, end_date, status, created_by, event_type, estimated_duration, budget, team_priority, allow_team_b, daily_rate_team_a, daily_rate_team_b, is_multi_day, total_days) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440003',
    'Evento de Teste 1',
    'Descrição do primeiro evento de teste para verificar a funcionalidade',
    'Estúdio Principal - São Paulo',
    CURRENT_DATE + INTERVAL '7 days',
    CURRENT_DATE + INTERVAL '7 days',
    'confirmed',
    '550e8400-e29b-41d4-a716-446655440000',
    'normal',
    8,
    5000.00,
    'equipe_a',
    true,
    200.00,
    180.00,
    false,
    1
),
(
    '550e8400-e29b-41d4-a716-446655440004',
    'Evento de Teste 2',
    'Descrição do segundo evento de teste para verificar a funcionalidade',
    'Auditório Municipal - Rio de Janeiro',
    CURRENT_DATE + INTERVAL '14 days',
    CURRENT_DATE + INTERVAL '16 days',
    'planning',
    '550e8400-e29b-41d4-a716-446655440000',
    'especial',
    24,
    15000.00,
    'equipe_b',
    true,
    250.00,
    220.00,
    true,
    3
),
(
    '550e8400-e29b-41d4-a716-446655440005',
    'Evento de Teste 3',
    'Descrição do terceiro evento de teste para verificar a funcionalidade',
    'Centro de Eventos - Belo Horizonte',
    CURRENT_DATE + INTERVAL '30 days',
    CURRENT_DATE + INTERVAL '30 days',
    'planning',
    '550e8400-e29b-41d4-a716-446655440000',
    'normal',
    6,
    3000.00,
    'equipe_a',
    false,
    180.00,
    160.00,
    false,
    1
);

-- Inserir alocações de equipe para o freelancer de teste
INSERT INTO team_allocations (id, event_id, user_id, assigned_role, status, daily_rate, total_days, total_payment, total_hours) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440006',
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440001',
    'Cameraman',
    'confirmed',
    200.00,
    1,
    200.00,
    8
),
(
    '550e8400-e29b-41d4-a716-446655440007',
    '550e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440001',
    'Iluminador',
    'pending',
    250.00,
    3,
    750.00,
    24
);

-- Verificar os dados inseridos
SELECT 'Usuários' as tabela, COUNT(*) as total FROM users
UNION ALL
SELECT 'Perfis de Freelancer', COUNT(*) FROM freelancer_profiles
UNION ALL
SELECT 'Eventos', COUNT(*) FROM events
UNION ALL
SELECT 'Alocações de Equipe', COUNT(*) FROM team_allocations;

-- Verificar eventos disponíveis para o freelancer
SELECT 
    e.title,
    e.status,
    e.start_date,
    ta.assigned_role,
    ta.status as allocation_status
FROM events e
INNER JOIN team_allocations ta ON e.id = ta.event_id
WHERE ta.user_id = '550e8400-e29b-41d4-a716-446655440001';
