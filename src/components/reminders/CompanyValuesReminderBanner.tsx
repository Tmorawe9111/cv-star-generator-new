import { useState, useEffect } from 'react';
import { useCompany } from '@/hooks/useCompany';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { CompanyValuesOverviewModal } from '@/components/modals/CompanyValuesOverviewModal';

export function CompanyValuesReminderBanner() {
  const { company } = useCompany();
  const [showReminder, setShowReminder] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

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
        setShowReminder(needsReminder);
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
      <Card className="p-4 bg-yellow-50 border-yellow-200 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <div>
              <h3 className="font-semibold text-sm text-yellow-900">
                Vervollständige deine Werte – bessere Matches!
              </h3>
              <p className="text-xs text-yellow-700 mt-0.5">
                Bewerber sehen deine Werte und Erwartungen im Profil.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setShowModal(true)}
            className="bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            Jetzt vervollständigen
          </Button>
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

