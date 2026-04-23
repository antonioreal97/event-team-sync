// API shim: routes legacy `apiFetch` calls to Lovable Cloud (Supabase).
// This keeps existing service files working while we migrate them progressively.
import { supabase } from '@/integrations/supabase/client';

export function getApiBaseUrl(): string {
  return '';
}

export const AUTH_TOKEN_STORAGE_KEY = 'token';

export function getStoredAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

export function setStoredAuthToken(token: string | null): void {
  if (token) localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  else localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}

type ApiFetchInit = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>;
};

// ============================================================================
// Helpers — convert profile rows to the legacy "user" shape with role joined.
// ============================================================================

async function fetchProfilesWithRoles(): Promise<Record<string, unknown>[]> {
  const [{ data: profiles, error: pErr }, { data: roles, error: rErr }] = await Promise.all([
    supabase.from('profiles').select('*'),
    supabase.from('user_roles').select('user_id, role'),
  ]);
  if (pErr) throw pErr;
  if (rErr) throw rErr;
  const roleByUser = new Map<string, string>();
  (roles || []).forEach((r: any) => roleByUser.set(r.user_id, r.role));
  return (profiles || []).map((p: any) => ({
    ...p,
    id: p.user_id, // legacy code expects user id as primary id
    role: roleByUser.get(p.user_id) || 'freelancer',
  }));
}

async function fetchProfileWithRole(userId: string): Promise<Record<string, unknown> | null> {
  const { data: profile, error: pErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (pErr) throw pErr;
  if (!profile) return null;
  const { data: roleRow } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();
  return {
    ...profile,
    id: profile.user_id,
    role: (roleRow as any)?.role || 'freelancer',
  };
}

async function fetchEvents(): Promise<Record<string, unknown>[]> {
  const { data, error } = await supabase.from('events').select('*');
  if (error) throw error;
  return (data || []) as Record<string, unknown>[];
}

async function fetchEventWithRelations(eventId: string): Promise<Record<string, unknown> | null> {
  const [{ data: event, error: eErr }, { data: allocations }] = await Promise.all([
    supabase.from('events').select('*').eq('id', eventId).maybeSingle(),
    supabase.from('team_allocations').select('*').eq('event_id', eventId),
  ]);
  if (eErr) throw eErr;
  if (!event) return null;
  return { ...event, teamAllocations: allocations || [] };
}

// Convert camelCase event payload to snake_case for Supabase insert/update
function eventToDbRow(payload: any): Record<string, unknown> {
  const map: Record<string, string> = {
    title: 'title',
    description: 'description',
    location: 'location',
    startDate: 'start_date',
    endDate: 'end_date',
    status: 'status',
    eventType: 'event_type',
    estimatedDuration: 'estimated_duration',
    budget: 'budget',
    requirements: 'requirements',
    notes: 'notes',
    teamPriority: 'team_priority',
    allowBackupLevels: 'allow_backup_levels',
    dailyRateIniciante: 'daily_rate_iniciante',
    dailyRateIntermediario: 'daily_rate_intermediario',
    dailyRateAvancado: 'daily_rate_avancado',
    isMultiDay: 'is_multi_day',
    totalDays: 'total_days',
    workingDays: 'working_days',
    dailySchedule: 'daily_schedule',
    eventAgenda: 'event_agenda',
    specialInstructions: 'special_instructions',
    setupRequirements: 'setup_requirements',
    technicalSpecifications: 'technical_specifications',
  };
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (map[k]) out[map[k]] = v;
  }
  return out;
}

// ============================================================================
// Router
// ============================================================================

