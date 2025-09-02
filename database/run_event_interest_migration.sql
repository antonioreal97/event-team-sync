-- Script para executar a migração da tabela de confirmações de interesse
-- Execute este script no seu banco de dados PostgreSQL

-- 1. Criar a tabela de confirmações de interesse
CREATE TABLE IF NOT EXISTS event_interest_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
  confirmed_at TIMESTAMP,
  rejected_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Garantir que um usuário só pode ter uma confirmação por evento
  UNIQUE(event_id, user_id)
);

-- 2. Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_event_interest_event_id ON event_interest_confirmations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_interest_user_id ON event_interest_confirmations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_interest_status ON event_interest_confirmations(status);

-- 3. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_event_interest_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Criar trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS trigger_update_event_interest_updated_at ON event_interest_confirmations;
CREATE TRIGGER trigger_update_event_interest_updated_at
  BEFORE UPDATE ON event_interest_confirmations
  FOR EACH ROW
  EXECUTE FUNCTION update_event_interest_updated_at();

-- 5. Adicionar comentários para documentação
COMMENT ON TABLE event_interest_confirmations IS 'Tabela para armazenar confirmações de interesse dos freelancers em eventos';
COMMENT ON COLUMN event_interest_confirmations.status IS 'Status da confirmação: pending (pendente), confirmed (confirmado), rejected (rejeitado)';
COMMENT ON COLUMN event_interest_confirmations.confirmed_at IS 'Data/hora em que o administrador confirmou o interesse';
COMMENT ON COLUMN event_interest_confirmations.rejected_at IS 'Data/hora em que o administrador rejeitou o interesse';
COMMENT ON COLUMN event_interest_confirmations.notes IS 'Observações do administrador sobre a confirmação';

-- 6. Verificar se a tabela foi criada corretamente
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'event_interest_confirmations'
ORDER BY ordinal_position;

-- 7. Verificar se os índices foram criados
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'event_interest_confirmations';

-- 8. Verificar se o trigger foi criado
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'event_interest_confirmations';

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE 'Migração da tabela event_interest_confirmations concluída com sucesso!';
  RAISE NOTICE 'A tabela está pronta para uso.';
END $$;
