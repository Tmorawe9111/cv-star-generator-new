import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ValuesStepper } from '@/components/onboarding/ValuesStepper';
import { ValuesReview } from '@/components/onboarding/ValuesReview';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

type Step = 'values' | 'review';

interface ValuesEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

export function ValuesEditModal({ open, onOpenChange, onComplete }: ValuesEditModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('values');
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && user?.id) {
      loadExistingData();
    }
  }, [open, user?.id]);

  const loadExistingData = async () => {
    if (!user?.id) return;

    try {
      // Load existing values
      const { data: valuesData } = await supabase
        .from('user_values')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (valuesData) {
        const formattedValues: Record<string, string> = {};
        // Map database fields (q1_team, q2_conflict, etc.) to form fields (q1, q2, etc.)
        const fieldMap: Record<string, string> = {
          'q1_team': 'q1',
          'q2_conflict': 'q2',
          'q3_reliable': 'q3',
          'q4_motivation': 'q4',
          'q5_stress': 'q5',
          'q6_environment': 'q6',
          'q7_respect': 'q7',
          'q8_expectations': 'q8',
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
    // Merge with existing values to preserve unchanged ones
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
    if (!user?.id) return;

    try {
      // Load existing values first to preserve unchanged answers
      const { data: existingValues } = await supabase
        .from('user_values')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      // Start with existing values or create new object
      const valuesToSave: any = {
        user_id: user.id,
      };

      // If existing record exists, include the id for proper upsert
      if (existingValues?.id) {
        valuesToSave.id = existingValues.id;
      }

      // Preserve all existing values first
      if (existingValues) {
        valuesToSave.q1_team = existingValues.q1_team || null;
        valuesToSave.q2_conflict = existingValues.q2_conflict || null;
        valuesToSave.q3_reliable = existingValues.q3_reliable || null;
        valuesToSave.q4_motivation = existingValues.q4_motivation || null;
        valuesToSave.q5_stress = existingValues.q5_stress || null;
        valuesToSave.q6_environment = existingValues.q6_environment || null;
        valuesToSave.q7_respect = existingValues.q7_respect || null;
        valuesToSave.q8_expectations = existingValues.q8_expectations || null;
      } else {
        // Initialize all fields as null for new record
        valuesToSave.q1_team = null;
        valuesToSave.q2_conflict = null;
        valuesToSave.q3_reliable = null;
        valuesToSave.q4_motivation = null;
        valuesToSave.q5_stress = null;
        valuesToSave.q6_environment = null;
        valuesToSave.q7_respect = null;
        valuesToSave.q8_expectations = null;
      }

      // Update only the values that were changed/answered in the form
      // Empty values will be set to null (skipped questions)
      Object.keys(values).forEach(key => {
        const num = key.replace('q', '');
        const fieldMap: Record<string, string> = {
          '1': 'q1_team',
          '2': 'q2_conflict',
          '3': 'q3_reliable',
          '4': 'q4_motivation',
          '5': 'q5_stress',
          '6': 'q6_environment',
          '7': 'q7_respect',
          '8': 'q8_expectations',
        };
        if (fieldMap[num]) {
          // If value is empty or whitespace, set to null (skipped)
          valuesToSave[fieldMap[num]] = values[key]?.trim() || null;
        }
      });

      // Always save (even if all are null) to update the record
      // Use onConflict to handle the UNIQUE(user_id) constraint
      const { error: valuesError } = await supabase
        .from('user_values')
        .upsert(valuesToSave, {
          onConflict: 'user_id'
        });

      if (valuesError) {
        console.error('Values save error:', valuesError);
        throw valuesError;
      }

      // Check if at least one value is answered
      const hasAnyValue = Object.values(valuesToSave).some((v: any) => v && typeof v === 'string' && v.trim());
      
      // Update values_completed flag only if at least one value is answered
      await supabase
        .from('profiles')
        .update({
          values_completed: hasAnyValue,
        })
        .eq('id', user.id);

      toast({
        title: 'Erfolgreich gespeichert',
        description: 'Deine Werte wurden gespeichert.',
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
              {step === 'values' ? 'Werte & Arbeitsweise' : 'Übersicht'}
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
                <ValuesStepper
                  initialValues={values}
                  onComplete={handleValuesComplete}
                  onSkip={() => setStep('review')}
                />
              )}
              {step === 'review' && (
                <ValuesReview
                  values={values}
                  interviewAnswers={[]}
                  showValuesOnly={true}
                  onEditValue={(key, value) => {
                    setValues(prev => ({ ...prev, [key]: value }));
                  }}
                  onEditInterview={() => {}}
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

