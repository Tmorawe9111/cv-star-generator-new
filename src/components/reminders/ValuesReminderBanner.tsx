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
        const dismissedKey = `values_reminder_dismissed_${profile.id}`;
        const wasDismissed = localStorage.getItem(dismissedKey);
        
        if (!wasDismissed) {
          setShow(true);
        }
      }
    } catch (error) {
      console.error('Error checking completion:', error);
    }
  };

  const handleDismiss = () => {
    if (profile?.id) {
      const dismissedKey = `values_reminder_dismissed_${profile.id}`;
      localStorage.setItem(dismissedKey, 'true');
      setDismissed(true);
      setShow(false);
    }
  };

  const handleComplete = () => {
    setModalOpen(true);
  };

  const handleModalComplete = () => {
    setModalOpen(false);
    // Reload to check completion status
    window.location.reload();
  };

  if (!show || dismissed) return null;

  return (
    <>
      <Card className="mb-4 border-blue-200 bg-blue-50">
        <div className="p-4 flex items-center justify-between">
          <div className="flex-1">
            <p className="font-medium text-blue-900">
              Vervollständige deine Werte – bessere Matches!
            </p>
            <p className="text-sm text-blue-700 mt-1">
              Unternehmen möchten mehr über dich erfahren.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleComplete}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Jetzt vervollständigen
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
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

