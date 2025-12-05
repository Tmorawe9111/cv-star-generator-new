import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Plus, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useCompany } from '@/hooks/useCompany';

interface CompanyInterviewQuestionsProps {
  initialQuestions?: Array<{ id?: string; question: string; position: number }>;
  onComplete: (questions: Array<{ question: string; position: number }>) => void;
  onBack?: () => void;
  onSkip?: () => void;
}

export function CompanyInterviewQuestions({ 
  initialQuestions = [], 
  onComplete, 
  onBack,
  onSkip 
}: CompanyInterviewQuestionsProps) {
  const { company } = useCompany();
  const [questions, setQuestions] = useState<Array<{ id?: string; question: string; position: number }>>(
    initialQuestions.length > 0 
      ? initialQuestions 
      : Array.from({ length: 5 }, (_, i) => ({ question: '', position: i }))
  );

  const handleQuestionChange = (index: number, value: string) => {
    setQuestions(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], question: value };
      return updated;
    });
  };

  const handleAddQuestion = () => {
    setQuestions(prev => [...prev, { question: '', position: prev.length }]);
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(prev => prev.filter((_, i) => i !== index).map((q, i) => ({ ...q, position: i })));
    }
  };

  const handleComplete = () => {
    const validQuestions = questions.filter(q => q.question.trim());
    if (validQuestions.length === 0) {
      toast({
        title: 'Hinweis',
        description: 'Bitte geben Sie mindestens eine Interviewfrage an.',
        variant: 'destructive',
      });
      return;
    }
    onComplete(validQuestions);
  };

  const filledCount = questions.filter(q => q.question.trim()).length;

  return (
    <div className="w-full space-y-4">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Interviewfragen ({filledCount} von {questions.length})</span>
          <span>{Math.round((filledCount / 5) * 100)}%</span>
        </div>
        <Progress value={(filledCount / 5) * 100} className="h-2" />
      </div>

      <Card className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-semibold">
              Interviewfragen für Bewerber
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Welche 5 Fragen stellen Sie Bewerbern am häufigsten?
            </p>
          </div>
          {questions.length < 10 && (
            <Button variant="outline" size="sm" onClick={handleAddQuestion}>
              <Plus className="h-4 w-4 mr-1" />
              Frage hinzufügen
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {questions.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  Frage {index + 1}
                </Label>
                {questions.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveQuestion(index)}
                    className="h-7 w-7 p-0 text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Textarea
                value={item.question}
                onChange={(e) => handleQuestionChange(index, e.target.value)}
                placeholder={`z. B. "Wie gehen Sie mit stressigen Situationen um?" oder "Was bedeutet für Sie gute Teamarbeit?"`}
                className="min-h-[80px] text-sm"
              />
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mt-4 italic">
          💡 Tipp: Diese Fragen helfen Bewerbern, sich auf Gespräche vorzubereiten und zeigen, was Ihnen wichtig ist.
        </p>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <div className="flex gap-2">
            {onBack && (
              <Button variant="outline" onClick={onBack} size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Zurück
              </Button>
            )}
            {onSkip && (
              <Button variant="ghost" onClick={onSkip} size="sm">
                Überspringen
              </Button>
            )}
          </div>
          
          <Button onClick={handleComplete} size="sm" className="bg-primary">
            Speichern
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </Card>
    </div>
  );
}

