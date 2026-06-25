import { supabase } from '@/integrations/supabase/client';
import type { TeamType } from '@/types';

export type InviteStatus = 'pending' | 'accepted' | 'cancelled' | 'expired';

export interface FreelancerInvite {
  id: string;
  email: string;
  name?: string | null;
  teamType: TeamType;
  invitedBy?: string | null;
  invitedUserId?: string | null;
  status: InviteStatus;
  inviteUrl?: string | null;
  expiresAt: string;
  acceptedAt?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFreelancerInviteInput {
  email: string;
  name?: string;
  teamType: TeamType;
}

export interface AcceptFreelancerInviteInput {
  name: string;
  password: string;
  phone?: string;
  city?: string;
  state?: string;
}

function mapInviteRow(row: Record<string, unknown>): FreelancerInvite {
  return {
    id: String(row.id),
    email: String(row.email),
    name: row.name == null ? null : String(row.name),
    teamType: (row.team_type as TeamType) || 'iniciante',
    invitedBy: row.invited_by == null ? null : String(row.invited_by),
    invitedUserId: row.invited_user_id == null ? null : String(row.invited_user_id),
    status: (row.status as InviteStatus) || 'pending',
    inviteUrl: row.invite_url == null ? null : String(row.invite_url),
    expiresAt: String(row.expires_at),
    acceptedAt: row.accepted_at == null ? null : String(row.accepted_at),
    cancelledAt: row.cancelled_at == null ? null : String(row.cancelled_at),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function listFreelancerInvites(): Promise<FreelancerInvite[]> {
  await (supabase as any)
    .from('freelancer_invites')
    .update({ status: 'expired' })
    .eq('status', 'pending')
    .lt('expires_at', new Date().toISOString());

  const { data, error } = await (supabase as any)
    .from('freelancer_invites')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(mapInviteRow);
}

export async function createFreelancerInvite(
  input: CreateFreelancerInviteInput
): Promise<FreelancerInvite> {
  const { data, error } = await supabase.functions.invoke('invite-freelancer', {
    body: {
      email: input.email.trim().toLowerCase(),
      name: input.name?.trim() || undefined,
      teamType: input.teamType,
    },
  });

  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(String(data.error));
  if (!data?.invite) throw new Error('Convite não retornado pelo Supabase');

  return mapInviteRow(data.invite as Record<string, unknown>);
}

export async function cancelFreelancerInvite(inviteId: string): Promise<void> {
  const { error } = await (supabase as any)
    .from('freelancer_invites')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    })
    .eq('id', inviteId)
    .eq('status', 'pending');

  if (error) throw new Error(error.message);
}

async function getPendingInviteForCurrentUser(
  userId: string,
  email?: string
): Promise<FreelancerInvite | null> {
  const byUser = await (supabase as any)
    .from('freelancer_invites')
    .select('*')
    .eq('invited_user_id', userId)
    .eq('status', 'pending')
    .maybeSingle();

  if (byUser.error) throw new Error(byUser.error.message);
  if (byUser.data) return mapInviteRow(byUser.data);

  if (!email) return null;

  const byEmail = await (supabase as any)
    .from('freelancer_invites')
    .select('*')
    .ilike('email', email)
    .eq('status', 'pending')
    .maybeSingle();

  if (byEmail.error) throw new Error(byEmail.error.message);
  return byEmail.data ? mapInviteRow(byEmail.data) : null;
}

export async function getCurrentPendingInvite(): Promise<FreelancerInvite | null> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) throw new Error(error.message);
  if (!session?.user) return null;

  return getPendingInviteForCurrentUser(session.user.id, session.user.email || undefined);
}

export async function acceptFreelancerInvite(
  input: AcceptFreelancerInviteInput
): Promise<void> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) throw new Error(sessionError.message);
  if (!session?.user) throw new Error('Link de convite inválido ou expirado');

  const invite = await getPendingInviteForCurrentUser(session.user.id, session.user.email || undefined);
  const teamType = invite?.teamType || 'iniciante';

  const { error: updateAuthError } = await supabase.auth.updateUser({
    password: input.password,
    data: { name: input.name },
  });

  if (updateAuthError) throw new Error(updateAuthError.message);

  const { error: profileError } = await (supabase as any)
    .from('profiles')
    .update({
      name: input.name,
      phone: input.phone || null,
      city: input.city || null,
      state: input.state || null,
      team_type: teamType,
      experience_level: teamType === 'sem_equipe' ? 'iniciante' : teamType,
      is_active: true,
    })
    .eq('user_id', session.user.id);

  if (profileError) throw new Error(profileError.message);

  if (invite) {
    const { error: inviteError } = await (supabase as any)
      .from('freelancer_invites')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        invited_user_id: session.user.id,
      })
      .eq('id', invite.id);

    if (inviteError) throw new Error(inviteError.message);
  }
}
