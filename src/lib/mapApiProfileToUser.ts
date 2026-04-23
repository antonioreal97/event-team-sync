import type { User, UserRole, TeamType, ExperienceLevel, AudioVisualRole } from '@/types';
import { normalizeTeamType } from '@/lib/teamDomain';

/** Linha retornada por GET /users/profile/me (snake_case do Postgres). */
export function mapApiProfileRowToUser(row: Record<string, unknown>): User {
  const role = row.role as UserRole;
  const fp = row as Record<string, unknown>;

  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    email: String(row.email ?? ''),
    role,
    avatar: row.avatar != null ? String(row.avatar) : undefined,
    teamType:
      fp.team_type != null
        ? normalizeTeamType(fp.team_type)
        : undefined,
    phone: fp.phone != null ? String(fp.phone) : undefined,
    address: fp.address != null ? String(fp.address) : undefined,
    city: fp.city != null ? String(fp.city) : undefined,
    state: fp.state != null ? String(fp.state) : undefined,
    cpf: fp.cpf != null ? String(fp.cpf) : undefined,
    hourlyRate: fp.hourly_rate != null ? Number(fp.hourly_rate) : undefined,
    dailyRate: fp.daily_rate != null ? Number(fp.daily_rate) : undefined,
    experienceLevel: (fp.experience_level as ExperienceLevel) || 'iniciante',
    audioVisualRoles: (fp.audio_visual_roles as AudioVisualRole[] | null) || [],
    bio: fp.bio != null ? String(fp.bio) : undefined,
    portfolio: fp.portfolio != null ? String(fp.portfolio) : undefined,
    linkedin: fp.linkedin != null ? String(fp.linkedin) : undefined,
    instagram: fp.instagram != null ? String(fp.instagram) : undefined,
    website: fp.website != null ? String(fp.website) : undefined,
    previousExperience:
      fp.previous_experience != null ? String(fp.previous_experience) : undefined,
    certifications: (fp.certifications as string[] | null) || [],
    equipment: (fp.equipment as string[] | null) || [],
    languages: (fp.languages as string[] | null) || [],
    totalEventsAttended: Number(fp.total_events_attended ?? 0),
    totalEarnings: Number(fp.total_earnings ?? 0),
    averageRating:
      fp.average_rating != null && fp.average_rating !== ''
        ? Number(fp.average_rating)
        : undefined,
    isActive: Boolean(row.is_active ?? true),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? row.created_at ?? new Date().toISOString()),
  };
}
