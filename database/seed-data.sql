-- ============================================
-- ARQUIVO SEED PARA POPULAR BANCO DE DADOS
-- Sistema de Gerenciamento de Eventos e Freelancers
-- ============================================
-- IMPORTANTE: Este arquivo deve ser removido em produção
-- Para executar: psql -U seu_usuario -d seu_banco -f database/seed-data.sql
-- ============================================

-- Limpar dados existentes (cuidado em produção!)
TRUNCATE TABLE 
  attendance_records,
  payment_records,
  team_allocations,
  event_interests,
  equipment_allocations,
  events,
  freelancer_profiles,
  users,
  equipments
CASCADE;

-- ============================================
-- USUÁRIOS
-- ============================================

-- Administrador (Senha: admin123)
INSERT INTO users (id, name, email, password_hash, role, is_active) VALUES
('11111111-1111-1111-1111-111111111111', 'Carlos Silva', 'admin@frela.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5w6.q', 'gestor', true);

-- Líder Freelancer (Senha: lider123)
INSERT INTO users (id, name, email, password_hash, role, is_active) VALUES
('22222222-2222-2222-2222-222222222222', 'Maria Santos', 'lider@frela.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5w6.q', 'lider_freelancer', true);

-- Freelancers (Senha: freelancer123)
INSERT INTO users (id, name, email, password_hash, role, is_active) VALUES
('33333333-3333-3333-3333-333333333333', 'João Pedro', 'joao@frela.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5w6.q', 'freelancer', true),
('44444444-4444-4444-4444-444444444444', 'Ana Paula', 'ana@frela.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5w6.q', 'freelancer', true),
('55555555-5555-5555-5555-555555555555', 'Lucas Oliveira', 'lucas@frela.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5w6.q', 'freelancer', true),
('66666666-6666-6666-6666-666666666666', 'Fernanda Costa', 'fernanda@frela.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5w6.q', 'freelancer', true),
('77777777-7777-7777-7777-777777777777', 'Roberto Alves', 'roberto@frela.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5w6.q', 'freelancer', true);

-- ============================================
-- PERFIS DE FREELANCERS
-- ============================================

-- Líder Freelancer
INSERT INTO freelancer_profiles (id, user_id, team_type, phone, city, state, experience_level, audio_visual_roles, bio, daily_rate) VALUES
('22222222-aaaa-aaaa-aaaa-222222222222', '22222222-2222-2222-2222-222222222222', 'equipe_a', '(11) 98765-4321', 'São Paulo', 'SP', 'expert', 
 ARRAY['director', 'producer'], 
 'Líder de equipe com 10 anos de experiência em produção audiovisual. Especializado em coordenação de equipes e gestão de projetos complexos.',
 350.00);

-- Freelancers Equipe A
INSERT INTO freelancer_profiles (id, user_id, team_type, phone, city, state, experience_level, audio_visual_roles, bio, daily_rate) VALUES
('33333333-aaaa-aaaa-aaaa-333333333333', '33333333-3333-3333-3333-333333333333', 'equipe_a', '(11) 99999-1111', 'São Paulo', 'SP', 'avancado', 
 ARRAY['camera', 'editing'], 
 'Cinegrafista profissional com foco em eventos corporativos e produções ao vivo.',
 280.00),
('44444444-aaaa-aaaa-aaaa-444444444444', '44444444-4444-4444-4444-444444444444', 'equipe_a', '(11) 99999-2222', 'São Paulo', 'SP', 'avancado', 
 ARRAY['audio', 'technician'], 
 'Técnica de áudio especializada em captação e mixagem para eventos ao vivo.',
 250.00);

-- Freelancers Equipe B
INSERT INTO freelancer_profiles (id, user_id, team_type, phone, city, state, experience_level, audio_visual_roles, bio, daily_rate) VALUES
('55555555-bbbb-bbbb-bbbb-555555555555', '55555555-5555-5555-5555-555555555555', 'equipe_b', '(11) 99999-3333', 'São Paulo', 'SP', 'intermediario', 
 ARRAY['lighting', 'technician'], 
 'Iluminador com experiência em diversos tipos de eventos e produções.',
 220.00),
('66666666-bbbb-bbbb-bbbb-666666666666', '66666666-6666-6666-6666-666666666666', 'equipe_b', '(11) 99999-4444', 'São Paulo', 'SP', 'intermediario', 
 ARRAY['camera', 'assistant'], 
 'Assistente de câmera em transição para operador principal.',
 200.00);

