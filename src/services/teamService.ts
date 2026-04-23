import { TeamAssignment, User, TeamType } from '@/types';
import { apiFetch } from '@/lib/api';
import { mapApiProfileRowToUser } from '@/lib/mapApiProfileToUser';
import { mapTeamAssignmentFromApi } from '@/lib/teamDomain';
import { getAllUsers } from '@/services/userService';

export const getAllTeamAssignments = async (): Promise<TeamAssignment[]> => {
  try {
    const data = await apiFetch<{ assignments: Record<string, unknown>[] }>('/teams/assignments');
    return (data.assignments || []).map(mapTeamAssignmentFromApi);
  } catch (error) {
    console.error('Erro ao buscar atribuições de equipe:', error);
    return [];
  }
};

export const getUsersByTeam = async (teamType: TeamType): Promise<User[]> => {
  try {
    const users = await getAllUsers();
    return users.filter((user) => (user.teamType || 'sem_equipe') === teamType);
  } catch (error) {
    console.error('Erro ao buscar usuários da equipe:', error);
    return [];
  }
};

export const assignUserToTeam = async (
  userId: string,
  teamType: TeamType,
  notes?: string
): Promise<void> => {
  await apiFetch(`/users/${userId}/team`, {
    method: 'PATCH',
    body: JSON.stringify({ teamType, notes }),
  });
};

export const removeUserFromTeam = async (userId: string, notes?: string): Promise<void> => {
  await assignUserToTeam(userId, 'sem_equipe', notes);
};

export const getTeamStatistics = async (): Promise<{
  total: number;
  iniciante: number;
  intermediario: number;
  avancado: number;
  sem_equipe: number;
}> => {
  try {
    const data = await apiFetch<{
      stats: {
        total: number;
        iniciante: number;
        intermediario: number;
        avancado: number;
        sem_equipe: number;
      };
    }>('/teams');
    return data.stats;
  } catch (error) {
    console.error('Erro ao buscar estatísticas de equipe:', error);
    return {
      total: 0,
      iniciante: 0,
      intermediario: 0,
      avancado: 0,
      sem_equipe: 0,
    };
  }
};

export const getAvailableUsersForEventWithPriority = async (
  _eventId: string,
  _requiredRoles: string[],
  _startDate: Date,
  _endDate: Date,
  _teamPriority: 'iniciante' | 'intermediario' | 'avancado'
): Promise<{
  iniciante: User[];
  intermediario: User[];
  avancado: User[];
  sem_equipe: User[];
}> => {
  try {
    const buckets = await getActiveFreelancersByTeam();
    return {
      iniciante: buckets.iniciante.users,
      intermediario: buckets.intermediario.users,
      avancado: buckets.avancado.users,
      sem_equipe: buckets.sem_equipe.users,
    };
  } catch (error) {
    console.error('Erro ao buscar usuários com prioridade:', error);
    return {
      iniciante: [],
      intermediario: [],
      avancado: [],
      sem_equipe: [],
    };
  }
};

export const allocateUserToEvent = async (allocationData: {
  eventId: string;
  userId: string;
  assignedRole: string;
  totalDays: number;
  notes?: string;
}): Promise<Record<string, unknown>> => {
  return apiFetch('/teams/allocate', {
    method: 'POST',
    body: JSON.stringify(allocationData),
  });
};

export const removeUserFromEvent = async (allocationId: string): Promise<void> => {
  await apiFetch(`/teams/allocate/${allocationId}`, { method: 'DELETE' });
};

export const updateAttendanceStatus = async (
  allocationId: string,
  date: string,
  status: 'present' | 'absent' | 'late',
  notes?: string
): Promise<void> => {
  await apiFetch(`/teams/attendance/${allocationId}`, {
    method: 'POST',
    body: JSON.stringify({ date, status, notes }),
  });
};

export const confirmDailyPayment = async (allocationId: string, date: string): Promise<void> => {
  await apiFetch(`/teams/payment/${allocationId}/confirm`, {
    method: 'POST',
    body: JSON.stringify({ date }),
  });
};

