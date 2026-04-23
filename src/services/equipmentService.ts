import { Equipment, EquipmentAllocation } from '@/types';
import { supabase } from '@/integrations/supabase/client';

function mapEquipmentRow(row: any): Equipment {
  return {
    id: row.id,
    name: row.name,
    totalQuantity: row.total_quantity,
    description: row.description,
    categoryId: row.category_id,
    categoryName: row.category_name || row.equipment_categories?.name,
    categoryDescription: row.equipment_categories?.description,
    hourlyRate: row.hourly_rate,
    dailyRate: row.daily_rate,
    condition: row.condition,
    location: row.location,
    lastMaintenance: row.last_maintenance,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function equipmentToDb(data: any): any {
  return {
    name: data.name,
    total_quantity: data.totalQuantity ?? 1,
    description: data.description,
    category_id: data.categoryId || null,
    hourly_rate: data.hourlyRate,
    daily_rate: data.dailyRate,
    condition: data.condition || 'good',
    location: data.location,
    last_maintenance: data.lastMaintenance,
  };
}

export const getAllEquipments = async (): Promise<Equipment[]> => {
  const { data, error } = await supabase
    .from('equipment')
    .select('*, equipment_categories(name, description)');
  if (error) throw new Error(error.message);
  return (data || []).map(mapEquipmentRow);
};

export const getEquipmentById = async (id: string): Promise<Equipment> => {
  const { data, error } = await supabase
    .from('equipment')
    .select('*, equipment_categories(name, description)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Equipamento não encontrado');
  return mapEquipmentRow(data);
};

export const createEquipment = async (
  equipmentData: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt' | 'categoryName' | 'categoryDescription'>
): Promise<Equipment> => {
  const { data, error } = await (supabase as any)
    .from('equipment')
    .insert(equipmentToDb(equipmentData))
    .select('*, equipment_categories(name, description)')
    .maybeSingle();
  if (error) throw new Error(error.message);
  return mapEquipmentRow(data);
};

export const updateEquipment = async (
  id: string,
  equipmentData: Partial<Omit<Equipment, 'id' | 'createdAt' | 'updatedAt' | 'categoryName' | 'categoryDescription'>>
): Promise<Equipment> => {
  const { data, error } = await (supabase as any)
    .from('equipment')
    .update(equipmentToDb(equipmentData))
    .eq('id', id)
    .select('*, equipment_categories(name, description)')
    .maybeSingle();
  if (error) throw new Error(error.message);
  return mapEquipmentRow(data);
};

export const deleteEquipment = async (id: string): Promise<void> => {
  const { error } = await supabase.from('equipment').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

export const getEventEquipmentAllocations = async (_eventId: string): Promise<EquipmentAllocation[]> => {
  return [];
};

export const createEquipmentAllocation = async (_data: Omit<EquipmentAllocation, 'id'>): Promise<EquipmentAllocation> => {
  throw new Error('Use o novo sistema de reservas de equipamentos');
};

export const updateEquipmentAllocation = async (_id: string, _data: Partial<EquipmentAllocation>): Promise<EquipmentAllocation> => {
  throw new Error('Use o novo sistema de reservas de equipamentos');
};

export const deleteEquipmentAllocation = async (_id: string): Promise<void> => {
  throw new Error('Use o novo sistema de reservas de equipamentos');
};

export const checkEquipmentAvailability = async (
  _equipmentId: string,
  _startDate: string,
  _endDate: string,
  _excludeEventId?: string
): Promise<number> => {
  return 0;
};
