import { Event, TeamAllocation } from '@/types';
import { apiFetch } from '@/lib/api';
import { transformEventFromBackend } from '@/utils/eventUtils';
import { apiAllocateUser } from '@/services/teamAllocationApiService';

function mapApiAllocationToTeamAllocation(row: Record<string, unknown>): TeamAllocation {
  return {
    id: String(row.id),
    eventId: String(row.event_id),
    userId: String(row.user_id),
    assignedRole: row.assigned_role as TeamAllocation['assignedRole'],
    status: (row.status as TeamAllocation['status']) || 'pending',
    assignedAt: String(row.assigned_at ?? row.created_at ?? new Date().toISOString()),
    confirmedAt: row.confirmed_at != null ? String(row.confirmed_at) : undefined,
    cancelledAt: row.cancelled_at != null ? String(row.cancelled_at) : undefined,
    cancellationReason:
      row.cancellation_reason != null ? String(row.cancellation_reason) : undefined,
    dailyRate: Number(row.daily_rate ?? 0),
    totalDays: Number(row.total_days ?? 0),
    totalPayment: Number(row.total_payment ?? 0),
    totalHours: Number(row.total_hours ?? 0),
    attendance: Array.isArray(row.attendance) ? (row.attendance as TeamAllocation['attendance']) : [],
    attended: Boolean(row.attended),
    cancellationDeadline: String(row.cancellation_deadline ?? ''),
    confirmationDeadline: String(row.confirmation_deadline ?? ''),
    notes: row.notes != null ? String(row.notes) : undefined,
  };
}

export const getAllEvents = async (): Promise<Event[]> => {
  const data = await apiFetch<{ events: Record<string, unknown>[] }>('/events');
  return (data.events || []).map(transformEventFromBackend);
};

export const getEventById = async (id: string): Promise<Event | null> => {
  try {
    const data = await apiFetch<{ event: Record<string, unknown> }>(`/events/${id}`);
    return data.event ? transformEventFromBackend(data.event) : null;
  } catch (error) {
    console.error('Erro ao buscar evento:', error);
    return null;
  }
};

export const createEvent = async (
  eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Event> => {
  const data = await apiFetch<{ event: Record<string, unknown> }>('/events', {
    method: 'POST',
    body: JSON.stringify(eventData),
  });
  return transformEventFromBackend(data.event);
};

export const updateEvent = async (id: string, eventData: Partial<Event>): Promise<Event> => {
  const data = await apiFetch<{ event: Record<string, unknown> }>(`/events/${id}`, {
    method: 'PUT',
    body: JSON.stringify(eventData),
  });
  return transformEventFromBackend(data.event);
};

export const deleteEvent = async (id: string): Promise<void> => {
  await apiFetch(`/events/${id}`, { method: 'DELETE' });
};

export const getEventStatistics = async (): Promise<{
  totalEvents: number;
  activeEvents: number;
  completedEvents: number;
  cancelledEvents: number;
}> => {
  try {
    const events = await getAllEvents();
    const now = new Date();
    const activeEvents = events.filter(
      (event) => new Date(event.startDate) <= now && new Date(event.endDate) >= now
    );
    const completedEvents = events.filter((event) => new Date(event.endDate) < now);
    const cancelledEvents = events.filter((event) => event.status === 'cancelled');

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

export const searchEvents = async (query: string): Promise<Event[]> => {
  try {
    const events = await getAllEvents();
    const lowerQuery = query.toLowerCase();
    return events.filter(
      (event) =>
        event.title.toLowerCase().includes(lowerQuery)
        || event.description?.toLowerCase().includes(lowerQuery)
        || event.location?.toLowerCase().includes(lowerQuery)
    );
  } catch (error) {
    console.error('Erro ao buscar eventos:', error);
    return [];
  }
};

export const getEventsByStatus = async (status: string): Promise<Event[]> => {
  try {
    const events = await getAllEvents();
    return events.filter((event) => event.status === status);
  } catch (error) {
    console.error('Erro ao buscar eventos por status:', error);
    return [];
  }
};

export const getTeamAllocationsForEvent = async (eventId: string): Promise<TeamAllocation[]> => {
  try {
    const data = await apiFetch<{ allocations: Record<string, unknown>[] }>(
      `/teams/event/${eventId}/allocations`
    );
    return (data.allocations || []).map(mapApiAllocationToTeamAllocation);
  } catch (error) {
    console.error('Erro ao buscar alocações de equipe:', error);
    return [];
  }
};

export const createTeamAllocation = async (allocationData: {
  eventId: string;
  userId: string;
  assignedRole: string;
  totalDays: number;
  notes?: string;
}): Promise<{ allocation: Record<string, unknown> }> => {
  return apiAllocateUser(allocationData);
};

export const getUserEvents = async (_user: unknown): Promise<Event[]> => {
  try {
    return await getAllEvents();
  } catch (error) {
    console.error('Erro ao buscar eventos do usuário:', error);
    return [];
  }
};

export const getEventsWithInterests = async (): Promise<Event[]> => {
  try {
    const events = await getAllEvents();
    return events.filter((event) => event.status === 'planning');
  } catch (error) {
    console.error('Erro ao buscar eventos em planejamento:', error);
    return [];
  }
};

export const getEventInterests = async (_eventId: string): Promise<never[]> => {
  return [];
};

export const getUpcomingEvents = async (days = 30): Promise<Event[]> => {
  try {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);

    const events = await getAllEvents();
    return events.filter((event) => {
      const start = new Date(event.startDate);
      return start >= now && start <= futureDate;
    });
  } catch (error) {
    console.error('Erro ao buscar eventos futuros:', error);
    return [];
  }
};

export const updateEventStatus = async (eventId: string, status: string): Promise<Event> => {
  const data = await apiFetch<{ event: Record<string, unknown> }>(`/events/${eventId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return transformEventFromBackend(data.event);
};

export const cancelEvent = async (eventId: string, _cancelReason?: string): Promise<void> => {
  await updateEventStatus(eventId, 'cancelled');
};
