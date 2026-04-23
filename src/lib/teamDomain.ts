import type { Event, TeamAssignment, TeamType } from '@/types';

const TEAM_TYPE_ALIASES: Record<string, TeamType> = {
  equipe_a: 'avancado',
  equipe_b: 'iniciante',
  iniciante: 'iniciante',
  intermediario: 'intermediario',
  avancado: 'avancado',
  sem_equipe: 'sem_equipe',
};

const TEAM_PRIORITY_ALIASES: Record<string, Event['teamPriority']> = {
  equipe_a: 'avancado',
  equipe_b: 'iniciante',
  iniciante: 'iniciante',
  intermediario: 'intermediario',
  avancado: 'avancado',
  ambas: 'ambas',
};

export function normalizeTeamType(value: unknown, fallback: TeamType = 'sem_equipe'): TeamType {
  if (typeof value !== 'string') return fallback;
  const normalized = value.trim().toLowerCase();
  return TEAM_TYPE_ALIASES[normalized] || fallback;
}

export function normalizeTeamPriority(
  value: unknown,
  fallback: Event['teamPriority'] = 'iniciante'
): Event['teamPriority'] {
  if (typeof value !== 'string') return fallback;
  const normalized = value.trim().toLowerCase();
  return TEAM_PRIORITY_ALIASES[normalized] || fallback;
}

export function getLegacyDailyRateAliases(
  dailyRateIniciante: number,
  dailyRateAvancado: number
): {
  dailyRateTeamA: number;
  dailyRateTeamB: number;
} {
  return {
    dailyRateTeamA: dailyRateAvancado,
    dailyRateTeamB: dailyRateIniciante,
  };
}

export function mapTeamAssignmentFromApi(row: Record<string, unknown>): TeamAssignment {
  const fromTeamType =
    row.from_team_type == null ? undefined : normalizeTeamType(row.from_team_type);
  const toTeamType = normalizeTeamType(row.to_team_type ?? row.team_type);
  const changedBy = row.changed_by != null ? String(row.changed_by) : '';
  const changedAt = String(row.created_at ?? row.assigned_at ?? new Date().toISOString());

  return {
    id: String(row.id),
    userId: String(row.user_id ?? row.userId ?? ''),
    fromTeamType,
    toTeamType,
    changedBy,
    changedAt,
    notes: row.notes != null ? String(row.notes) : undefined,
    userName: row.user_name != null ? String(row.user_name) : undefined,
    userEmail: row.user_email != null ? String(row.user_email) : undefined,
    changedByName: row.changed_by_name != null ? String(row.changed_by_name) : undefined,
    // Aliases de compatibilidade para componentes ainda não migrados.
    teamType: toTeamType,
    assignedBy: changedBy,
    assignedAt: changedAt,
  };
}
