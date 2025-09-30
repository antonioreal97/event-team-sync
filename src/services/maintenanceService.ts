import { MaintenanceOrder } from '@/types';

const API_BASE = '/api/maintenance';

export const getAllMaintenanceOrders = async (filters?: {
  status?: string;
  equipmentItemId?: string;
}): Promise<MaintenanceOrder[]> => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.equipmentItemId) params.append('equipmentItemId', filters.equipmentItemId);

  const url = `${API_BASE}${params.toString() ? `?${params.toString()}` : ''}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Erro ao buscar ordens de manutenção');
  }

  const data = await response.json();
  return data.orders;
};

export const getMaintenanceOrderById = async (id: string): Promise<MaintenanceOrder> => {
  const response = await fetch(`${API_BASE}/${id}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Erro ao buscar ordem de manutenção');
  }

  const data = await response.json();
  return data.order;
};

export const createMaintenanceOrder = async (orderData: {
  equipmentItemId: string;
  eventId?: string;
  requestedAction: 'maintenance' | 'replace';
  notes?: string;
}): Promise<MaintenanceOrder> => {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Erro ao criar ordem de manutenção');
  }

  const data = await response.json();
  return data.order;
};

export const updateMaintenanceOrder = async (id: string, orderData: {
  status: 'open' | 'in_progress' | 'completed' | 'discarded';
  notes?: string;
}): Promise<MaintenanceOrder> => {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Erro ao atualizar ordem de manutenção');
  }

  const data = await response.json();
  return data.order;
};

export const deleteMaintenanceOrder = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Erro ao deletar ordem de manutenção');
  }
};

export const getMaintenanceStats = async (): Promise<{
  orders: {
    totalOrders: number;
    openOrders: number;
    inProgressOrders: number;
    completedOrders: number;
    discardedOrders: number;
    maintenanceOrders: number;
    replaceOrders: number;
  };
  itemsInMaintenance: number;
}> => {
  const response = await fetch(`${API_BASE}/stats/overview`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Erro ao buscar estatísticas de manutenção');
  }

  const data = await response.json();
  return data;
};

