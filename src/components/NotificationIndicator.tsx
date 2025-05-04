
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getUnreadCount, getUserNotifications, markAsRead } from '@/services/notificationService';
import { useAuth } from '@/contexts/AuthContext';
import { Notification } from '@/types';

const NotificationIndicator: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchUnreadCount = async () => {
      const count = await getUnreadCount(user.id);
      setUnreadCount(count);
    };

    fetchUnreadCount();
    // Set up an interval to check for new notifications
    const intervalId = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(intervalId);
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const userNotifications = await getUserNotifications(user.id);
      setNotifications(userNotifications.slice(0, 5)); // Show only 5 most recent
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePopoverOpen = (open: boolean) => {
    setOpen(open);
    if (open) {
      loadNotifications();
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    await markAsRead(notification.id);
    setUnreadCount(prev => Math.max(0, prev - 1));
    
    // Update the notification in our state as well
    setNotifications(prev => 
      prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
    );
    
    // Navigate based on notification type
    if (notification.relatedEventId) {
      navigate(`/events/${notification.relatedEventId}`);
    } else {
      navigate('/notifications');
    }
    
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={handlePopoverOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center transform translate-x-1 -translate-y-1">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b">
          <h3 className="font-semibold">Notificações</h3>
        </div>
        <div className="max-h-80 overflow-auto">
          {loading ? (
            <div className="p-4 text-center">Carregando...</div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">Não há notificações</div>
          ) : (
            notifications.map(notification => (
              <div 
                key={notification.id} 
                className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${!notification.read ? 'bg-blue-50' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <p className="font-medium">{notification.title}</p>
                <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(notification.createdAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
            ))
          )}
        </div>
        <div className="p-2 border-t flex justify-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              navigate('/notifications');
              setOpen(false);
            }}
          >
            Ver todas
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationIndicator;
