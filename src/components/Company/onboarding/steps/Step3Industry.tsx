import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import type { OnboardingData } from '../AppleOnboardingWizard';

interface Step3IndustryProps {
  data: OnboardingData;
  onUpdate: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

// Branchen matching CV Generator and Backend
const BRANCHES = [
  { key: 'handwerk', label: 'Handwerk', desc: 'Bau, Elektro, Sanitär, KFZ und mehr' },
  { key: 'it', label: 'IT & Software', desc: 'Programmierung, Support, Systemadmin' },
  { key: 'gesundheit', label: 'Gesundheit', desc: 'Pflege, Therapie, medizinische Assistenz' },
  { key: 'buero', label: 'Büro & Verwaltung', desc: 'Organisation, Kommunikation, Administration' },
  { key: 'verkauf', label: 'Verkauf & Handel', desc: 'Beratung, Kundenservice, Einzelhandel' },
  { key: 'gastronomie', label: 'Gastronomie', desc: 'Service, Küche, Hotellerie' },
  { key: 'bau', label: 'Bau & Architektur', desc: 'Konstruktion, Planung, Ausführung' }
] as const;

export function Step3Industry({ data, onUpdate, onNext, onBack }: Step3IndustryProps) {
  const isValid = () => {
    return !!data.industry;
  };

  return (
    <div className="flex flex-col h-full space-y-8 overflow-hidden">
      {/* Header */}
      <div className="text-center space-y-3 flex-shrink-0">
        <h2 className="text-3xl font-light text-gray-900 tracking-tight">
          Branche
        </h2>
        <p className="text-lg text-gray-600 leading-relaxed">
          In welcher Branche ist Ihr Unternehmen tätig?
        </p>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 pr-2">
        {/* Industry - Card Grid like CV Generator */}
        <div className="space-y-4">
          <Label className="text-base font-medium">
            Wählen Sie Ihre Branche *
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {BRANCHES.map((branch) => (
              <Card
                key={branch.key}
                className={`p-5 cursor-pointer transition-all duration-300 ease-out rounded-xl hover:shadow-sm hover:scale-[1.02] active:scale-[0.98] ${
                  data.industry === branch.key
                    ? 'ring-2 ring-blue-600 bg-blue-50 shadow-sm'
                    : 'hover:bg-gray-50 border-gray-200'
                }`}
                onClick={() => onUpdate({ industry: branch.key })}
              >
                <div className="text-center">
                  <h3 className="text-sm font-medium mb-2">{branch.label}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{branch.desc}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-shrink-0 flex items-center justify-between pt-4 border-t border-gray-200">
        <Button variant="ghost" onClick={onBack} className="rounded-xl">
          Zurück
        </Button>
        <Button 
          onClick={onNext} 
          disabled={!isValid()}
          className="rounded-xl bg-blue-600 hover:bg-blue-700"
        >
          Weiter
        </Button>
      </div>
    </div>
  );
}

