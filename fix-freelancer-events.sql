-- Script para corrigir eventos não aparecerem para freelancers
-- Este script cria alocações de equipe para que freelancers vejam eventos

-- 1. Verificar usuários existentes
SELECT 'Usuários existentes:' as info;
SELECT id, name, email, role FROM users;

-- 2. Verificar eventos existentes
SELECT 'Eventos existentes:' as info;
SELECT id, title, status, created_by FROM events;

-- 3. Verificar alocações existentes
SELECT 'Alocações existentes:' as info;
SELECT * FROM team_allocations;

-- 4. Inserir alocações de equipe para freelancers
-- Primeiro, vamos pegar o ID do primeiro usuário freelancer
DO $$
DECLARE
    freelancer_id UUID;
    event_id UUID;
    admin_id UUID;
BEGIN
    -- Pegar ID do primeiro freelancer
    SELECT id INTO freelancer_id FROM users WHERE role = 'freelancer' LIMIT 1;
    
    -- Pegar ID do primeiro evento
    SELECT id INTO event_id FROM events LIMIT 1;
    
    -- Pegar ID do administrador
    SELECT id INTO admin_id FROM users WHERE role = 'gestor' LIMIT 1;
    
    -- Se não existir evento, criar um
    IF event_id IS NULL THEN
        INSERT INTO events (id, title, description, location, start_date, end_date, status, created_by, event_type, estimated_duration, budget, team_priority, allow_team_b, daily_rate_team_a, daily_rate_team_b, is_multi_day, total_days) VALUES 
        (
            gen_random_uuid(),
            'Evento de Teste para Freelancer',
            'Este é um evento de teste para verificar se freelancers conseguem ver eventos',
            'São Paulo - Estúdio Principal',
            CURRENT_DATE + INTERVAL '7 days',
            CURRENT_DATE + INTERVAL '7 days',
            'confirmed',
            admin_id,
            'normal',
            8,
            5000.00,
            'equipe_a',
            true,
            200.00,
            180.00,
            false,
            1
        );
        
        -- Pegar o ID do evento recém-criado
        SELECT id INTO event_id FROM events WHERE title = 'Evento de Teste para Freelancer';
    END IF;
    
    -- Se não existir freelancer, criar um
    IF freelancer_id IS NULL THEN
        INSERT INTO users (id, name, email, password_hash, role, is_active) VALUES 
        (
            gen_random_uuid(),
            'João Silva',
            'joao.silva@teste.com',
            '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5w6.q',
            'freelancer',
            true
        );
        
        -- Pegar o ID do freelancer recém-criado
        SELECT id INTO freelancer_id FROM users WHERE email = 'joao.silva@teste.com';
    END IF;
    
    -- Criar alocação do freelancer no evento
    IF freelancer_id IS NOT NULL AND event_id IS NOT NULL THEN
        INSERT INTO team_allocations (id, event_id, user_id, assigned_role, status, daily_rate, total_days, total_payment, total_hours) VALUES 
        (
            gen_random_uuid(),
            event_id,
            freelancer_id,
            'Cameraman',
            'confirmed',
            200.00,
            1,
            200.00,
            8
        );
        
        RAISE NOTICE 'Alocação criada: Freelancer % alocado no evento %', freelancer_id, event_id;
    ELSE
        RAISE NOTICE 'Não foi possível criar alocação. Freelancer: %, Evento: %', freelancer_id, event_id;
    END IF;
END $$;

-- 5. Verificar resultado
SELECT 'Alocações após correção:' as info;
SELECT 
    ta.id,
    ta.event_id,
    ta.user_id,
    ta.assigned_role,
    ta.status,
    e.title as event_title,
    u.name as user_name,
    u.role as user_role
FROM team_allocations ta
INNER JOIN events e ON ta.event_id = e.id
INNER JOIN users u ON ta.user_id = u.id;

-- 6. Testar consulta para freelancer
SELECT 'Teste de consulta para freelancer:' as info;
SELECT 
    e.title,
    e.status,
    e.start_date,
    ta.assigned_role,
    ta.status as allocation_status
FROM events e
INNER JOIN team_allocations ta ON e.id = ta.event_id
INNER JOIN users u ON ta.user_id = u.id
WHERE u.role = 'freelancer';
