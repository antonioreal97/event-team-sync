import { EquipmentItem } from '@/types';

const API_BASE = '/api/equipment/items';

export const getAllEquipmentItems = async (filters?: {
  categoryId?: string;
  status?: string;
  equipmentId?: string;
}): Promise<EquipmentItem[]> => {
  const params = new URLSearchParams();
  if (filters?.categoryId) params.append('categoryId', filters.categoryId);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.equipmentId) params.append('equipmentId', filters.equipmentId);

  const url = `${API_BASE}${params.toString() ? `?${params.toString()}` : ''}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Erro ao buscar itens de equipamento');
  }

  const data = await response.json();
  return data.items;
};

export const getEquipmentItemById = async (id: string): Promise<EquipmentItem> => {
  const response = await fetch(`${API_BASE}/${id}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Erro ao buscar item de equipamento');
  }

  const data = await response.json();
  return data.item;
};

export const getEquipmentItemByAssetTag = async (assetTag: string): Promise<EquipmentItem> => {
  const response = await fetch(`${API_BASE}/by-tag/${assetTag}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Erro ao buscar item de equipamento');
  }

  const data = await response.json();
  return data.item;
};

export const getAvailableEquipmentItems = async (filters: {
  startDate: string;
  endDate: string;
  categoryId?: string;
}): Promise<EquipmentItem[]> => {
  const params = new URLSearchParams();
  params.append('startDate', filters.startDate);
  params.append('endDate', filters.endDate);
  if (filters.categoryId) params.append('categoryId', filters.categoryId);

  const response = await fetch(`${API_BASE}/available?${params.toString()}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Erro ao buscar itens disponíveis');
  }

  const data = await response.json();
  return data.items;
};

export const createEquipmentItem = async (itemData: Omit<EquipmentItem, 'id' | 'createdAt' | 'updatedAt' | 'equipmentName' | 'equipmentDescription' | 'categoryName' | 'isAvailable'>): Promise<EquipmentItem> => {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(itemData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Erro ao criar item de equipamento');
  }

  const data = await response.json();
  return data.item;
};

export const updateEquipmentItem = async (id: string, itemData: Partial<Omit<EquipmentItem, 'id' | 'createdAt' | 'updatedAt' | 'equipmentName' | 'equipmentDescription' | 'categoryName' | 'isAvailable'>>): Promise<EquipmentItem> => {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(itemData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Erro ao atualizar item de equipamento');
  }

  const data = await response.json();
  return data.item;
};

export const deleteEquipmentItem = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Erro ao deletar item de equipamento');
  }
};

