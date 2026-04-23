
import { Notification } from '@/types';
import { supabase as supabaseTyped } from '@/integrations/supabase/client';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase: any = supabaseTyped;

// Notification service functions - Conectado ao Supabase
export const getAllNotifications = async (): Promise<Notification[]> => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(mapDatabaseNotificationToNotification);
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    return [];
  }
};

// Mapper function to convert database notification to frontend notification
const mapDatabaseNotificationToNotification = (dbNotification: any): Notification => {
  return {
    id: dbNotification.id,
    userId: dbNotification.user_id,
    title: dbNotification.title,
    message: dbNotification.message,
    type: 'update', // Usar 'update' como tipo padrão
    read: dbNotification.is_read || false,
    relatedEventId: dbNotification.related_event_id,
    createdAt: dbNotification.created_at,
    priority: 'medium', // Default priority
    actionRequired: false, // Default action required
  };
};

export const getNotificationById = async (id: string): Promise<Notification | undefined> => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return data ? mapDatabaseNotificationToNotification(data) : undefined;
  } catch (error) {
    console.error('Erro ao buscar notificação:', error);
    return undefined;
  }
};

export const createNotification = async (notificationData: Omit<Notification, 'id' | 'createdAt' | 'read'>): Promise<Notification> => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: notificationData.userId,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        related_event_id: notificationData.relatedEventId,
        is_read: false
      })
      .select()
      .single();

    if (error) throw error;

    return mapDatabaseNotificationToNotification(data);
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    throw error;
  }
};

export const markNotificationAsRead = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    throw error;
  }
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await supabase
      .from('notifications')
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) throw error;
  } catch (error) {
    console.error('Erro ao marcar todas as notificações como lidas:', error);
    throw error;
  }
};

export const deleteNotification = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Erro ao deletar notificação:', error);
    throw error;
  }
};

// Notification utility functions
export const getUnreadNotifications = async (): Promise<Notification[]> => {
  try {
    const notifications = await getAllNotifications();
    return notifications.filter(notification => !notification.read);
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
      unread: notifications.filter(n => !n.read).length,
      read: notifications.filter(n => n.read).length,
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', user.id);

    if (error) throw error;
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
