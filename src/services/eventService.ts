import { Event } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { getAllNotifications, createNotification } from '@/services/notificationService';

// Event service functions - Conectado ao Supabase
export const getAllEvents = async (): Promise<Event[]> => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(mapDatabaseEventToEvent);
  } catch (error) {
    console.error('Erro ao buscar eventos:', error);
    return [];
  }
};

export const getEventById = async (id: string): Promise<Event | null> => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return data ? mapDatabaseEventToEvent(data) : null;
  } catch (error) {
    console.error('Erro ao buscar evento:', error);
    return null;
  }
};

export const createEvent = async (eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event> => {
  try {
    const { data, error } = await supabase
      .from('events')
      .insert({
        title: eventData.title,
        description: eventData.description,
        location: eventData.location,
        start_date: eventData.startDate,
        end_date: eventData.endDate,
        status: eventData.status,
        created_by: eventData.createdBy,
        event_type: eventData.eventType,
        estimated_duration: eventData.estimatedDuration,
        budget: eventData.budget,
        requirements: eventData.requirements,
        notes: eventData.notes,
        team_priority: eventData.teamPriority,
        allow_team_b: eventData.allowTeamB,
        daily_rate_team_a: eventData.dailyRateTeamA,
        daily_rate_team_b: eventData.dailyRateTeamB,
        is_multi_day: eventData.isMultiDay,
        total_days: eventData.totalDays,
        working_days: eventData.workingDays,
      })
      .select()
      .single();

    if (error) throw error;

    return mapDatabaseEventToEvent(data);
  } catch (error) {
    console.error('Erro ao criar evento:', error);
    throw error;
  }
};

export const updateEvent = async (id: string, eventData: Partial<Event>): Promise<Event> => {
  try {
    const updateData: any = {};
    
    // Map frontend fields to database fields
    if (eventData.title !== undefined) updateData.title = eventData.title;
    if (eventData.description !== undefined) updateData.description = eventData.description;
    if (eventData.location !== undefined) updateData.location = eventData.location;
    if (eventData.startDate !== undefined) updateData.start_date = eventData.startDate;
    if (eventData.endDate !== undefined) updateData.end_date = eventData.endDate;
    if (eventData.status !== undefined) updateData.status = eventData.status;
    if (eventData.eventType !== undefined) updateData.event_type = eventData.eventType;
    if (eventData.estimatedDuration !== undefined) updateData.estimated_duration = eventData.estimatedDuration;
    if (eventData.budget !== undefined) updateData.budget = eventData.budget;
    if (eventData.requirements !== undefined) updateData.requirements = eventData.requirements;
    if (eventData.notes !== undefined) updateData.notes = eventData.notes;
    if (eventData.teamPriority !== undefined) updateData.team_priority = eventData.teamPriority;
    if (eventData.allowTeamB !== undefined) updateData.allow_team_b = eventData.allowTeamB;
    if (eventData.dailyRateTeamA !== undefined) updateData.daily_rate_team_a = eventData.dailyRateTeamA;
    if (eventData.dailyRateTeamB !== undefined) updateData.daily_rate_team_b = eventData.dailyRateTeamB;
    if (eventData.isMultiDay !== undefined) updateData.is_multi_day = eventData.isMultiDay;
    if (eventData.totalDays !== undefined) updateData.total_days = eventData.totalDays;
    if (eventData.workingDays !== undefined) updateData.working_days = eventData.workingDays;

    const { data, error } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return mapDatabaseEventToEvent(data);
  } catch (error) {
    console.error('Erro ao atualizar evento:', error);
    throw error;
  }
};

export const deleteEvent = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Erro ao deletar evento:', error);
    throw error;
  }
};

// Helper function to map database event to frontend Event type
function mapDatabaseEventToEvent(dbEvent: any): Event {
  return {
    id: dbEvent.id,
    title: dbEvent.title,
    description: dbEvent.description,
    location: dbEvent.location,
    startDate: dbEvent.start_date,
    endDate: dbEvent.end_date,
    status: dbEvent.status,
    createdBy: dbEvent.created_by,
    createdAt: dbEvent.created_at,
    updatedAt: dbEvent.updated_at,
    eventType: dbEvent.event_type,
    estimatedDuration: dbEvent.estimated_duration,
    budget: dbEvent.budget,
    requirements: dbEvent.requirements || [],
    notes: dbEvent.notes,
    teamPriority: dbEvent.team_priority,
    allowTeamB: dbEvent.allow_team_b,
    dailyRateTeamA: dbEvent.daily_rate_team_a,
    dailyRateTeamB: dbEvent.daily_rate_team_b,
    isMultiDay: dbEvent.is_multi_day,
    totalDays: dbEvent.total_days,
    workingDays: dbEvent.working_days || [],
    teamAllocations: [],
    equipmentAllocations: []
  };
}

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
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(mapDatabaseEventToEvent);
  } catch (error) {
    console.error('Erro ao buscar eventos por status:', error);
    return [];
  }
};

