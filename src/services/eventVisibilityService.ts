import { Event, User, EventForFreelancer, TeamType } from '@/types';
import { supabase } from '@/integrations/supabase/client';

// Helper function to get daily rate based on user's experience level
const getUserDailyRate = (teamType: TeamType | undefined, event: Event): number => {
  if (!teamType || teamType === 'sem_equipe') {
    return event.dailyRateIniciante;
  }
  
  switch (teamType) {
    case 'iniciante':
      return event.dailyRateIniciante;
    case 'intermediario':
      return event.dailyRateIntermediario;
    case 'avancado':
      return event.dailyRateAvancado;
    default:
      return event.dailyRateIniciante;
  }
};

// Event visibility service functions - Conectado ao PostgreSQL
export const filterEventForUser = async (event: Event, user: User): Promise<EventForFreelancer | null> => {
  try {
    // Se for gestor, pode ver todos os detalhes
    if (user.role === 'gestor') {
      return null; // Retorna null para indicar que o evento completo deve ser mostrado
    }

    // Se for freelancer, filtra as informações
    if (user.role === 'freelancer') {
      // Verificar se o usuário está alocado para este evento
      const isAllocated = await checkUserAllocation(event.id, user.id);
      
      if (!isAllocated) {
        return null; // Usuário não pode ver este evento
      }

      // Retornar versão filtrada do evento
      return {
        id: event.id,
        title: event.title,
        description: event.description,
        location: event.location,
        startDate: event.startDate,
        endDate: event.endDate,
        status: event.status,
        eventType: event.eventType,
        estimatedDuration: event.estimatedDuration,
        requirements: event.requirements,
        userTeamType: user.teamType || 'sem_equipe',
        userDailyRate: getUserDailyRate(user.teamType, event),
        totalDays: event.totalDays,
        isMultiDay: event.isMultiDay,
        workingDays: event.workingDays,
      };
    }

    return null;
  } catch (error) {
    console.error('Erro ao filtrar evento para usuário:', error);
    return null;
  }
};

export const filterEventsListForUser = async (events: Event[], user: User): Promise<EventForFreelancer[]> => {
  try {
    if (user.role === 'gestor') {
      // Gestor vê todos os eventos
      return [];
    }

    if (user.role === 'freelancer') {
      const filteredEvents: EventForFreelancer[] = [];
      
      for (const event of events) {
        const isAllocated = await checkUserAllocation(event.id, user.id);
        
        if (isAllocated) {
          filteredEvents.push({
            id: event.id,
            title: event.title,
            description: event.description,
            location: event.location,
            startDate: event.startDate,
            endDate: event.endDate,
            status: event.status,
            eventType: event.eventType,
            estimatedDuration: event.estimatedDuration,
            requirements: event.requirements,
            userTeamType: user.teamType || 'sem_equipe',
            userDailyRate: user.teamType === 'equipe_a' ? event.dailyRateTeamA : event.dailyRateTeamB,
            totalDays: event.totalDays,
            isMultiDay: event.isMultiDay,
            workingDays: event.workingDays,
          });
        }
      }
      
      return filteredEvents;
    }

    return [];
  } catch (error) {
    console.error('Erro ao filtrar lista de eventos para usuário:', error);
    return [];
  }
};

