import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const COMPANY_VALUES_QUESTIONS = [
  {
    key: 'q1_important_values',
    question: 'Welche Werte sind in Ihrem Unternehmen besonders wichtig?',
    placeholder: 'z. B. Respekt, Zuverlässigkeit, Teamarbeit, Verantwortungsbewusstsein, Offenheit...',
    tip: 'Beschreiben Sie die Kernwerte, die in Ihrem Unternehmen gelebt werden.'
  },
  {
    key: 'q2_team_collaboration',
    question: 'Wie sieht bei Ihnen eine gute Zusammenarbeit im Team aus?',
    placeholder: 'Beschreiben Sie, wie Teams bei Ihnen zusammenarbeiten und was Ihnen wichtig ist...',
    tip: 'Denken Sie an konkrete Beispiele aus Ihrem Arbeitsalltag.'
  },
  {
    key: 'q3_handling_mistakes',
    question: 'Wie gehen Sie mit Fehlern oder schwierigen Situationen um?',
    placeholder: 'Erklären Sie Ihren Umgang mit Fehlern und wie Sie daraus lernen...',
    tip: 'Bewerber möchten wissen, ob Fehler als Lernchance gesehen werden.'
  },
  {
    key: 'q4_desired_traits',
    question: 'Welche Eigenschaften sind Ihnen bei neuen Mitarbeitenden besonders wichtig?',
    placeholder: 'Nennen Sie die wichtigsten Eigenschaften, die neue Mitarbeitende mitbringen sollten...',
    tip: 'Fokussieren Sie sich auf 3-5 Kern-Eigenschaften.'
  },
  {
    key: 'q5_long_term_motivation',
    question: 'Was motiviert Mitarbeitende in Ihrem Unternehmen langfristig?',
    placeholder: 'Beschreiben Sie, was Mitarbeitende bei Ihnen langfristig motiviert...',
    tip: 'Denken Sie an Entwicklungsmöglichkeiten, Anerkennung, Work-Life-Balance etc.'
  }
];

interface CompanyValuesStepperProps {
  initialValues?: Record<string, string>;
  onComplete: (values: Record<string, string>) => void;
  onSkip?: () => void;
}

export function CompanyValuesStepper({ initialValues = {}, onComplete, onSkip }: CompanyValuesStepperProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [values, setValues] = useState<Record<string, string>>(initialValues);

  const currentQuestion = COMPANY_VALUES_QUESTIONS[currentStep];
  const progress = ((currentStep + 1) / COMPANY_VALUES_QUESTIONS.length) * 100;

  const handleNext = () => {
    if (currentStep < COMPANY_VALUES_QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(values);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Frage {currentStep + 1} von {COMPANY_VALUES_QUESTIONS.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question Card */}
      <Card className="p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold mb-4">
          {currentQuestion.question}
        </h3>
        
        <Textarea
          value={values[currentQuestion.key] || ''}
          onChange={(e) => setValues(prev => ({ ...prev, [currentQuestion.key]: e.target.value }))}
          placeholder={currentQuestion.placeholder}
          className="min-h-[120px] text-sm"
        />

        {!values[currentQuestion.key]?.trim() && (
          <p className="text-xs text-muted-foreground mt-2 italic">
            💡 Tipp: {currentQuestion.tip}
          </p>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="outline" onClick={handleBack} size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Zurück
              </Button>
            )}
            {onSkip && (
              <Button variant="ghost" onClick={handleSkip} size="sm">
                Überspringen
              </Button>
            )}
          </div>
          
          <Button 
            onClick={handleNext} 
            size="sm"
            className="bg-primary"
          >
            {currentStep === COMPANY_VALUES_QUESTIONS.length - 1 ? 'Fertig' : 'Weiter'}
            {currentStep < COMPANY_VALUES_QUESTIONS.length - 1 && (
              <ArrowRight className="h-4 w-4 ml-1" />
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}

