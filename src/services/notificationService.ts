
import { Notification } from '@/types';
import { notifications as mockNotifications } from './mockData';

// Local storage state management helpers
const getNotifications = (): Notification[] => {
  const stored = localStorage.getItem('event-team-sync-notifications');
  return stored ? JSON.parse(stored) : [...mockNotifications];
};

const saveNotifications = (notifications: Notification[]): void => {
  localStorage.setItem('event-team-sync-notifications', JSON.stringify(notifications));
};

// Notification service functions
export const getUserNotifications = async (userId: string): Promise<Notification[]> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const notifications = getNotifications();
  return notifications
    .filter(notification => notification.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const getUnreadCount = async (userId: string): Promise<number> => {
  const notifications = await getUserNotifications(userId);
  return notifications.filter(notification => !notification.read).length;
};

export const markAsRead = async (notificationId: string): Promise<void> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const notifications = getNotifications();
  const index = notifications.findIndex(notification => notification.id === notificationId);
  
  if (index !== -1) {
    notifications[index].read = true;
    saveNotifications(notifications);
  }
};

export const markAllAsRead = async (userId: string): Promise<void> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const notifications = getNotifications();
  const updatedNotifications = notifications.map(notification => 
    notification.userId === userId ? { ...notification, read: true } : notification
  );
  
  saveNotifications(updatedNotifications);
};

export const createNotification = async (notificationData: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const notifications = getNotifications();
  const newNotification: Notification = {
    ...notificationData,
    id: `${notifications.length + 1}`, // Simple ID generation
    createdAt: new Date().toISOString(),
  };
  
  const updatedNotifications = [...notifications, newNotification];
  saveNotifications(updatedNotifications);
  
  return newNotification;
};
