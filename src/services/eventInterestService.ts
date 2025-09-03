import { buildApiUrl, getAuthHeaders } from '@/config/api';

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
    const response = await fetch(buildApiUrl('/events/:id/confirm-interest', { id: eventId }), {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro na resposta da API:', errorData);
      
      // Tratar erros específicos
      if (response.status === 400 && errorData.error?.includes('já confirmou interesse')) {
        throw new Error('Você já confirmou interesse neste evento');
      }
      
      if (response.status === 403) {
        throw new Error('Acesso negado. Apenas freelancers podem confirmar interesse');
      }
      
      if (response.status === 404) {
        throw new Error('Evento não encontrado');
      }
      
      throw new Error(errorData.error || `Erro ao confirmar interesse no evento (${response.status})`);
    }

    const data = await response.json();
    return data.confirmation;
  } catch (error) {
    console.error('Erro ao confirmar interesse no evento:', error);
    throw error;
  }
};

// Função para verificar se o usuário já confirmou interesse
export const checkEventInterestStatus = async (eventId: string): Promise<EventInterestConfirmation | null> => {
  try {
    const response = await fetch(buildApiUrl('/events/:id/interest-status', { id: eventId }), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      console.error(`Erro ao verificar status de interesse: ${response.status}`);
      // Se for erro de autenticação, retornar null para evitar loops
      if (response.status === 401 || response.status === 403) {
        return null;
      }
      throw new Error(`Erro ao verificar status de interesse: ${response.status}`);
    }

    const data = await response.json();
    
    // Se não há interesse confirmado, retornar null
    if (!data.hasInterest) {
      console.log('ℹ️ Usuário não confirmou interesse ainda');
      return null;
    }
    
    // Se há interesse, retornar a confirmação
    console.log('✅ Status de interesse encontrado:', data.confirmation);
    return data.confirmation;
  } catch (error) {
    console.error('Erro ao verificar status de interesse:', error);
    // Em caso de erro, retornar null para evitar que o botão seja exibido
    return null;
  }
};

// Função para cancelar confirmação de interesse
export const cancelEventInterest = async (eventId: string): Promise<void> => {
  try {
    const response = await fetch(buildApiUrl('/events/:id/cancel-interest', { id: eventId }), {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao cancelar interesse no evento');
    }
  } catch (error) {
    console.error('Erro ao cancelar interesse no evento:', error);
    throw error;
  }
};
