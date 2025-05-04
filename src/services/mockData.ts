
import { Event, TeamAllocation, Equipment, EquipmentAllocation, Notification } from '@/types';

// Events data
export const events: Event[] = [
  {
    id: '1',
    title: 'Corporate Annual Conference',
    description: 'Annual gathering for all employees with keynote speakers and workshops.',
    location: 'Convention Center, São Paulo',
    startDate: '2025-07-15T09:00:00',
    endDate: '2025-07-16T18:00:00',
    status: 'planning',
    createdBy: '1',
    createdAt: '2025-04-01T10:30:00',
    updatedAt: '2025-04-01T10:30:00',
  },
  {
    id: '2',
    title: 'Product Launch',
    description: 'Introducing our new line of products to the market with press coverage.',
    location: 'Tech Hub, Rio de Janeiro',
    startDate: '2025-06-05T14:00:00',
    endDate: '2025-06-05T20:00:00',
    status: 'planning',
    createdBy: '1',
    createdAt: '2025-03-20T16:45:00',
    updatedAt: '2025-03-22T11:15:00',
  },
  {
    id: '3',
    title: 'Industry Networking Mixer',
    description: 'Casual networking event for professionals in the tech industry.',
    location: 'Downtown Lounge, Brasília',
    startDate: '2025-05-12T18:00:00',
    endDate: '2025-05-12T22:00:00',
    status: 'planning',
    createdBy: '1',
    createdAt: '2025-04-02T09:20:00',
    updatedAt: '2025-04-02T09:20:00',
  },
];

// Team allocations data
export const teamAllocations: TeamAllocation[] = [
  {
    id: '1',
    eventId: '1',
    userId: '2',
    status: 'pending',
    confirmationDeadline: '2025-07-12T23:59:59',
  },
  {
    id: '2',
    eventId: '2',
    userId: '2',
    status: 'confirmed',
    confirmationDeadline: '2025-06-02T23:59:59',
  },
];

// Equipment data
export const equipments: Equipment[] = [
  {
    id: '1',
    name: 'Wireless Microphone',
    totalQuantity: 10,
    description: 'High-quality wireless microphones with 8-hour battery life',
  },
  {
    id: '2',
    name: 'Projector',
    totalQuantity: 5,
    description: '4K projectors with HDMI and wireless connectivity',
  },
  {
    id: '3',
    name: 'Speaker System',
    totalQuantity: 3,
    description: 'Professional audio system suitable for up to 300 people',
  },
];

// Equipment allocations
export const equipmentAllocations: EquipmentAllocation[] = [
  {
    id: '1',
    eventId: '1',
    equipmentId: '1',
    quantity: 4,
  },
  {
    id: '2',
    eventId: '1',
    equipmentId: '2',
    quantity: 2,
  },
  {
    id: '3',
    eventId: '2',
    equipmentId: '1',
    quantity: 2,
  },
  {
    id: '4',
    eventId: '2',
    equipmentId: '3',
    quantity: 1,
  },
];

// Notifications
export const notifications: Notification[] = [
  {
    id: '1',
    userId: '2',
    title: 'New event allocation',
    message: 'You have been assigned to "Corporate Annual Conference"',
    read: false,
    type: 'allocation',
    relatedEventId: '1',
    createdAt: '2025-04-02T14:30:00',
  },
  {
    id: '2',
    userId: '2',
    title: 'Event update',
    message: 'Details for "Product Launch" have been updated',
    read: true,
    type: 'update',
    relatedEventId: '2',
    createdAt: '2025-03-25T10:15:00',
  },
  {
    id: '3',
    userId: '1',
    title: 'Team confirmation',
    message: 'Anna Collaborator confirmed availability for Product Launch',
    read: false,
    type: 'update',
    relatedEventId: '2',
    createdAt: '2025-03-26T16:40:00',
  },
];
