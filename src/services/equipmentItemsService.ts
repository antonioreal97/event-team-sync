import { EquipmentItem } from '@/types';
import { supabase } from '@/integrations/supabase/client';

function mapRow(row: any): EquipmentItem {
  return {
    id: row.id,
    equipmentId: row.equipment_id,
    assetTag: row.asset_tag,
    serialNumber: row.serial_number,
    condition: row.condition,
    status: row.status,
    location: row.location,
    notes: row.notes,
    lastMaintenance: row.last_maintenance,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    equipmentName: row.equipment?.name,
    equipmentDescription: row.equipment?.description,
    categoryName: row.equipment?.equipment_categories?.name,
    isAvailable: row.status === 'in_service',
  };
}

function toDb(data: any) {
  return {
    equipment_id: data.equipmentId,
    asset_tag: data.assetTag,
    serial_number: data.serialNumber,
    condition: data.condition || 'good',
    status: data.status || 'in_service',
    location: data.location,
    notes: data.notes,
    last_maintenance: data.lastMaintenance,
  };
}

export const getAllEquipmentItems = async (filters?: {
  categoryId?: string;
  status?: string;
  equipmentId?: string;
}): Promise<EquipmentItem[]> => {
  let q = supabase.from('equipment_items').select('*, equipment(name, description, equipment_categories(name, id))');
  if (filters?.equipmentId) q = q.eq('equipment_id', filters.equipmentId);
  if (filters?.status) q = q.eq('status', filters.status as any);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  let items = (data || []).map(mapRow);
  if (filters?.categoryId) {
    items = items.filter((i: any) => (data?.find((d: any) => d.id === i.id) as any)?.equipment?.equipment_categories?.id === filters.categoryId);
  }
  return items;
};

export const getEquipmentItemById = async (id: string): Promise<EquipmentItem> => {
  const { data, error } = await supabase
    .from('equipment_items')
    .select('*, equipment(name, description, equipment_categories(name))')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Item não encontrado');
  return mapRow(data);
};

export const getEquipmentItemByAssetTag = async (assetTag: string): Promise<EquipmentItem> => {
  const { data, error } = await supabase
    .from('equipment_items')
    .select('*, equipment(name, description, equipment_categories(name))')
    .eq('asset_tag', assetTag)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Item não encontrado');
  return mapRow(data);
};

export const getAvailableEquipmentItems = async (filters: {
  startDate: string;
  endDate: string;
  categoryId?: string;
}): Promise<EquipmentItem[]> => {
  return getAllEquipmentItems({ status: 'in_service', categoryId: filters.categoryId });
};

export const createEquipmentItem = async (
  itemData: Omit<EquipmentItem, 'id' | 'createdAt' | 'updatedAt' | 'equipmentName' | 'equipmentDescription' | 'categoryName' | 'isAvailable'>
): Promise<EquipmentItem> => {
  const { data, error } = await (supabase as any)
    .from('equipment_items')
    .insert(toDb(itemData))
    .select('*, equipment(name, description, equipment_categories(name))')
    .maybeSingle();
  if (error) throw new Error(error.message);
  return mapRow(data);
};

export const updateEquipmentItem = async (
  id: string,
  itemData: Partial<Omit<EquipmentItem, 'id' | 'createdAt' | 'updatedAt' | 'equipmentName' | 'equipmentDescription' | 'categoryName' | 'isAvailable'>>
): Promise<EquipmentItem> => {
  const { data, error } = await (supabase as any)
    .from('equipment_items')
    .update(toDb(itemData))
    .eq('id', id)
    .select('*, equipment(name, description, equipment_categories(name))')
    .maybeSingle();
  if (error) throw new Error(error.message);
  return mapRow(data);
};

export const deleteEquipmentItem = async (id: string): Promise<void> => {
  const { error } = await supabase.from('equipment_items').delete().eq('id', id);
  if (error) throw new Error(error.message);
};
