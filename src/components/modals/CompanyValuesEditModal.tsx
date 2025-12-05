import { useState, useEffect } from 'react';
import { useCompany } from '@/hooks/useCompany';
import { supabase } from '@/integrations/supabase/client';
import { CompanyValuesStepper } from '@/components/onboarding/CompanyValuesStepper';
import { CompanyValuesReview } from '@/components/onboarding/CompanyValuesReview';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

type Step = 'values' | 'review';

interface CompanyValuesEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

export function CompanyValuesEditModal({ open, onOpenChange, onComplete }: CompanyValuesEditModalProps) {
  const { company } = useCompany();
  const [step, setStep] = useState<Step>('values');
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && company?.id) {
      loadExistingData();
    }
  }, [open, company?.id]);

  const loadExistingData = async () => {
    if (!company?.id) return;

    try {
      const { data: valuesData } = await supabase
        .from('company_values')
        .select('*')
        .eq('company_id', company.id)
        .single();

      if (valuesData) {
        const formattedValues: Record<string, string> = {};
        const fieldMap: Record<string, string> = {
          'q1_important_values': 'q1_important_values',
          'q2_team_collaboration': 'q2_team_collaboration',
          'q3_handling_mistakes': 'q3_handling_mistakes',
          'q4_desired_traits': 'q4_desired_traits',
          'q5_long_term_motivation': 'q5_long_term_motivation',
        };
        
        Object.keys(valuesData).forEach(key => {
          if (fieldMap[key] && valuesData[key]) {
            formattedValues[fieldMap[key]] = valuesData[key];
          }
        });
        setValues(formattedValues);
      }
    } catch (error) {
      console.error('Error loading existing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleValuesComplete = (completedValues: Record<string, string>) => {
    setValues(prev => {
      const merged = { ...prev };
      Object.keys(completedValues).forEach(key => {
        merged[key] = completedValues[key];
      });
      return merged;
    });
    setStep('review');
  };

  const handleSave = async () => {
    if (!company?.id) return;

    try {
      // Load existing values first to preserve unchanged answers
      const { data: existingValues } = await supabase
        .from('company_values')
        .select('*')
        .eq('company_id', company.id)
        .maybeSingle();

      const valuesToSave: any = {
        company_id: company.id,
      };

      // If existing record exists, include the id for proper upsert
      if (existingValues?.id) {
        valuesToSave.id = existingValues.id;
      }

      // Preserve all existing values first
      if (existingValues) {
        valuesToSave.q1_important_values = existingValues.q1_important_values || null;
        valuesToSave.q2_team_collaboration = existingValues.q2_team_collaboration || null;
        valuesToSave.q3_handling_mistakes = existingValues.q3_handling_mistakes || null;
        valuesToSave.q4_desired_traits = existingValues.q4_desired_traits || null;
        valuesToSave.q5_long_term_motivation = existingValues.q5_long_term_motivation || null;
      } else {
        // Initialize all fields as null for new record
        valuesToSave.q1_important_values = null;
        valuesToSave.q2_team_collaboration = null;
        valuesToSave.q3_handling_mistakes = null;
        valuesToSave.q4_desired_traits = null;
        valuesToSave.q5_long_term_motivation = null;
      }

      // Update only the values that were changed/answered in the form
      Object.keys(values).forEach(key => {
        if (values[key]?.trim()) {
          valuesToSave[key] = values[key];
        } else {
          valuesToSave[key] = null;
        }
      });

      // Extract keywords for matching (simple implementation)
      const allText = Object.values(valuesToSave)
        .filter(v => v && typeof v === 'string' && v.trim())
        .join(' ')
        .toLowerCase();
      
      // Simple keyword extraction
      const keywords: string[] = [];
      const commonKeywords = [
        'respekt', 'zuverlässigkeit', 'teamarbeit', 'verantwortung', 'pünktlich',
        'motivation', 'motiviert', 'engagement', 'offenheit', 'transparenz',
        'qualität', 'kundenorientierung', 'innovation', 'kontinuität', 'flexibilität'
      ];
      
      commonKeywords.forEach(keyword => {
        if (allText.includes(keyword) && !keywords.includes(keyword)) {
          keywords.push(keyword);
        }
      });

      valuesToSave.values_tags = keywords.slice(0, 10);

      // Always save (even if all are null) to update the record
      const { error: valuesError } = await supabase
        .from('company_values')
        .upsert(valuesToSave, {
          onConflict: 'company_id'
        });

      if (valuesError) {
        console.error('Values save error:', valuesError);
        throw valuesError;
      }

      // Check if at least one value is answered
      const hasAnyValue = Object.values(valuesToSave).some((v: any) => v && typeof v === 'string' && v.trim());
      
      // Update values_completed flag only if at least one value is answered
      await supabase
        .from('companies')
        .update({
          values_completed: hasAnyValue,
        })
        .eq('id', company.id);

      toast({
        title: 'Erfolgreich gespeichert',
        description: 'Ihre Unternehmenswerte wurden gespeichert.',
      });

      onOpenChange(false);
      if (onComplete) {
        onComplete();
      }
    } catch (error: any) {
      console.error('Error saving:', error);
      const errorMessage = error?.message || 'Beim Speichern ist ein Fehler aufgetreten.';
      toast({
        title: 'Fehler',
        description: errorMessage,
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
              {step === 'values' ? 'Unternehmenswerte' : 'Übersicht'}
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
              {step === 'values' && (
                <CompanyValuesStepper
                  initialValues={values}
                  onComplete={handleValuesComplete}
                  onSkip={() => setStep('review')}
                />
              )}
              {step === 'review' && (
                <CompanyValuesReview
                  values={values}
                  showValuesOnly={true}
                  onEditValue={(key, value) => {
                    setValues(prev => ({ ...prev, [key]: value }));
                  }}
                  onEditRoleExpectation={() => {}}
                  onEditInterviewQuestion={() => {}}
                  onSave={handleSave}
                  onBack={() => setStep('values')}
                />
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

