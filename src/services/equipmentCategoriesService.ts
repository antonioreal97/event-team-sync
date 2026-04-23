import { EquipmentCategory } from '@/types';
import { supabase } from '@/integrations/supabase/client';

function mapRow(row: any): EquipmentCategory {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const getAllEquipmentCategories = async (): Promise<EquipmentCategory[]> => {
  const { data, error } = await supabase.from('equipment_categories').select('*').order('name');
  if (error) throw new Error(error.message);
  return (data || []).map(mapRow);
};

export const getEquipmentCategoryById = async (id: string): Promise<EquipmentCategory> => {
  const { data, error } = await supabase.from('equipment_categories').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Categoria não encontrada');
  return mapRow(data);
};

export const createEquipmentCategory = async (
  categoryData: Omit<EquipmentCategory, 'id' | 'createdAt' | 'updatedAt'>
): Promise<EquipmentCategory> => {
  const { data, error } = await (supabase as any)
    .from('equipment_categories')
    .insert({ name: categoryData.name, description: categoryData.description })
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  return mapRow(data);
};

export const updateEquipmentCategory = async (
  id: string,
  categoryData: Partial<Omit<EquipmentCategory, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<EquipmentCategory> => {
  const { data, error } = await (supabase as any)
    .from('equipment_categories')
    .update({ name: categoryData.name, description: categoryData.description })
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  return mapRow(data);
};

export const deleteEquipmentCategory = async (id: string): Promise<void> => {
  const { error } = await supabase.from('equipment_categories').delete().eq('id', id);
  if (error) throw new Error(error.message);
};
