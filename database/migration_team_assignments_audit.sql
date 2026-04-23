-- Auditoria de mudanças de equipe para freelancers

CREATE TABLE IF NOT EXISTS team_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  from_team_type VARCHAR(20),
  to_team_type VARCHAR(20) NOT NULL,
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'team_assignments_from_team_type_check'
  ) THEN
    ALTER TABLE team_assignments
      ADD CONSTRAINT team_assignments_from_team_type_check
      CHECK (
        from_team_type IS NULL
        OR from_team_type IN ('iniciante', 'intermediario', 'avancado', 'sem_equipe')
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'team_assignments_to_team_type_check'
  ) THEN
    ALTER TABLE team_assignments
      ADD CONSTRAINT team_assignments_to_team_type_check
      CHECK (to_team_type IN ('iniciante', 'intermediario', 'avancado', 'sem_equipe'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_team_assignments_user_id ON team_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_team_assignments_created_at ON team_assignments(created_at DESC);

-- Backfill inicial para ambientes já existentes.
INSERT INTO team_assignments (user_id, from_team_type, to_team_type, changed_by, notes)
SELECT
  fp.user_id,
  NULL,
  CASE
    WHEN fp.team_type = 'equipe_a' THEN 'avancado'
    WHEN fp.team_type = 'equipe_b' THEN 'iniciante'
    WHEN fp.team_type IN ('iniciante', 'intermediario', 'avancado', 'sem_equipe') THEN fp.team_type
    ELSE 'sem_equipe'
  END AS to_team_type,
  NULL,
  'Backfill inicial da auditoria de equipes'
FROM freelancer_profiles fp
WHERE NOT EXISTS (
  SELECT 1
  FROM team_assignments ta
  WHERE ta.user_id = fp.user_id
)
  AND fp.team_type IS NOT NULL;
