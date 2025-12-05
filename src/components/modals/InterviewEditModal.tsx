import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { InterviewQuestions } from '@/components/onboarding/InterviewQuestions';
import { ValuesReview } from '@/components/onboarding/ValuesReview';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

type Step = 'interview' | 'review';

interface InterviewEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

export function InterviewEditModal({ open, onOpenChange, onComplete }: InterviewEditModalProps) {
  const { user, profile } = useAuth();
  const [step, setStep] = useState<Step>('interview');
  const [interviewAnswers, setInterviewAnswers] = useState<Array<{ question: string; answer: string; id: number }>>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (open && user?.id) {
      loadExistingData();
    }
  }, [open, user?.id]);

  const loadExistingData = async () => {
    if (!user?.id) return;

    try {
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
      }
    } catch (error) {
      console.error('Error loading existing data:', error);
    } finally {
      setLoading(false);
    }
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
    setStep('review');
  };

  const handleSave = async () => {
    if (!user?.id) return;

    try {
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

      // Save all interview answers - empty answers will be deleted (skipped questions)
      const answersToSave = interviewAnswers
        .filter(item => item.answer?.trim() && item.id)
        .map(item => ({
          user_id: user.id,
          question_id: item.id,
          answer: item.answer,
        }));

      // Get all question IDs that should exist (from the form)
      const formQuestionIds = new Set(interviewAnswers.map(item => item.id));

      // Delete answers for questions that are now empty (skipped)
      for (const [questionId, existingAnswer] of existingAnswersMap.entries()) {
        // If question was in form but is now empty, delete it
        const formAnswer = interviewAnswers.find(item => item.id === questionId);
        if (formAnswer && !formAnswer.answer?.trim()) {
          // Delete this answer
          await supabase
            .from('user_interview_answers')
            .delete()
            .eq('user_id', user.id)
            .eq('question_id', questionId);
        } else if (!formAnswer && existingAnswer?.trim()) {
          // Preserve existing answer that wasn't in form
          answersToSave.push({
            user_id: user.id,
            question_id: questionId,
            answer: existingAnswer,
          });
        }
      }

      // Save all non-empty answers using upsert (updates existing, creates new)
      for (const answer of answersToSave) {
        const { error: answerError } = await supabase
          .from('user_interview_answers')
          .upsert(answer, { 
            onConflict: 'user_id,question_id'
          });

        if (answerError) {
          console.error('Interview answer save error:', answerError);
          throw answerError;
        }
      }

      // Check if at least one interview answer exists
      const hasAnyAnswer = answersToSave.length > 0;

      // Update interview_completed flag only if at least one answer exists
      await supabase
        .from('profiles')
        .update({
          interview_completed: hasAnyAnswer,
        })
        .eq('id', user.id);

      toast({
        title: 'Erfolgreich gespeichert',
        description: 'Deine Interviewfragen wurden gespeichert.',
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden p-0">
        <DialogHeader className="px-4 pt-4 pb-3 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">
              {step === 'interview' ? 'Interviewfragen' : 'Übersicht'}
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
              {step === 'interview' && (
                <InterviewQuestions
                  userBranch={interviewBranch}
                  initialAnswers={Object.fromEntries(
                    interviewAnswers.map(item => [item.id, item.answer])
                  )}
                  onComplete={handleInterviewComplete}
                  onBack={() => onOpenChange(false)}
                  onSkip={handleInterviewSkip}
                />
              )}
              {step === 'review' && (
                <ValuesReview
                  values={{}}
                  interviewAnswers={interviewAnswers}
                  showInterviewOnly={true}
                  onEditValue={() => {}}
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

