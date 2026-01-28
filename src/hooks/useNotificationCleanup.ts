import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useNotifications } from '@/contexts/NotificationContext';

export const useNotificationCleanup = () => {
  const location = useLocation();
  const { notifications, removeNotification } = useNotifications();

  useEffect(() => {
    // Remove notifications based on current page
    const currentPath = location.pathname;
    
    notifications.forEach(notification => {
      const notificationId = notification.id || notification._id;
      
      // Remove chat notifications when visiting chat page
      if (currentPath === '/chat' && notification.type === 'chat') {
        removeNotification(notificationId);
      }
      
      // Remove query notifications when visiting query page
      if (currentPath === '/query' && notification.type === 'query') {
        removeNotification(notificationId);
      }
      
      // Remove circular notifications when visiting circular page
      if (currentPath === '/circular' && notification.type === 'circular') {
        removeNotification(notificationId);
      }
    });
  }, [location.pathname, notifications, removeNotification]);
}; 