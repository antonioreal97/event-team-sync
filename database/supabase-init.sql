-- Inicialização do banco de dados FRELA no Supabase
-- Sistema de gerenciamento de equipes para eventos audiovisuais

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('gestor', 'freelancer')),
    avatar VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de perfis de freelancers
CREATE TABLE IF NOT EXISTS freelancer_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    team_type VARCHAR(20) CHECK (team_type IN ('equipe_a', 'equipe_b', 'sem_equipe')),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(2),
    cpf VARCHAR(14) UNIQUE,
    hourly_rate DECIMAL(10,2),
    daily_rate DECIMAL(10,2),
    experience_level VARCHAR(20) CHECK (experience_level IN ('iniciante', 'intermediario', 'avancado', 'expert')),
    audio_visual_roles TEXT[], -- Array de roles
    bio TEXT,
    portfolio VARCHAR(500),
    linkedin VARCHAR(500),
    instagram VARCHAR(100),
    website VARCHAR(500),
    previous_experience TEXT,
    certifications TEXT[],
    equipment TEXT[],
    languages TEXT[],
    total_events_attended INTEGER DEFAULT 0,
    total_earnings DECIMAL(12,2) DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de eventos
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'planning' CHECK (status IN ('planning', 'confirmed', 'in_progress', 'completed', 'cancelled')),
    created_by UUID REFERENCES users(id),
    event_type VARCHAR(20) DEFAULT 'normal' CHECK (event_type IN ('normal', 'especial')),
    estimated_duration INTEGER, -- em horas
    budget DECIMAL(12,2),
    requirements TEXT[],
    notes TEXT,
    team_priority VARCHAR(20) DEFAULT 'equipe_a' CHECK (team_priority IN ('equipe_a', 'equipe_b')),
    allow_team_b BOOLEAN DEFAULT true,
    daily_rate_team_a DECIMAL(10,2) NOT NULL,
    daily_rate_team_b DECIMAL(10,2) NOT NULL,
    is_multi_day BOOLEAN DEFAULT false,
    total_days INTEGER DEFAULT 1,
    working_days DATE[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de alocações de equipe
CREATE TABLE IF NOT EXISTS team_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    assigned_role VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    daily_rate DECIMAL(10,2) NOT NULL,
    total_days INTEGER NOT NULL,
    total_payment DECIMAL(12,2) NOT NULL,
    total_hours INTEGER,
    attended BOOLEAN DEFAULT false,
    cancellation_deadline TIMESTAMP WITH TIME ZONE,
    confirmation_deadline TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de controle de presença
CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_allocation_id UUID REFERENCES team_allocations(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'present', 'absent', 'late')),
    daily_payment DECIMAL(10,2) NOT NULL,
    payment_confirmed BOOLEAN DEFAULT false,
    confirmed_by UUID REFERENCES users(id),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de equipamentos
CREATE TABLE IF NOT EXISTS equipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    total_quantity INTEGER NOT NULL,
    description TEXT,
    category VARCHAR(100),
    hourly_rate DECIMAL(10,2),
    daily_rate DECIMAL(10,2),
    condition VARCHAR(20) DEFAULT 'good' CHECK (condition IN ('excellent', 'good', 'fair', 'poor')),
    location VARCHAR(255),
    last_maintenance DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de alocações de equipamentos
