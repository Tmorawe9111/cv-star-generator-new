import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { ValuesOverviewModal } from '@/components/modals/ValuesOverviewModal';

export function ValuesReminderBanner() {
  const { profile } = useAuth();
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const dismissedKey = profile?.id ? `values_reminder_dismissed_${profile.id}` : null;

  useEffect(() => {
    checkCompletion();
  }, [profile]);

  const checkCompletion = async () => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('values_completed, interview_completed')
        .eq('id', profile.id)
        .single();

      if (error) {
        console.error('Error loading completion status:', error);
        return;
      }

      if (data && (!(data as any).values_completed || !(data as any).interview_completed)) {
        // Check if dismissed in localStorage
        const wasDismissed = dismissedKey ? localStorage.getItem(dismissedKey) : null;
        if (!wasDismissed) setShow(true);
      }
    } catch (error) {
      console.error('Error checking completion:', error);
    }
  };

  const handleDismiss = () => {
    if (dismissedKey) localStorage.setItem(dismissedKey, 'true');
    setDismissed(true);
    setShow(false);
  };

  const handleComplete = () => {
    setModalOpen(true);
  };

  const handleModalComplete = () => {
    setModalOpen(false);
    // Re-check completion (avoid hard reload)
    checkCompletion();
  };

  if (!show || dismissed) return null;

  return (
    <>
      <Card className="mb-4 border-[#c7ddff] bg-gradient-to-b from-[#eff6ff] to-white shadow-sm rounded-2xl">
        <div className="p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-[#0f172a] leading-snug">
                Vervollständige deine Werte – bessere Matches.
              </div>
              <div className="mt-1 text-[13px] text-muted-foreground">
                Unternehmen möchten mehr über dich erfahren.
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleComplete}
                  className="h-10 rounded-full px-5 bg-[#2563eb] hover:bg-[#1d4ed8]"
                >
                  Jetzt vervollständigen
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDismiss}
                  className="h-10 w-10 rounded-full"
                  aria-label="Banner schließen"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
      <ValuesOverviewModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onComplete={handleModalComplete}
      />
    </>
  );
}

