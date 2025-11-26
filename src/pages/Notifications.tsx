import { useState } from 'react';
import { NotificationsListWithFilters } from '@/components/notifications/NotificationsListWithFilters';
import { NotificationPreferencesDialog } from '@/components/notifications/NotificationPreferencesDialog';
import { useAuth } from '@/hooks/useAuth';
import { LeftPanel } from '@/components/dashboard/LeftPanel';
import { RightPanel } from '@/components/dashboard/RightPanel';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotificationsPage() {
  const { profile } = useAuth();
  const isCompany = false;
  const companyId = null;
  const [prefsOpen, setPrefsOpen] = useState(false);

  const handleMarkAllRead = () => {
    // Call the function stored by NotificationsList
    if (typeof window !== 'undefined' && (window as any).__notificationsMarkAllRead) {
      (window as any).__notificationsMarkAllRead();
    }
  };

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

              <div className="bg-card rounded-lg border p-3 sm:p-4 flex-1 flex flex-col min-h-0">
                <NotificationsListWithFilters
                  recipientType={isCompany ? 'company' : 'profile'}
                  recipientId={isCompany ? companyId : profile?.id ?? null}
                  onAction={(n, action) => {
                    console.log('action', n.id, action);
                  }}
                />
              </div>

              {profile && (
                <NotificationPreferencesDialog
                  open={prefsOpen}
                  onOpenChange={setPrefsOpen}
                  userId={profile.id}
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