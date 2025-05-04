
export type UserRole = 'producer' | 'collaborator';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamAllocation {
  id: string;
  eventId: string;
  userId: string;
  status: 'pending' | 'confirmed' | 'rejected';
  user?: User;
  confirmationDeadline: string;
}

export interface Equipment {
  id: string;
  name: string;
  totalQuantity: number;
  description?: string;
}

export interface EquipmentAllocation {
  id: string;
  eventId: string;
  equipmentId: string;
  quantity: number;
  equipment?: Equipment;
}

export interface CheckIn {
  id: string;
  allocationId: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  type: 'allocation' | 'update' | 'reminder' | 'checkin';
  relatedEventId?: string;
  createdAt: string;
}