export const getEventDisplayInfo = async (event: Event, user: User): Promise<{
  canSeeFullDetails: boolean;
  canSeeTeamInfo: boolean;
  canSeeBudget: boolean;
  canSeeOtherTeams: boolean;
}> => {
  try {
    if (user.role === 'gestor') {
      return {
        canSeeFullDetails: true,
        canSeeTeamInfo: true,
        canSeeBudget: true,
        canSeeOtherTeams: true,
      };
    }

    if (user.role === 'freelancer') {
      const isAllocated = await checkUserAllocation(event.id, user.id);
      
      return {
        canSeeFullDetails: isAllocated,
        canSeeTeamInfo: false, // Freelancers não veem informações de equipe
        canSeeBudget: false, // Freelancers não veem orçamento
        canSeeOtherTeams: false, // Freelancers não veem outras equipes
      };
    }

    return {
      canSeeFullDetails: false,
      canSeeTeamInfo: false,
      canSeeBudget: false,
      canSeeOtherTeams: false,
    };
  } catch (error) {
    console.error('Erro ao obter informações de exibição do evento:', error);
    return {
      canSeeFullDetails: false,
      canSeeTeamInfo: false,
      canSeeBudget: false,
      canSeeOtherTeams: false,
    };
  }
};

export const getEventDescription = async (event: Event, user: User): Promise<string> => {
  try {
    if (user.role === 'gestor') {
      return event.description;
    }

    if (user.role === 'freelancer') {
      const isAllocated = await checkUserAllocation(event.id, user.id);
      
      if (isAllocated) {
        // Retornar descrição sem informações sensíveis
        return event.description.replace(/equipe\s+[ab]/gi, 'equipe')
                               .replace(/prioridade\s+[ab]/gi, '')
                               .replace(/orçamento.*?reais/gi, '')
                               .trim();
      }
    }

    return 'Descrição não disponível';
  } catch (error) {
    console.error('Erro ao obter descrição do evento:', error);
    return 'Descrição não disponível';
  }
};

export const canUserSeeEventDetails = async (eventId: string, user: User): Promise<boolean> => {
  try {
    if (user.role === 'gestor') {
      return true;
    }

    if (user.role === 'freelancer') {
      return await checkUserAllocation(eventId, user.id);
    }

    return false;
  } catch (error) {
    console.error('Erro ao verificar permissão de visualização:', error);
    return false;
  }
};

// Helper function to check if user is allocated to an event
const checkUserAllocation = async (eventId: string, userId: string): Promise<boolean> => {
  try {
    // Esta funcionalidade será implementada quando tivermos a rota específica
    // Por enquanto, retornamos false para freelancers não verem eventos
    return false;
  } catch (error) {
    console.error('Erro ao verificar alocação do usuário:', error);
    return false;
  }
};

// Event access control functions
export const canUserEditEvent = async (eventId: string, user: User): Promise<boolean> => {
  try {
    if (user.role === 'gestor') {
      return true;
    }

    if (user.role === 'freelancer') {
      // Freelancers não podem editar eventos
      return false;
    }

    return false;
  } catch (error) {
    console.error('Erro ao verificar permissão de edição:', error);
    return false;
  }
};

export const canUserDeleteEvent = async (eventId: string, user: User): Promise<boolean> => {
  try {
    if (user.role === 'gestor') {
      return true;
    }

    if (user.role === 'freelancer') {
      // Freelancers não podem deletar eventos
      return false;
    }

    return false;
  } catch (error) {
    console.error('Erro ao verificar permissão de exclusão:', error);
    return false;
  }
};

export const canUserAllocateTeam = async (eventId: string, user: User): Promise<boolean> => {
  try {
    if (user.role === 'gestor') {
      return true;
    }

    if (user.role === 'freelancer') {
      // Freelancers não podem alocar equipes
      return false;
    }

    return false;
  } catch (error) {
    console.error('Erro ao verificar permissão de alocação:', error);
    return false;
  }
};

// Event visibility rules
export const getEventVisibilityRules = (): {
  gestor: string[];
  freelancer: string[];
} => {
  return {
    gestor: [
      'Todos os detalhes do evento',
      'Informações de equipe e prioridades',
      'Orçamento e custos',
      'Lista completa de alocações',
      'Relatórios financeiros',
    ],
    freelancer: [
      'Apenas eventos alocados',
      'Informações básicas do evento',
      'Suas próprias alocações',
      'Horários e localização',
      'Sem acesso a dados de equipe',
    ],
  };
};
