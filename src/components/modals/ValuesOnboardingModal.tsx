import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ValuesStepper } from '@/components/onboarding/ValuesStepper';
import { InterviewQuestions } from '@/components/onboarding/InterviewQuestions';
import { ValuesReview } from '@/components/onboarding/ValuesReview';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

type Step = 'values' | 'interview' | 'review';

interface ValuesOnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

export function ValuesOnboardingModal({ open, onOpenChange, onComplete }: ValuesOnboardingModalProps) {
  const { user, profile } = useAuth();
  const [step, setStep] = useState<Step>('values');
  const [values, setValues] = useState<Record<string, string>>({});
  const [interviewAnswers, setInterviewAnswers] = useState<Array<{ question: string; answer: string; id: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [valuesCompleted, setValuesCompleted] = useState(false);
  const [interviewCompleted, setInterviewCompleted] = useState(false);

  useEffect(() => {
    if (open && user?.id) {
      loadExistingData();
      checkCompletionStatus();
    }
  }, [open, user?.id]);

  const checkCompletionStatus = async () => {
    if (!user?.id) return;

    try {
      const { data } = await supabase
        .from('profiles')
        .select('values_completed, interview_completed')
        .eq('id', user.id)
        .single();

      if (data) {
        setValuesCompleted(data.values_completed || false);
        setInterviewCompleted(data.interview_completed || false);

        // Determine initial step based on what's missing
        if (!data.values_completed && !data.interview_completed) {
          setStep('values');
        } else if (!data.values_completed) {
          setStep('values');
        } else if (!data.interview_completed) {
          setStep('interview');
        } else {
          // Both completed, start with values for editing
          setStep('values');
        }
      }
    } catch (error) {
      console.error('Error checking completion:', error);
    }
  };

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

      // Load existing interview answers
      const { data: interviewData } = await supabase
        .from('user_interview_answers')
        .select('answer, interview_questions!inner(question, id)')
        .eq('user_id', user.id);

      if (interviewData && interviewData.length > 0) {
        const formattedAnswers = interviewData.map((item: any) => ({
          question: item.interview_questions?.question || '',
          answer: item.answer || '',
          id: item.interview_questions?.id || 0,
        })).filter(item => item.question && item.id);
        
        setInterviewAnswers(formattedAnswers);
        
        // Also set step to review if we have existing data
        if (formattedAnswers.length > 0 && Object.keys(values).length > 0) {
          // Don't auto-set step, let user navigate
        }
      }
    } catch (error) {
      console.error('Error loading existing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleValuesComplete = (completedValues: Record<string, string>) => {
    setValues(completedValues);
    // Only go to interview if not completed yet
    if (!interviewCompleted) {
      setStep('interview');
    } else {
      // Skip to review if interview already completed
      setStep('review');
    }
  };

  const handleValuesSkip = () => {
    // Skip values, go to interview if not completed
    if (!interviewCompleted) {
      setStep('interview');
    } else {
      // Both can be skipped, go to review
      setStep('review');
    }
  };

  // Map database branch values to interview_questions branch names
  const mapBranchToInterviewBranch = (branch: string | null | undefined): string | null => {
    if (!branch) return null;
    
    const branchMap: Record<string, string> = {
      'handwerk': 'Handwerk',
      'it': 'Büro',
      'gesundheit': 'Pflege',
      'buero': 'Büro',
      'verkauf': 'Büro',
      'gastronomie': 'Gastronomie',
      'bau': 'Handwerk',
      'logistik': 'Logistik',
      'produktion': 'Produktion',
    };
    
    return branchMap[branch.toLowerCase()] || null;
  };

  const handleInterviewComplete = async (answers: Record<number, string>) => {
    if (!user?.id || !profile?.branche) return;

    const interviewBranch = mapBranchToInterviewBranch(profile.branche);
    if (!interviewBranch) {
      toast({
        title: 'Fehler',
        description: 'Keine Interviewfragen für deine Branche verfügbar.',
        variant: 'destructive',
      });
      return;
    }

    // Load questions to map IDs
    const { data: questions } = await supabase
      .from('interview_questions')
      .select('id, question')
      .eq('branch', interviewBranch);

    if (questions) {
      // Merge with existing answers - preserve old ones, update new ones
      const existingAnswersMap = new Map<number, { question: string; answer: string; id: number }>();
      interviewAnswers.forEach(item => {
        if (item.id && item.answer?.trim()) {
          existingAnswersMap.set(item.id, item);
        }
      });

      // Update with new answers, but keep existing ones that weren't changed
      const formattedAnswers = questions.map(q => {
        const existingAnswer = existingAnswersMap.get(q.id);
        // Use new answer if provided and not empty, otherwise keep existing
        const newAnswer = answers[q.id]?.trim();
        return {
          question: q.question,
          answer: newAnswer || existingAnswer?.answer || '',
          id: q.id,
        };
      });
      
      setInterviewAnswers(formattedAnswers);
    }

    setStep('review');
  };

  const handleInterviewSkip = () => {
    // Skip interview, go to review
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
        updated_at: new Date().toISOString(),
      };

      // Preserve all existing values
      if (existingValues) {
        valuesToSave.q1_team = existingValues.q1_team || null;
        valuesToSave.q2_conflict = existingValues.q2_conflict || null;
        valuesToSave.q3_reliable = existingValues.q3_reliable || null;
        valuesToSave.q4_motivation = existingValues.q4_motivation || null;
        valuesToSave.q5_stress = existingValues.q5_stress || null;
        valuesToSave.q6_environment = existingValues.q6_environment || null;
        valuesToSave.q7_respect = existingValues.q7_respect || null;
        valuesToSave.q8_expectations = existingValues.q8_expectations || null;
      }

      // Update only the values that were changed/answered in the form
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
        if (fieldMap[num] && values[key]?.trim()) {
          valuesToSave[fieldMap[num]] = values[key];
        }
      });

      // Only save if there's at least one value
      const hasAnyValue = Object.values(valuesToSave).some((v: any) => v && typeof v === 'string' && v.trim());
      
      if (hasAnyValue) {
        const { error: valuesError } = await supabase
          .from('user_values')
          .upsert(valuesToSave);

        if (valuesError) throw valuesError;
      }

      // Load existing interview answers to preserve unchanged ones
      const { data: existingInterviewAnswers } = await supabase
        .from('user_interview_answers')
        .select('question_id, answer')
        .eq('user_id', user.id);

      // Create a map of existing answers
      const existingAnswersMap = new Map<number, string>();
      if (existingInterviewAnswers) {
        existingInterviewAnswers.forEach((item: any) => {
          if (item.question_id && item.answer?.trim()) {
            existingAnswersMap.set(item.question_id, item.answer);
          }
        });
      }

      // Save all interview answers (both existing and new/changed)
      // Use upsert which will update existing or create new ones
      // This preserves all existing answers and only updates the ones that were changed
      const answersToSave = interviewAnswers
        .filter(item => item.answer?.trim() && item.id)
        .map(item => ({
          user_id: user.id,
          question_id: item.id,
          answer: item.answer,
        }));

      // Also preserve existing answers that weren't in the form (in case user skipped some)
      existingAnswersMap.forEach((answer, questionId) => {
        // Only add if not already in the form answers
        const alreadyInForm = answersToSave.some(a => a.question_id === questionId);
        if (!alreadyInForm && answer?.trim()) {
          answersToSave.push({
            user_id: user.id,
            question_id: questionId,
            answer: answer,
          });
        }
      });

      // Save all answers using upsert (updates existing, creates new)
      for (const answer of answersToSave) {
        const { error: answerError } = await supabase
          .from('user_interview_answers')
          .upsert(answer, { onConflict: 'user_id,question_id' });

        if (answerError) throw answerError;
      }

      // Update profile completion flags based on what was saved
      const newValuesCompleted = hasValues || valuesCompleted;
      const newInterviewCompleted = hasInterviewAnswers || interviewCompleted;

      await supabase
        .from('profiles')
        .update({
          values_completed: newValuesCompleted,
          interview_completed: newInterviewCompleted,
        })
        .eq('id', user.id);

      toast({
        title: 'Erfolgreich gespeichert',
        description: 'Deine Änderungen wurden gespeichert.',
      });

      onOpenChange(false);
      if (onComplete) {
        onComplete();
      }
    } catch (error: any) {
      console.error('Error saving:', error);
      toast({
        title: 'Fehler',
        description: 'Beim Speichern ist ein Fehler aufgetreten.',
        variant: 'destructive',
      });
    }
  };

  const handleClose = (open: boolean) => {
    if (!open && step === 'review') {
      // Auto-save on close if on review step
      handleSave();
    } else if (!open) {
      onOpenChange(false);
    }
  };

  const interviewBranch = profile?.branche ? mapBranchToInterviewBranch(profile.branche) : null;

  if (!profile?.branche || !interviewBranch) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Branche erforderlich</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground mb-4">
            Bitte wähle zuerst eine Branche in deinem Profil aus.
          </p>
          <Button onClick={() => onOpenChange(false)}>
            Schließen
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(open) => handleClose(open)}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden p-0">
        <DialogHeader className="px-4 pt-4 pb-3 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">
              {step === 'values' && 'Werte & Arbeitsweise'}
              {step === 'interview' && 'Interviewfragen'}
              {step === 'review' && 'Übersicht'}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleClose(false)}
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
                  onSkip={handleValuesSkip}
                />
              )}
              {step === 'interview' && (
                <InterviewQuestions
                  userBranch={interviewBranch}
                  initialAnswers={Object.fromEntries(
                    interviewAnswers.map(item => [item.id, item.answer])
                  )}
                  onComplete={handleInterviewComplete}
                  onBack={() => setStep('values')}
                  onSkip={handleInterviewSkip}
                />
              )}
              {step === 'review' && (
                <ValuesReview
                  values={values}
                  interviewAnswers={interviewAnswers}
                  onEditValue={(key, value) => {
                    setValues(prev => ({ ...prev, [key]: value }));
                  }}
                  onEditInterview={(questionId, value) => {
                    setInterviewAnswers(prev =>
                      prev.map(item =>
                        item.id === questionId ? { ...item, answer: value } : item
                      )
                    );
                  }}
                  onSave={handleSave}
                  onBack={() => setStep('interview')}
                />
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

