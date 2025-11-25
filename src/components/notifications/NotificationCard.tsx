import { timeAgo } from '@/utils/timeAgo';
import type { NotificationRow, NotifType } from '@/types/notifications';
import { useAcceptEmployment, useDeclineEmployment } from '@/hooks/useEmployment';
import { acceptInterviewRequest, declineInterviewRequest } from '@/lib/api/interview-requests';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

type Props = {
  n: NotificationRow;
  onRead: (id: string) => void;
  onAction?: (n: NotificationRow, action: string) => void; // e.g. 'accept', 'decline', 'allow_contact'
};

const typeIcon: Record<NotifType, string> = {
  company_unlocked_you: '🔓',
  follow_request_received: '➕',
  pipeline_move_for_you: '📌',
  post_interaction: '💬',
  profile_incomplete_reminder: '⚠️',
  weekly_digest_user: '📈',
  new_matches_available: '✨',
  follow_accepted_chat_unlocked: '✉️',
  candidate_response_to_unlock: '✅',
  pipeline_activity_team: '🗂️',
  low_tokens: '🪙',
  weekly_digest_company: '📊',
  billing_update: '🧾',
  product_update: '🧩',
  employment_request: '👋',
  employment_accepted: '✅',
  employment_declined: 'ℹ️',
  application_received: '📨',
  application_withdrawn: '↩️',
  candidate_message: '💬',
  job_post_approved: '✅',
  job_post_rejected: '❌',
  job_post_expiring: '⏰',
  billing_invoice_ready: '🧾',
  interview_request_received: '📅',
  interview_request_accepted: '✅',
  interview_request_declined: '❌',
};

