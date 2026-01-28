import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { API_BASE_URL } from '@/config';
import { useAuth } from './AuthContext';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';

interface Notification {
  _id?: string;
  id?: string;
  type: 'chat' | 'query' | 'circular' | 'lquery';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  link?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  loadNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const loadNotifications = async () => {
    if (!user || user.role === 'ddpo') return;

    try {
      const response = await axios.get(`${API_BASE_URL}/api/notifications/${user.username}`);
      const fetchedNotifications = response.data.map((notification: any) => ({
        ...notification,
        id: notification._id || notification.id,
        timestamp: new Date(notification.timestamp)
      }));
      setNotifications(fetchedNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    console.log('Adding notification:', notification);
    setNotifications(prev => {
      // Check if a similar notification already exists (by message and type, within the last few seconds)
      const isDuplicate = prev.some(n =>
        n.type === notification.type &&
        n.message === notification.message &&
        (new Date().getTime() - new Date(n.timestamp).getTime() < 5000) // 5 seconds threshold
      );

      if (isDuplicate) {
        console.log('Duplicate notification detected, skipping');
        return prev;
      }

      const newNotification: Notification = {
        ...notification,
        id: notification._id || Date.now().toString(),
        timestamp: new Date(),
        read: false,
      };
      console.log('New notification added:', newNotification);
      return [newNotification, ...prev];
    });
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await axios.put(`${API_BASE_URL} /api/notifications / ${id}/read`);
      setNotifications(prev =>
        prev.map(n => (n.id === id || n._id === id ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      await axios.put(`${API_BASE_URL}/api/notifications/${user.username}/read-all`);
      setNotifications([]); // cleared locally since backend deletes them
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id && n._id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id && n._id !== id));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // Load notifications on user login
  useEffect(() => {
    if (user && user.role !== 'ddpo') {
      loadNotifications();
    }
  }, [user]);

  // Socket.IO connection for real-time notifications
  useEffect(() => {
    if (!user || user.role === 'ddpo') {
      // Clean up socket if user logs out or is DDPO
      if (socketRef.current) {
        console.log('User logged out or is DDPO, disconnecting socket');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // Create socket connection only once
    if (!socketRef.current) {
      console.log('Creating new Socket.IO connection for user:', user.username);
      socketRef.current = io(API_BASE_URL, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: Infinity,
      });
    }

    const socket = socketRef.current;

    // Connection event handlers
    const handleConnect = () => {
      console.log('✅ Connected to notification socket, ID:', socket.id);
      console.log('User:', user.username);
    };

    const handleDisconnect = (reason: string) => {
      console.log('❌ Disconnected from notification socket. Reason:', reason);
      if (reason === 'io server disconnect') {
        // Server disconnected, manually reconnect
        socket.connect();
      }
    };

    const handleReconnect = (attemptNumber: number) => {
      console.log('🔄 Reconnected to socket after', attemptNumber, 'attempts');
    };

    const handleReconnectError = (error: Error) => {
      console.error('❌ Reconnection error:', error);
    };

    // Event handlers with recipient check
    const handleChat = (data: any) => {
      console.log('📧 Received ddpo_chat_message:', data);
      if (data.college === user.username) {
        console.log('✅ Message is for this user, adding notification');
        addNotification({ type: 'chat', title: 'New Message from DDPO', message: data.message, link: '/chat' });
      } else {
        console.log('⏭️ Message is for different user:', data.college);
      }
    };

    const handleQuery = (data: any) => {
      console.log('❓ Received ddpo_query_message:', data);
      if (data.college === user.username) {
        console.log('✅ Query is for this user, adding notification');
        addNotification({ type: 'query', title: 'New Query from DDPO', message: data.message, link: '/query' });
      } else {
        console.log('⏭️ Query is for different user:', data.college);
      }
    };

    const handleCircular = (data: any) => {
      console.log('📢 Received ddpo_circular_message:', data);
      if (!data.college || data.college === user.username || (Array.isArray(data.recipients) && data.recipients.includes(user.username))) {
        console.log('✅ Circular is for this user, adding notification');
        addNotification({ type: 'circular', title: 'New Circular from DDPO', message: data.message, link: '/circular' });
      } else {
        console.log('⏭️ Circular is for different user');
      }
    };

    const handleLQuery = (data: any) => {
      console.log('🔗 Received ddpo_lquery_message:', data);
      if (data.college === user.username) {
        console.log('✅ Link query is for this user, adding notification');
        addNotification({ type: 'lquery', title: 'New Link Query from DDPO', message: data.message, link: '/query' });
      } else {
        console.log('⏭️ Link query is for different user:', data.college);
      }
    };

    // Register connection events
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('reconnect', handleReconnect);
    socket.on('reconnect_error', handleReconnectError);

    // Register notification events
    socket.on('ddpo_chat_message', handleChat);
    socket.on('ddpo_query_message', handleQuery);
    socket.on('ddpo_circular_message', handleCircular);
    socket.on('ddpo_lquery_message', handleLQuery);

    console.log('🎯 Socket event handlers registered for user:', user.username);

    // Cleanup: Remove event listeners but keep socket connected
    return () => {
      console.log('🧹 Cleaning up socket event handlers (socket stays connected)');
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('reconnect', handleReconnect);
      socket.off('reconnect_error', handleReconnectError);
      socket.off('ddpo_chat_message', handleChat);
      socket.off('ddpo_query_message', handleQuery);
      socket.off('ddpo_circular_message', handleCircular);
      socket.off('ddpo_lquery_message', handleLQuery);
    };
  }, [user, addNotification]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      addNotification,
      removeNotification,
      clearNotifications,
      loadNotifications,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
