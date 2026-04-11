import { apiFetch } from '@/lib/api';
import type { AudioVisualRole } from '@/types';

export type ApiTeamAllocationRow = Record<string, unknown> & {
  id: string;
  event_id: string;
  user_id: string;
  assigned_role: string;
  status: string | null;
  daily_rate: number;
  total_days: number;
  total_payment: number;
  confirmation_deadline?: string | null;
  event_title?: string;
  start_date?: string;
  end_date?: string;
};

export async function apiGetPlanningEvents(): Promise<Record<string, unknown>[]> {
  const data = await apiFetch<{ events: Record<string, unknown>[] }>('/events');
  const events = data.events || [];
  return events.filter((e) => e.status === 'planning');
}

export type ActiveFreelancersBuckets = Record<
  string,
  { total: number; active: number; users: Record<string, unknown>[] }
>;

export async function apiGetActiveFreelancers(): Promise<ActiveFreelancersBuckets> {
  return apiFetch<ActiveFreelancersBuckets>('/teams/active-freelancers');
}

export async function apiAllocateUser(params: {
  eventId: string;
  userId: string;
  assignedRole: string;
  totalDays: number;
  notes?: string;
}): Promise<{ allocation: Record<string, unknown> }> {
  return apiFetch('/teams/allocate', {
    method: 'POST',
    body: JSON.stringify({
      eventId: params.eventId,
      userId: params.userId,
      assignedRole: params.assignedRole,
      totalDays: params.totalDays,
      notes: params.notes,
    }),
  });
}

export async function apiGetMyAllocations(eventId?: string): Promise<ApiTeamAllocationRow[]> {
  const q = eventId ? `?eventId=${encodeURIComponent(eventId)}` : '';
  const data = await apiFetch<{ allocations: ApiTeamAllocationRow[] }>(`/teams/my-allocations${q}`);
  return data.allocations || [];
}

export async function apiConfirmAllocationAvailability(allocationId: string): Promise<void> {
  await apiFetch(`/teams/allocations/${allocationId}/confirm-availability`, { method: 'POST' });
}

export async function apiDeclineAllocationAvailability(allocationId: string): Promise<void> {
  await apiFetch(`/teams/allocations/${allocationId}/decline-availability`, { method: 'POST' });
}

export async function apiGetPendingAllocationsForGestor(): Promise<Record<string, unknown>[]> {
  const data = await apiFetch<{ allocations: Record<string, unknown>[] }>('/teams/pending-allocations');
  return data.allocations || [];
}

/** Lista plana de freelancers para UI de escalação (todos os buckets). */
export function flattenActiveFreelancers(buckets: ActiveFreelancersBuckets): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  for (const key of Object.keys(buckets)) {
    const b = buckets[key];
    if (b?.users?.length) out.push(...b.users);
  }
  return out;
}

export const ALLOCATION_ROLE_OPTIONS: AudioVisualRole[] = [
  'camera',
  'audio',
  'lighting',
  'director',
  'producer',
  'assistant',
  'technician',
  'streaming',
  'editing',
];