CREATE TABLE IF NOT EXISTS equipment_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    equipment_id UUID REFERENCES equipments(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    total_cost DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de notificações
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    is_read BOOLEAN DEFAULT false,
    related_event_id UUID REFERENCES events(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITH TIME ZONE
);

-- Tabela de convites para freelancers
CREATE TABLE IF NOT EXISTS freelancer_invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    invited_by UUID REFERENCES users(id),
    team_type VARCHAR(20) CHECK (team_type IN ('equipe_a', 'equipe_b')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
    invite_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de histórico de pagamentos
CREATE TABLE IF NOT EXISTS payment_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_allocation_id UUID REFERENCES team_allocations(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_type VARCHAR(50) DEFAULT 'daily' CHECK (payment_type IN ('daily', 'event_complete', 'bonus', 'adjustment')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'paid', 'cancelled')),
    confirmed_by UUID REFERENCES users(id),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de interesse em eventos (se existir)
CREATE TABLE IF NOT EXISTS event_interests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'interested' CHECK (status IN ('interested', 'confirmed', 'declined')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, user_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_freelancer_profiles_team_type ON freelancer_profiles(team_type);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_team_allocations_event_id ON team_allocations(event_id);
CREATE INDEX IF NOT EXISTS idx_team_allocations_user_id ON team_allocations(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_allocation_id ON attendance_records(team_allocation_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_freelancer_invites_email ON freelancer_invites(email);
CREATE INDEX IF NOT EXISTS idx_freelancer_invites_token ON freelancer_invites(invite_token);
CREATE INDEX IF NOT EXISTS idx_event_interests_event_id ON event_interests(event_id);
CREATE INDEX IF NOT EXISTS idx_event_interests_user_id ON event_interests(user_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger em todas as tabelas com updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_freelancer_profiles_updated_at ON freelancer_profiles;
CREATE TRIGGER update_freelancer_profiles_updated_at BEFORE UPDATE ON freelancer_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_team_allocations_updated_at ON team_allocations;
CREATE TRIGGER update_team_allocations_updated_at BEFORE UPDATE ON team_allocations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_attendance_records_updated_at ON attendance_records;
CREATE TRIGGER update_attendance_records_updated_at BEFORE UPDATE ON attendance_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_equipments_updated_at ON equipments;
CREATE TRIGGER update_equipments_updated_at BEFORE UPDATE ON equipments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_equipment_allocations_updated_at ON equipment_allocations;
CREATE TRIGGER update_equipment_allocations_updated_at BEFORE UPDATE ON equipment_allocations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_records_updated_at ON payment_records;
CREATE TRIGGER update_payment_records_updated_at BEFORE UPDATE ON payment_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_event_interests_updated_at ON event_interests;
CREATE TRIGGER update_event_interests_updated_at BEFORE UPDATE ON event_interests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir usuário gestor padrão (se não existir)
INSERT INTO users (id, name, email, password_hash, role) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'Administrador', 'admin@frela.com', '$2b$10$rQZ8K9LmN2PqR3S4T5U6V7W8X9Y0Z1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P', 'gestor')
ON CONFLICT (id) DO NOTHING;

-- Inserir equipamentos padrão (se não existirem)
INSERT INTO equipments (name, total_quantity, description, category, hourly_rate, daily_rate, condition, location) VALUES
('Câmera Profissional 4K', 5, 'Câmera profissional 4K com estabilização e zoom óptico', 'camera', 25, 200, 'excellent', 'Estúdio Principal'),
('Microfone Sem Fio', 10, 'Microfone sem fio com alcance de 100m e bateria de 8h', 'audio', 8, 60, 'good', 'Estúdio Principal'),
('Painéis LED RGB', 8, 'Painéis LED RGB com controle remoto e múltiplos modos', 'lighting', 15, 120, 'excellent', 'Estúdio Principal'),
('Mesa de Corte', 2, 'Mesa de corte profissional para transmissões ao vivo', 'streaming', 30, 250, 'good', 'Estúdio Principal'),
('Notebook Streaming', 3, 'Notebook de alta performance para streaming e edição', 'streaming', 20, 150, 'excellent', 'Estúdio Principal'),
('Monitor 4K', 4, 'Monitor 4K para monitoramento de qualidade', 'accessories', 12, 90, 'good', 'Estúdio Principal'),
('Cabos HDMI', 20, 'Cabos HDMI de alta qualidade, 5m e 10m', 'accessories', 2, 15, 'excellent', 'Estúdio Principal'),
('Baterias', 15, 'Baterias de alta duração para equipamentos portáteis', 'power', 3, 20, 'good', 'Estúdio Principal'),
('Extensões', 10, 'Extensões com proteção contra surtos e múltiplas tomadas', 'power', 5, 35, 'excellent', 'Estúdio Principal')
ON CONFLICT DO NOTHING;

-- Configurar Row Level Security (RLS) para Supabase
-- Habilitar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE freelancer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE freelancer_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_interests ENABLE ROW LEVEL SECURITY;

-- Políticas básicas de RLS (você pode ajustar conforme necessário)
-- Usuários podem ver seus próprios dados
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- Gestores podem ver todos os dados
CREATE POLICY "Gestores can view all users" ON users FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'gestor')
);

-- Políticas para eventos
CREATE POLICY "Anyone can view events" ON events FOR SELECT USING (true);
CREATE POLICY "Gestores can manage events" ON events FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'gestor')
);

-- Políticas para notificações
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (user_id::text = auth.uid()::text);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (user_id::text = auth.uid()::text);

-- Políticas para equipamentos
CREATE POLICY "Anyone can view equipments" ON equipments FOR SELECT USING (true);
CREATE POLICY "Gestores can manage equipments" ON equipments FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'gestor')
);
