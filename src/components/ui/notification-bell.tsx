import React, { useState } from 'react';
import { Bell, X, MessageSquare, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const getNotificationIcon = (type: 'chat' | 'query' | 'circular') => {
  switch (type) {
    case 'chat':
      return <MessageSquare className="h-4 w-4" />;
    case 'query':
      return <AlertCircle className="h-4 w-4" />;
    case 'circular':
      return <FileText className="h-4 w-4" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
};

const getNotificationColor = (type: 'chat' | 'query' | 'circular') => {
  switch (type) {
    case 'chat':
      return 'bg-blue-500';
    case 'query':
      return 'bg-orange-500';
    case 'circular':
      return 'bg-green-500';
    default:
      return 'bg-gray-500';
  }
};

export const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const { notifications, unreadCount, deleteNotification, markAllAsRead, removeNotification } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // Only show for college users (admin role)
  if (!user || user.role === 'ddpo') {
    return null;
  }

  const handleNotificationClick = (notification: any) => {
    const notificationId = notification.id || notification._id;
    deleteNotification(notificationId);
    removeNotification(notificationId);
    if (notification.link) {
      navigate(notification.link);
    }
    setIsOpen(false);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Notification Bell Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-14 h-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 transition-all duration-200"
        size="icon"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <Badge 
            className={`absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs font-bold ${getNotificationColor('chat')}`}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 max-h-96">
          <Card className="shadow-xl border-0 bg-background/95 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Notifications</CardTitle>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleMarkAllAsRead}
                      className="text-xs h-6 px-2"
                    >
                      Mark all read
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-64">
                {notifications.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    <div className="text-center">
                      <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No notifications</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className="p-3 cursor-pointer transition-colors hover:bg-muted/50"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 p-1 rounded-full ${getNotificationColor(notification.type)} text-white`}>
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-foreground">
                                {notification.title}
                              </p>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-xs mt-1 line-clamp-2 text-muted-foreground">
                              {notification.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}; 