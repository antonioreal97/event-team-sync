
import { Equipment, EquipmentAllocation } from '@/types';

const API_BASE = '/api/equipment';

// Equipment service functions
export const getAllEquipments = async (): Promise<Equipment[]> => {
  const response = await fetch(API_BASE, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Erro ao buscar equipamentos');
  }

  const data = await response.json();
  return data.equipments;
};

export const getEquipmentById = async (id: string): Promise<Equipment> => {
  const response = await fetch(`${API_BASE}/${id}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Erro ao buscar equipamento');
  }

  const data = await response.json();
  return data.equipment;
};

export const createEquipment = async (equipmentData: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt' | 'categoryName' | 'categoryDescription'>): Promise<Equipment> => {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(equipmentData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Erro ao criar equipamento');
  }

  const data = await response.json();
  return data.equipment;
};

export const updateEquipment = async (id: string, equipmentData: Partial<Omit<Equipment, 'id' | 'createdAt' | 'updatedAt' | 'categoryName' | 'categoryDescription'>>): Promise<Equipment> => {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(equipmentData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Erro ao atualizar equipamento');
  }

  const data = await response.json();
  return data.equipment;
};

export const deleteEquipment = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Erro ao deletar equipamento');
  }
};

// Manter compatibilidade com sistema antigo
export const getEventEquipmentAllocations = async (eventId: string): Promise<EquipmentAllocation[]> => {
  // Esta função agora deve usar o novo sistema de reservas
  // Por enquanto, retornar array vazio para não quebrar o código existente
  return [];
};

export const createEquipmentAllocation = async (allocationData: Omit<EquipmentAllocation, 'id'>): Promise<EquipmentAllocation> => {
  // Esta função agora deve usar o novo sistema de reservas
  throw new Error('Use o novo sistema de reservas de equipamentos');
};

export const updateEquipmentAllocation = async (id: string, allocationData: Partial<EquipmentAllocation>): Promise<EquipmentAllocation> => {
  // Esta função agora deve usar o novo sistema de reservas
  throw new Error('Use o novo sistema de reservas de equipamentos');
};

export const deleteEquipmentAllocation = async (id: string): Promise<void> => {
  // Esta função agora deve usar o novo sistema de reservas
  throw new Error('Use o novo sistema de reservas de equipamentos');
};

// Check equipment availability
export const checkEquipmentAvailability = async (equipmentId: string, startDate: string, endDate: string, excludeEventId?: string): Promise<number> => {
  // Esta função agora deve usar o novo sistema de itens individuais
  // Por enquanto, retornar 0 para não quebrar o código existente
  return 0;
};
