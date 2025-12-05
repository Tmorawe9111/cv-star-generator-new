import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface InterviewQuestionsProps {
  userBranch: string; // e.g., "Pflege", "Handwerk"
  initialAnswers?: Record<number, string>;
  onComplete: (answers: Record<number, string>) => void;
  onBack: () => void;
  onSkip?: () => void;
}

export function InterviewQuestions({ 
  userBranch, 
  initialAnswers = {}, 
  onComplete,
  onBack,
  onSkip
}: InterviewQuestionsProps) {
  const [questions, setQuestions] = useState<Array<{ id: number; question: string }>>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>(initialAnswers);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuestions();
  }, [userBranch]);

  const loadQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('interview_questions' as any)
        .select('id, question')
        .eq('branch', userBranch)
        .order('id');

      if (error) throw error;
      setQuestions((data as unknown as Array<{ id: number; question: string }>) || []);
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const progress = questions.length > 0 
    ? ((currentStep + 1) / questions.length) * 100 
    : 0;

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(answers);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      onBack();
    }
  };

  const updateAnswer = (questionId: number, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const getPlaceholderForQuestion = (question: string, branch: string): string => {
    // Generic placeholders based on question keywords
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('warum') || lowerQuestion.includes('motiviert')) {
      return `Beispiel: Ich möchte in der ${branch} arbeiten, weil ich gerne praktisch arbeite und Menschen helfen möchte. Es macht mich stolz, wenn ich sehe, dass meine Arbeit einen Unterschied macht.`;
    }
    
    if (lowerQuestion.includes('stress') || lowerQuestion.includes('druck')) {
      return 'Beispiel: Bei Stress bleibe ich ruhig und konzentriert. Ich priorisiere meine Aufgaben und arbeite sie Schritt für Schritt ab. Bei Bedarf hole ich mir Unterstützung von Kollegen.';
    }
    
    if (lowerQuestion.includes('organisier') || lowerQuestion.includes('aufgaben')) {
      return 'Beispiel: Ich erstelle mir eine To-Do-Liste und arbeite die wichtigsten Aufgaben zuerst ab. Ich teile mir die Zeit gut ein und schaue regelmäßig, was noch zu tun ist.';
    }
    
    if (lowerQuestion.includes('reagier') || lowerQuestion.includes('unzufrieden')) {
      return 'Beispiel: Ich höre erstmal zu, was das Problem ist. Dann versuche ich, eine Lösung zu finden. Ich bleibe dabei freundlich und professionell, auch wenn es schwierig wird.';
    }
    
    if (lowerQuestion.includes('zuverlässig') || lowerQuestion.includes('verlassen')) {
      return 'Beispiel: Zuverlässigkeit bedeutet für mich, dass ich meine Aufgaben pünktlich und sorgfältig erledige. Meine Kollegen können sich darauf verlassen, dass ich mein Wort halte.';
    }
    
    if (lowerQuestion.includes('teamarbeit') || lowerQuestion.includes('team')) {
      return 'Beispiel: Teamarbeit ist wichtig, weil wir gemeinsam mehr erreichen können. Ich unterstütze meine Kollegen, wenn sie Hilfe brauchen, und freue mich auch über Unterstützung.';
    }
    
    if (lowerQuestion.includes('kritik') || lowerQuestion.includes('umgehen')) {
      return 'Beispiel: Bei Kritik höre ich mir an, was gesagt wird, und überlege, was ich daraus lernen kann. Ich sehe Kritik als Chance, mich zu verbessern.';
    }
    
    if (lowerQuestion.includes('qualität') || lowerQuestion.includes('sicherheit')) {
      return 'Beispiel: Qualität bedeutet für mich, dass ich meine Arbeit sorgfältig und genau mache. Ich achte auf Details und stelle sicher, dass alles richtig gemacht wird.';
    }
    
    if (lowerQuestion.includes('verantwortung')) {
      return 'Beispiel: Ich übernehme gerne Verantwortung für meine Aufgaben. Wenn ich etwas übernehme, stelle ich sicher, dass es gut gemacht wird und stehe dafür ein.';
    }
    
    // Default placeholder
    return 'Beispiel: Schreibe hier deine persönliche Antwort. Denke an konkrete Situationen aus deiner Erfahrung und erkläre, wie du gehandelt hast oder handeln würdest.';
  };

  if (loading) {
    return (
      <div className="w-full">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="w-full">
        <Card className="p-6">
          <p className="text-muted-foreground">
            Keine Fragen für deine Branche gefunden.
          </p>
          <Button onClick={onBack} className="mt-4">
            Zurück
          </Button>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentStep];

  return (
    <div className="w-full">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>Frage {currentStep + 1} von {questions.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question Card */}
      <Card className="p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-3">
          {currentQuestion.question}
        </h2>

        <div className="relative">
          <Textarea
            value={answers[currentQuestion.id] || ''}
            onChange={(e) => updateAnswer(currentQuestion.id, e.target.value)}
            placeholder={getPlaceholderForQuestion(currentQuestion.question, userBranch)}
            className="min-h-[150px] resize-none text-sm pr-4"
            autoFocus
          />
          {!answers[currentQuestion.id] && (
            <p className="text-xs text-muted-foreground mt-1.5 italic">
              💡 Tipp: Beantworte die Frage ehrlich und mit konkreten Beispielen aus deiner Erfahrung.
            </p>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={handleBack}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Zurück
          </Button>

          <div className="flex gap-2">
            {onSkip && (
              <Button variant="ghost" onClick={onSkip}>
                Überspringen
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={!answers[currentQuestion.id]?.trim()}
            >
              {currentStep === questions.length - 1 ? 'Zum Review' : 'Weiter'}
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

