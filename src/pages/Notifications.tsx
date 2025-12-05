import { useState, useCallback } from 'react';
import { NotificationsListWithFilters } from '@/components/notifications/NotificationsListWithFilters';
import { NotificationPreferencesDialog } from '@/components/notifications/NotificationPreferencesDialog';
import { FollowRequestsBanner } from '@/components/notifications/FollowRequestsBanner';
import { useAuth } from '@/hooks/useAuth';
import { LeftPanel } from '@/components/dashboard/LeftPanel';
import { RightPanel } from '@/components/dashboard/RightPanel';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useJobApplicationInterview } from '@/hooks/useJobApplicationInterview';
import { JobApplicationInterviewQuestions } from '@/components/jobs/JobApplicationInterviewQuestions';

export default function NotificationsPage() {
  const { profile, user } = useAuth();
  const isCompany = false;
  const companyId = null;
  const [prefsOpen, setPrefsOpen] = useState(false);
  const queryClient = useQueryClient();
  const { showModal, applicationId, jobId, companyId: interviewCompanyId, closeModal } = useJobApplicationInterview();

  const handleMarkAllRead = () => {
    // Call the function stored by NotificationsList
    if (typeof window !== 'undefined' && (window as any).__notificationsMarkAllRead) {
      (window as any).__notificationsMarkAllRead();
    }
  };

  // Handle notification actions from notification cards
  const handleNotificationAction = useCallback(async (notification: any, action: string) => {
    // Handle interview questions action - will be handled by the hook's openModal
    // The hook will automatically check and show the modal

    if (notification.type !== 'follow_request_received') return;
    
    const followerId = notification.actor_id;
    if (!followerId || !user?.id) return;

    try {
      if (action === 'accept') {
        // Find and update the follow request
        const { data: followData, error: findError } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', followerId)
          .eq('followee_id', user.id)
          .eq('status', 'pending')
          .single();

        if (findError) throw findError;

        // Update to accepted
        const { error: updateError } = await supabase
          .from('follows')
          .update({ status: 'accepted' })
          .eq('id', followData.id);

        if (updateError) throw updateError;

        // Auto follow back (ignore if already exists)
        const { error: followBackError } = await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            follower_type: 'profile',
            followee_id: followerId,
            followee_type: notification.payload?.follower_type || 'company',
            status: 'accepted'
          });
        
        // Ignore duplicate key error (23505)
        if (followBackError && followBackError.code !== '23505') {
          console.warn('Follow back error:', followBackError);
        }

        toast({ title: 'Anfrage angenommen', description: 'Ihr seid jetzt verbunden.' });
      } else if (action === 'decline') {
        // Delete the follow request
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', followerId)
          .eq('followee_id', user.id)
          .eq('status', 'pending');

        if (error) throw error;

        toast({ title: 'Anfrage abgelehnt' });
      }

      // Delete the notification after action
      await supabase
        .from('notifications')
        .delete()
        .eq('id', notification.id);

      // Remove from local state immediately
      if (typeof window !== 'undefined' && (window as any).__notificationsRemoveItem) {
        (window as any).__notificationsRemoveItem(notification.id);
      }

      // Invalidate queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['follow-relations'] });

    } catch (error) {
      console.error('Error handling follow action:', error);
      toast({ 
        title: 'Fehler', 
        description: 'Die Aktion konnte nicht ausgeführt werden.',
        variant: 'destructive'
      });
    }
  }, [user, queryClient]);

  return (
    <main className="w-full overflow-x-hidden">
      <h1 className="sr-only">Benachrichtigungen</h1>
      <div className="mx-auto max-w-screen-2xl px-3 sm:px-6 lg:px-8 py-2 md:py-4">
        <div className="flex gap-4 lg:gap-6">
          {/* Left column (fixed width) */}
          <aside className="hidden lg:block w-[280px] xl:w-[320px] shrink-0">
            <div className="sticky top-12 md:top-14 space-y-4">
              <LeftPanel />
            </div>
          </aside>

          {/* Center column (flex grows) */}
          <section className="flex-1 min-w-0 flex flex-col h-[calc(100vh-4rem)]">
            <div className="w-full max-w-[560px] mx-auto md:max-w-none flex flex-col h-full">
              {/* Header with "Mark all as read" button - Fixed */}
              <div className="mb-4 flex items-center justify-between shrink-0 bg-background py-2">
                <h1 className="text-2xl font-semibold">Benachrichtigungen</h1>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPrefsOpen(true)}
                    className="px-2 sm:px-3"
                  >
                    <Settings className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Einstellungen</span>
                  </Button>
                  <button
                    onClick={handleMarkAllRead}
                    className="rounded-lg border px-2 sm:px-3 py-1.5 text-xs hover:bg-accent whitespace-nowrap"
                    title="Alle ungelesenen Benachrichtigungen als gelesen markieren"
                  >
                    <span className="hidden sm:inline">Alle als gelesen markieren</span>
                    <span className="sm:hidden">Gelesen</span>
                  </button>
                </div>
              </div>

              {/* Follow Requests Banner - Instagram Style */}
              <FollowRequestsBanner />

              <div className="bg-card rounded-lg border p-3 sm:p-4 flex-1 flex flex-col min-h-0">
                <NotificationsListWithFilters
                  recipientType={isCompany ? 'company' : 'profile'}
                  recipientId={isCompany ? companyId : profile?.id ?? null}
                  onAction={handleNotificationAction}
                />
              </div>

              {profile && (
                <NotificationPreferencesDialog
                  open={prefsOpen}
                  onOpenChange={setPrefsOpen}
                  userId={profile.id}
                />
              )}

              {/* Interview Questions Modal */}
              {showModal && applicationId && jobId && interviewCompanyId && (
                <JobApplicationInterviewQuestions
                  open={showModal}
                  onOpenChange={closeModal}
                  applicationId={applicationId}
                  jobId={jobId}
                  companyId={interviewCompanyId}
                  onComplete={() => {
                    closeModal();
                    queryClient.invalidateQueries({ queryKey: ['notifications'] });
                  }}
                />
              )}
            </div>
          </section>

          {/* Right column (fixed width) */}
          <aside className="hidden xl:block w-[320px] shrink-0">
            <div className="sticky top-12 md:top-14 space-y-4">
              <RightPanel />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}