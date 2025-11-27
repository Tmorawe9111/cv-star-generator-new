import { useCallback, useEffect, useRef, useState } from 'react';
import { NotificationService } from '@/services/notificationService';
import type { NotificationRow, RecipientType } from '@/types/notifications';

export interface UseNotificationsReturn {
  items: NotificationRow[];
  loading: boolean;
  hasMore: boolean;
  error?: string;
  fetchPage: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  removeItem: (id: string) => void;
  reset: () => void;
}

/**
 * Hook for managing notifications with pagination and real-time updates
 * @param recipientType - Type of recipient (profile or company)
 * @param recipientId - ID of the recipient
 * @returns Notification data and management functions
 */
export function useNotifications(
  recipientType: RecipientType, 
  recipientId: string | null
): UseNotificationsReturn {
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const cursorRef = useRef<string | null>(null);

  const fetchPage = useCallback(async () => {
    if (!recipientId || loading || !hasMore) return;
    
    setLoading(true);
    setError(undefined);

    const result = await NotificationService.fetchPage({
      recipientType,
      recipientId,
      cursor: cursorRef.current || undefined,
    });

    if (result.error) {
      setError(result.error);
    } else {
      setItems(prev => [...prev, ...result.data]);
      cursorRef.current = result.nextCursor || null;
      setHasMore(result.hasMore);
    }

    setLoading(false);
  }, [recipientId, recipientType, loading, hasMore]);

  // Real-time subscription for new notifications
  useEffect(() => {
    if (!recipientId) return;

    const unsubscribe = NotificationService.subscribeToUpdates(
      recipientType,
      recipientId,
      (newNotification) => {
        setItems(prev => [newNotification, ...prev]);
      }
    );

    return unsubscribe;
  }, [recipientId, recipientType]);

  const markRead = useCallback(async (id: string) => {
    // Optimistic update
    setItems(prev =>
      prev.map(n => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    );

    // Server update
    const result = await NotificationService.markAsRead(id);
    if (!result.success && result.error) {
      setError(result.error);
      // Revert optimistic update on error
      setItems(prev =>
        prev.map(n => (n.id === id ? { ...n, read_at: null } : n))
      );
    }
  }, []);

  const markAllRead = useCallback(async () => {
    if (!recipientId) return;
    
    const now = new Date().toISOString();

    // Optimistic update
    setItems(prev => prev.map(n => ({ ...n, read_at: n.read_at ?? now })));

    // Server update
    const result = await NotificationService.markAllAsRead(recipientType, recipientId);
    if (!result.success && result.error) {
      setError(result.error);
    }
  }, [recipientId, recipientType]);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(n => n.id !== id));
  }, []);

  const reset = useCallback(() => {
    setItems([]);
    setHasMore(true);
    setError(undefined);
    cursorRef.current = null;
  }, []);

  // Store removeItem for external access
  if (typeof window !== 'undefined') {
    (window as any).__notificationsRemoveItem = removeItem;
  }

  return { 
    items, 
    loading, 
    hasMore, 
    error,
    fetchPage, 
    markRead, 
    markAllRead,
    removeItem,
    reset 
  };
}