export default function NotificationCard({ n, onRead, onAction }: Props) {
  const [busy, setBusy] = useState(false);
  const accept = useAcceptEmployment();
  const decline = useDeclineEmployment();
  const cardRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();
  
  const unread = !n.read_at;
  const icon = typeIcon[n.type] || '🔔';

  // Get notification link based on type
  const getNotificationLink = (notif: NotificationRow): string | null => {
    switch (notif.type) {
      case 'application_received':
        return notif.payload?.job_id ? `/company/jobs/${notif.payload.job_id}?tab=bewerber` : null;
      
      case 'pipeline_move_for_you':
      case 'pipeline_activity_team':
        return notif.payload?.job_id ? `/company/jobs/${notif.payload.job_id}` : null;
      
      case 'company_unlocked_you':
        return notif.actor_id ? `/profile/${notif.actor_id}` : null;
      
      case 'follow_request_received':
        return notif.actor_id ? `/profile/${notif.actor_id}` : null;
      
      case 'post_interaction':
        return notif.payload?.post_id ? `/feed/post/${notif.payload.post_id}` : null;
      
      case 'new_matches_available':
        return '/company/search';
      
      case 'low_tokens':
        return '/company/settings#tokens';
      
      case 'job_post_approved':
      case 'job_post_rejected':
      case 'job_post_expiring':
        return notif.payload?.job_id ? `/company/jobs/${notif.payload.job_id}` : null;
      
      case 'billing_invoice_ready':
        return '/company/settings#billing';
      
      case 'employment_request':
      case 'employment_accepted':
      case 'employment_declined':
        return notif.payload?.user_id ? `/profile/${notif.payload.user_id}` : null;
      
      case 'candidate_message':
        return notif.actor_id ? `/messages/${notif.actor_id}` : null;
      
      case 'application_withdrawn':
        return notif.payload?.job_id ? `/company/jobs/${notif.payload.job_id}` : null;
      
      case 'interview_request_received':
      case 'interview_request_accepted':
      case 'interview_request_declined':
        return notif.payload?.company_id ? `/company/${notif.payload.company_id}` : null;
      
      default:
        return null;
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on a button
    if ((e.target as HTMLElement).closest('button, a')) {
      return;
    }

    const link = getNotificationLink(n);
    if (link) {
      navigate(link);
    }
    
    if (unread) {
      onRead(n.id);
    }
  };

  // Auto-mark as seen when in viewport
  useEffect(() => {
    if (!cardRef.current || n.seen_at) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(async () => {
            await supabase
              .from('notifications')
              .update({ seen_at: new Date().toISOString() })
              .eq('id', n.id);
          }, 1000);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [n.id, n.seen_at]);

  // Handle employment request actions
  const handleAcceptEmployment = async () => {
    if (!n.payload?.request_id || busy) return;
    setBusy(true);
    try {
      await accept.mutateAsync({ request_id: n.payload.request_id });
      onAction?.(n, 'accept');
    } finally {
      setBusy(false);
    }
  };

  const handleDeclineEmployment = async () => {
    if (!n.payload?.request_id || busy) return;
    setBusy(true);
    try {
      await decline.mutateAsync({ request_id: n.payload.request_id });
      onAction?.(n, 'decline');
    } finally {
      setBusy(false);
    }
  };

  // Handle interview request actions
  const handleAcceptInterview = async () => {
    if (!n.payload?.interview_request_id || busy) return;
    setBusy(true);
    try {
      await acceptInterviewRequest({ requestId: n.payload.interview_request_id });
      toast.success("Interview-Anfrage angenommen. Du erhältst in Kürze eine E-Mail mit dem Meeting-Link.");
      onAction?.(n, 'accept');
      onRead(n.id);
    } catch (error) {
      console.error(error);
      toast.error("Interview-Anfrage konnte nicht angenommen werden.");
    } finally {
      setBusy(false);
    }
  };

  const handleDeclineInterview = async () => {
    if (!n.payload?.interview_request_id || busy) return;
    setBusy(true);
    try {
      await declineInterviewRequest({ requestId: n.payload.interview_request_id });
      toast.success("Interview-Anfrage abgelehnt.");
      onAction?.(n, 'decline');
      onRead(n.id);
    } catch (error) {
      console.error(error);
      toast.error("Interview-Anfrage konnte nicht abgelehnt werden.");
    } finally {
      setBusy(false);
    }
  };

  const ActionButtons = () => {
    switch (n.type) {
      case 'employment_request':
        return (
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleAcceptEmployment}
              disabled={busy}
              className="h-9 rounded-lg px-3 text-sm text-white disabled:opacity-60"
              style={{ backgroundColor: '#5CE1E6' }}
              title="Beschäftigung bestätigen"
            >
              {busy && accept.isPending ? 'Bestätige…' : 'Annehmen'}
            </button>
            <button
              onClick={handleDeclineEmployment}
              disabled={busy}
              className="h-9 rounded-lg border px-3 text-sm hover:bg-gray-50 disabled:opacity-60"
              title="Beschäftigung ablehnen"
            >
              {busy && decline.isPending ? 'Lehne ab…' : 'Ablehnen'}
            </button>
            {n.payload?.user_id && (
              <a
                href={`/profile/${n.payload.user_id}`}
                className="h-9 rounded-lg border px-3 text-sm hover:bg-gray-50 flex items-center"
                title="Profil ansehen"
              >
                Profil ansehen
              </a>
            )}
          </div>
        );
      case 'employment_accepted':
      case 'employment_declined':
        return null; // Info-only notifications
      case 'company_unlocked_you':
        return (
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => onAction?.(n, 'allow_contact')}
              className="h-9 rounded-lg px-3 text-sm text-white"
              style={{ backgroundColor: '#5CE1E6' }}
            >
              Kontakt erlauben
            </button>
            <button
              onClick={() => onAction?.(n, 'not_interested')}
              className="h-9 rounded-lg px-3 text-sm border hover:bg-gray-50"
            >
              Kein Interesse
            </button>
          </div>
        );
      case 'follow_request_received':
        return (
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => onAction?.(n, 'accept')}
              className="h-9 rounded-lg px-3 text-sm text-white"
              style={{ backgroundColor: '#5CE1E6' }}
            >
              Annehmen
            </button>
            <button
              onClick={() => onAction?.(n, 'decline')}
              className="h-9 rounded-lg px-3 text-sm border hover:bg-gray-50"
            >
              Ablehnen
            </button>
          </div>
        );
      case 'pipeline_move_for_you':
        if (n.payload?.interview_at) {
          return (
            <div className="mt-3">
              <a
                href={`/calendar/add?ref=${n.id}`}
                className="text-sm underline"
              >
                Zum Kalender hinzufügen
              </a>
            </div>
          );
        }
        return null;
      case 'new_matches_available':
        return (
          <div className="mt-3">
            <a href="/unternehmen/kandidatensuche" className="text-sm underline">
              Jetzt ansehen
            </a>
          </div>
        );
      case 'low_tokens':
        return (
          <div className="mt-3">
            <a href="/unternehmen/einstellungen#upgrade" className="text-sm underline">
              Tokens nachkaufen
            </a>
          </div>
        );
      case 'interview_request_received':
        return (
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleAcceptInterview}
              disabled={busy}
              className="h-9 rounded-lg px-3 text-sm text-white disabled:opacity-60"
              style={{ backgroundColor: '#5CE1E6' }}
              title="Interview-Anfrage annehmen"
            >
              {busy ? 'Wird verarbeitet…' : 'Annehmen'}
            </button>
            <button
              onClick={handleDeclineInterview}
              disabled={busy}
              className="h-9 rounded-lg border px-3 text-sm hover:bg-gray-50 disabled:opacity-60"
              title="Interview-Anfrage ablehnen"
            >
              {busy ? 'Wird verarbeitet…' : 'Ablehnen'}
            </button>
          </div>
        );
      case 'interview_request_accepted':
      case 'interview_request_declined':
        return null; // Info-only notifications
      default:
        return null;
    }
  };

  return (
    <article
      ref={cardRef}
      className={`rounded-2xl border bg-card p-4 shadow-sm transition cursor-pointer hover:shadow-md ${
        unread ? 'border-[#5CE1E6]/50' : 'border-border'
      }`}
      onClick={handleCardClick}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-xl" aria-hidden>{icon}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className={`truncate text-sm ${unread ? 'font-semibold' : 'font-medium'}`}>
              {n.title}
            </h3>
            {unread && <span className="h-2 w-2 rounded-full bg-[#5CE1E6]" aria-label="ungelesen" />}
          </div>
          {n.body && <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>}
          
          {/* Employment request meta info */}
          {n.type === 'employment_request' && n.payload && (
            <div className="mt-2 text-xs text-muted-foreground">
              Anfrage von{' '}
              <span className="font-medium">
                {n.payload.user_name ?? 'Mitarbeiter:in'}
              </span>
              {n.payload.company_name && (
                <span> für {n.payload.company_name}</span>
              )}
            </div>
          )}

          {/* Interview request meta info */}
          {n.type === 'interview_request_received' && n.payload && (
            <div className="mt-2 space-y-1 text-xs text-muted-foreground">
              {n.payload.planned_at && (
                <div>
                  <span className="font-medium">Termin:</span>{' '}
                  {format(new Date(n.payload.planned_at), "dd.MM.yyyy 'um' HH:mm 'Uhr'", { locale: de })}
                </div>
              )}
              {n.payload.interview_type && (
                <div>
                  <span className="font-medium">Art:</span>{' '}
                  {n.payload.interview_type === 'online' ? 'Online (Video-Interview)' : 'Vor Ort'}
                </div>
              )}
              {n.payload.location_address && (
                <div>
                  <span className="font-medium">Adresse:</span> {n.payload.location_address}
                </div>
              )}
              {n.payload.job_title && (
                <div>
                  <span className="font-medium">Stelle:</span> {n.payload.job_title}
                </div>
              )}
            </div>
          )}

          <div className="mt-1 text-xs text-muted-foreground">{timeAgo(n.created_at)}</div>
          <ActionButtons />
        </div>
      </div>
    </article>
  );
}