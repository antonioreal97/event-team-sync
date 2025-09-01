
import { Notification } from '@/types';
import { buildApiUrl, getAuthHeaders } from '@/config/api';

// Notification service functions - Conectado ao PostgreSQL
export const getAllNotifications = async (): Promise<Notification[]> => {
  try {
    const response = await fetch(buildApiUrl('/notifications'), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar notificações: ${response.status}`);
    }

    const data = await response.json();
    return data.notifications || [];
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    return [];
  }
};

export const getNotificationById = async (id: string): Promise<Notification | undefined> => {
  try {
    const response = await fetch(buildApiUrl('/notifications/:id', { id }), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar notificação: ${response.status}`);
    }

    const data = await response.json();
    return data.notification;
  } catch (error) {
    console.error('Erro ao buscar notificação:', error);
    return undefined;
  }
};

export const createNotification = async (notificationData: Omit<Notification, 'id' | 'createdAt' | 'isRead'>): Promise<Notification> => {
  try {
    const response = await fetch(buildApiUrl('/notifications'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(notificationData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao criar notificação');
    }

    const data = await response.json();
    return data.notification;
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    throw error;
  }
};

export const markNotificationAsRead = async (id: string): Promise<void> => {
  try {
    const response = await fetch(buildApiUrl('/notifications/:id/read', { id }), {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao marcar notificação como lida');
    }
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    throw error;
  }
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  try {
    const response = await fetch(buildApiUrl('/notifications/read-all'), {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao marcar todas as notificações como lidas');
    }
  } catch (error) {
    console.error('Erro ao marcar todas as notificações como lidas:', error);
    throw error;
  }
};

export const deleteNotification = async (id: string): Promise<void> => {
  try {
    const response = await fetch(buildApiUrl('/notifications/:id', { id }), {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao deletar notificação');
    }
  } catch (error) {
    console.error('Erro ao deletar notificação:', error);
    throw error;
  }
};

// Notification utility functions
export const getUnreadNotifications = async (): Promise<Notification[]> => {
  try {
    const notifications = await getAllNotifications();
    return notifications.filter(notification => !notification.isRead);
  } catch (error) {
    console.error('Erro ao buscar notificações não lidas:', error);
    return [];
  }
};

export const getNotificationsByType = async (type: string): Promise<Notification[]> => {
  try {
    const notifications = await getAllNotifications();
    return notifications.filter(notification => notification.type === type);
  } catch (error) {
    console.error('Erro ao buscar notificações por tipo:', error);
    return [];
  }
};

export const getNotificationsByUserId = async (userId: string): Promise<Notification[]> => {
  try {
    const notifications = await getAllNotifications();
    return notifications.filter(notification => notification.userId === userId);
  } catch (error) {
    console.error('Erro ao buscar notificações por usuário:', error);
    return [];
  }
};

// Notification statistics
export const getNotificationStatistics = async (): Promise<{
  total: number;
  unread: number;
  read: number;
  byType: Record<string, number>;
}> => {
  try {
    const notifications = await getAllNotifications();
    
    const byType: Record<string, number> = {};
    notifications.forEach(notification => {
      byType[notification.type] = (byType[notification.type] || 0) + 1;
    });

    return {
      total: notifications.length,
      unread: notifications.filter(n => !n.isRead).length,
      read: notifications.filter(n => n.isRead).length,
      byType,
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas de notificações:', error);
    return {
      total: 0,
      unread: 0,
      read: 0,
      byType: {},
    };
  }
};

// Bulk operations
export const deleteAllNotifications = async (): Promise<void> => {
  try {
    const response = await fetch(buildApiUrl('/notifications'), {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao deletar todas as notificações');
    }
  } catch (error) {
    console.error('Erro ao deletar todas as notificações:', error);
    throw error;
  }
};

export const deleteNotificationsByType = async (type: string): Promise<void> => {
  try {
    const notifications = await getNotificationsByType(type);
    
    for (const notification of notifications) {
      await deleteNotification(notification.id);
    }
  } catch (error) {
    console.error('Erro ao deletar notificações por tipo:', error);
    throw error;
  }
};
