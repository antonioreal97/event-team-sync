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
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        freelancer_profile:freelancer_profiles!inner(*)
      `)
      .eq('role', 'freelancer')
      .eq('freelancer_profiles.team_type', teamType);

    if (error) {
      throw new Error(`Erro ao buscar usuários da equipe: ${error.message}`);
    }

    return (data || []).map(mapSupabaseUserToUser);
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
  equipe_a: number;
  equipe_b: number;
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
      equipe_a: data?.filter(u => (u.freelancer_profile as any)?.team_type === 'equipe_a').length || 0,
      equipe_b: data?.filter(u => (u.freelancer_profile as any)?.team_type === 'equipe_b').length || 0,
      sem_equipe: data?.filter(u => (u.freelancer_profile as any)?.team_type === 'sem_equipe' || !(u.freelancer_profile as any)?.team_type).length || 0,
    };

    return stats;
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
  equipe_a: { total: number; active: number; users: User[] };
  equipe_b: { total: number; active: number; users: User[] };
  sem_equipe: { total: number; active: number; users: User[] };
}> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        freelancer_profile:freelancer_profiles(*)
      `)
      .eq('role', 'freelancer');

    if (error) {
      throw new Error(`Erro ao buscar freelancers ativos: ${error.message}`);
    }

    const mappedUsers = (data || []).map(user => {
      const freelancerProfile = user.freelancer_profile?.[0];
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as 'gestor' | 'freelancer',
        avatar: user.avatar,
        isActive: user.is_active,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        teamType: freelancerProfile?.team_type as 'equipe_a' | 'equipe_b' | 'sem_equipe' | undefined,
        phone: freelancerProfile?.phone,
        address: freelancerProfile?.address,
        city: freelancerProfile?.city,
        state: freelancerProfile?.state,
        cpf: freelancerProfile?.cpf,
        hourlyRate: freelancerProfile?.hourly_rate,
        dailyRate: freelancerProfile?.daily_rate,
        experienceLevel: (freelancerProfile?.experience_level as 'iniciante' | 'intermediario' | 'avancado' | 'expert') || 'iniciante',
        audioVisualRoles: (freelancerProfile?.audio_visual_roles as ('camera' | 'audio' | 'lighting' | 'director' | 'producer' | 'assistant' | 'technician' | 'streaming' | 'editing')[]) || [],
        bio: freelancerProfile?.bio,
        portfolio: freelancerProfile?.portfolio,
        linkedin: freelancerProfile?.linkedin,
        instagram: freelancerProfile?.instagram,
        website: freelancerProfile?.website,
        previousExperience: freelancerProfile?.previous_experience,
        certifications: freelancerProfile?.certifications || [],
        equipment: freelancerProfile?.equipment || [],
        languages: freelancerProfile?.languages || [],
        totalEventsAttended: freelancerProfile?.total_events_attended || 0,
        totalEarnings: freelancerProfile?.total_earnings || 0,
        averageRating: freelancerProfile?.average_rating,
      };
    });

    const equipe_a_users = mappedUsers.filter(u => u.teamType === 'equipe_a');
    const equipe_b_users = mappedUsers.filter(u => u.teamType === 'equipe_b');
    const sem_equipe_users = mappedUsers.filter(u => u.teamType === 'sem_equipe' || !u.teamType);

    return {
      equipe_a: { 
        total: equipe_a_users.length, 
        active: equipe_a_users.filter(u => u.isActive).length, 
        users: equipe_a_users 
      },
      equipe_b: { 
        total: equipe_b_users.length, 
        active: equipe_b_users.filter(u => u.isActive).length, 
        users: equipe_b_users 
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
      equipe_a: { total: 0, active: 0, users: [] },
      equipe_b: { total: 0, active: 0, users: [] },
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
