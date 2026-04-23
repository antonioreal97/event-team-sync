import { User, TeamType, ExperienceLevel, AudioVisualRole } from '@/types';
import { apiFetch } from '@/lib/api';
import { mapApiProfileRowToUser } from '@/lib/mapApiProfileToUser';

export const getAllUsers = async (): Promise<User[]> => {
  try {
    const data = await apiFetch<{ users: Record<string, unknown>[] }>('/users');
    return (data.users || []).map(mapApiProfileRowToUser);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return [];
  }
};

export const getUserById = async (id: string): Promise<User | undefined> => {
  try {
    const data = await apiFetch<{ user: Record<string, unknown> }>(`/users/${id}`);
    return data.user ? mapApiProfileRowToUser(data.user) : undefined;
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return undefined;
  }
};

export const getUsersByRole = async (role: string): Promise<User[]> => {
  try {
    const users = await getAllUsers();
    return users.filter((user) => user.role === role);
  } catch (error) {
    console.error('Erro ao buscar usuários por role:', error);
    return [];
  }
};

export const getFreelancers = async (): Promise<User[]> => {
  const users = await getAllUsers();
  return users.filter((user) => user.role === 'freelancer' || user.role === 'lider_freelancer');
};

export const getFreelancersByTeam = async (teamType: TeamType): Promise<User[]> => {
  try {
    const freelancers = await getFreelancers();
    return freelancers.filter((user) => (user.teamType || 'sem_equipe') === teamType);
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
  const data = await apiFetch<{ user: Record<string, unknown> }>('/users', {
    method: 'POST',
    body: JSON.stringify(freelancerData),
  });
  return mapApiProfileRowToUser(data.user);
};

export const updateUser = async (id: string, userData: Partial<User>): Promise<User> => {
  const data = await apiFetch<{ user: Record<string, unknown> }>(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(userData),
  });
  return mapApiProfileRowToUser(data.user);
};

export const updateUserTeam = async (id: string, teamType: TeamType, notes?: string): Promise<void> => {
  await apiFetch(`/users/${id}/team`, {
    method: 'PATCH',
    body: JSON.stringify({ teamType, notes }),
  });
};

export const updateUserStatus = async (id: string, isActive: boolean): Promise<void> => {
  await apiFetch(`/users/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
};

// Compatibilidade: remoção agora significa desativação.
export const deleteUser = async (id: string): Promise<void> => {
  await updateUserStatus(id, false);
};

export const getUserAvailability = async (
  _userId: string,
  _startDate: Date,
  _endDate: Date
): Promise<{
  isAvailable: boolean;
  conflictingEvents: string[];
}> => {
  return {
    isAvailable: true,
    conflictingEvents: [],
  };
};

export const getAvailableUsersForEvent = async (
  _eventId: string,
  requiredRoles: AudioVisualRole[],
  startDate: Date,
  endDate: Date
): Promise<User[]> => {
  try {
    const freelancers = await getFreelancers();
    const availableUsers: User[] = [];

    for (const freelancer of freelancers) {
      if (!freelancer.isActive) continue;

      const hasRequiredRole = requiredRoles.length === 0
        || requiredRoles.some((role) => freelancer.audioVisualRoles?.includes(role));
      if (!hasRequiredRole) continue;

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
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(lowerQuery)
        || user.email.toLowerCase().includes(lowerQuery)
        || user.audioVisualRoles?.some((role) => role.toLowerCase().includes(lowerQuery))
    );
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return [];
  }
};

export const getTeamStatistics = async (): Promise<{
  iniciante: { count: number; users: User[] };
  intermediario: { count: number; users: User[] };
  avancado: { count: number; users: User[] };
  sem_equipe: { count: number; users: User[] };
}> => {
  try {
    const freelancers = await getFreelancers();

    const iniciante = freelancers.filter((user) => user.teamType === 'iniciante');
    const intermediario = freelancers.filter((user) => user.teamType === 'intermediario');
    const avancado = freelancers.filter((user) => user.teamType === 'avancado');
    const sem_equipe = freelancers.filter(
      (user) => !user.teamType || user.teamType === 'sem_equipe'
    );

    return {
      iniciante: { count: iniciante.length, users: iniciante },
      intermediario: { count: intermediario.length, users: intermediario },
      avancado: { count: avancado.length, users: avancado },
      sem_equipe: { count: sem_equipe.length, users: sem_equipe },
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas de equipe:', error);
    return {
      iniciante: { count: 0, users: [] },
      intermediario: { count: 0, users: [] },
      avancado: { count: 0, users: [] },
      sem_equipe: { count: 0, users: [] },
    };
  }
};

export const getAvailableUsersForEventWithPriority = async (
  eventId: string,
  requiredRoles: AudioVisualRole[],
  startDate: Date,
  endDate: Date,
  _teamPriority: 'iniciante' | 'intermediario' | 'avancado'
): Promise<{
  iniciante: User[];
  intermediario: User[];
  avancado: User[];
  sem_equipe: User[];
}> => {
  try {
    const availableUsers = await getAvailableUsersForEvent(
      eventId,
      requiredRoles,
      startDate,
      endDate
    );

    return {
      iniciante: availableUsers.filter((user) => user.teamType === 'iniciante'),
      intermediario: availableUsers.filter((user) => user.teamType === 'intermediario'),
      avancado: availableUsers.filter((user) => user.teamType === 'avancado'),
      sem_equipe: availableUsers.filter(
        (user) => !user.teamType || user.teamType === 'sem_equipe'
      ),
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
