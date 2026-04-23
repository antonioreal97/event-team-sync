import { supabase as supabaseTyped } from '@/integrations/supabase/client';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase: any = supabaseTyped;

// Interface para confirmação de interesse
export interface EventInterestConfirmation {
  id: string;
  eventId: string;
  userId: string;
  status: 'pending' | 'confirmed' | 'rejected';
  confirmedAt?: string;
  rejectedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Função para confirmar interesse em um evento
export const confirmEventInterest = async (eventId: string): Promise<EventInterestConfirmation> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Verificar se já existe interesse para este evento e usuário
    const { data: existingInterest, error: checkError } = await supabase
      .from('event_interests')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existingInterest) {
      throw new Error('Você já confirmou interesse neste evento');
    }

    // Criar novo interesse
    const { data, error } = await supabase
      .from('event_interests')
      .insert({
        event_id: eventId,
        user_id: user.id,
        status: 'interested'
      })
      .select()
      .single();

    if (error) throw error;

    // Buscar informações do evento para notificação
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('title, created_by')
      .eq('id', eventId)
      .single();

    if (eventError) throw eventError;

    // Buscar informações do usuário
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('name')
      .eq('id', user.id)
      .single();

    if (userError) throw userError;

    // Criar notificação para o gestor do evento
    if (event.created_by) {
      await supabase
        .from('notifications')
        .insert({
          user_id: event.created_by,
          title: 'Novo Interesse em Evento',
          message: `${userData.name} demonstrou interesse no evento "${event.title}".`,
          type: 'update',
          related_event_id: eventId,
          is_read: false
        });
    }

    return mapDatabaseInterestToInterest(data);
  } catch (error) {
    console.error('Erro ao confirmar interesse no evento:', error);
    throw error;
  }
};

// Função para verificar se o usuário já confirmou interesse
export const checkEventInterestStatus = async (eventId: string): Promise<EventInterestConfirmation | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('event_interests')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;

    return data ? mapDatabaseInterestToInterest(data) : null;
  } catch (error) {
    console.error('Erro ao verificar status de interesse:', error);
    return null;
  }
};

// Função para cancelar confirmação de interesse
export const cancelEventInterest = async (eventId: string): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Verificar se o usuário está alocado para este evento
    const { data: allocation, error: allocError } = await supabase
      .from('team_allocations')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (allocError) throw allocError;

    if (allocation) {
      throw new Error('Não é possível cancelar interesse. Você já está alocado para este evento.');
    }

    // Remover interesse
    const { error } = await supabase
      .from('event_interests')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', user.id);

    if (error) throw error;
  } catch (error) {
    console.error('Erro ao cancelar interesse no evento:', error);
    throw error;
  }
};

// Mapper function
const mapDatabaseInterestToInterest = (dbInterest: any): EventInterestConfirmation => {
  return {
    id: dbInterest.id,
    eventId: dbInterest.event_id,
    userId: dbInterest.user_id,
    status: dbInterest.status || 'pending',
    confirmedAt: dbInterest.created_at,
    rejectedAt: null,
    notes: '',
    createdAt: dbInterest.created_at,
    updatedAt: dbInterest.updated_at,
  };
};
