import { useState, useEffect } from 'react';
import { useCompany } from '@/hooks/useCompany';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { CompanyValuesOverviewModal } from '@/components/modals/CompanyValuesOverviewModal';

export function CompanyValuesReminderBanner() {
  const { company } = useCompany();
  const [showReminder, setShowReminder] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const dismissedKey = company?.id ? `company_values_reminder_dismissed_${company.id}` : null;

  useEffect(() => {
    if (company?.id) {
      checkCompletionStatus();
    }
  }, [company?.id]);

  const checkCompletionStatus = async () => {
    if (!company?.id) return;

    try {
      const { data } = await supabase
        .from('companies')
        .select('values_completed, interview_questions_completed')
        .eq('id', company.id)
        .single();

      if (data) {
        const needsReminder = !data.values_completed || !data.interview_questions_completed;
        const wasDismissed = dismissedKey ? localStorage.getItem(dismissedKey) : null;
        setShowReminder(needsReminder && !wasDismissed);
      }
    } catch (error) {
      console.error('Error checking completion status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !showReminder || !company) {
    return null;
  }

  return (
    <>
      <Card className="mb-4 border-[#fde68a] bg-gradient-to-b from-[#fffbeb] to-white shadow-sm rounded-2xl">
        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-[#0f172a] leading-snug">
                Werteprofil vervollständigen – bessere Matches.
              </div>
              <div className="mt-1 text-[13px] text-muted-foreground">
                Bewerber sehen deine Werte und Erwartungen im Profil.
              </div>

              <div className="mt-3 flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => setShowModal(true)}
                  className="h-10 rounded-full px-5 bg-[#f59e0b] hover:bg-[#d97706] text-white"
                >
                  Jetzt vervollständigen
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (dismissedKey) localStorage.setItem(dismissedKey, 'true');
                    setShowReminder(false);
                  }}
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

      <CompanyValuesOverviewModal
        open={showModal}
        onOpenChange={(open) => {
          setShowModal(open);
          if (!open) {
            checkCompletionStatus();
          }
        }}
        onComplete={checkCompletionStatus}
      />
    </>
  );
}

