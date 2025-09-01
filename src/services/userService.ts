import { User, TeamType, ExperienceLevel, AudioVisualRole } from '@/types';
import { buildApiUrl, getAuthHeaders } from '@/config/api';

// User service functions - Conectado ao PostgreSQL
export const getAllUsers = async (): Promise<User[]> => {
  try {
    const response = await fetch(buildApiUrl('/users'), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar usuários: ${response.status}`);
    }

    const data = await response.json();
    return data.users || [];
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return [];
  }
};

export const getUserById = async (id: string): Promise<User | undefined> => {
  try {
    const response = await fetch(buildApiUrl('/users/:id', { id }), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar usuário: ${response.status}`);
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return undefined;
  }
};

export const getUsersByRole = async (role: string): Promise<User[]> => {
  try {
    const users = await getAllUsers();
    return users.filter(user => user.role === role);
  } catch (error) {
    console.error('Erro ao buscar usuários por role:', error);
    return [];
  }
};

export const getFreelancers = async (): Promise<User[]> => {
  return getUsersByRole('freelancer');
};

export const getFreelancersByTeam = async (teamType: TeamType): Promise<User[]> => {
  try {
    const freelancers = await getFreelancers();
    return freelancers.filter(user => user.teamType === teamType);
  } catch (error) {
    console.error('Erro ao buscar freelancers por equipe:', error);
    return [];
  }
};

export const createFreelancer = async (freelancerData: {
  name: string;
  email: string;
  password: string;
  teamType: TeamType;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  cpf?: string;
  experienceLevel?: ExperienceLevel;
  audioVisualRoles?: AudioVisualRole[];
  bio?: string;
  portfolio?: string;
  linkedin?: string;
  instagram?: string;
  website?: string;
  previousExperience?: string;
  certifications?: string[];
  equipment?: string[];
  languages?: string[];
}): Promise<User> => {
  try {
    const response = await fetch(buildApiUrl('/users'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(freelancerData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.error?.message || errorData.error || 'Erro ao criar freelancer';
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Erro ao criar freelancer:', error);
    throw error;
  }
};

export const updateUser = async (id: string, userData: Partial<User>): Promise<User> => {
  try {
    const response = await fetch(buildApiUrl('/users/:id', { id }), {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao atualizar usuário');
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    throw error;
  }
};

export const updateUserTeam = async (id: string, teamType: TeamType): Promise<void> => {
  try {
    const response = await fetch(buildApiUrl('/users/:id/team', { id }), {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ teamType }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao atualizar equipe do usuário');
    }
  } catch (error) {
    console.error('Erro ao atualizar equipe do usuário:', error);
    throw error;
  }
};

export const updateUserStatus = async (id: string, isActive: boolean): Promise<void> => {
  try {
    const response = await fetch(buildApiUrl('/users/:id/status', { id }), {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ isActive }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao atualizar status do usuário');
    }
  } catch (error) {
    console.error('Erro ao atualizar status do usuário:', error);
    throw error;
  }
};

export const getUserAvailability = async (userId: string, startDate: Date, endDate: Date): Promise<{
  isAvailable: boolean;
  conflictingEvents: string[];
}> => {
  try {
    // Esta funcionalidade será implementada quando tivermos a rota de disponibilidade
    // Por enquanto, retornamos disponível
    return {
      isAvailable: true,
      conflictingEvents: [],
    };
  } catch (error) {
    console.error('Erro ao verificar disponibilidade:', error);
    return {
      isAvailable: false,
      conflictingEvents: [],
    };
  }
};

export const getAvailableUsersForEvent = async (
  eventId: string,
  requiredRoles: AudioVisualRole[],
  startDate: Date,
  endDate: Date
): Promise<User[]> => {
  try {
    const freelancers = await getFreelancers();
    const availableUsers: User[] = [];

    for (const freelancer of freelancers) {
      if (!freelancer.isActive) continue;

      // Verificar se tem as roles necessárias
      const hasRequiredRole = requiredRoles.some(role => 
        freelancer.audioVisualRoles?.includes(role)
      );

      if (!hasRequiredRole) continue;

      // Verificar disponibilidade
      const availability = await getUserAvailability(freelancer.id, startDate, endDate);
      if (availability.isAvailable) {
        availableUsers.push(freelancer);
      }
    }

    return availableUsers;
  } catch (error) {
    console.error('Erro ao buscar usuários disponíveis:', error);
    return [];
  }
};

export const searchUsers = async (query: string): Promise<User[]> => {
  try {
    const users = await getAllUsers();
    const lowerQuery = query.toLowerCase();
    
    return users.filter(user => 
      user.name.toLowerCase().includes(lowerQuery) ||
      user.email.toLowerCase().includes(lowerQuery) ||
      user.audioVisualRoles?.some(role => role.toLowerCase().includes(lowerQuery))
    );
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return [];
  }
};

// Team management functions
export const getTeamStatistics = async (): Promise<{
  equipe_a: { count: number; users: User[] };
  equipe_b: { count: number; users: User[] };
  sem_equipe: { count: number; users: User[] };
}> => {
  try {
    const freelancers = await getFreelancers();
    
    const equipe_a = freelancers.filter(user => user.teamType === 'equipe_a');
    const equipe_b = freelancers.filter(user => user.teamType === 'equipe_b');
    const sem_equipe = freelancers.filter(user => 
      !user.teamType || user.teamType === 'sem_equipe'
    );

    return {
      equipe_a: { count: equipe_a.length, users: equipe_a },
      equipe_b: { count: equipe_b.length, users: equipe_b },
      sem_equipe: { count: sem_equipe.length, users: sem_equipe },
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas de equipe:', error);
    return {
      equipe_a: { count: 0, users: [] },
      equipe_b: { count: 0, users: [] },
      sem_equipe: { count: 0, users: [] },
    };
  }
};

export const getAvailableUsersForEventWithPriority = async (
  eventId: string,
  requiredRoles: AudioVisualRole[],
  startDate: Date,
  endDate: Date,
  teamPriority: 'equipe_a' | 'equipe_b'
): Promise<{
  equipe_a: User[];
  equipe_b: User[];
  sem_equipe: User[];
}> => {
  try {
    const availableUsers = await getAvailableUsersForEvent(
      eventId,
      requiredRoles,
      startDate,
      endDate
    );

    const equipe_a = availableUsers.filter(user => user.teamType === 'equipe_a');
    const equipe_b = availableUsers.filter(user => user.teamType === 'equipe_b');
    const sem_equipe = availableUsers.filter(user => 
      !user.teamType || user.teamType === 'sem_equipe'
    );

    return { equipe_a, equipe_b, sem_equipe };
  } catch (error) {
    console.error('Erro ao buscar usuários com prioridade:', error);
    return {
      equipe_a: [],
      equipe_b: [],
      sem_equipe: [],
    };
  }
};


