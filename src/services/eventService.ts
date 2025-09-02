
import { Event, TeamAllocation, EquipmentAllocation, User } from '@/types';
import { buildApiUrl, getAuthHeaders } from '@/config/api';
import { transformEventFromBackend } from '@/utils/eventUtils';

// Event service functions - Conectado ao PostgreSQL
export const getAllEvents = async (): Promise<Event[]> => {
  try {
    const response = await fetch(buildApiUrl('/events'), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar eventos: ${response.status}`);
    }

    const data = await response.json();
    // Transforma os dados do backend para o formato do frontend
    return (data.events || []).map(transformEventFromBackend);
  } catch (error) {
    console.error('Erro ao buscar eventos:', error);
    return []; // Retorna array vazio em caso de erro
  }
};

export const getEventById = async (id: string): Promise<Event | undefined> => {
  try {
    const response = await fetch(buildApiUrl('/events/:id', { id }), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar evento: ${response.status}`);
    }

    const data = await response.json();
    // Transforma os dados do backend para o formato do frontend
    return transformEventFromBackend(data.event);
  } catch (error) {
    console.error('Erro ao buscar evento:', error);
    return undefined;
  }
};

export const createEvent = async (eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event> => {
  try {
    const response = await fetch(buildApiUrl('/events'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(eventData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao criar evento');
    }

    const data = await response.json();
    // Transforma os dados do backend para o formato do frontend
    return transformEventFromBackend(data.event);
  } catch (error) {
    console.error('Erro ao criar evento:', error);
    throw error;
  }
};

export const updateEvent = async (id: string, eventData: Partial<Event>): Promise<Event> => {
  try {
    const response = await fetch(buildApiUrl('/events/:id', { id }), {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(eventData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao atualizar evento');
    }

    const data = await response.json();
    // Transforma os dados do backend para o formato do frontend
    return transformEventFromBackend(data.event);
  } catch (error) {
    console.error('Erro ao atualizar evento:', error);
    throw error;
  }
};

export const deleteEvent = async (id: string): Promise<void> => {
  try {
    const response = await fetch(buildApiUrl('/events/:id', { id }), {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao deletar evento');
    }
  } catch (error) {
    console.error('Erro ao deletar evento:', error);
    throw error;
  }
};

// Team allocation functions
export const getTeamAllocationsForEvent = async (eventId: string): Promise<TeamAllocation[]> => {
  try {
    const event = await getEventById(eventId);
    return event?.teamAllocations || [];
  } catch (error) {
    console.error('Erro ao buscar alocações de equipe:', error);
    return [];
  }
};

export const createTeamAllocation = async (allocationData: {
  eventId: string;
  userId: string;
  assignedRole: string;
  dailyRate: number;
  totalDays: number;
  notes?: string;
}): Promise<TeamAllocation> => {
  try {
    const response = await fetch(buildApiUrl('/teams/allocate'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(allocationData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao alocar freelancer');
    }

    const data = await response.json();
    return data.allocation;
  } catch (error) {
    console.error('Erro ao alocar freelancer:', error);
    throw error;
  }
};

export const removeTeamAllocation = async (allocationId: string): Promise<void> => {
  try {
    const response = await fetch(buildApiUrl('/teams/allocate/:allocationId', { allocationId }), {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao remover alocação');
    }
  } catch (error) {
    console.error('Erro ao remover alocação:', error);
    throw error;
  }
};

// Equipment allocation functions
export const getEquipmentAllocationsForEvent = async (eventId: string): Promise<EquipmentAllocation[]> => {
  try {
    const event = await getEventById(eventId);
    return event?.equipmentAllocations || [];
  } catch (error) {
    console.error('Erro ao buscar alocações de equipamento:', error);
    return [];
  }
};

// Event statistics
export const getEventStatistics = async (): Promise<{
  totalEvents: number;
  activeEvents: number;
  completedEvents: number;
  cancelledEvents: number;
}> => {
  try {
    const events = await getAllEvents();
    
    const now = new Date();
    const activeEvents = events.filter(event => 
      new Date(event.startDate) <= now && new Date(event.endDate) >= now
    );
    const completedEvents = events.filter(event => 
      new Date(event.endDate) < now
    );
    const cancelledEvents = events.filter(event => 
      event.status === 'cancelled'
    );

    return {
      totalEvents: events.length,
      activeEvents: activeEvents.length,
      completedEvents: completedEvents.length,
      cancelledEvents: cancelledEvents.length,
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return {
      totalEvents: 0,
      activeEvents: 0,
      completedEvents: 0,
      cancelledEvents: 0,
    };
  }
};

// Search and filter functions
export const searchEvents = async (query: string): Promise<Event[]> => {
  try {
    const events = await getAllEvents();
    const lowerQuery = query.toLowerCase();
    
    return events.filter(event => 
      event.title.toLowerCase().includes(lowerQuery) ||
      event.description?.toLowerCase().includes(lowerQuery) ||
      event.location?.toLowerCase().includes(lowerQuery)
    );
  } catch (error) {
    console.error('Erro ao buscar eventos:', error);
    return [];
  }
};

export const getEventsByStatus = async (status: string): Promise<Event[]> => {
  try {
    const events = await getAllEvents();
    return events.filter(event => event.status === status);
  } catch (error) {
    console.error('Erro ao buscar eventos por status:', error);
    return [];
  }
};

export const getUpcomingEvents = async (days: number = 30): Promise<Event[]> => {
  try {
    const events = await getAllEvents();
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);
    
    return events.filter(event => {
      const eventDate = new Date(event.startDate);
      return eventDate >= now && eventDate <= futureDate;
    }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  } catch (error) {
    console.error('Erro ao buscar eventos futuros:', error);
    return [];
  }
};

export const getUserEvents = async (user: User): Promise<Event[]> => {
  try {
    if (user.role === 'gestor') {
      // Gestores veem todos os eventos
      return await getAllEvents();
    } else {
      // Freelancers veem apenas eventos onde estão alocados
      const response = await fetch(buildApiUrl('/events/user/:userId', { userId: user.id }), {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar eventos do usuário: ${response.status}`);
      }

      const data = await response.json();
      // Transforma os dados do backend para o formato do frontend
      return (data.events || []).map(transformEventFromBackend);
    }
  } catch (error) {
    console.error('Erro ao buscar eventos do usuário:', error);
    return [];
  }
};
