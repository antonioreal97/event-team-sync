-- Migration: Equipment Management System
-- Criação de sistema de gestão de materiais com itens individuais, reservas e checklist

-- 1. Criar tabela de categorias de equipamentos
CREATE TABLE IF NOT EXISTS equipment_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Inserir categorias padrão
INSERT INTO equipment_categories (name, description) VALUES
('Câmeras de Gravação', 'Câmeras profissionais para captura de vídeo'),
('Baterias', 'Baterias recarregáveis para equipamentos'),
('Tripés', 'Suportes e tripés para câmeras'),
('Cabos', 'Cabos de conexão diversos'),
('Comunicação', 'Rádios e equipamentos de comunicação'),
('Mesa de Corte', 'Switchers HDMI e equipamentos de corte'),
('Transmissão', 'Transmissores de vídeo wireless')
ON CONFLICT (name) DO NOTHING;

-- 3. Adicionar category_id à tabela equipments (mantendo category como legado)
ALTER TABLE equipments 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES equipment_categories(id);

-- 4. Migrar categorias existentes para category_id
UPDATE equipments 
SET category_id = ec.id
FROM equipment_categories ec
WHERE equipments.category = ec.name;

-- 5. Criar tabela de itens individuais de equipamento
CREATE TABLE IF NOT EXISTS equipment_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipment_id UUID REFERENCES equipments(id) ON DELETE CASCADE,
    asset_tag VARCHAR(50) UNIQUE NOT NULL,
    serial_number VARCHAR(100),
    condition VARCHAR(20) DEFAULT 'good' CHECK (condition IN ('excellent', 'good', 'fair', 'poor', 'damaged')),
    status VARCHAR(20) DEFAULT 'in_service' CHECK (status IN ('in_service', 'maintenance', 'retired', 'lost')),
    location VARCHAR(255),
    notes TEXT,
    last_maintenance DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Criar tabela de reservas de itens para eventos
CREATE TABLE IF NOT EXISTS equipment_item_reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    equipment_item_id UUID REFERENCES equipment_items(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'reserved' CHECK (status IN ('reserved', 'checked_out', 'returned', 'cancelled')),
    
    -- Dados de reserva
    reserved_by UUID REFERENCES users(id),
    reserved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Dados de checkout (retirada)
    checked_out_by UUID REFERENCES users(id),
    checked_out_at TIMESTAMP WITH TIME ZONE,
    condition_out VARCHAR(20) CHECK (condition_out IN ('excellent', 'good', 'fair', 'poor', 'damaged')),
    
    -- Dados de checkin (devolução)
    checked_in_by UUID REFERENCES users(id),
    checked_in_at TIMESTAMP WITH TIME ZONE,
    condition_in VARCHAR(20) CHECK (condition_in IN ('excellent', 'good', 'fair', 'poor', 'damaged')),
    post_event_status VARCHAR(20) CHECK (post_event_status IN ('ok', 'maintenance', 'replace', 'lost', 'damaged')),
    
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Criar tabela de ordens de manutenção
CREATE TABLE IF NOT EXISTS maintenance_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipment_item_id UUID REFERENCES equipment_items(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    opened_by UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'discarded')),
    requested_action VARCHAR(20) NOT NULL CHECK (requested_action IN ('maintenance', 'replace')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_equipment_items_asset_tag ON equipment_items(asset_tag);
CREATE INDEX IF NOT EXISTS idx_equipment_items_equipment_id ON equipment_items(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_items_status ON equipment_items(status);
CREATE INDEX IF NOT EXISTS idx_equipment_item_reservations_event_id ON equipment_item_reservations(event_id);
CREATE INDEX IF NOT EXISTS idx_equipment_item_reservations_item_id ON equipment_item_reservations(equipment_item_id);
CREATE INDEX IF NOT EXISTS idx_equipment_item_reservations_status ON equipment_item_reservations(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_orders_item_id ON maintenance_orders(equipment_item_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_orders_status ON maintenance_orders(status);

-- 9. Função para verificar conflitos de reserva
CREATE OR REPLACE FUNCTION check_equipment_reservation_conflict(
    p_item_id UUID,
    p_event_id UUID,
    p_start_date TIMESTAMP WITH TIME ZONE,
    p_end_date TIMESTAMP WITH TIME ZONE
) RETURNS BOOLEAN AS $$
DECLARE
    conflict_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO conflict_count
    FROM equipment_item_reservations eir
    JOIN events e ON eir.event_id = e.id
    WHERE eir.equipment_item_id = p_item_id
      AND eir.event_id != p_event_id
      AND eir.status IN ('reserved', 'checked_out')
      AND NOT (e.end_date <= p_start_date OR e.start_date >= p_end_date);
    
    RETURN conflict_count > 0;
END;
$$ LANGUAGE plpgsql;

-- 10. Função para criar ordem de manutenção automática
CREATE OR REPLACE FUNCTION create_maintenance_order_if_needed(
    p_item_id UUID,
    p_event_id UUID,
    p_opened_by UUID,
    p_post_event_status VARCHAR(20),
    p_notes TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    order_id UUID;
    requested_action VARCHAR(20);
BEGIN
    -- Determinar ação baseada no status pós-evento
    CASE p_post_event_status
        WHEN 'maintenance' THEN requested_action := 'maintenance';
        WHEN 'replace', 'damaged', 'lost' THEN requested_action := 'replace';
        ELSE RETURN NULL; -- Não precisa de manutenção
    END CASE;
    
    -- Criar ordem de manutenção
    INSERT INTO maintenance_orders (
        equipment_item_id,
        event_id,
        opened_by,
        requested_action,
        notes
    ) VALUES (
        p_item_id,
        p_event_id,
        p_opened_by,
        requested_action,
        p_notes
    ) RETURNING id INTO order_id;
    
    -- Atualizar status do item se necessário
    IF p_post_event_status IN ('maintenance', 'replace', 'damaged', 'lost') THEN
        UPDATE equipment_items 
        SET status = CASE 
            WHEN p_post_event_status = 'lost' THEN 'lost'
            ELSE 'maintenance'
        END,
        updated_at = CURRENT_TIMESTAMP
        WHERE id = p_item_id;
    END IF;
    
    RETURN order_id;
END;
$$ LANGUAGE plpgsql;

-- 11. Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger nas tabelas
DROP TRIGGER IF EXISTS update_equipment_categories_updated_at ON equipment_categories;
CREATE TRIGGER update_equipment_categories_updated_at
    BEFORE UPDATE ON equipment_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_equipment_items_updated_at ON equipment_items;
CREATE TRIGGER update_equipment_items_updated_at
    BEFORE UPDATE ON equipment_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_equipment_item_reservations_updated_at ON equipment_item_reservations;
CREATE TRIGGER update_equipment_item_reservations_updated_at
    BEFORE UPDATE ON equipment_item_reservations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_maintenance_orders_updated_at ON maintenance_orders;
CREATE TRIGGER update_maintenance_orders_updated_at
    BEFORE UPDATE ON maintenance_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 12. Comentários nas tabelas
COMMENT ON TABLE equipment_categories IS 'Categorias de equipamentos gerenciáveis pelo admin';
COMMENT ON TABLE equipment_items IS 'Itens individuais de equipamento com controle por patrimônio';
COMMENT ON TABLE equipment_item_reservations IS 'Reservas de itens para eventos com controle de retirada/devolução';
COMMENT ON TABLE maintenance_orders IS 'Ordens de manutenção geradas automaticamente';

