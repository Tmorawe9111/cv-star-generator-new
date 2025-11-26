import { useEffect, useMemo } from 'react';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { useNotifications } from '@/hooks/useNotifications';
import type { NotificationRow, NotifType } from '@/types/notifications';
import type { RecipientType } from '@/types/notifications';
import NotificationCard from './NotificationCard';

type Props = {
  recipientType: RecipientType;
  recipientId: string | null;
  filter?: NotifType[] | 'unread' | null;
  onAction?: Parameters<typeof NotificationCard>[0]['onAction'];
  onMarkAllReadCallback?: () => void;
};

export default function NotificationsList({ recipientType, recipientId, filter, onAction, onMarkAllReadCallback }: Props) {
  const { items, loading, hasMore, error, fetchPage, markRead, markAllRead, reset } =
    useNotifications(recipientType, recipientId);

  // Provide markAllRead to parent component
  const handleMarkAllRead = async () => {
    await markAllRead();
  };

  // Store reference for parent to call
  if (typeof window !== 'undefined') {
    (window as any).__notificationsMarkAllRead = handleMarkAllRead;
  }

  // Filter items: exclude older than 14 days and apply filter prop
  const now = new Date();
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const filteredItems = useMemo(() => {
    return items.filter(n => {
      const createdAt = new Date(n.created_at);
      // Exclude notifications older than 14 days
      if (createdAt < fourteenDaysAgo) return false;
      
      if (!filter) return true;
      if (filter === 'unread') return !n.read_at;
      if (Array.isArray(filter)) return filter.includes(n.type);
      return true;
    });
  }, [items, filter, fourteenDaysAgo]);

  // Group notifications by time period
  const { last24Hours, last7Days } = useMemo(() => {
    const last24Hours: typeof filteredItems = [];
    const last7Days: typeof filteredItems = [];

    filteredItems.forEach(n => {
      const createdAt = new Date(n.created_at);
      if (createdAt >= oneDayAgo) {
        last24Hours.push(n);
      } else if (createdAt >= sevenDaysAgo) {
        last7Days.push(n);
      }
      // Items between 7-14 days are shown in "last7Days" section for simplicity
      else {
        last7Days.push(n);
      }
    });

    return { last24Hours, last7Days };
  }, [filteredItems, oneDayAgo, sevenDaysAgo]);

  useEffect(() => {
    reset();
  }, [recipientId, recipientType, reset]);

  useEffect(() => {
    fetchPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipientId]);

  if (error) {
    return (
      <div className="space-y-3">
        <EmptyState 
          text={`Fehler beim Laden der Benachrichtigungen: ${error}`}
          icon="⚠️"
          action={
            <button 
              onClick={fetchPage}
              className="text-sm text-primary hover:underline"
            >
              Erneut versuchen
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Last 24 Hours Section */}
      {last24Hours.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-1">Letzte 24 Stunden</h3>
          <div className="space-y-2">
            {last24Hours.map(n => (
              <NotificationCard key={n.id} n={n} onRead={markRead} onAction={onAction} />
            ))}
          </div>
        </div>
      )}

      {/* Last 7 Days Section */}
      {last7Days.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-1">Letzte 7 Tage</h3>
          <div className="space-y-2">
            {last7Days.map(n => (
              <NotificationCard key={n.id} n={n} onRead={markRead} onAction={onAction} />
            ))}
          </div>
        </div>
      )}

      {loading && <LoadingSkeleton rows={2} showAvatar={false} />}

      {!loading && hasMore && (
        <button
          onClick={fetchPage}
          className="mx-auto block rounded-xl border px-4 py-2 text-sm hover:bg-accent"
        >
          Mehr laden
        </button>
      )}

      {!loading && filteredItems.length === 0 && (
        <EmptyState 
          text="Keine Benachrichtigungen." 
          icon="🔔"
        />
      )}
    </div>
  );
}