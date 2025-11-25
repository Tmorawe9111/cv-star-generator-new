import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, Building2, Users, Briefcase, Sparkles } from 'lucide-react';
import { OnboardingPopup } from './OnboardingPopup';

interface WelcomePopupProps {
  onComplete: () => void;
  onSkip?: () => void;
  stepNumber?: number;
  totalSteps?: number;
}

const nextSteps = [
  {
    id: 'profile',
    icon: Building2,
    label: 'Unternehmensprofil vervollständigen',
    desc: 'Logo, Beschreibung und Unternehmenskultur hinzufügen'
  },
  {
    id: 'team',
    icon: Users,
    label: 'Team-Mitglieder einladen',
    desc: 'Kollegen zur Zusammenarbeit einladen'
  },
  {
    id: 'job',
    icon: Briefcase,
    label: 'Erste Stellenanzeige erstellen',
    desc: 'Finden Sie die besten Talente für Ihr Team'
  },
  {
    id: 'branding',
    icon: Sparkles,
    label: 'Employer Branding aufbauen',
    desc: 'Zeigen Sie, was Ihr Unternehmen besonders macht'
  }
];

export function WelcomePopup({ onComplete, onSkip, stepNumber, totalSteps }: WelcomePopupProps) {
  return (
    <OnboardingPopup onSkip={onSkip} showSkip={false} stepNumber={stepNumber} totalSteps={totalSteps}>
      <div className="p-8">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-3xl font-bold mb-2">Willkommen bei BeVisiblle! 🎉</h2>
          <p className="text-muted-foreground">
            Ihr Account ist bereit. Hier sind Ihre nächsten Schritte:
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {nextSteps.map(step => {
            const Icon = step.icon;
            return (
              <Card key={step.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{step.label}</h3>
                    <p className="text-sm text-muted-foreground">{step.desc}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <Button
          onClick={onComplete}
          className="w-full"
          size="lg"
        >
          Los geht's!
        </Button>

        <p className="text-sm text-center text-muted-foreground mt-4">
          Sie finden diese Checkliste jederzeit in Ihren Einstellungen
        </p>
      </div>
    </OnboardingPopup>
  );
}
