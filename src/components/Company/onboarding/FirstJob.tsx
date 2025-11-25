import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { OnboardingPopup } from './OnboardingPopup';
import { Briefcase, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FirstJobProps {
  onNext: () => void;
  onSkip: () => void;
  stepNumber: number;
  totalSteps: number;
  hasJob?: boolean;
}

export function FirstJob({ onNext, onSkip, stepNumber, totalSteps, hasJob }: FirstJobProps) {
  const navigate = useNavigate();

  const handleCreateJob = () => {
    navigate('/unternehmen/stellenanzeigen/neu');
    onNext();
  };

  const handleSkip = () => {
    onSkip();
  };

  if (hasJob) {
    return (
      <OnboardingPopup onSkip={onSkip} showSkip={false} stepNumber={stepNumber} totalSteps={totalSteps}>
        <div className="p-8">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Stellenanzeige erstellt! ✅</h2>
            <p className="text-muted-foreground">
              Großartig! Sie haben bereits eine Stellenanzeige erstellt.
            </p>
          </div>

          <Button
            onClick={onNext}
            className="w-full"
            size="lg"
          >
            Weiter
          </Button>
        </div>
      </OnboardingPopup>
    );
  }

  return (
    <OnboardingPopup onSkip={onSkip} showSkip={true} stepNumber={stepNumber} totalSteps={totalSteps}>
      <div className="p-8">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-3xl font-bold mb-2">Erste Stellenanzeige erstellen</h2>
          <p className="text-muted-foreground">
            Erstellen Sie Ihre erste Stellenanzeige und erreichen Sie passende Kandidaten
          </p>
        </div>

        <Card className="p-6 mb-6 bg-primary/5 border-primary/20">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 text-white font-semibold">
                1
              </div>
              <div>
                <h3 className="font-semibold mb-1">Stellenanzeige verfassen</h3>
                <p className="text-sm text-muted-foreground">
                  Beschreiben Sie die Position, Anforderungen und was Sie bieten
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 text-white font-semibold">
                2
              </div>
              <div>
                <h3 className="font-semibold mb-1">Automatisches Matching</h3>
                <p className="text-sm text-muted-foreground">
                  BeVisiblle findet automatisch passende Kandidaten für Sie
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 text-white font-semibold">
                3
              </div>
              <div>
                <h3 className="font-semibold mb-1">Kandidaten kontaktieren</h3>
                <p className="text-sm text-muted-foreground">
                  Kontaktieren Sie interessante Kandidaten direkt über BeVisiblle
                </p>
              </div>
            </div>
          </div>
        </Card>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleSkip}
            className="flex-1"
          >
            Überspringen
          </Button>
          <Button
            onClick={handleCreateJob}
            className="flex-1"
            size="lg"
          >
            Stellenanzeige erstellen
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <p className="text-sm text-center text-muted-foreground mt-4">
          Sie können dies auch später in der Job-Verwaltung tun
        </p>
      </div>
    </OnboardingPopup>
  );
}

