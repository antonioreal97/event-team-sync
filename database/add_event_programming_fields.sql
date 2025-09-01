-- Script para adicionar campos de programação detalhada à tabela events
-- Execute este script no banco de dados para suportar os novos recursos

-- Adicionar campos para programação detalhada dos eventos
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS daily_schedule JSONB,
ADD COLUMN IF NOT EXISTS event_agenda TEXT,
ADD COLUMN IF NOT EXISTS special_instructions TEXT,
ADD COLUMN IF NOT EXISTS setup_requirements TEXT,
ADD COLUMN IF NOT EXISTS technical_specifications TEXT;

-- Comentários para documentar os novos campos
COMMENT ON COLUMN events.daily_schedule IS 'Programação detalhada dos dias do evento em formato JSON';
COMMENT ON COLUMN events.event_agenda IS 'Agenda geral do evento';
COMMENT ON COLUMN events.special_instructions IS 'Instruções especiais para a equipe';
COMMENT ON COLUMN events.setup_requirements IS 'Requisitos específicos para setup';
COMMENT ON COLUMN events.technical_specifications IS 'Especificações técnicas do evento';

-- Verificar se os campos foram adicionados
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name IN ('daily_schedule', 'event_agenda', 'special_instructions', 'setup_requirements', 'technical_specifications');
