import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, CalendarIcon, Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { OnboardingData } from './OnboardingWizard';
import { PLZOrtSelector } from '@/components/shared/PLZOrtSelector';
import { useToast } from '@/hooks/use-toast';
import { LocationAutocomplete } from '@/components/Company/LocationAutocomplete';

interface OnboardingStep5Props {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function OnboardingStep5({ data, updateData, onNext, onPrev }: OnboardingStep5Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const requirementOptions = [
    'Hauptschulabschluss',
    'Realschulabschluss',
    'Abitur',
    'Führerschein B',
    'Führerschein CE',
    'Deutsch (B2)',
    'Englisch (B1)',
    'Handwerkliche Vorerfahrung',
    'IT-Grundkenntnisse',
    'Teamfähigkeit'
  ];

  const handleRequirementChange = (requirement: string, checked: boolean) => {
    const newRequirements = checked 
      ? [...data.requirements, requirement]
      : data.requirements.filter(r => r !== requirement);
    updateData({ requirements: newRequirements });
  };

  const validateStep = () => {
    const newErrors: Record<string, string> = {};
    
    if (!data.jobTitle.trim()) {
      newErrors.jobTitle = 'Berufsbezeichnung ist erforderlich';
    }
    if (data.positions < 1) {
      newErrors.positions = 'Mindestens 1 Stelle erforderlich';
    }
    if (!data.jobLocation.trim()) {
      newErrors.jobLocation = 'Standort ist erforderlich';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      onNext();
    } else {
      toast({
        title: "Bitte alle Pflichtfelder ausfüllen",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="mx-auto w-16 h-16 bg-[hsl(var(--accent))] rounded-full flex items-center justify-center mb-4">
          <Briefcase className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">Erstes Anforderungsprofil</h2>
        <p className="text-muted-foreground">
          Erstellen Sie Ihr erstes Stellenprofil und sehen Sie passende Kandidaten
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
        {/* Job Title */}
        <div className="space-y-2">
          <Label htmlFor="jobTitle">Berufsbezeichnung *</Label>
          <Input
            id="jobTitle"
            value={data.jobTitle}
            onChange={(e) => updateData({ jobTitle: e.target.value })}
            placeholder="z.B. Elektroniker/in für Betriebstechnik"
            className={errors.jobTitle ? 'border-destructive' : ''}
          />
          {errors.jobTitle && (
            <p className="text-sm text-destructive">{errors.jobTitle}</p>
          )}
        </div>

        {/* Number of Positions */}
        <div className="space-y-2">
          <Label htmlFor="positions">Anzahl Stellen *</Label>
          <Input
            id="positions"
            type="number"
            min="1"
            value={data.positions}
            onChange={(e) => updateData({ positions: parseInt(e.target.value) || 1 })}
            className={errors.positions ? 'border-destructive' : ''}
          />
          {errors.positions && (
            <p className="text-sm text-destructive">{errors.positions}</p>
          )}
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label>Standort (PLZ & Stadt) *</Label>
          <LocationAutocomplete
            value={data.jobLocation}
            onChange={(value) => updateData({ jobLocation: value })}
            placeholder="z. B. 10115 Berlin oder Berlin"
            className={errors.jobLocation ? 'border-destructive' : ''}
          />
          {errors.jobLocation && (
            <p className="text-sm text-destructive">{errors.jobLocation}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Geben Sie PLZ und Stadt ein für präzise Standortangabe
          </p>
        </div>

        {/* Start Date */}
        <div className="space-y-2">
          <Label>Startdatum</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !data.startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {data.startDate ? (
                  format(data.startDate, "dd.MM.yyyy", { locale: de })
                ) : (
                  <span>Datum wählen</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={data.startDate || undefined}
                onSelect={(date) => updateData({ startDate: date || null })}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
                locale={de}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Requirements */}
        <div className="md:col-span-2 space-y-4">
          <Label>Anforderungen</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {requirementOptions.map((requirement) => (
              <div key={requirement} className="flex items-center space-x-2">
                <Checkbox
                  id={requirement}
                  checked={data.requirements.includes(requirement)}
                  onCheckedChange={(checked) => handleRequirementChange(requirement, checked as boolean)}
                />
                <Label htmlFor={requirement} className="text-sm">
                  {requirement}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-muted/50 rounded-lg p-6 space-y-3">
          <h3 className="font-semibold text-center mb-4">Zusammenfassung</h3>
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Position:</span>
              <span>{data.jobTitle || 'Nicht angegeben'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Anzahl:</span>
              <span>{data.positions} Stelle{data.positions > 1 ? 'n' : ''}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Standort:</span>
              <span>{data.jobLocation || 'Nicht angegeben'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Start:</span>
              <span>
                {data.startDate 
                  ? format(data.startDate, "dd.MM.yyyy", { locale: de })
                  : 'Flexibel'
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Anforderungen:</span>
              <span>{data.requirements.length} ausgewählt</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onPrev}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück
        </Button>
        
        <Button 
          onClick={handleNext}
          className="bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent-hover))] text-white px-8"
        >
          Weiter
        </Button>
      </div>
    </div>
  );
}