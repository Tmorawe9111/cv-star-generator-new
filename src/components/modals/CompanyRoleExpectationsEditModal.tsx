import { useState, useEffect } from 'react';
import { useCompany } from '@/hooks/useCompany';
import { supabase } from '@/integrations/supabase/client';
import { CompanyRoleExpectations } from '@/components/onboarding/CompanyRoleExpectations';
import { CompanyValuesReview } from '@/components/onboarding/CompanyValuesReview';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

type Step = 'expectations' | 'review';

interface CompanyRoleExpectationsEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

export function CompanyRoleExpectationsEditModal({ open, onOpenChange, onComplete }: CompanyRoleExpectationsEditModalProps) {
  const { company } = useCompany();
  const [step, setStep] = useState<Step>('expectations');
  const [roleExpectations, setRoleExpectations] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && company?.id) {
      loadExistingData();
    }
  }, [open, company?.id]);

  const loadExistingData = async () => {
    if (!company?.id) return;

    try {
      // Load general role expectations (without role_id)
      const { data: expectationsData } = await supabase
        .from('company_role_expectations')
        .select('*')
        .eq('company_id', company.id)
        .is('role_id', null)
        .maybeSingle();

      if (expectationsData) {
        setRoleExpectations({
          key_tasks: expectationsData.key_tasks || '',
          desired_behavior: expectationsData.desired_behavior || '',
          must_have_traits: expectationsData.must_have_traits || '',
          no_gos: expectationsData.no_gos || '',
          work_environment: expectationsData.work_environment || '',
        });
      }
    } catch (error) {
      console.error('Error loading existing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExpectationsComplete = (completedValues: Record<string, string>) => {
    setRoleExpectations(completedValues);
    setStep('review');
  };

  const handleSave = async () => {
    if (!company?.id) return;

    try {
      // Load existing expectations
      const { data: existingExpectations } = await supabase
        .from('company_role_expectations')
        .select('*')
        .eq('company_id', company.id)
        .is('role_id', null)
        .maybeSingle();

      const expectationsToSave: any = {
        company_id: company.id,
        role_id: null, // General expectations
        key_tasks: roleExpectations.key_tasks?.trim() || null,
        desired_behavior: roleExpectations.desired_behavior?.trim() || null,
        must_have_traits: roleExpectations.must_have_traits?.trim() || null,
        no_gos: roleExpectations.no_gos?.trim() || null,
        work_environment: roleExpectations.work_environment?.trim() || null,
      };

      if (existingExpectations?.id) {
        expectationsToSave.id = existingExpectations.id;
      }

      // Check if at least one field is answered
      const hasAnyValue = Object.values(expectationsToSave).some((v: any) => v && typeof v === 'string' && v.trim());

      if (hasAnyValue) {
        const { error } = await supabase
          .from('company_role_expectations')
          .upsert(expectationsToSave, {
            onConflict: 'id'
          });

        if (error) throw error;
      } else if (existingExpectations?.id) {
        // Delete if all fields are empty
        await supabase
          .from('company_role_expectations')
          .delete()
          .eq('id', existingExpectations.id);
      }

      toast({
        title: 'Erfolgreich gespeichert',
        description: 'Ihre Erwartungen wurden gespeichert.',
      });

      onOpenChange(false);
      if (onComplete) {
        onComplete();
      }
    } catch (error: any) {
      console.error('Error saving:', error);
      toast({
        title: 'Fehler',
        description: error?.message || 'Beim Speichern ist ein Fehler aufgetreten.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden p-0">
        <DialogHeader className="px-4 pt-4 pb-3 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">
              {step === 'expectations' ? 'Erwartungen an Mitarbeitende' : 'Übersicht'}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-7 w-7 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="overflow-y-auto px-4 py-3 max-h-[calc(85vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {step === 'expectations' && (
                <CompanyRoleExpectations
                  initialValues={roleExpectations}
                  onComplete={handleExpectationsComplete}
                  onBack={() => onOpenChange(false)}
                  onSkip={() => setStep('review')}
                />
              )}
              {step === 'review' && (
                <CompanyValuesReview
                  values={{}}
                  roleExpectations={roleExpectations}
                  showRoleExpectationsOnly={true}
                  onEditValue={() => {}}
                  onEditRoleExpectation={(key, value) => {
                    setRoleExpectations(prev => ({ ...prev, [key]: value }));
                  }}
                  onEditInterviewQuestion={() => {}}
                  onSave={handleSave}
                  onBack={() => setStep('expectations')}
                />
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

