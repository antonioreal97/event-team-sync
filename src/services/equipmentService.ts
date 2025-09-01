
import { Equipment, EquipmentAllocation } from '@/types';
import { buildApiUrl, getAuthHeaders } from '@/config/api';

// Equipment service functions - Conectado ao PostgreSQL
export const getAllEquipment = async (): Promise<Equipment[]> => {
  try {
    const response = await fetch(buildApiUrl('/equipment'), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar equipamentos: ${response.status}`);
    }

    const data = await response.json();
    return data.equipments || [];
  } catch (error) {
    console.error('Erro ao buscar equipamentos:', error);
    return [];
  }
};

export const getEquipmentById = async (id: string): Promise<Equipment | undefined> => {
  try {
    const response = await fetch(buildApiUrl('/equipment/:id', { id }), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar equipamento: ${response.status}`);
    }

    const data = await response.json();
    return data.equipment;
  } catch (error) {
    console.error('Erro ao buscar equipamento:', error);
    return undefined;
  }
};

export const createEquipment = async (equipmentData: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Equipment> => {
  try {
    const response = await fetch(buildApiUrl('/equipment'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(equipmentData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao criar equipamento');
    }

    const data = await response.json();
    return data.equipment;
  } catch (error) {
    console.error('Erro ao criar equipamento:', error);
    throw error;
  }
};

export const updateEquipment = async (id: string, equipmentData: Partial<Equipment>): Promise<Equipment> => {
  try {
    const response = await fetch(buildApiUrl('/equipment/:id', { id }), {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(equipmentData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao atualizar equipamento');
    }

    const data = await response.json();
    return data.equipment;
  } catch (error) {
    console.error('Erro ao atualizar equipamento:', error);
    throw error;
  }
};

export const deleteEquipment = async (id: string): Promise<void> => {
  try {
    const response = await fetch(buildApiUrl('/equipment/:id', { id }), {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao deletar equipamento');
    }
  } catch (error) {
    console.error('Erro ao deletar equipamento:', error);
    throw error;
  }
};

// Equipment allocation functions
export const getEquipmentAllocationsForEvent = async (eventId: string): Promise<EquipmentAllocation[]> => {
  try {
    // Esta funcionalidade será implementada quando tivermos a rota específica
    // Por enquanto, retornamos array vazio
    return [];
  } catch (error) {
    console.error('Erro ao buscar alocações de equipamento:', error);
    return [];
  }
};

export const allocateEquipmentToEvent = async (allocationData: {
  eventId: string;
  equipmentId: string;
  quantity: number;
  startDate: string;
  endDate: string;
  notes?: string;
}): Promise<EquipmentAllocation> => {
  try {
    // Esta funcionalidade será implementada quando tivermos a rota específica
    // Por enquanto, retornamos um objeto vazio
    return {} as EquipmentAllocation;
  } catch (error) {
    console.error('Erro ao alocar equipamento ao evento:', error);
    throw error;
  }
};

export const removeEquipmentFromEvent = async (allocationId: string): Promise<void> => {
  try {
    // Esta funcionalidade será implementada quando tivermos a rota específica
  } catch (error) {
    console.error('Erro ao remover equipamento do evento:', error);
    throw error;
  }
};

// Equipment search and filter functions
export const searchEquipment = async (query: string): Promise<Equipment[]> => {
  try {
    const equipment = await getAllEquipment();
    const lowerQuery = query.toLowerCase();
    
    return equipment.filter(item => 
      item.name.toLowerCase().includes(lowerQuery) ||
      item.description?.toLowerCase().includes(lowerQuery) ||
      item.category?.toLowerCase().includes(lowerQuery)
    );
  } catch (error) {
    console.error('Erro ao buscar equipamentos:', error);
    return [];
  }
};

export const getEquipmentByCategory = async (category: string): Promise<Equipment[]> => {
  try {
    const equipment = await getAllEquipment();
    return equipment.filter(item => item.category === category);
  } catch (error) {
    console.error('Erro ao buscar equipamentos por categoria:', error);
    return [];
  }
};

export const getEquipmentByCondition = async (condition: string): Promise<Equipment[]> => {
  try {
    const equipment = await getAllEquipment();
    return equipment.filter(item => item.condition === condition);
  } catch (error) {
    console.error('Erro ao buscar equipamentos por condição:', error);
    return [];
  }
};

// Equipment statistics
export const getEquipmentStatistics = async (): Promise<{
  totalEquipment: number;
  availableEquipment: number;
  allocatedEquipment: number;
  byCategory: Record<string, number>;
  byCondition: Record<string, number>;
}> => {
  try {
    const equipment = await getAllEquipment();
    
    const byCategory: Record<string, number> = {};
    const byCondition: Record<string, number> = {};
    
    equipment.forEach(item => {
      byCategory[item.category || 'Sem categoria'] = (byCategory[item.category || 'Sem categoria'] || 0) + 1;
      byCondition[item.condition || 'Sem condição'] = (byCondition[item.condition || 'Sem condição'] || 0) + 1;
    });

    return {
      totalEquipment: equipment.length,
      availableEquipment: equipment.length, // Por enquanto, assumimos que todos estão disponíveis
      allocatedEquipment: 0, // Será implementado quando tivermos sistema de alocação
      byCategory,
      byCondition,
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas de equipamento:', error);
    return {
      totalEquipment: 0,
      availableEquipment: 0,
      allocatedEquipment: 0,
      byCategory: {},
      byCondition: {},
    };
  }
};

// Equipment maintenance tracking
export const getEquipmentNeedingMaintenance = async (daysThreshold: number = 30): Promise<Equipment[]> => {
  try {
    const equipment = await getAllEquipment();
    const now = new Date();
    const thresholdDate = new Date();
    thresholdDate.setDate(now.getDate() - daysThreshold);
    
    return equipment.filter(item => {
      if (!item.lastMaintenance) return true;
      const lastMaintenance = new Date(item.lastMaintenance);
      return lastMaintenance < thresholdDate;
    });
  } catch (error) {
    console.error('Erro ao buscar equipamentos que precisam de manutenção:', error);
    return [];
  }
};

export const updateEquipmentMaintenance = async (id: string, maintenanceDate: Date): Promise<void> => {
  try {
    await updateEquipment(id, { lastMaintenance: maintenanceDate.toISOString().split('T')[0] });
  } catch (error) {
    console.error('Erro ao atualizar data de manutenção:', error);
    throw error;
  }
};
