-- Vincula notificações à alocação de equipe (confirmação de disponibilidade, etc.)
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS related_team_allocation_id UUID REFERENCES team_allocations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_related_team_allocation_id
  ON notifications(related_team_allocation_id);
