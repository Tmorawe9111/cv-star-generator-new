import { useState, useEffect } from 'react';
import { useCompany } from '@/hooks/useCompany';
import { supabase } from '@/integrations/supabase/client';
import { CompanyInterviewQuestions } from '@/components/onboarding/CompanyInterviewQuestions';
import { CompanyValuesReview } from '@/components/onboarding/CompanyValuesReview';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Sparkles, Loader2 } from 'lucide-react';

type Step = 'interview' | 'review';

interface CompanyInterviewEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
  roleId?: string; // Optional: job_id for job-specific questions
}

export function CompanyInterviewEditModal({ open, onOpenChange, onComplete, roleId }: CompanyInterviewEditModalProps) {
  const { company } = useCompany();
  const [step, setStep] = useState<Step>('interview');
  const [interviewQuestions, setInterviewQuestions] = useState<Array<{ id?: string; question: string; position: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [generatingAI, setGeneratingAI] = useState(false);

  useEffect(() => {
    if (open && company?.id) {
      loadExistingData();
    }
  }, [open, company?.id]);

  const loadExistingData = async () => {
    if (!company?.id) return;

    try {
      // Load questions - either job-specific (if roleId) or general
      const query = supabase
        .from('company_interview_questions')
        .select('*')
        .eq('company_id', company.id)
        .order('position', { ascending: true });

      if (roleId) {
        query.eq('role_id', roleId);
      } else {
        query.is('role_id', null);
      }

      const { data: questionsData } = await query;

      if (questionsData && questionsData.length > 0) {
        setInterviewQuestions(
          questionsData.map((q: any) => ({
            id: q.id,
            question: q.question || '',
            position: q.position || 0,
          }))
        );
      } else {
        // Initialize with 5 empty questions
        setInterviewQuestions(
          Array.from({ length: 5 }, (_, i) => ({ question: '', position: i }))
        );
      }
    } catch (error) {
      console.error('Error loading existing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAISuggestions = async () => {
    if (!roleId || !company?.id) return;

    setGeneratingAI(true);
    try {
      // Get job details
      const { data: job, error: jobError } = await supabase
        .from('job_posts')
        .select('title, description_md, tasks_md, requirements_md')
        .eq('id', roleId)
        .single();

      if (jobError || !job) {
        throw new Error('Stelle nicht gefunden');
      }

      // Call AI function
      const { data, error } = await supabase.functions.invoke('ai-generate-interview-questions', {
        body: {
          jobTitle: job.title,
          description: job.description_md || '',
          tasks: job.tasks_md || '',
          requirements: job.requirements_md || '',
        }
      });

      if (error) throw error;

      if (data?.questions && Array.isArray(data.questions)) {
        // Replace empty questions with AI suggestions, or append if all are filled
        setInterviewQuestions(prev => {
          const filled = prev.filter(q => q.question.trim());
          const empty = prev.filter(q => !q.question.trim());
          
          // If we have empty questions, replace them
          if (empty.length > 0) {
            const aiQuestions = data.questions.slice(0, Math.min(empty.length, data.questions.length));
            const updated = [...filled];
            
            // Replace empty questions with AI suggestions
            let aiIndex = 0;
            prev.forEach((q, i) => {
              if (!q.question.trim() && aiIndex < aiQuestions.length) {
                updated[i] = { ...q, question: aiQuestions[aiIndex++] };
              }
            });
            
            return updated;
          } else {
            // All questions are filled, append AI suggestions
            const aiQuestions = data.questions.slice(0, 5).map((q: string, i: number) => ({
              question: q,
              position: prev.length + i,
            }));
            return [...prev, ...aiQuestions];
          }
        });

        toast({
          title: 'AI-Vorschläge geladen',
          description: `${data.questions.length} Fragen wurden generiert.`,
        });
      }
    } catch (error: any) {
      console.error('Error generating AI suggestions:', error);
      toast({
        title: 'Fehler',
        description: error?.message || 'AI-Vorschläge konnten nicht generiert werden.',
        variant: 'destructive',
      });
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleInterviewComplete = (questions: Array<{ question: string; position: number }>) => {
    setInterviewQuestions(questions);
    setStep('review');
  };

  const handleSave = async () => {
    if (!company?.id) return;

    try {
      // Load existing questions (job-specific or general)
      const query = supabase
        .from('company_interview_questions')
        .select('*')
        .eq('company_id', company.id);

      if (roleId) {
        query.eq('role_id', roleId);
      } else {
        query.is('role_id', null);
      }

      const { data: existingQuestions } = await query;

      const existingIds = new Set((existingQuestions || []).map((q: any) => q.id));
      const questionsToSave = interviewQuestions.filter(q => q.question.trim());

      // Delete questions that are no longer in the list
      if (existingQuestions) {
        for (const existing of existingQuestions) {
          const stillExists = questionsToSave.some(q => q.id === existing.id);
          if (!stillExists) {
            await supabase
              .from('company_interview_questions')
              .delete()
              .eq('id', existing.id);
          }
        }
      }

      // Save/update questions
      for (const question of questionsToSave) {
        const questionToSave: any = {
          company_id: company.id,
          role_id: roleId || null, // Job-specific if roleId provided, otherwise general
          question: question.question,
          position: question.position,
        };

        if (question.id) {
          questionToSave.id = question.id;
        }

        await supabase
          .from('company_interview_questions')
          .upsert(questionToSave, {
            onConflict: 'id'
          });
      }

      // Check if at least one question exists
      const hasAnyQuestion = questionsToSave.length > 0;

      // Update interview_questions_completed flag
      await supabase
        .from('companies')
        .update({
          interview_questions_completed: hasAnyQuestion,
        })
        .eq('id', company.id);

      toast({
        title: 'Erfolgreich gespeichert',
        description: 'Ihre Interviewfragen wurden gespeichert.',
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
                <div className="space-y-4">
                  {roleId && (
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={generateAISuggestions}
                        disabled={generatingAI}
                      >
                        {generatingAI ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Wird generiert...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            AI-Vorschläge generieren
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                  <CompanyInterviewQuestions
                    initialQuestions={interviewQuestions}
                    onComplete={handleInterviewComplete}
                    onBack={() => onOpenChange(false)}
                    onSkip={() => setStep('review')}
                  />
                </div>
              )}
              {step === 'review' && (
                <CompanyValuesReview
                  values={{}}
                  interviewQuestions={interviewQuestions}
                  showInterviewOnly={true}
                  onEditValue={() => {}}
                  onEditRoleExpectation={() => {}}
                  onEditInterviewQuestion={(index, question) => {
                    setInterviewQuestions(prev =>
                      prev.map((q, i) => i === index ? { ...q, question } : q)
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

