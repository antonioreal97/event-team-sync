-- Migração: Substituir Equipe A/B por Níveis de Experiência
-- Data: 2025-01-XX
-- Descrição: Migra o sistema de Equipe A/B para categorias de experiência (Iniciante, Intermediário, Avançado)

BEGIN;

-- 1. Atualizar tabela freelancer_profiles: alterar team_type
-- Primeiro, adicionar a nova constraint temporariamente permitindo os novos valores
ALTER TABLE freelancer_profiles 
  DROP CONSTRAINT IF EXISTS freelancer_profiles_team_type_check;

ALTER TABLE freelancer_profiles 
  ADD CONSTRAINT freelancer_profiles_team_type_check 
  CHECK (team_type IN ('iniciante', 'intermediario', 'avancado', 'sem_equipe'));

-- Migrar dados existentes:
-- equipe_a -> avancado (mesmo valor de diária)
-- equipe_b -> iniciante (mesmo valor de diária)
UPDATE freelancer_profiles 
SET team_type = CASE 
  WHEN team_type = 'equipe_a' THEN 'avancado'
  WHEN team_type = 'equipe_b' THEN 'iniciante'
  ELSE team_type
END
WHERE team_type IN ('equipe_a', 'equipe_b');

-- 2. Atualizar tabela events: alterar team_priority e adicionar novos campos de diária
-- Primeiro, adicionar as novas colunas
ALTER TABLE events 
  ADD COLUMN IF NOT EXISTS daily_rate_iniciante DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS daily_rate_intermediario DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS daily_rate_avancado DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS allow_backup_levels BOOLEAN DEFAULT true;

-- Migrar valores de diária existentes para os novos campos
UPDATE events 
SET 
  daily_rate_iniciante = COALESCE(daily_rate_team_b, 200),
  daily_rate_intermediario = COALESCE(daily_rate_team_b, 200),
  daily_rate_avancado = COALESCE(daily_rate_team_a, 250),
  allow_backup_levels = COALESCE(allow_team_b, true)
WHERE daily_rate_iniciante IS NULL;

-- Atualizar team_priority: remover constraint antiga e adicionar nova
ALTER TABLE events 
  DROP CONSTRAINT IF EXISTS events_team_priority_check;

ALTER TABLE events 
  ADD CONSTRAINT events_team_priority_check 
  CHECK (team_priority IN ('iniciante', 'intermediario', 'avancado', 'ambas'));

-- Migrar dados de team_priority:
-- equipe_a -> avancado
-- equipe_b -> iniciante
UPDATE events 
SET team_priority = CASE 
  WHEN team_priority = 'equipe_a' THEN 'avancado'
  WHEN team_priority = 'equipe_b' THEN 'iniciante'
  ELSE team_priority
END
WHERE team_priority IN ('equipe_a', 'equipe_b');

-- Tornar os novos campos obrigatórios (após migração)
ALTER TABLE events 
  ALTER COLUMN daily_rate_iniciante SET NOT NULL,
  ALTER COLUMN daily_rate_intermediario SET NOT NULL,
  ALTER COLUMN daily_rate_avancado SET NOT NULL;

-- Definir valores padrão para novos eventos
ALTER TABLE events 
  ALTER COLUMN daily_rate_iniciante SET DEFAULT 200,
  ALTER COLUMN daily_rate_intermediario SET DEFAULT 200,
  ALTER COLUMN daily_rate_avancado SET DEFAULT 250,
  ALTER COLUMN allow_backup_levels SET DEFAULT true;

-- 3. Atualizar team_allocations se necessário (manter compatibilidade)
-- Os valores de daily_rate já estão corretos, apenas garantir que estão alinhados

-- 4. Comentários para documentação
COMMENT ON COLUMN freelancer_profiles.team_type IS 'Nível de experiência: iniciante, intermediario, avancado ou sem_equipe';
COMMENT ON COLUMN events.team_priority IS 'Nível de experiência prioritário: iniciante, intermediario, avancado ou ambas';
COMMENT ON COLUMN events.daily_rate_iniciante IS 'Valor por diária para nível iniciante (mesmo de intermediário)';
COMMENT ON COLUMN events.daily_rate_intermediario IS 'Valor por diária para nível intermediário (mesmo de iniciante)';
COMMENT ON COLUMN events.daily_rate_avancado IS 'Valor por diária para nível avançado';
COMMENT ON COLUMN events.allow_backup_levels IS 'Permite escalar outros níveis quando o prioritário não estiver disponível';

COMMIT;

-- Nota: As colunas antigas (daily_rate_team_a, daily_rate_team_b, allow_team_b) 
-- podem ser removidas em uma migração futura após confirmar que tudo está funcionando.
-- Por enquanto, mantemos para compatibilidade reversa.