-- Freelancer Sem Equipe
INSERT INTO freelancer_profiles (id, user_id, team_type, phone, city, state, experience_level, audio_visual_roles, bio, daily_rate) VALUES
('77777777-cccc-cccc-cccc-777777777777', '77777777-7777-7777-7777-777777777777', 'sem_equipe', '(11) 99999-5555', 'São Paulo', 'SP', 'iniciante', 
 ARRAY['assistant', 'streaming'], 
 'Profissional em início de carreira com conhecimentos em streaming e suporte técnico.',
 150.00);

-- ============================================
-- EQUIPAMENTOS
-- ============================================

INSERT INTO equipments (id, name, total_quantity, description, category, hourly_rate, daily_rate, condition, location) VALUES
-- Câmeras
('e1111111-1111-1111-1111-111111111111', 'Sony A7S III', 3, 'Câmera mirrorless full-frame com excelente desempenho em baixa luz', 'Câmeras', 80.00, 500.00, 'excellent', 'Depósito A - Prateleira 1'),
('e2222222-2222-2222-2222-222222222222', 'Canon C300 Mark III', 2, 'Câmera cinema profissional 4K', 'Câmeras', 120.00, 800.00, 'excellent', 'Depósito A - Prateleira 1'),
('e3333333-3333-3333-3333-333333333333', 'Blackmagic Pocket 6K', 4, 'Câmera cinema compacta', 'Câmeras', 60.00, 400.00, 'good', 'Depósito A - Prateleira 2'),

-- Iluminação
('e4444444-4444-4444-4444-444444444444', 'Aputure 300d II', 6, 'LED daylight 300W com controle wireless', 'Iluminação', 30.00, 200.00, 'excellent', 'Depósito B - Setor 1'),
('e5555555-5555-5555-5555-555555555555', 'Godox SL-60W', 10, 'LED compacto 60W', 'Iluminação', 15.00, 100.00, 'good', 'Depósito B - Setor 1'),
('e6666666-6666-6666-6666-666666666666', 'Softbox 90x90cm', 8, 'Modificadores de luz para iluminação suave', 'Iluminação', 5.00, 30.00, 'good', 'Depósito B - Setor 2'),

-- Áudio
('e7777777-7777-7777-7777-777777777777', 'Rode NTG3', 5, 'Microfone shotgun profissional', 'Áudio', 25.00, 150.00, 'excellent', 'Depósito C - Armário 1'),
('e8888888-8888-8888-8888-888888888888', 'Zoom H6', 4, 'Gravador portátil 6 canais', 'Áudio', 20.00, 120.00, 'good', 'Depósito C - Armário 1'),
('e9999999-9999-9999-9999-999999999999', 'Sennheiser EW 112P G4', 6, 'Sistema de microfone sem fio lapela', 'Áudio', 30.00, 180.00, 'excellent', 'Depósito C - Armário 2'),

-- Suportes e Tripés
('ea111111-aaaa-aaaa-aaaa-111111111111', 'Manfrotto 504HD', 5, 'Cabeça fluida para vídeo profissional', 'Suportes', 15.00, 90.00, 'good', 'Depósito D - Rack 1'),
('ea222222-aaaa-aaaa-aaaa-222222222222', 'Tripé Carbono 535', 5, 'Tripé profissional em fibra de carbono', 'Suportes', 20.00, 120.00, 'excellent', 'Depósito D - Rack 1'),
('ea333333-aaaa-aaaa-aaaa-333333333333', 'C-Stand com Braço', 10, 'Suporte C-Stand para iluminação', 'Suportes', 8.00, 50.00, 'good', 'Depósito D - Rack 2'),

-- Monitores
('ea444444-bbbb-bbbb-bbbb-444444444444', 'SmallHD 702 Touch', 3, 'Monitor 7" Full HD touchscreen', 'Monitores', 25.00, 150.00, 'excellent', 'Depósito A - Prateleira 3'),
('ea555555-bbbb-bbbb-bbbb-555555555555', 'Atomos Ninja V', 2, 'Monitor/gravador 5" 4K HDR', 'Monitores', 35.00, 220.00, 'excellent', 'Depósito A - Prateleira 3');

-- ============================================
-- EVENTOS
-- ============================================

