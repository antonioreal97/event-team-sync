-- Script para limpar o banco de dados e começar com um sistema limpo
-- Este script remove todos os dados de teste e mantém apenas o usuário admin

-- Limpar tabelas de alocação de equipe
DELETE FROM team_allocations;
DELETE FROM team_assignments;

-- Limpar tabelas de alocação de equipamento
DELETE FROM equipment_allocations;

-- Limpar tabelas de presença
DELETE FROM attendance_records;

-- Limpar tabelas de pagamento
DELETE FROM payment_records;

-- Limpar tabelas de notificação
DELETE FROM notifications;

-- Limpar tabelas de convite
DELETE FROM invites;

-- Limpar tabelas de equipamento
DELETE FROM equipment;

-- Limpar tabelas de evento
DELETE FROM events;

-- Limpar tabelas de usuário (exceto admin)
DELETE FROM users WHERE email != 'admin@frela.com';

-- Resetar sequências (se existirem)
-- ALTER SEQUENCE users_id_seq RESTART WITH 2;
-- ALTER SEQUENCE events_id_seq RESTART WITH 1;
-- ALTER SEQUENCE team_allocations_id_seq RESTART WITH 1;
-- ALTER SEQUENCE equipment_id_seq RESTART WITH 1;

-- Verificar o que restou
SELECT 'Usuários restantes:' as info;
SELECT id, name, email, role FROM users;

SELECT 'Total de eventos:' as info, COUNT(*) as count FROM events;
SELECT 'Total de alocações de equipe:' as info, COUNT(*) as count FROM team_allocations;
SELECT 'Total de equipamentos:' as info, COUNT(*) as count FROM equipment;
SELECT 'Total de notificações:' as info, COUNT(*) as count FROM notifications;






