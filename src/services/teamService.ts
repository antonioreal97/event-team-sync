import { TeamAssignment, User, TeamType } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { mapSupabaseUserToUser } from '@/utils/userMapper';

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
    let query = supabase
      .from('users')
      .select(`
        *,
        freelancer_profile:freelancer_profiles(*)
      `)
      .eq('role', 'freelancer');

    // Para usuários sem equipe, precisamos incluir aqueles que não têm perfil ou têm team_type null/undefined
    if (teamType === 'sem_equipe') {
      const { data, error } = await query;
      
      if (error) {
        throw new Error(`Erro ao buscar usuários sem equipe: ${error.message}`);
      }

      // Filtrar usuários que não têm perfil ou têm team_type null/undefined/sem_equipe
      const filteredData = (data || []).filter(user => {
        const freelancerProfile = user.freelancer_profile?.[0];
        return !freelancerProfile || 
               !freelancerProfile.team_type || 
               freelancerProfile.team_type === 'sem_equipe';
      });

      return filteredData.map(mapSupabaseUserToUser);
    } else {
      // Para outras equipes, usar inner join
      const { data, error } = await query
        .eq('freelancer_profiles.team_type', teamType);

      if (error) {
        throw new Error(`Erro ao buscar usuários da equipe: ${error.message}`);
      }

      return (data || []).map(mapSupabaseUserToUser);
    }
  } catch (error) {
    console.error('Erro ao buscar usuários da equipe:', error);
    return [];
  }
};

export const assignUserToTeam = async (userId: string, teamType: TeamType, notes?: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('freelancer_profiles')
      .update({ team_type: teamType })
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Erro ao atribuir usuário à equipe: ${error.message}`);
    }
  } catch (error) {
    console.error('Erro ao atribuir usuário à equipe:', error);
    throw error;
  }
};

export const removeUserFromTeam = async (userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('freelancer_profiles')
      .update({ team_type: 'sem_equipe' })
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Erro ao remover usuário da equipe: ${error.message}`);
    }
  } catch (error) {
    console.error('Erro ao remover usuário da equipe:', error);
    throw error;
  }
};

export const getTeamStatistics = async (): Promise<{
  total: number;
  iniciante: number;
  intermediario: number;
  avancado: number;
  sem_equipe: number;
}> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        freelancer_profile:freelancer_profiles(team_type)
      `)
      .eq('role', 'freelancer');

    if (error) {
      throw new Error(`Erro ao buscar estatísticas de equipe: ${error.message}`);
    }

    const stats = {
      total: data?.length || 0,
      iniciante: data?.filter(u => (u.freelancer_profile as any)?.team_type === 'iniciante').length || 0,
      intermediario: data?.filter(u => (u.freelancer_profile as any)?.team_type === 'intermediario').length || 0,
      avancado: data?.filter(u => (u.freelancer_profile as any)?.team_type === 'avancado').length || 0,
      sem_equipe: data?.filter(u => (u.freelancer_profile as any)?.team_type === 'sem_equipe' || !(u.freelancer_profile as any)?.team_type).length || 0,
    };

    return stats;
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
  eventId: string,
  requiredRoles: string[],
  startDate: Date,
  endDate: Date,
  teamPriority: 'iniciante' | 'intermediario' | 'avancado'
): Promise<{
  iniciante: User[];
  intermediario: User[];
  avancado: User[];
  sem_equipe: User[];
}> => {
  try {
    // Esta funcionalidade será implementada quando tivermos a rota específica
    // Por enquanto, retornamos arrays vazios
    return {
      iniciante: [],
      intermediario: [],
      avancado: [],
      sem_equipe: [],
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

// Team allocation functions
export const allocateUserToEvent = async (allocationData: {
  eventId: string;
  userId: string;
  assignedRole: string;
  totalDays: number;
  notes?: string;
}): Promise<any> => {
  try {
    // Esta funcionalidade será implementada quando tivermos as tabelas de alocação no Supabase
    // Por enquanto, retornamos dados mock
    return {
      id: Date.now().toString(),
      ...allocationData,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Erro ao alocar usuário ao evento:', error);
    throw error;
  }
};

export const removeUserFromEvent = async (allocationId: string): Promise<void> => {
  try {
    // Esta funcionalidade será implementada quando tivermos as tabelas de alocação no Supabase
    console.log('Removendo usuário do evento:', allocationId);
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
    // Esta funcionalidade será implementada quando tivermos as tabelas de presença no Supabase
    console.log('Atualizando status de presença:', { allocationId, date, status, notes });
  } catch (error) {
    console.error('Erro ao atualizar status de presença:', error);
    throw error;
  }
};

export const confirmDailyPayment = async (allocationId: string, date: string): Promise<void> => {
  try {
    // Esta funcionalidade será implementada quando tivermos as tabelas de pagamento no Supabase
    console.log('Confirmando pagamento diário:', { allocationId, date });
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
  iniciante: { total: number; active: number; users: User[] };
  intermediario: { total: number; active: number; users: User[] };
  avancado: { total: number; active: number; users: User[] };
  sem_equipe: { total: number; active: number; users: User[] };
}> => {
  try {
    // Usar as funções getUsersByTeam para garantir consistência
    const [iniciante_users, intermediario_users, avancado_users, sem_equipe_users] = await Promise.all([
      getUsersByTeam('iniciante'),
      getUsersByTeam('intermediario'),
      getUsersByTeam('avancado'),
      getUsersByTeam('sem_equipe')
    ]);

    return {
      iniciante: { 
        total: iniciante_users.length, 
        active: iniciante_users.filter(u => u.isActive).length, 
        users: iniciante_users 
      },
      intermediario: { 
        total: intermediario_users.length, 
        active: intermediario_users.filter(u => u.isActive).length, 
        users: intermediario_users 
      },
      avancado: { 
        total: avancado_users.length, 
        active: avancado_users.filter(u => u.isActive).length, 
        users: avancado_users 
      },
      sem_equipe: { 
        total: sem_equipe_users.length, 
        active: sem_equipe_users.filter(u => u.isActive).length, 
        users: sem_equipe_users 
      }
    };
  } catch (error) {
    console.error('Erro ao buscar freelancers ativos:', error);
    return {
      iniciante: { total: 0, active: 0, users: [] },
      intermediario: { total: 0, active: 0, users: [] },
      avancado: { total: 0, active: 0, users: [] },
      sem_equipe: { total: 0, active: 0, users: [] }
    };
  }
};

export const isEventTeamFullyConfirmed = async (eventId: string): Promise<boolean> => {
  try {
    // Esta funcionalidade será implementada quando tivermos as tabelas de confirmação no Supabase
    return false;
  } catch (error) {
    console.error('Erro ao verificar status da equipe:', error);
    return false;
  }
};
