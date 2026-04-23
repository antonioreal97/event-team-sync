import { pool } from '../config/database';
import {
  normalizeNullableTeamType,
  normalizeTeamType,
  type CanonicalTeamType,
} from './teamDomain';

let teamAssignmentsTableAvailable: boolean | null = null;

async function hasTeamAssignmentsTable(): Promise<boolean> {
  if (teamAssignmentsTableAvailable !== null) {
    return teamAssignmentsTableAvailable;
  }

  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'team_assignments'
      ) AS ok
    `);
    teamAssignmentsTableAvailable = result.rows[0]?.ok === true;
  } catch (error) {
    console.warn('Falha ao verificar tabela team_assignments:', error);
    teamAssignmentsTableAvailable = false;
  }

  return teamAssignmentsTableAvailable;
}

export function invalidateTeamAssignmentsCache(): void {
  teamAssignmentsTableAvailable = null;
}

export function normalizeTeamAssignmentRow<T extends Record<string, unknown>>(row: T): T {
  const fromTeamType = normalizeNullableTeamType(row.from_team_type);
  const toTeamType = normalizeTeamType(row.to_team_type ?? row.team_type);

  return {
    ...row,
    from_team_type: fromTeamType,
    to_team_type: toTeamType,
    team_type: toTeamType,
    assigned_by: row.changed_by ?? row.assigned_by,
    assigned_at: row.created_at ?? row.assigned_at,
  };
}

export async function recordTeamAssignment(params: {
  userId: string;
  fromTeamType: CanonicalTeamType | null;
  toTeamType: CanonicalTeamType;
  changedBy: string | null | undefined;
  notes?: string | null;
}): Promise<Record<string, unknown> | null> {
  if (!(await hasTeamAssignmentsTable())) {
    return null;
  }

  const result = await pool.query(
    `
    INSERT INTO team_assignments (
      user_id, from_team_type, to_team_type, changed_by, notes
    ) VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `,
    [
      params.userId,
      params.fromTeamType,
      params.toTeamType,
      params.changedBy ?? null,
      params.notes ?? null,
    ]
  );

  return normalizeTeamAssignmentRow(result.rows[0]);
}

export async function listTeamAssignments(): Promise<Record<string, unknown>[]> {
  if (!(await hasTeamAssignmentsTable())) {
    return [];
  }

  const result = await pool.query(`
    SELECT
      ta.*,
      u.name AS user_name,
      u.email AS user_email,
      changer.name AS changed_by_name
    FROM team_assignments ta
    INNER JOIN users u ON u.id = ta.user_id
    LEFT JOIN users changer ON changer.id = ta.changed_by
    ORDER BY ta.created_at DESC
  `);

  return result.rows.map(normalizeTeamAssignmentRow);
}
