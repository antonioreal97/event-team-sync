-- Migração para adicionar campo daily_schedule na tabela events
-- Executar após a criação inicial do banco

-- Adicionar campo daily_schedule como JSONB para armazenar a programação detalhada dos dias
ALTER TABLE events ADD COLUMN IF NOT EXISTS daily_schedule JSONB;

-- Adicionar campo event_agenda para agenda geral do evento
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_agenda TEXT;

-- Adicionar campo special_instructions para instruções especiais
ALTER TABLE events ADD COLUMN IF NOT EXISTS special_instructions TEXT;

-- Adicionar campo setup_requirements para requisitos de montagem
ALTER TABLE events ADD COLUMN IF NOT EXISTS setup_requirements TEXT;

-- Adicionar campo technical_specifications para especificações técnicas
ALTER TABLE events ADD COLUMN IF NOT EXISTS technical_specifications TEXT;

-- Comentários para documentar os novos campos
COMMENT ON COLUMN events.daily_schedule IS 'Programação detalhada dos dias do evento (JSONB)';
COMMENT ON COLUMN events.event_agenda IS 'Agenda geral do evento';
COMMENT ON COLUMN events.special_instructions IS 'Instruções especiais para a equipe';
COMMENT ON COLUMN events.setup_requirements IS 'Requisitos de montagem e preparação';
COMMENT ON COLUMN events.technical_specifications IS 'Especificações técnicas do evento';