-- Evento Futuro - Em Planejamento (permite confirmar interesse)
INSERT INTO events (id, title, description, location, start_date, end_date, status, created_by, event_type, estimated_duration, budget, team_priority, allow_team_b, daily_rate_team_a, daily_rate_team_b, is_multi_day, total_days, working_days, requirements, notes) VALUES
('ev111111-1111-1111-1111-111111111111', 
 'Congresso de Tecnologia 2025', 
 'Cobertura completa do maior evento de tecnologia do ano. Transmissão ao vivo, entrevistas e produção de conteúdo.',
 'Expo Center Norte - São Paulo, SP',
 CURRENT_DATE + INTERVAL '30 days',
 CURRENT_DATE + INTERVAL '32 days',
 'planning',
 '11111111-1111-1111-1111-111111111111',
 'especial',
 24,
 25000.00,
 'equipe_a',
 true,
 300.00,
 250.00,
 true,
 3,
 ARRAY[(CURRENT_DATE + INTERVAL '30 days')::text, (CURRENT_DATE + INTERVAL '31 days')::text, (CURRENT_DATE + INTERVAL '32 days')::text],
 ARRAY['camera', 'audio', 'lighting', 'streaming', 'editing'],
 'Evento de grande porte, necessário equipe experiente. Transmissão simultânea em 3 salas.');

-- Evento Futuro 2 - Em Planejamento
INSERT INTO events (id, title, description, location, start_date, end_date, status, created_by, event_type, estimated_duration, budget, team_priority, allow_team_b, daily_rate_team_a, daily_rate_team_b, is_multi_day, total_days, working_days, requirements, notes) VALUES
('ev222222-2222-2222-2222-222222222222',
 'Lançamento de Produto - Tech Corp',
 'Evento corporativo para lançamento de nova linha de produtos. Cobertura fotográfica e vídeo institucional.',
 'Hotel Renaissance - São Paulo, SP',
 CURRENT_DATE + INTERVAL '15 days',
 CURRENT_DATE + INTERVAL '15 days',
 'planning',
 '11111111-1111-1111-1111-111111111111',
 'normal',
 8,
 8000.00,
 'equipe_a',
 true,
 280.00,
 230.00,
 false,
 1,
 ARRAY[(CURRENT_DATE + INTERVAL '15 days')::text],
 ARRAY['camera', 'lighting', 'audio'],
 'Cliente VIP, máxima qualidade necessária.');

-- Evento Futuro 3 - Confirmado
INSERT INTO events (id, title, description, location, start_date, end_date, status, created_by, event_type, estimated_duration, budget, team_priority, allow_team_b, daily_rate_team_a, daily_rate_team_b, is_multi_day, total_days, working_days, requirements, notes) VALUES
('ev333333-3333-3333-3333-333333333333',
 'Workshop de Fotografia',
 'Workshop educacional sobre técnicas avançadas de fotografia e vídeo. Gravação e streaming.',
 'Estúdio Creative Space - São Paulo, SP',
 CURRENT_DATE + INTERVAL '7 days',
 CURRENT_DATE + INTERVAL '7 days',
 'confirmed',
 '11111111-1111-1111-1111-111111111111',
 'normal',
 6,
 4000.00,
 'equipe_b',
 false,
 250.00,
 200.00,
 false,
 1,
 ARRAY[(CURRENT_DATE + INTERVAL '7 days')::text],
 ARRAY['camera', 'streaming', 'lighting'],
 'Evento educacional, ambiente controlado.');

-- Evento Passado - Concluído
INSERT INTO events (id, title, description, location, start_date, end_date, status, created_by, event_type, estimated_duration, budget, team_priority, allow_team_b, daily_rate_team_a, daily_rate_team_b, is_multi_day, total_days, working_days, requirements, notes) VALUES
('ev444444-4444-4444-4444-444444444444',
 'Festival de Música Indie',
 'Cobertura completa do festival com múltiplos palcos. Gravação multi-câmera e edição posterior.',
 'Parque do Ibirapuera - São Paulo, SP',
 CURRENT_DATE - INTERVAL '10 days',
 CURRENT_DATE - INTERVAL '8 days',
 'completed',
 '11111111-1111-1111-1111-111111111111',
 'especial',
 30,
 35000.00,
 'ambas',
 true,
 320.00,
 270.00,
 true,
 3,
 ARRAY[(CURRENT_DATE - INTERVAL '10 days')::text, (CURRENT_DATE - INTERVAL '9 days')::text, (CURRENT_DATE - INTERVAL '8 days')::text],
 ARRAY['camera', 'audio', 'lighting', 'editing', 'director'],
 'Projeto concluído com sucesso. Cliente satisfeito.');

-- ============================================
-- INTERESSES EM EVENTOS
-- ============================================

