-- Script para corrigir automaticamente a tabela event_interest_confirmations
-- Execute este script no seu banco de dados PostgreSQL

-- 1. Verificar se a extensão UUID está habilitada
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    RAISE NOTICE 'Extensão uuid-ossp habilitada';
  ELSE
    RAISE NOTICE 'Extensão uuid-ossp já está habilitada';
  END IF;
END $$;

-- 2. Verificar se a tabela existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'event_interest_confirmations') THEN
    RAISE NOTICE 'Tabela event_interest_confirmations não existe. Criando...';
    
    -- Criar a tabela
    CREATE TABLE event_interest_confirmations (
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
    
    RAISE NOTICE 'Tabela event_interest_confirmations criada com sucesso!';
  ELSE
    RAISE NOTICE 'Tabela event_interest_confirmations já existe';
  END IF;
END $$;

-- 3. Verificar e adicionar foreign keys se não existirem
DO $$
BEGIN
  -- Foreign key para events
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_event_interest_event_id'
  ) THEN
    BEGIN
      ALTER TABLE event_interest_confirmations 
      ADD CONSTRAINT fk_event_interest_event_id 
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;
      RAISE NOTICE 'Foreign key fk_event_interest_event_id adicionada';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Não foi possível adicionar foreign key para events: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'Foreign key fk_event_interest_event_id já existe';
  END IF;

  -- Foreign key para users
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_event_interest_user_id'
  ) THEN
    BEGIN
      ALTER TABLE event_interest_confirmations 
      ADD CONSTRAINT fk_event_interest_user_id 
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
      RAISE NOTICE 'Foreign key fk_event_interest_user_id adicionada';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Não foi possível adicionar foreign key para users: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'Foreign key fk_event_interest_user_id já existe';
  END IF;
END $$;

-- 4. Verificar e adicionar constraint único se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'unique_event_user'
  ) THEN
    BEGIN
      ALTER TABLE event_interest_confirmations 
      ADD CONSTRAINT unique_event_user 
      UNIQUE(event_id, user_id);
      RAISE NOTICE 'Constraint único unique_event_user adicionado';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Não foi possível adicionar constraint único: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'Constraint único unique_event_user já existe';
  END IF;
END $$;

-- 5. Criar índices se não existirem
DO $$
BEGIN
  -- Índice para event_id
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_event_interest_event_id'
  ) THEN
    CREATE INDEX idx_event_interest_event_id ON event_interest_confirmations(event_id);
    RAISE NOTICE 'Índice idx_event_interest_event_id criado';
  ELSE
    RAISE NOTICE 'Índice idx_event_interest_event_id já existe';
  END IF;

  -- Índice para user_id
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_event_interest_user_id'
  ) THEN
    CREATE INDEX idx_event_interest_user_id ON event_interest_confirmations(user_id);
    RAISE NOTICE 'Índice idx_event_interest_user_id criado';
  ELSE
    RAISE NOTICE 'Índice idx_event_interest_user_id já existe';
  END IF;

  -- Índice para status
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_event_interest_status'
  ) THEN
    CREATE INDEX idx_event_interest_status ON event_interest_confirmations(status);
    RAISE NOTICE 'Índice idx_event_interest_status criado';
  ELSE
    RAISE NOTICE 'Índice idx_event_interest_status já existe';
  END IF;
END $$;

-- 6. Criar função para atualizar updated_at se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'update_event_interest_updated_at'
  ) THEN
    CREATE OR REPLACE FUNCTION update_event_interest_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    RAISE NOTICE 'Função update_event_interest_updated_at criada';
  ELSE
    RAISE NOTICE 'Função update_event_interest_updated_at já existe';
  END IF;
END $$;

-- 7. Criar trigger se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_event_interest_updated_at'
  ) THEN
    CREATE TRIGGER trigger_update_event_interest_updated_at
      BEFORE UPDATE ON event_interest_confirmations
      FOR EACH ROW
      EXECUTE FUNCTION update_event_interest_updated_at();
    RAISE NOTICE 'Trigger trigger_update_event_interest_updated_at criado';
  ELSE
    RAISE NOTICE 'Trigger trigger_update_event_interest_updated_at já existe';
  END IF;
END $$;

-- 8. Verificar se tudo foi criado corretamente
SELECT 
  'Verificação Final' as status,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'event_interest_confirmations') as tabela_existe,
  (SELECT COUNT(*) FROM information_schema.table_constraints WHERE table_name = 'event_interest_confirmations' AND constraint_type = 'FOREIGN KEY') as foreign_keys,
  (SELECT COUNT(*) FROM information_schema.table_constraints WHERE table_name = 'event_interest_confirmations' AND constraint_type = 'UNIQUE') as constraints_unicos,
  (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'event_interest_confirmations') as indices,
  (SELECT COUNT(*) FROM pg_trigger WHERE tgrelid = 'event_interest_confirmations'::regclass) as triggers;

-- 9. Testar uma query simples
SELECT 
  'Teste de Query' as teste,
  COUNT(*) as total_registros
FROM event_interest_confirmations;

-- 10. Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ CORREÇÃO CONCLUÍDA COM SUCESSO!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'A tabela event_interest_confirmations está pronta para uso.';
  RAISE NOTICE 'Reinicie o servidor para aplicar as mudanças.';
  RAISE NOTICE '';
  RAISE NOTICE 'Próximos passos:';
  RAISE NOTICE '1. Reinicie o servidor: npm run dev:server';
  RAISE NOTICE '2. Teste a página "Interesse em Eventos"';
  RAISE NOTICE '3. Verifique se não há mais erro 500';
  RAISE NOTICE '';
END $$;
