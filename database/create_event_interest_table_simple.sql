-- Script simples para criar a tabela de confirmações de interesse
-- Execute este script no seu banco de dados PostgreSQL

-- Criar a tabela
CREATE TABLE IF NOT EXISTS event_interest_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL,
  user_id UUID NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
  confirmed_at TIMESTAMP,
  rejected_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Adicionar foreign keys
ALTER TABLE event_interest_confirmations 
ADD CONSTRAINT fk_event_interest_event_id 
FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;

ALTER TABLE event_interest_confirmations 
ADD CONSTRAINT fk_event_interest_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Adicionar constraint único
ALTER TABLE event_interest_confirmations 
ADD CONSTRAINT unique_event_user 
UNIQUE(event_id, user_id);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_event_interest_event_id ON event_interest_confirmations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_interest_user_id ON event_interest_confirmations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_interest_status ON event_interest_confirmations(status);

-- Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_event_interest_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_update_event_interest_updated_at ON event_interest_confirmations;
CREATE TRIGGER trigger_update_event_interest_updated_at
  BEFORE UPDATE ON event_interest_confirmations
  FOR EACH ROW
  EXECUTE FUNCTION update_event_interest_updated_at();

-- Verificar se a tabela foi criada
SELECT 'Tabela event_interest_confirmations criada com sucesso!' as status;
