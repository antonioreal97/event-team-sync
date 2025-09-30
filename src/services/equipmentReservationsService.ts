import { EquipmentItemReservation } from '@/types';

const API_BASE = '/api/equipment/reservations';

export const getEventEquipmentReservations = async (eventId: string): Promise<{
  event: any;
  reservations: EquipmentItemReservation[];
}> => {
  const response = await fetch(`${API_BASE}/events/${eventId}/equipment`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Erro ao buscar reservas de equipamentos do evento');
  }

  const data = await response.json();
  return data;
};

export const createEquipmentReservations = async (eventId: string, itemIds: string[]): Promise<EquipmentItemReservation[]> => {
  const response = await fetch(`${API_BASE}/events/${eventId}/equipment/reservations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ itemIds }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Erro ao criar reservas de equipamentos');
  }

  const data = await response.json();
  return data.reservations;
};

export const checkoutEquipmentItem = async (eventId: string, data: {
  assetTag?: string;
  reservationId?: string;
  conditionOut?: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
}): Promise<EquipmentItemReservation> => {
  const response = await fetch(`${API_BASE}/events/${eventId}/equipment/checkout`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Erro ao fazer checkout do equipamento');
  }

  const result = await response.json();
  return result.reservation;
};

export const checkinEquipmentItem = async (eventId: string, data: {
  assetTag?: string;
  reservationId?: string;
  conditionIn: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
  postEventStatus: 'ok' | 'maintenance' | 'replace' | 'lost' | 'damaged';
  notes?: string;
}): Promise<{
  reservation: EquipmentItemReservation;
  maintenanceOrderId?: string;
}> => {
  const response = await fetch(`${API_BASE}/events/${eventId}/equipment/checkin`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Erro ao fazer checkin do equipamento');
  }

  const result = await response.json();
  return result;
};

export const resolveAssetTag = async (assetTag: string, eventId?: string): Promise<{
  item: any;
  activeReservation?: EquipmentItemReservation;
}> => {
  const response = await fetch(`${API_BASE}/equipment/scan/resolve`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ assetTag, eventId }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Erro ao resolver etiqueta de patrimônio');
  }

  const data = await response.json();
  return data;
};

export const cancelEquipmentReservation = async (eventId: string, reservationId: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/events/${eventId}/equipment/reservations/${reservationId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Erro ao cancelar reserva de equipamento');
  }
};

