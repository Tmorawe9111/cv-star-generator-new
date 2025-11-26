import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import NotificationsList from './NotificationsList';
import type { RecipientType, NotifType } from '@/types/notifications';

interface Props {
  recipientType: RecipientType;
  recipientId: string | null;
  onAction?: (notification: any, action: string) => void;
}

const FILTER_GROUPS: Record<string, NotifType[] | 'unread' | null> = {
  all: null,
  unread: 'unread',
  jobs: ['pipeline_activity_team', 'new_matches_available', 'pipeline_move_for_you', 'application_received', 'application_withdrawn', 'job_post_approved', 'job_post_rejected', 'job_post_expiring'],
  profile: ['company_unlocked_you', 'follow_request_received', 'profile_incomplete_reminder'],
  social: ['post_interaction', 'follow_accepted_chat_unlocked', 'employment_request', 'employment_accepted', 'employment_declined', 'candidate_message', 'billing_update', 'billing_invoice_ready', 'low_tokens'],
};

export function NotificationsListWithFilters({ recipientType, recipientId, onAction }: Props) {
  const [filter, setFilter] = useState<keyof typeof FILTER_GROUPS>('all');

  return (
    <div className="w-full h-full flex flex-col">
      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="w-full h-full flex flex-col">
        {/* Fixed Tabs */}
        <TabsList className="w-full flex flex-nowrap overflow-x-auto sm:grid sm:grid-cols-5 mb-3 sm:mb-4 gap-1 sm:gap-0 shrink-0 sticky top-0 bg-card z-10">
          <TabsTrigger value="all" className="px-3 py-1.5 text-xs sm:text-sm whitespace-nowrap flex-shrink-0">Alle</TabsTrigger>
          <TabsTrigger value="unread" className="px-3 py-1.5 text-xs sm:text-sm whitespace-nowrap flex-shrink-0">Ungelesen</TabsTrigger>
          <TabsTrigger value="jobs" className="px-3 py-1.5 text-xs sm:text-sm whitespace-nowrap flex-shrink-0">Jobs</TabsTrigger>
          <TabsTrigger value="profile" className="px-3 py-1.5 text-xs sm:text-sm whitespace-nowrap flex-shrink-0">Profil</TabsTrigger>
          <TabsTrigger value="social" className="px-3 py-1.5 text-xs sm:text-sm whitespace-nowrap flex-shrink-0">Social</TabsTrigger>
        </TabsList>

        {/* Scrollable Content */}
        <TabsContent value={filter} className="mt-0 flex-1 overflow-y-auto min-h-0">
          <NotificationsList
            recipientType={recipientType}
            recipientId={recipientId}
            filter={FILTER_GROUPS[filter]}
            onAction={onAction}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