export const getTeamPerformance = async (teamType: TeamType): Promise<{
  totalMembers: number;
  activeMembers: number;
  averageRating: number;
  totalEvents: number;
  totalEarnings: number;
}> => {
  try {
    const users = await getUsersByTeam(teamType);
    const activeMembers = users.filter((user) => user.isActive).length;
    const totalRating = users.reduce((sum, user) => sum + (user.averageRating || 0), 0);
    const averageRating = users.length > 0 ? totalRating / users.length : 0;

    return {
      totalMembers: users.length,
      activeMembers,
      averageRating: Math.round(averageRating * 100) / 100,
      totalEvents: users.reduce((sum, user) => sum + user.totalEventsAttended, 0),
      totalEarnings: users.reduce((sum, user) => sum + user.totalEarnings, 0),
    };
  } catch (error) {
    console.error('Erro ao buscar performance da equipe:', error);
    return {
      totalMembers: 0,
      activeMembers: 0,
      averageRating: 0,
      totalEvents: 0,
      totalEarnings: 0,
    };
  }
};

export const getTeamWorkload = async (teamType: TeamType): Promise<{
  availableMembers: number;
  busyMembers: number;
  totalCapacity: number;
  utilizationRate: number;
}> => {
  try {
    const users = await getUsersByTeam(teamType);
    const availableMembers = users.filter((user) => user.isActive).length;
    const busyMembers = users.filter((user) => !user.isActive).length;
    const totalCapacity = users.length;
    const utilizationRate = totalCapacity > 0 ? (busyMembers / totalCapacity) * 100 : 0;

    return {
      availableMembers,
      busyMembers,
      totalCapacity,
      utilizationRate: Math.round(utilizationRate * 100) / 100,
    };
  } catch (error) {
    console.error('Erro ao buscar carga de trabalho da equipe:', error);
    return {
      availableMembers: 0,
      busyMembers: 0,
      totalCapacity: 0,
      utilizationRate: 0,
    };
  }
};

export const getActiveFreelancersByTeam = async (): Promise<{
  iniciante: { total: number; active: number; users: User[] };
  intermediario: { total: number; active: number; users: User[] };
  avancado: { total: number; active: number; users: User[] };
  sem_equipe: { total: number; active: number; users: User[] };
}> => {
  try {
    const data = await apiFetch<Record<string, { total: number; active: number; users: Record<string, unknown>[] }>>(
      '/teams/active-freelancers'
    );

    return {
      iniciante: {
        total: data.iniciante?.total || 0,
        active: data.iniciante?.active || 0,
        users: (data.iniciante?.users || []).map(mapApiProfileRowToUser),
      },
      intermediario: {
        total: data.intermediario?.total || 0,
        active: data.intermediario?.active || 0,
        users: (data.intermediario?.users || []).map(mapApiProfileRowToUser),
      },
      avancado: {
        total: data.avancado?.total || 0,
        active: data.avancado?.active || 0,
        users: (data.avancado?.users || []).map(mapApiProfileRowToUser),
      },
      sem_equipe: {
        total: data.sem_equipe?.total || 0,
        active: data.sem_equipe?.active || 0,
        users: (data.sem_equipe?.users || []).map(mapApiProfileRowToUser),
      },
    };
  } catch (error) {
    console.error('Erro ao buscar freelancers ativos:', error);
    return {
      iniciante: { total: 0, active: 0, users: [] },
      intermediario: { total: 0, active: 0, users: [] },
      avancado: { total: 0, active: 0, users: [] },
      sem_equipe: { total: 0, active: 0, users: [] },
    };
  }
};

export const isEventTeamFullyConfirmed = async (eventId: string): Promise<boolean> => {
  try {
    const data = await apiFetch<{ isFullyConfirmed: boolean }>(
      `/teams/event/${eventId}/confirmation-status`
    );
    return Boolean(data.isFullyConfirmed);
  } catch (error) {
    console.error('Erro ao verificar confirmação da equipe:', error);
    return false;
  }
};