// Team allocation functions (placeholder implementations)
export const getTeamAllocationsForEvent = async (eventId: string): Promise<any[]> => {
  try {
    // This will be implemented when we add team allocation tables
    return [];
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
}): Promise<any> => {
  try {
    // This will be implemented when we add team allocation tables
    console.log('createTeamAllocation called with:', allocationData);
    return {
      id: Date.now().toString(),
      ...allocationData,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Erro ao alocar freelancer:', error);
    throw error;
  }
};

// User events
export const getUserEvents = async (user: any): Promise<Event[]> => {
  try {
    if (user.role === 'gestor') {
      // Gestores veem todos os eventos
      return await getAllEvents();
    } else {
      // Freelancers veem apenas eventos onde estão alocados
      // This will be properly implemented when we add team allocation tables
      return await getAllEvents();
    }
  } catch (error) {
    console.error('Erro ao buscar eventos do usuário:', error);
    return [];
  }
};

// Events with interests
export const getEventsWithInterests = async (): Promise<Event[]> => {
  try {
    // This will be implemented when we add event interest functionality
    return await getAllEvents();
  } catch (error) {
    console.error('Erro ao buscar eventos com interesses:', error);
    return [];
  }
};

export const getEventInterests = async (eventId: string): Promise<any[]> => {
  try {
    // This will be implemented when we add event interest functionality
    return [];
  } catch (error) {
    console.error('Erro ao buscar interesses do evento:', error);
    return [];
  }
};

export const getUpcomingEvents = async (days: number = 30): Promise<Event[]> => {
  try {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);
    
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .gte('start_date', now.toISOString())
      .lte('start_date', futureDate.toISOString())
      .order('start_date', { ascending: true });

    if (error) throw error;

    return (data || []).map(mapDatabaseEventToEvent);
  } catch (error) {
    console.error('Erro ao buscar eventos futuros:', error);
    return [];
  }
};

// Update event status
export const updateEventStatus = async (eventId: string, status: string): Promise<Event> => {
  try {
    const { data, error } = await supabase
      .from('events')
      .update({ status })
      .eq('id', eventId)
      .select()
      .single();

    if (error) throw error;

    return mapDatabaseEventToEvent(data);
  } catch (error) {
    console.error('Erro ao atualizar status do evento:', error);
    throw error;
  }
};

// Cancelar evento e notificar interessados
export const cancelEvent = async (eventId: string, cancelReason?: string): Promise<void> => {
  try {
    // 1. Atualizar status do evento para cancelado
    const { error: updateError } = await supabase
      .from('events')
      .update({ status: 'cancelled' })
      .eq('id', eventId);

    if (updateError) throw updateError;

    // 2. Buscar evento para obter informações
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('title, start_date')
      .eq('id', eventId)
      .single();

    if (eventError) throw eventError;

    // 3. Buscar usuários que demonstraram interesse no evento
    const { data: interests, error: interestsError } = await supabase
      .from('event_interests')
      .select('user_id')
      .eq('event_id', eventId)
      .eq('status', 'interested');

    if (interestsError) throw interestsError;

    // 4. Criar notificações para todos os interessados
    const interestedUserIds = interests?.map(interest => interest.user_id) || [];
    
    for (const userId of interestedUserIds) {
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title: 'Evento Cancelado',
          message: `O evento "${event.title}" que você demonstrou interesse foi cancelado.${cancelReason ? ` Motivo: ${cancelReason}` : ''}`,
          type: 'update',
          related_event_id: eventId,
          is_read: false
        });

      if (notificationError) {
        console.error('Erro ao criar notificação para usuário:', userId, notificationError);
      }
    }

    // 5. Criar notificação para o administrador (usuário atual)
    const { error: adminNotificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        title: 'Evento Cancelado por Você',
        message: `Você cancelou o evento "${event.title}". ${interestedUserIds.length} pessoas foram notificadas.`,
        type: 'update',
        related_event_id: eventId,
        is_read: false
      });

    if (adminNotificationError) {
      console.error('Erro ao criar notificação para administrador:', adminNotificationError);
    }

  } catch (error) {
    console.error('Erro ao cancelar evento:', error);
    throw error;
  }
};