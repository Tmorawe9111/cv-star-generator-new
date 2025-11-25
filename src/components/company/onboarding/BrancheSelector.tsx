import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OnboardingPopup } from './OnboardingPopup';
import { BRANCHES } from '@/lib/branches';

interface BrancheSelectorProps {
  onNext: (industry: string) => void;
  onSkip?: () => void;
  stepNumber?: number;
  totalSteps?: number;
}

// Use centralized branch definitions
const branches = BRANCHES.map(branch => ({
  key: branch.key,
  emoji: branch.emoji || '',
  title: branch.label,
  desc: branch.desc || ''
}));

export function BrancheSelector({ onNext, onSkip, stepNumber, totalSteps }: BrancheSelectorProps) {
  const [selected, setSelected] = useState<string>('');

  return (
    <OnboardingPopup onSkip={onSkip} showSkip={!!onSkip} stepNumber={stepNumber} totalSteps={totalSteps}>
      <div className="p-8">
        <h2 className="text-3xl font-bold mb-2">Willkommen bei BeVisiblle! 👋</h2>
        <p className="text-muted-foreground mb-6">
          In welcher Branche ist Ihr Unternehmen tätig?
        </p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {branches.map(branch => (
            <Card
              key={branch.key}
              className={`p-4 cursor-pointer transition-all hover:border-primary ${
                selected === branch.key ? 'border-primary bg-primary/5' : ''
              }`}
              onClick={() => setSelected(branch.key)}
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl">{branch.emoji}</span>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{branch.title}</h3>
                  <p className="text-sm text-muted-foreground">{branch.desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="flex gap-3">
          {onSkip && (
            <Button
              variant="outline"
              onClick={onSkip}
              className="flex-1"
            >
              Überspringen
            </Button>
          )}
          <Button
            onClick={() => selected && onNext(selected)}
            disabled={!selected}
            className={onSkip ? "flex-1" : "w-full"}
            size="lg"
          >
            Weiter
          </Button>
        </div>
      </div>
    </OnboardingPopup>
  );
}
