import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { OnboardingPopup } from './OnboardingPopup';

interface TargetGroupSelectorProps {
  onNext: (groups: string[]) => void;
  onSkip?: () => void;
  stepNumber?: number;
  totalSteps?: number;
}

const targetGroups = [
  { id: 'schueler', label: 'Schüler:innen', desc: 'Schüler für Praktika & Ausbildung', emoji: '🎓' },
  { id: 'azubis', label: 'Azubis', desc: 'Auszubildende suchen', emoji: '👨‍🎓' },
  { id: 'gesellen', label: 'Gesellen/Fachkräfte', desc: 'Fertig ausgebildete Fachkräfte', emoji: '⚒️' }
];

export function TargetGroupSelector({ onNext, onSkip, stepNumber, totalSteps }: TargetGroupSelectorProps) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggleGroup = (groupId: string) => {
    setSelected(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  return (
    <OnboardingPopup onSkip={onSkip} showSkip={!!onSkip} stepNumber={stepNumber} totalSteps={totalSteps}>
      <div className="p-8">
        <h2 className="text-3xl font-bold mb-2">Wen suchen Sie?</h2>
        <p className="text-muted-foreground mb-6">
          Wählen Sie die Zielgruppen aus, die Sie mit BeVisiblle erreichen möchten (Mehrfachauswahl möglich)
        </p>

        <div className="space-y-3 mb-6">
          {targetGroups.map(group => (
            <Card key={group.id} className="p-4">
              <div className="flex items-center gap-3">
                <Checkbox
                  id={group.id}
                  checked={selected.includes(group.id)}
                  onCheckedChange={() => toggleGroup(group.id)}
                />
                <span className="text-2xl">{group.emoji}</span>
                <div className="flex-1">
                  <Label htmlFor={group.id} className="font-semibold cursor-pointer">
                    {group.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">{group.desc}</p>
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
            onClick={() => onNext(selected)}
            disabled={selected.length === 0}
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