-- Interesses no Congresso de Tecnologia
INSERT INTO event_interests (id, event_id, user_id, status) VALUES
('ei111111-1111-1111-1111-111111111111', 'ev111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'interested'),
('ei222222-2222-2222-2222-222222222222', 'ev111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'interested'),
('ei333333-3333-3333-3333-333333333333', 'ev111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'interested'),
('ei444444-4444-4444-4444-444444444444', 'ev111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 'interested');

-- Interesses no Lançamento de Produto
INSERT INTO event_interests (id, event_id, user_id, status) VALUES
('ei555555-5555-5555-5555-555555555555', 'ev222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'interested'),
('ei666666-6666-6666-6666-666666666666', 'ev222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666666', 'interested');

-- ============================================
-- ALOCAÇÕES DE EQUIPE (para evento confirmado)
-- ============================================

-- Alocações para Workshop de Fotografia
INSERT INTO team_allocations (id, event_id, user_id, assigned_role, status, daily_rate, total_days, total_payment, total_hours, assigned_at, confirmation_deadline, cancellation_deadline) VALUES
('ta111111-1111-1111-1111-111111111111', 'ev333333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555555', 'camera', 'confirmed', 220.00, 1, 220.00, 6, CURRENT_TIMESTAMP, CURRENT_DATE + INTERVAL '5 days', CURRENT_DATE + INTERVAL '2 days'),
('ta222222-2222-2222-2222-222222222222', 'ev333333-3333-3333-3333-333333333333', '66666666-6666-6666-6666-666666666666', 'lighting', 'confirmed', 200.00, 1, 200.00, 6, CURRENT_TIMESTAMP, CURRENT_DATE + INTERVAL '5 days', CURRENT_DATE + INTERVAL '2 days');

-- Alocações para Festival de Música (evento concluído)
INSERT INTO team_allocations (id, event_id, user_id, assigned_role, status, daily_rate, total_days, total_payment, total_hours, attended, assigned_at) VALUES
('ta333333-3333-3333-3333-333333333333', 'ev444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'director', 'confirmed', 350.00, 3, 1050.00, 30, true, CURRENT_DATE - INTERVAL '15 days'),
('ta444444-4444-4444-4444-444444444444', 'ev444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'camera', 'confirmed', 280.00, 3, 840.00, 30, true, CURRENT_DATE - INTERVAL '15 days'),
('ta555555-5555-5555-5555-555555555555', 'ev444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'audio', 'confirmed', 250.00, 3, 750.00, 30, true, CURRENT_DATE - INTERVAL '15 days');

-- ============================================
-- REGISTROS DE PRESENÇA (para evento concluído)
-- ============================================

-- Presenças do Festival de Música - Dia 1
INSERT INTO attendance_records (id, team_allocation_id, date, status, daily_payment, payment_confirmed) VALUES
('ar111111-1111-1111-1111-111111111111', 'ta333333-3333-3333-3333-333333333333', CURRENT_DATE - INTERVAL '10 days', 'present', 350.00, true),
('ar222222-2222-2222-2222-222222222222', 'ta444444-4444-4444-4444-444444444444', CURRENT_DATE - INTERVAL '10 days', 'present', 280.00, true),
('ar333333-3333-3333-3333-333333333333', 'ta555555-5555-5555-5555-555555555555', CURRENT_DATE - INTERVAL '10 days', 'present', 250.00, true);

-- Presenças do Festival de Música - Dia 2
INSERT INTO attendance_records (id, team_allocation_id, date, status, daily_payment, payment_confirmed) VALUES
('ar444444-4444-4444-4444-444444444444', 'ta333333-3333-3333-3333-333333333333', CURRENT_DATE - INTERVAL '9 days', 'present', 350.00, true),
('ar555555-5555-5555-5555-555555555555', 'ta444444-4444-4444-4444-444444444444', CURRENT_DATE - INTERVAL '9 days', 'present', 280.00, true),
('ar666666-6666-6666-6666-666666666666', 'ta555555-5555-5555-5555-555555555555', CURRENT_DATE - INTERVAL '9 days', 'present', 250.00, true);

-- Presenças do Festival de Música - Dia 3
INSERT INTO attendance_records (id, team_allocation_id, date, status, daily_payment, payment_confirmed) VALUES
('ar777777-7777-7777-7777-777777777777', 'ta333333-3333-3333-3333-333333333333', CURRENT_DATE - INTERVAL '8 days', 'present', 350.00, true),
('ar888888-8888-8888-8888-888888888888', 'ta444444-4444-4444-4444-444444444444', CURRENT_DATE - INTERVAL '8 days', 'present', 280.00, true),
('ar999999-9999-9999-9999-999999999999', 'ta555555-5555-5555-5555-555555555555', CURRENT_DATE - INTERVAL '8 days', 'present', 250.00, true);

-- ============================================
-- REGISTROS DE PAGAMENTO
-- ============================================

-- Pagamentos do Festival de Música
INSERT INTO payment_records (id, team_allocation_id, amount, payment_date, status, payment_type, confirmed_by, confirmed_at, notes) VALUES
('pr111111-1111-1111-1111-111111111111', 'ta333333-3333-3333-3333-333333333333', 1050.00, CURRENT_DATE - INTERVAL '5 days', 'paid', 'daily', '11111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '5 days', 'Pagamento via PIX'),
('pr222222-2222-2222-2222-222222222222', 'ta444444-4444-4444-4444-444444444444', 840.00, CURRENT_DATE - INTERVAL '5 days', 'paid', 'daily', '11111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '5 days', 'Pagamento via PIX'),
('pr333333-3333-3333-3333-333333333333', 'ta555555-5555-5555-5555-555555555555', 750.00, CURRENT_DATE - INTERVAL '3 days', 'pending', 'daily', NULL, NULL, 'Aguardando dados bancários');

-- ============================================
-- NOTIFICAÇÕES
-- ============================================

INSERT INTO notifications (id, user_id, title, message, type, is_read, related_event_id) VALUES
-- Notificações para o líder freelancer
('n1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Novo Evento Disponível', 'Um novo evento está disponível: Congresso de Tecnologia 2025', 'allocation', false, 'ev111111-1111-1111-1111-111111111111'),
('n2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Pagamento Recebido', 'Seu pagamento de R$ 1.050,00 foi confirmado para o Festival de Música Indie', 'payment', true, 'ev444444-4444-4444-4444-444444444444'),

-- Notificações para freelancers
('n3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'Novo Evento Disponível', 'Um novo evento está disponível: Congresso de Tecnologia 2025', 'allocation', false, 'ev111111-1111-1111-1111-111111111111'),
('n4444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'Pagamento Recebido', 'Seu pagamento de R$ 840,00 foi confirmado', 'payment', true, 'ev444444-4444-4444-4444-444444444444'),
('n5555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', 'Alocação Confirmada', 'Você foi alocado para o Workshop de Fotografia', 'allocation', false, 'ev333333-3333-3333-3333-333333333333');

-- ============================================
-- ALOCAÇÕES DE EQUIPAMENTOS
-- ============================================

-- Equipamentos para Workshop de Fotografia
INSERT INTO equipment_allocations (id, event_id, equipment_id, quantity, start_date, end_date, total_cost, notes) VALUES
('ea111111-1111-1111-1111-111111111111', 'ev333333-3333-3333-3333-333333333333', 'e3333333-3333-3333-3333-333333333333', 2, CURRENT_DATE + INTERVAL '7 days', CURRENT_DATE + INTERVAL '7 days', 800.00, 'Câmeras para gravação do workshop'),
('ea222222-2222-2222-2222-222222222222', 'ev333333-3333-3333-3333-333333333333', 'e4444444-4444-4444-4444-444444444444', 3, CURRENT_DATE + INTERVAL '7 days', CURRENT_DATE + INTERVAL '7 days', 600.00, 'Iluminação principal');

-- ============================================
-- VERIFICAÇÃO DOS DADOS INSERIDOS
-- ============================================

SELECT 'RESUMO DOS DADOS INSERIDOS' as info;

SELECT 'Usuários' as tabela, COUNT(*) as total FROM users
UNION ALL
SELECT 'Perfis de Freelancer', COUNT(*) FROM freelancer_profiles
UNION ALL
SELECT 'Equipamentos', COUNT(*) FROM equipments
UNION ALL
SELECT 'Eventos', COUNT(*) FROM events
UNION ALL
SELECT 'Interesses', COUNT(*) FROM event_interests
UNION ALL
SELECT 'Alocações de Equipe', COUNT(*) FROM team_allocations
UNION ALL
SELECT 'Registros de Presença', COUNT(*) FROM attendance_records
UNION ALL
SELECT 'Registros de Pagamento', COUNT(*) FROM payment_records
UNION ALL
SELECT 'Notificações', COUNT(*) FROM notifications;

-- ============================================
-- CREDENCIAIS DE ACESSO
-- ============================================

SELECT '
============================================
CREDENCIAIS DE ACESSO PARA TESTE
============================================

ADMINISTRADOR:
Email: admin@frela.com
Senha: admin123

LÍDER FREELANCER:
Email: lider@frela.com
Senha: lider123

FREELANCERS:
Email: joao@frela.com / Senha: freelancer123
Email: ana@frela.com / Senha: freelancer123
Email: lucas@frela.com / Senha: freelancer123
Email: fernanda@frela.com / Senha: freelancer123
Email: roberto@frela.com / Senha: freelancer123

============================================
IMPORTANTE: Remover este arquivo em produção!
============================================
' as credenciais;
