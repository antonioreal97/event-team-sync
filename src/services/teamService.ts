import { TeamAssignment, User, TeamType } from '@/types';
import { buildApiUrl, getAuthHeaders } from '@/config/api';

// Team service functions - Conectado ao PostgreSQL
export const getAllTeamAssignments = async (): Promise<TeamAssignment[]> => {
  try {
    // Esta funcionalidade será implementada quando tivermos a rota específica
    // Por enquanto, retornamos array vazio
    return [];
  } catch (error) {
    console.error('Erro ao buscar atribuições de equipe:', error);
    return [];
  }
};

export const getUsersByTeam = async (teamType: TeamType): Promise<User[]> => {
  try {
    const response = await fetch(buildApiUrl('/teams'), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar usuários da equipe: ${response.status}`);
    }

    const data = await response.json();
    const teams = data.teams || {};
    
    switch (teamType) {
      case 'equipe_a':
        return teams.equipe_a || [];
      case 'equipe_b':
        return teams.equipe_b || [];
      case 'sem_equipe':
        return teams.sem_equipe || [];
      default:
        return [];
    }
  } catch (error) {
    console.error('Erro ao buscar usuários da equipe:', error);
    return [];
  }
};

export const assignUserToTeam = async (userId: string, teamType: TeamType, notes?: string): Promise<void> => {
  try {
    const response = await fetch(buildApiUrl('/users/:id/team', { id: userId }), {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ teamType, notes }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao atribuir usuário à equipe');
    }
  } catch (error) {
    console.error('Erro ao atribuir usuário à equipe:', error);
    throw error;
  }
};

export const removeUserFromTeam = async (userId: string): Promise<void> => {
  try {
    const response = await fetch(buildApiUrl('/users/:id/team', { id: userId }), {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ teamType: 'sem_equipe' }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao remover usuário da equipe');
    }
  } catch (error) {
    console.error('Erro ao remover usuário da equipe:', error);
    throw error;
  }
};

export const getTeamStatistics = async (): Promise<{
  total: number;
  equipe_a: number;
  equipe_b: number;
  sem_equipe: number;
}> => {
  try {
    const response = await fetch(buildApiUrl('/teams'), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar estatísticas de equipe: ${response.status}`);
    }

    const data = await response.json();
    return data.stats || {
      total: 0,
      equipe_a: 0,
      equipe_b: 0,
      sem_equipe: 0,
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas de equipe:', error);
    return {
      total: 0,
      equipe_a: 0,
      equipe_b: 0,
      sem_equipe: 0,
    };
  }
};

export const getAvailableUsersForEventWithPriority = async (
  eventId: string,
  requiredRoles: string[],
  startDate: Date,
  endDate: Date,
  teamPriority: 'equipe_a' | 'equipe_b'
): Promise<{
  equipe_a: User[];
  equipe_b: User[];
  sem_equipe: User[];
}> => {
  try {
    // Esta funcionalidade será implementada quando tivermos a rota específica
    // Por enquanto, retornamos arrays vazios
    return {
      equipe_a: [],
      equipe_b: [],
      sem_equipe: [],
    };
  } catch (error) {
    console.error('Erro ao buscar usuários com prioridade:', error);
    return {
      equipe_a: [],
      equipe_b: [],
      sem_equipe: [],
    };
  }
};

// Team allocation functions
export const allocateUserToEvent = async (allocationData: {
  eventId: string;
  userId: string;
  assignedRole: string;
  dailyRate: number;
  totalDays: number;
  notes?: string;
}): Promise<any> => {
  try {
    const response = await fetch(buildApiUrl('/teams/allocate'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(allocationData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao alocar usuário ao evento');
    }

    const data = await response.json();
    return data.allocation;
  } catch (error) {
    console.error('Erro ao alocar usuário ao evento:', error);
    throw error;
  }
};

export const removeUserFromEvent = async (allocationId: string): Promise<void> => {
  try {
    const response = await fetch(buildApiUrl('/teams/allocate/:allocationId', { allocationId }), {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao remover usuário do evento');
    }
  } catch (error) {
    console.error('Erro ao remover usuário do evento:', error);
    throw error;
  }
};

// Attendance management
export const updateAttendanceStatus = async (
  allocationId: string,
  date: string,
  status: 'present' | 'absent' | 'late',
  notes?: string
): Promise<void> => {
  try {
    const response = await fetch(buildApiUrl('/teams/attendance/:allocationId', { allocationId }), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ date, status, notes }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao atualizar status de presença');
    }
  } catch (error) {
    console.error('Erro ao atualizar status de presença:', error);
    throw error;
  }
};

export const confirmDailyPayment = async (allocationId: string, date: string): Promise<void> => {
  try {
    const response = await fetch(buildApiUrl('/teams/payment/:allocationId/confirm', { allocationId }), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ date }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao confirmar pagamento diário');
    }
  } catch (error) {
    console.error('Erro ao confirmar pagamento diário:', error);
    throw error;
  }
};

// Team performance and analytics
export const getTeamPerformance = async (teamType: TeamType): Promise<{
  totalMembers: number;
  activeMembers: number;
  averageRating: number;
  totalEvents: number;
  totalEarnings: number;
}> => {
  try {
    const users = await getUsersByTeam(teamType);
    
    const activeMembers = users.filter(user => user.isActive).length;
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
  utilizationRate: number;
}> => {
  try {
    const users = await getUsersByTeam(teamType);
    const activeUsers = users.filter(user => user.isActive);
    
    // Por enquanto, assumimos que todos estão disponíveis
    // Esta lógica será implementada quando tivermos sistema de disponibilidade
    const availableMembers = activeUsers.length;
    const busyMembers = 0;
    const utilizationRate = availableMembers > 0 ? (busyMembers / availableMembers) * 100 : 0;
    
    return {
      availableMembers,
      busyMembers,
      utilizationRate: Math.round(utilizationRate * 100) / 100,
    };
  } catch (error) {
    console.error('Erro ao buscar carga de trabalho da equipe:', error);
    return {
      availableMembers: 0,
      busyMembers: 0,
      utilizationRate: 0,
    };
  }
};

export const getActiveFreelancersByTeam = async (): Promise<{
  equipe_a: { total: number; active: number; users: User[] };
  equipe_b: { total: number; active: number; users: User[] };
  sem_equipe: { total: number; active: number; users: User[] };
}> => {
  try {
    const response = await fetch(buildApiUrl('/teams/active-freelancers'), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar freelancers ativos: ${response.status}`);
    }

    const data = await response.json();
    return data || {
      equipe_a: { total: 0, active: 0, users: [] },
      equipe_b: { total: 0, active: 0, users: [] },
      sem_equipe: { total: 0, active: 0, users: [] }
    };
  } catch (error) {
    console.error('Erro ao buscar freelancers ativos:', error);
    return {
      equipe_a: { total: 0, active: 0, users: [] },
      equipe_b: { total: 0, active: 0, users: [] },
      sem_equipe: { total: 0, active: 0, users: [] }
    };
  }
};

export const isEventTeamFullyConfirmed = async (eventId: string): Promise<boolean> => {
  try {
    const response = await fetch(buildApiUrl(`/teams/event/${eventId}/confirmation-status`), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Erro ao verificar status da equipe: ${response.status}`);
    }

    const data = await response.json();
    return data.isFullyConfirmed || false;
  } catch (error) {
    console.error('Erro ao verificar status da equipe:', error);
    return false;
  }
};
