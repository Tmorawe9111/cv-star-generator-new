import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const VALUES_QUESTIONS = [
  {
    question: 'Was ist dir in einem Team am wichtigsten – und warum?',
    placeholder: 'Beispiel: Offene Kommunikation ist mir wichtig, weil ich so besser mit meinen Kollegen zusammenarbeiten kann und wir gemeinsam Probleme lösen können.'
  },
  {
    question: 'Wie möchtest du behandelt werden, wenn etwas nicht gut läuft?',
    placeholder: 'Beispiel: Ich schätze konstruktives Feedback, das mir zeigt, was ich verbessern kann, ohne dass ich mich dabei schlecht fühle.'
  },
  {
    question: 'Worauf können Kollegen und Vorgesetzte sich bei dir verlassen?',
    placeholder: 'Beispiel: Sie können sich darauf verlassen, dass ich meine Aufgaben pünktlich und zuverlässig erledige und bei Problemen proaktiv nach Lösungen suche.'
  },
  {
    question: 'Was motiviert dich langfristig in einem Job?',
    placeholder: 'Beispiel: Langfristig motiviert mich die Möglichkeit, mich weiterzuentwickeln und neue Fähigkeiten zu lernen, während ich einen sinnvollen Beitrag zum Team leiste.'
  },
  {
    question: 'Wie gehst du mit stressigen Situationen oder Druck um?',
    placeholder: 'Beispiel: Bei Stress bleibe ich ruhig, priorisiere meine Aufgaben und hole mir bei Bedarf Unterstützung von Kollegen, um alles gut zu schaffen.'
  },
  {
    question: 'Welche Art von Arbeitsumgebung bringt dein bestes Potenzial hervor?',
    placeholder: 'Beispiel: Eine Arbeitsumgebung, in der ich selbstständig arbeiten kann, aber auch im Team zusammenarbeiten kann, bringt mein bestes Potenzial hervor.'
  },
  {
    question: 'Was bedeutet für dich „Respekt" am Arbeitsplatz?',
    placeholder: 'Beispiel: Respekt bedeutet für mich, dass jeder mit seinen Ideen gehört wird, fair behandelt wird und dass wir alle auf Augenhöhe zusammenarbeiten.'
  },
  {
    question: 'Was erwartest du grundsätzlich von einem guten Arbeitgeber?',
    placeholder: 'Beispiel: Von einem guten Arbeitgeber erwarte ich faire Behandlung, klare Kommunikation, Entwicklungsmöglichkeiten und ein gutes Arbeitsklima im Team.'
  },
];

interface ValuesStepperProps {
  initialValues?: Record<string, string>;
  onComplete: (values: Record<string, string>) => void;
  onSkip?: () => void;
}

export function ValuesStepper({ initialValues = {}, onComplete, onSkip }: ValuesStepperProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(initialValues);

  const progress = ((currentStep + 1) / VALUES_QUESTIONS.length) * 100;

  const handleNext = () => {
    if (currentStep < VALUES_QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(answers);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateAnswer = (step: number, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [`q${step + 1}`]: value,
    }));
  };

  return (
    <div className="w-full">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>Frage {currentStep + 1} von {VALUES_QUESTIONS.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question Card */}
      <Card className="p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-3">
          {VALUES_QUESTIONS[currentStep].question}
        </h2>

        <div className="relative">
          <Textarea
            value={answers[`q${currentStep + 1}`] || ''}
            onChange={(e) => updateAnswer(currentStep, e.target.value)}
            placeholder={VALUES_QUESTIONS[currentStep].placeholder}
            className="min-h-[150px] resize-none text-sm pr-4"
            autoFocus
          />
          {!answers[`q${currentStep + 1}`] && (
            <p className="text-xs text-muted-foreground mt-1.5 italic">
              💡 Tipp: Schreibe in deinen eigenen Worten, was dir wirklich wichtig ist.
            </p>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
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
              disabled={!answers[`q${currentStep + 1}`]?.trim()}
            >
              {currentStep === VALUES_QUESTIONS.length - 1 ? 'Weiter zum Review' : 'Weiter'}
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

