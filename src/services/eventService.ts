
import { Event, TeamAllocation, EquipmentAllocation, User } from '@/types';
import { events as mockEvents, teamAllocations as mockTeamAllocations, equipmentAllocations as mockEquipmentAllocations } from './mockData';

// Local storage state management helpers
const getEvents = (): Event[] => {
  const stored = localStorage.getItem('event-team-sync-events');
  return stored ? JSON.parse(stored) : [...mockEvents];
};

const saveEvents = (events: Event[]): void => {
  localStorage.setItem('event-team-sync-events', JSON.stringify(events));
};

const getTeamAllocations = (): TeamAllocation[] => {
  const stored = localStorage.getItem('event-team-sync-team-allocations');
  return stored ? JSON.parse(stored) : [...mockTeamAllocations];
};

const saveTeamAllocations = (allocations: TeamAllocation[]): void => {
  localStorage.setItem('event-team-sync-team-allocations', JSON.stringify(allocations));
};

const getEquipmentAllocations = (): EquipmentAllocation[] => {
  const stored = localStorage.getItem('event-team-sync-equipment-allocations');
  return stored ? JSON.parse(stored) : [...mockEquipmentAllocations];
};

const saveEquipmentAllocations = (allocations: EquipmentAllocation[]): void => {
  localStorage.setItem('event-team-sync-equipment-allocations', JSON.stringify(allocations));
};

// Event service functions
export const getAllEvents = async (): Promise<Event[]> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  return getEvents();
};

export const getEventById = async (id: string): Promise<Event | undefined> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 300));
  const events = getEvents();
  return events.find(event => event.id === id);
};

export const createEvent = async (eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const events = getEvents();
  const newEvent: Event = {
    ...eventData,
    id: `${events.length + 1}`, // Simple ID generation
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  const updatedEvents = [...events, newEvent];
  saveEvents(updatedEvents);
  
  return newEvent;
};

export const updateEvent = async (id: string, eventData: Partial<Event>): Promise<Event> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const events = getEvents();
  const index = events.findIndex(event => event.id === id);
  
  if (index === -1) {
    throw new Error('Event not found');
  }
  
  const updatedEvent = {
    ...events[index],
    ...eventData,
    updatedAt: new Date().toISOString(),
  };
  
  events[index] = updatedEvent;
  saveEvents(events);
  
  return updatedEvent;
};

export const deleteEvent = async (id: string): Promise<void> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const events = getEvents();
  const updatedEvents = events.filter(event => event.id !== id);
  
  if (events.length === updatedEvents.length) {
    throw new Error('Event not found');
  }
  
  saveEvents(updatedEvents);
  
  // Also remove related allocations
  const teamAllocations = getTeamAllocations();
  const updatedTeamAllocations = teamAllocations.filter(allocation => allocation.eventId !== id);
  saveTeamAllocations(updatedTeamAllocations);
  
  const equipmentAllocations = getEquipmentAllocations();
  const updatedEquipmentAllocations = equipmentAllocations.filter(allocation => allocation.eventId !== id);
  saveEquipmentAllocations(updatedEquipmentAllocations);
};

// Team allocation functions
export const getEventTeamAllocations = async (eventId: string): Promise<TeamAllocation[]> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const allocations = getTeamAllocations();
  return allocations.filter(allocation => allocation.eventId === eventId);
};

export const getUserAllocations = async (userId: string): Promise<TeamAllocation[]> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const allocations = getTeamAllocations();
  return allocations.filter(allocation => allocation.userId === userId);
};

export const createTeamAllocation = async (allocationData: Omit<TeamAllocation, 'id'>): Promise<TeamAllocation> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 600));
  
  const allocations = getTeamAllocations();
  const newAllocation: TeamAllocation = {
    ...allocationData,
    id: `${allocations.length + 1}`, // Simple ID generation
  };
  
  const updatedAllocations = [...allocations, newAllocation];
  saveTeamAllocations(updatedAllocations);
  
  return newAllocation;
};

export const updateTeamAllocation = async (id: string, allocationData: Partial<TeamAllocation>): Promise<TeamAllocation> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const allocations = getTeamAllocations();
  const index = allocations.findIndex(allocation => allocation.id === id);
  
  if (index === -1) {
    throw new Error('Allocation not found');
  }
  
  const updatedAllocation = {
    ...allocations[index],
    ...allocationData,
  };
  
  allocations[index] = updatedAllocation;
  saveTeamAllocations(allocations);
  
  return updatedAllocation;
};

export const deleteTeamAllocation = async (id: string): Promise<void> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const allocations = getTeamAllocations();
  const updatedAllocations = allocations.filter(allocation => allocation.id !== id);
  
  if (allocations.length === updatedAllocations.length) {
    throw new Error('Allocation not found');
  }
  
  saveTeamAllocations(updatedAllocations);
};

// Helper function to get user events based on their role
export const getUserEvents = async (user: User): Promise<Event[]> => {
  const events = getEvents();
  
  if (user.role === 'producer') {
    // Producers see all events they created
    return events.filter(event => event.createdBy === user.id);
  } else {
    // Collaborators see events they're allocated to
    const allocations = await getUserAllocations(user.id);
    const eventIds = new Set(allocations.map(a => a.eventId));
    return events.filter(event => eventIds.has(event.id));
  }
};