async function route(path: string, init: ApiFetchInit): Promise<unknown> {
  const method = (init.method || 'GET').toUpperCase();
  const body = init.body && typeof init.body === 'string' ? JSON.parse(init.body) : undefined;
  const cleanPath = path.replace(/^\//, '').split('?')[0];
  const segs = cleanPath.split('/');

  // ---- /users ----
  if (segs[0] === 'users') {
    // GET /users/profile/me
    if (method === 'GET' && segs[1] === 'profile' && segs[2] === 'me') {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Unauthorized');
      const profile = await fetchProfileWithRole(user.id);
      return { user: profile };
    }
    // GET /users
    if (method === 'GET' && !segs[1]) {
      return { users: await fetchProfilesWithRoles() };
    }
    // GET /users/:id
    if (method === 'GET' && segs[1] && !segs[2]) {
      return { user: await fetchProfileWithRole(segs[1]) };
    }
    // POST /users (create freelancer)
    if (method === 'POST' && !segs[1]) {
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body,
      });
      if (error) throw new Error(error.message || 'Erro ao criar usuário');
      return { user: data?.user };
    }
    // PUT /users/:id
    if (method === 'PUT' && segs[1] && !segs[2]) {
      const updates: Record<string, unknown> = {};
      const map: Record<string, string> = {
        name: 'name', email: 'email', phone: 'phone', address: 'address',
        city: 'city', state: 'state', cpf: 'cpf', bio: 'bio',
        portfolio: 'portfolio', linkedin: 'linkedin', instagram: 'instagram',
        website: 'website', avatar: 'avatar',
        teamType: 'team_type', dailyRate: 'daily_rate', hourlyRate: 'hourly_rate',
        experienceLevel: 'experience_level', audioVisualRoles: 'audio_visual_roles',
        certifications: 'certifications', equipment: 'equipment', languages: 'languages',
        previousExperience: 'previous_experience', isActive: 'is_active',
      };
      for (const [k, v] of Object.entries(body || {})) {
        if (map[k]) updates[map[k]] = v;
      }
      const { data, error } = await (supabase as any)
        .from('profiles').update(updates).eq('user_id', segs[1])
        .select().maybeSingle();
      if (error) throw error;
      return { user: data ? { ...data, id: (data as any).user_id } : null };
    }
    // PATCH /users/:id/team
    if (method === 'PATCH' && segs[1] && segs[2] === 'team') {
      const { error } = await supabase
        .from('profiles').update({ team_type: body.teamType }).eq('user_id', segs[1]);
      if (error) throw error;
      return {};
    }
    // PATCH /users/:id/status
    if (method === 'PATCH' && segs[1] && segs[2] === 'status') {
      const { error } = await supabase
        .from('profiles').update({ is_active: body.isActive }).eq('user_id', segs[1]);
      if (error) throw error;
      return {};
    }
  }

  // ---- /events ----
  if (segs[0] === 'events') {
    if (method === 'GET' && !segs[1]) {
      return { events: await fetchEvents() };
    }
    if (method === 'GET' && segs[1] && !segs[2]) {
      return { event: await fetchEventWithRelations(segs[1]) };
    }
    if (method === 'POST' && !segs[1]) {
      const { data: { user } } = await supabase.auth.getUser();
      const row = { ...eventToDbRow(body), created_by: user?.id };
      const { data, error } = await (supabase as any).from('events').insert(row).select().maybeSingle();
      if (error) throw error;
      return { event: data };
    }
    if (method === 'PUT' && segs[1] && !segs[2]) {
      const { data, error } = await (supabase as any)
        .from('events').update(eventToDbRow(body)).eq('id', segs[1])
        .select().maybeSingle();
      if (error) throw error;
      return { event: data };
    }
    if (method === 'DELETE' && segs[1] && !segs[2]) {
      const { error } = await supabase.from('events').delete().eq('id', segs[1]);
      if (error) throw error;
      return {};
    }
    if (method === 'PATCH' && segs[1] && segs[2] === 'status') {
      const { data, error } = await supabase
        .from('events').update({ status: body.status }).eq('id', segs[1])
        .select().maybeSingle();
      if (error) throw error;
      return { event: data };
    }
  }

  // ---- /teams ----
  if (segs[0] === 'teams') {
    // GET /teams/assignments → lista profiles agrupados
    if (method === 'GET' && segs[1] === 'assignments') {
      const profiles = await fetchProfilesWithRoles();
      const assignments = profiles
        .filter((p: any) => p.role !== 'gestor')
        .map((p: any) => ({
          id: p.user_id,
          user_id: p.user_id,
          to_team_type: p.team_type || 'sem_equipe',
          team_type: p.team_type || 'sem_equipe',
          changed_by: '',
          created_at: p.updated_at,
          user_name: p.name,
          user_email: p.email,
        }));
      return { assignments };
    }
    // GET /teams (stats)
    if (method === 'GET' && !segs[1]) {
      const profiles = await fetchProfilesWithRoles();
      const freelancers = profiles.filter((p: any) => p.role !== 'gestor');
      const stats = {
        total: freelancers.length,
        iniciante: freelancers.filter((p: any) => p.team_type === 'iniciante').length,
        intermediario: freelancers.filter((p: any) => p.team_type === 'intermediario').length,
        avancado: freelancers.filter((p: any) => p.team_type === 'avancado').length,
        sem_equipe: freelancers.filter((p: any) => !p.team_type || p.team_type === 'sem_equipe').length,
      };
      return { stats };
    }
    // GET /teams/active-freelancers
    if (method === 'GET' && segs[1] === 'active-freelancers') {
      const profiles = await fetchProfilesWithRoles();
      const freelancers = profiles.filter((p: any) => p.role !== 'gestor');
      const bucket = (key: string) => {
        const inBucket = freelancers.filter((p: any) =>
          (p.team_type || 'sem_equipe') === key
        );
        const active = inBucket.filter((p: any) => p.is_active !== false);
        return { total: inBucket.length, active: active.length, users: active };
      };
      return {
        iniciante: bucket('iniciante'),
        intermediario: bucket('intermediario'),
        avancado: bucket('avancado'),
        sem_equipe: bucket('sem_equipe'),
      };
    }
    // GET /teams/event/:id/allocations
    if (method === 'GET' && segs[1] === 'event' && segs[3] === 'allocations') {
      const { data, error } = await supabase
        .from('team_allocations').select('*').eq('event_id', segs[2]);
      if (error) throw error;
      return { allocations: data || [] };
    }
    // GET /teams/event/:id/confirmation-status
    if (method === 'GET' && segs[1] === 'event' && segs[3] === 'confirmation-status') {
      const { data, error } = await supabase
        .from('team_allocations').select('status').eq('event_id', segs[2]);
      if (error) throw error;
      const list = (data || []) as { status: string }[];
      const isFullyConfirmed = list.length > 0 && list.every((a) => a.status === 'confirmed');
      return { isFullyConfirmed };
    }
    // POST /teams/allocate
    if (method === 'POST' && segs[1] === 'allocate') {
      const row: Record<string, unknown> = {
        event_id: body.eventId,
        user_id: body.userId,
        assigned_role: body.assignedRole,
        total_days: body.totalDays || 1,
        notes: body.notes,
      };
      const { data, error } = await supabase
        .from('team_allocations').insert(row).select().maybeSingle();
      if (error) throw error;
      return { allocation: data };
    }
    // DELETE /teams/allocate/:id
    if (method === 'DELETE' && segs[1] === 'allocate' && segs[2]) {
      const { error } = await supabase
        .from('team_allocations').delete().eq('id', segs[2]);
      if (error) throw error;
      return {};
    }
    // POST /teams/attendance/:allocId
    if (method === 'POST' && segs[1] === 'attendance' && segs[2]) {
      const { data: { user } } = await supabase.auth.getUser();
      const row = {
        allocation_id: segs[2],
        date: body.date,
        status: body.status,
        notes: body.notes,
        confirmed_by: user?.id,
        confirmed_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from('attendance_records')
        .upsert(row, { onConflict: 'allocation_id,date' });
      if (error) throw error;
      return {};
    }
    // POST /teams/payment/:allocId/confirm
    if (method === 'POST' && segs[1] === 'payment' && segs[3] === 'confirm') {
      const { error } = await supabase
        .from('attendance_records')
        .update({ payment_confirmed: true })
        .eq('allocation_id', segs[2])
        .eq('date', body.date);
      if (error) throw error;
      return {};
    }
  }

  // Unknown endpoint — return safe empty payload to avoid UI crashes during migration.
  console.warn('[api shim] Unhandled endpoint, returning empty:', method, path);
  return { users: [], events: [], assignments: [], allocations: [], stats: {}, items: [], categories: [], equipments: [] };
}

export async function apiFetch<T = unknown>(
  path: string,
  init: ApiFetchInit = {}
): Promise<T> {
  try {
    const result = await route(path, init);
    return result as T;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(msg);
  }
}
