import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ValuesStepper } from '@/components/onboarding/ValuesStepper';
import { InterviewQuestions } from '@/components/onboarding/InterviewQuestions';
import { ValuesReview } from '@/components/onboarding/ValuesReview';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

type Step = 'values' | 'interview' | 'review';

export default function ValuesOnboarding() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('values');
  const [values, setValues] = useState<Record<string, string>>({});
  const [interviewAnswers, setInterviewAnswers] = useState<Array<{ question: string; answer: string; id: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadExistingData();
    }
  }, [user?.id]);

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
        Object.keys(valuesData).forEach(key => {
          if (key.startsWith('q') && valuesData[key]) {
            formattedValues[key] = valuesData[key];
          }
        });
        setValues(formattedValues);
      }

      // Load existing interview answers
      const { data: interviewData } = await supabase
        .from('user_interview_answers')
        .select('answer, interview_questions!inner(question, id)')
        .eq('user_id', user.id);

      if (interviewData) {
        setInterviewAnswers(
          interviewData.map((item: any) => ({
            question: item.interview_questions.question,
            answer: item.answer,
            id: item.interview_questions.id,
          }))
        );
      }
    } catch (error) {
      console.error('Error loading existing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleValuesComplete = (completedValues: Record<string, string>) => {
    setValues(completedValues);
    setStep('interview');
  };

  // Map database branch values to interview_questions branch names
  const mapBranchToInterviewBranch = (branch: string | null | undefined): string | null => {
    if (!branch) return null;
    
    const branchMap: Record<string, string> = {
      'handwerk': 'Handwerk',
      'it': 'Büro', // IT falls under Büro
      'gesundheit': 'Pflege',
      'buero': 'Büro',
      'verkauf': 'Büro', // Verkauf falls under Büro
      'gastronomie': 'Gastronomie',
      'bau': 'Handwerk', // Bau falls under Handwerk
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
      const formattedAnswers = questions.map(q => ({
        question: q.question,
        answer: answers[q.id] || '',
        id: q.id,
      }));
      setInterviewAnswers(formattedAnswers);
    }

    setStep('review');
  };

  const handleSave = async () => {
    if (!user?.id) return;

    try {
      // Save values
      const valuesToSave: any = {
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };

      // Map q1, q2, etc. to q1_team, q2_conflict, etc.
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
          valuesToSave[fieldMap[num]] = values[key];
        }
      });

      const { error: valuesError } = await supabase
        .from('user_values')
        .upsert(valuesToSave);

      if (valuesError) throw valuesError;

      // Save interview answers
      const answersToSave = interviewAnswers.map(item => ({
        user_id: user.id,
        question_id: item.id,
        answer: item.answer,
      }));

      for (const answer of answersToSave) {
        const { error: answerError } = await supabase
          .from('user_interview_answers')
          .upsert(answer, { onConflict: 'user_id,question_id' });

        if (answerError) throw answerError;
      }

      // Update profile completion flags
      await supabase
        .from('profiles')
        .update({
          values_completed: true,
          interview_completed: true,
        })
        .eq('id', user.id);

      toast({
        title: 'Erfolgreich gespeichert',
        description: 'Deine Werte und Interviewfragen wurden gespeichert.',
      });

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error saving:', error);
      toast({
        title: 'Fehler',
        description: 'Beim Speichern ist ein Fehler aufgetreten.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="h-64 w-full max-w-2xl" />
      </div>
    );
  }

  const interviewBranch = profile?.branche ? mapBranchToInterviewBranch(profile.branche) : null;

  if (!profile?.branche || !interviewBranch) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <p className="text-muted-foreground mb-4">
            Bitte wähle zuerst eine Branche in deinem Profil aus.
          </p>
          <Button onClick={() => navigate('/profile')}>
            Zum Profil
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      {step === 'values' && (
        <ValuesStepper
          initialValues={values}
          onComplete={handleValuesComplete}
          onSkip={() => setStep('interview')}
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
    </div>
  );
}

