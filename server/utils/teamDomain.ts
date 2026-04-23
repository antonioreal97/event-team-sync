export type CanonicalTeamType = 'iniciante' | 'intermediario' | 'avancado' | 'sem_equipe';
export type CanonicalTeamPriority = 'iniciante' | 'intermediario' | 'avancado' | 'ambas';

const TEAM_TYPE_ALIASES: Record<string, CanonicalTeamType> = {
  equipe_a: 'avancado',
  equipe_b: 'iniciante',
  iniciante: 'iniciante',
  intermediario: 'intermediario',
  avancado: 'avancado',
  sem_equipe: 'sem_equipe',
};

const TEAM_PRIORITY_ALIASES: Record<string, CanonicalTeamPriority> = {
  equipe_a: 'avancado',
  equipe_b: 'iniciante',
  iniciante: 'iniciante',
  intermediario: 'intermediario',
  avancado: 'avancado',
  ambas: 'ambas',
};

function normalizeKey(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  return normalized || null;
}

export function normalizeTeamType(
  value: unknown,
  fallback: CanonicalTeamType = 'sem_equipe'
): CanonicalTeamType {
  const key = normalizeKey(value);
  if (!key) return fallback;
  return TEAM_TYPE_ALIASES[key] || fallback;
}

export function normalizeNullableTeamType(value: unknown): CanonicalTeamType | null {
  const key = normalizeKey(value);
  if (!key) return null;
  return TEAM_TYPE_ALIASES[key] || null;
}

export function isCanonicalTeamType(value: unknown): value is CanonicalTeamType {
  return value === 'iniciante'
    || value === 'intermediario'
    || value === 'avancado'
    || value === 'sem_equipe';
}

export function normalizeTeamPriority(
  value: unknown,
  fallback: CanonicalTeamPriority = 'iniciante'
): CanonicalTeamPriority {
  const key = normalizeKey(value);
  if (!key) return fallback;
  return TEAM_PRIORITY_ALIASES[key] || fallback;
}

export function normalizeNullableTeamPriority(value: unknown): CanonicalTeamPriority | null {
  const key = normalizeKey(value);
  if (!key) return null;
  return TEAM_PRIORITY_ALIASES[key] || null;
}

export function isCanonicalTeamPriority(value: unknown): value is CanonicalTeamPriority {
  return value === 'iniciante'
    || value === 'intermediario'
    || value === 'avancado'
    || value === 'ambas';
}

export function getAllowBackupLevels(row: Record<string, unknown>): boolean {
  const value = row.allow_backup_levels ?? row.allow_team_b;
  if (typeof value === 'boolean') return value;
  if (value == null) return true;
  return Boolean(value);
}

export function getCanonicalDailyRates(row: Record<string, unknown>): {
  dailyRateIniciante: number;
  dailyRateIntermediario: number;
  dailyRateAvancado: number;
} {
  const dailyRateIniciante = Number(row.daily_rate_iniciante ?? row.daily_rate_team_b ?? 200);
  const dailyRateIntermediario = Number(row.daily_rate_intermediario ?? row.daily_rate_team_b ?? 200);
  const dailyRateAvancado = Number(row.daily_rate_avancado ?? row.daily_rate_team_a ?? 250);

  return {
    dailyRateIniciante,
    dailyRateIntermediario,
    dailyRateAvancado,
  };
}

export function normalizeUserRow<T extends Record<string, unknown>>(row: T): T {
  return {
    ...row,
    team_type: normalizeTeamType(row.team_type),
  };
}

export function normalizeEventRow<T extends Record<string, unknown>>(row: T): T {
  const allowBackupLevels = getAllowBackupLevels(row);
  const rates = getCanonicalDailyRates(row);

  return {
    ...row,
    team_priority: normalizeTeamPriority(row.team_priority),
    allow_backup_levels: allowBackupLevels,
    allow_team_b: allowBackupLevels,
    daily_rate_iniciante: rates.dailyRateIniciante,
    daily_rate_intermediario: rates.dailyRateIntermediario,
    daily_rate_avancado: rates.dailyRateAvancado,
    daily_rate_team_a: rates.dailyRateAvancado,
    daily_rate_team_b: rates.dailyRateIniciante,
  };
}
