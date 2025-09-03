
import { Equipment, EquipmentAllocation } from '@/types';
import { equipments as mockEquipments, equipmentAllocations as mockEquipmentAllocations } from './mockData';

// Local storage state management helpers
const getEquipments = (): Equipment[] => {
  const stored = localStorage.getItem('event-team-sync-equipments');
  return stored ? JSON.parse(stored) : [...mockEquipments];
};

const saveEquipments = (equipments: Equipment[]): void => {
  localStorage.setItem('event-team-sync-equipments', JSON.stringify(equipments));
};

const getEquipmentAllocations = (): EquipmentAllocation[] => {
  const stored = localStorage.getItem('event-team-sync-equipment-allocations');
  return stored ? JSON.parse(stored) : [...mockEquipmentAllocations];
};

const saveEquipmentAllocations = (allocations: EquipmentAllocation[]): void => {
  localStorage.setItem('event-team-sync-equipment-allocations', JSON.stringify(allocations));
};

// Equipment service functions
export const getAllEquipments = async (): Promise<Equipment[]> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 400));
  return getEquipments();
};

export const getEquipmentById = async (id: string): Promise<Equipment | undefined> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 300));
  const equipments = getEquipments();
  return equipments.find(equipment => equipment.id === id);
};

export const getEventEquipmentAllocations = async (eventId: string): Promise<EquipmentAllocation[]> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const allocations = getEquipmentAllocations();
  return allocations.filter(allocation => allocation.eventId === eventId);
};

export const createEquipmentAllocation = async (allocationData: Omit<EquipmentAllocation, 'id'>): Promise<EquipmentAllocation> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 600));
  
  const allocations = getEquipmentAllocations();
  const newAllocation: EquipmentAllocation = {
    ...allocationData,
    id: `${allocations.length + 1}`, // Simple ID generation
  };
  
  const updatedAllocations = [...allocations, newAllocation];
  saveEquipmentAllocations(updatedAllocations);
  
  return newAllocation;
};

export const updateEquipmentAllocation = async (id: string, allocationData: Partial<EquipmentAllocation>): Promise<EquipmentAllocation> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const allocations = getEquipmentAllocations();
  const index = allocations.findIndex(allocation => allocation.id === id);
  
  if (index === -1) {
    throw new Error('Allocation not found');
  }
  
  const updatedAllocation = {
    ...allocations[index],
    ...allocationData,
  };
  
  allocations[index] = updatedAllocation;
  saveEquipmentAllocations(allocations);
  
  return updatedAllocation;
};

export const deleteEquipmentAllocation = async (id: string): Promise<void> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const allocations = getEquipmentAllocations();
  const updatedAllocations = allocations.filter(allocation => allocation.id !== id);
  
  if (allocations.length === updatedAllocations.length) {
    throw new Error('Allocation not found');
  }
  
  saveEquipmentAllocations(updatedAllocations);
};

// Check equipment availability
export const checkEquipmentAvailability = async (equipmentId: string, startDate: string, endDate: string, excludeEventId?: string): Promise<number> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 600));
  
  const equipment = await getEquipmentById(equipmentId);
  const allocations = getEquipmentAllocations();
  
  if (!equipment) {
    throw new Error('Equipment not found');
  }
  
  // Calculate total allocated for the given time period
  const startDateTime = new Date(startDate).getTime();
  const endDateTime = new Date(endDate).getTime();
  
  let totalAllocated = 0;
  
  // Simple overlap check (more sophisticated logic might be needed)
  // For now, we'll assume any allocation in the system is potentially conflicting
  for (const allocation of allocations) {
    if (allocation.equipmentId === equipmentId && (!excludeEventId || allocation.eventId !== excludeEventId)) {
      totalAllocated += allocation.quantity;
    }
  }
  
  return equipment.totalQuantity - totalAllocated;
};
