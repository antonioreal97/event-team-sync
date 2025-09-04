import { User, TeamType, ExperienceLevel, AudioVisualRole } from '@/types';
import { supabase } from '@/integrations/supabase/client';

// User service functions - Conectado ao Supabase
export const getAllUsers = async (): Promise<User[]> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        freelancer_profile:freelancer_profiles(*)
      `)
      .eq('role', 'freelancer');

    if (error) {
      throw new Error(`Erro ao buscar usuários: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return [];
  }
};

export const getUserById = async (id: string): Promise<User | undefined> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        freelancer_profile:freelancer_profiles(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Erro ao buscar usuário: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return undefined;
  }
};

export const getUsersByRole = async (role: string): Promise<User[]> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        freelancer_profile:freelancer_profiles(*)
      `)
      .eq('role', role);

    if (error) {
      throw new Error(`Erro ao buscar usuários por role: ${error.message}`);
    }

    return data || [];
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
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        freelancer_profile:freelancer_profiles!inner(*)
      `)
      .eq('role', 'freelancer')
      .eq('freelancer_profiles.team_type', teamType);

    if (error) {
      throw new Error(`Erro ao buscar freelancers por equipe: ${error.message}`);
    }

    return data || [];
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
    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: freelancerData.email,
      password: freelancerData.password,
    });

    if (authError) {
      throw new Error(`Erro na autenticação: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error('Falha ao criar usuário');
    }

    // Criar registro na tabela users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: freelancerData.email,
        name: freelancerData.name,
        role: 'freelancer',
        password_hash: 'managed_by_supabase_auth',
        is_active: true,
      })
      .select()
      .single();

    if (userError) {
      throw new Error(`Erro ao criar usuário: ${userError.message}`);
    }

    // Criar perfil de freelancer
    const { error: profileError } = await supabase
      .from('freelancer_profiles')
      .insert({
        user_id: authData.user.id,
        team_type: freelancerData.teamType,
        phone: freelancerData.phone,
        address: freelancerData.address,
        city: freelancerData.city,
        state: freelancerData.state,
        cpf: freelancerData.cpf,
        experience_level: freelancerData.experienceLevel,
        audio_visual_roles: freelancerData.audioVisualRoles,
        bio: freelancerData.bio,
        portfolio: freelancerData.portfolio,
        linkedin: freelancerData.linkedin,
        instagram: freelancerData.instagram,
        website: freelancerData.website,
        previous_experience: freelancerData.previousExperience,
        certifications: freelancerData.certifications,
        equipment: freelancerData.equipment,
        languages: freelancerData.languages,
      });

    if (profileError) {
      throw new Error(`Erro ao criar perfil: ${profileError.message}`);
    }

    return userData;
  } catch (error) {
    console.error('Erro ao criar freelancer:', error);
    throw error;
  }
};

export const updateUser = async (id: string, userData: Partial<User>): Promise<User> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(userData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao atualizar usuário: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    throw error;
  }
};

export const updateUserTeam = async (id: string, teamType: TeamType): Promise<void> => {
  try {
    const { error } = await supabase
      .from('freelancer_profiles')
      .update({ team_type: teamType })
      .eq('user_id', id);

    if (error) {
      throw new Error(`Erro ao atualizar equipe do usuário: ${error.message}`);
    }
  } catch (error) {
    console.error('Erro ao atualizar equipe do usuário:', error);
    throw error;
  }
};

export const updateUserStatus = async (id: string, isActive: boolean): Promise<void> => {
  try {
    const { error } = await supabase
      .from('users')
      .update({ is_active: isActive })
      .eq('id', id);

    if (error) {
      throw new Error(`Erro ao atualizar status do usuário: ${error.message}`);
    }
  } catch (error) {
    console.error('Erro ao atualizar status do usuário:', error);
    throw error;
  }
};

export const deleteUser = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Erro ao excluir usuário: ${error.message}`);
    }
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
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


