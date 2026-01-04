import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';

interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  requestId: string | null;
  isRead: boolean;
  createdAt: string;
}

interface UseNotificationsResult {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export function useNotifications(options?: {
  pollInterval?: number;
  unreadOnly?: boolean;
}): UseNotificationsResult {
  const { pollInterval = 30000, unreadOnly = false } = options || {};
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { tokens, isAuthenticated } = useAuthStore();
  const token = tokens?.accessToken;

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      const url = unreadOnly
        ? `${API_URL}/notifications?unreadOnly=true`
        : `${API_URL}/notifications`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      setNotifications(data.data);
      setUnreadCount(data.data.filter((n: Notification) => !n.isRead).length);
      setError(null);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token, unreadOnly, API_URL]);

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setUnreadCount(0);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/notifications/unread-count`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch unread count');
      }

      const data = await response.json();
      setUnreadCount(data.data.count);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  }, [isAuthenticated, token, API_URL]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!token) return;

      try {
        const response = await fetch(
          `${API_URL}/notifications/${notificationId}/read`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === notificationId ? { ...n, isRead: true } : n
            )
          );
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      } catch (err) {
        console.error('Error marking notification as read:', err);
      }
    },
    [token, API_URL]
  );

  const markAllAsRead = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/notifications/read-all`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true }))
        );
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  }, [token, API_URL]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Polling for updates
  useEffect(() => {
    if (!isAuthenticated || pollInterval <= 0) return;

    const interval = setInterval(() => {
      if (unreadOnly) {
        fetchUnreadCount();
      } else {
        fetchNotifications();
      }
    }, pollInterval);

    return () => clearInterval(interval);
  }, [isAuthenticated, pollInterval, unreadOnly, fetchNotifications, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refetch: fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
}
