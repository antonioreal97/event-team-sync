import { EquipmentCategory } from '@/types';

const API_BASE = '/api/equipment/categories';

export const getAllEquipmentCategories = async (): Promise<EquipmentCategory[]> => {
  const response = await fetch(API_BASE, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Erro ao buscar categorias de equipamentos');
  }

  const data = await response.json();
  return data.categories;
};

export const getEquipmentCategoryById = async (id: string): Promise<EquipmentCategory> => {
  const response = await fetch(`${API_BASE}/${id}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Erro ao buscar categoria de equipamento');
  }

  const data = await response.json();
  return data.category;
};

export const createEquipmentCategory = async (categoryData: Omit<EquipmentCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<EquipmentCategory> => {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(categoryData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Erro ao criar categoria de equipamento');
  }

  const data = await response.json();
  return data.category;
};

export const updateEquipmentCategory = async (id: string, categoryData: Partial<Omit<EquipmentCategory, 'id' | 'createdAt' | 'updatedAt'>>): Promise<EquipmentCategory> => {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(categoryData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Erro ao atualizar categoria de equipamento');
  }

  const data = await response.json();
  return data.category;
};

export const deleteEquipmentCategory = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Erro ao deletar categoria de equipamento');
  }
};

