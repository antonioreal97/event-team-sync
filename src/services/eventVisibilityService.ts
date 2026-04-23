import { Event, User, EventForFreelancer, TeamType } from '@/types';

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

export const filterEventForUser = async (
  event: Event,
  user: User
): Promise<EventForFreelancer | null> => {
  try {
    if (user.role === 'gestor') {
      return null;
    }

    if (user.role === 'freelancer' || user.role === 'lider_freelancer') {
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

export const filterEventsListForUser = async (
  events: Event[],
  user: User
): Promise<EventForFreelancer[]> => {
  try {
    if (user.role === 'gestor') {
      return [];
    }

    const filteredEvents: EventForFreelancer[] = [];
    for (const event of events) {
      const filtered = await filterEventForUser(event, user);
      if (filtered) filteredEvents.push(filtered);
    }
    return filteredEvents;
  } catch (error) {
    console.error('Erro ao filtrar lista de eventos para usuário:', error);
    return [];
  }
};

export const getEventDisplayInfo = async (_event: Event, user: User): Promise<{
  canSeeFullDetails: boolean;
  canSeeTeamInfo: boolean;
  canSeeBudget: boolean;
  canSeeOtherTeams: boolean;
}> => {
  if (user.role === 'gestor') {
    return {
      canSeeFullDetails: true,
      canSeeTeamInfo: true,
      canSeeBudget: true,
      canSeeOtherTeams: true,
    };
  }

  if (user.role === 'freelancer' || user.role === 'lider_freelancer') {
    return {
      canSeeFullDetails: true,
      canSeeTeamInfo: false,
      canSeeBudget: false,
      canSeeOtherTeams: false,
    };
  }

  return {
    canSeeFullDetails: false,
    canSeeTeamInfo: false,
    canSeeBudget: false,
    canSeeOtherTeams: false,
  };
};

export const getEventDescription = async (event: Event, user: User): Promise<string> => {
  if (user.role === 'gestor') {
    return event.description;
  }

  if (user.role === 'freelancer' || user.role === 'lider_freelancer') {
    return event.description
      .replace(/equipe\s+[ab]/gi, 'equipe')
      .replace(/prioridade\s+[ab]/gi, '')
      .trim();
  }

  return 'Descrição não disponível';
};

export const canUserSeeEventDetails = async (_eventId: string, user: User): Promise<boolean> => {
  return user.role === 'gestor' || user.role === 'freelancer' || user.role === 'lider_freelancer';
};

export const canUserEditEvent = async (_eventId: string, user: User): Promise<boolean> => {
  return user.role === 'gestor';
};
