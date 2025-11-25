import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle2, Loader2 } from 'lucide-react';
import type { OnboardingData } from '../AppleOnboardingWizard';

interface Step5ActivationProps {
  data: OnboardingData;
  onUpdate: (data: Partial<OnboardingData>) => void;
  onComplete: () => void;
  onBack: () => void;
  loading: boolean;
}

const EMPLOYMENT_TYPES = [
  { value: 'full-time', label: 'Vollzeit' },
  { value: 'part-time', label: 'Teilzeit' },
  { value: 'contract', label: 'Befristet' },
  { value: 'internship', label: 'Praktikum' },
];

export function Step5Activation({ data, onUpdate, onComplete, onBack, loading }: Step5ActivationProps) {
  const [skipJob, setSkipJob] = useState(false);

  // Free plan: Show success and redirect
  if (data.selectedPlan === 'free') {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-10 text-center">
        <div className="space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          
          <h2 className="text-4xl font-light text-gray-900 tracking-tight">
            Willkommen bei BeVisiblle!
          </h2>
          
          <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
            Ihr kostenloses Konto wurde erfolgreich eingerichtet. Sie können jetzt loslegen und Ihr Unternehmensprofil erkunden.
          </p>
        </div>

        <Button
          onClick={onComplete}
          size="lg"
          className="px-8"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Wird geladen...
            </>
          ) : (
            'Zum Dashboard'
          )}
        </Button>
      </div>
    );
  }

  // Paid plan: Show job posting form
  const isValid = () => {
    if (skipJob) return true;
    return !!data.jobTitle && !!data.employmentType;
  };

  return (
    <div className="flex flex-col h-full space-y-8 overflow-hidden">
      {/* Header */}
      <div className="text-center space-y-3 flex-shrink-0">
        <h2 className="text-3xl font-light text-gray-900 tracking-tight">
          Erste Stellenanzeige erstellen
        </h2>
        <p className="text-lg text-gray-600 leading-relaxed">
          Erstellen Sie Ihre erste Stellenanzeige oder überspringen Sie diesen Schritt
        </p>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto min-h-0 pr-2">
        {/* Skip Option */}
        <div className="flex items-center space-x-2 p-4 rounded-lg border border-gray-200">
          <Checkbox
            id="skipJob"
            checked={skipJob}
            onCheckedChange={(checked) => setSkipJob(checked === true)}
          />
          <Label htmlFor="skipJob" className="text-sm font-normal cursor-pointer">
            Stellenanzeige später erstellen
          </Label>
        </div>

        {!skipJob && (
          <>
            {/* Job Title */}
            <div className="space-y-2">
              <Label htmlFor="jobTitle" className="text-base font-medium">
                Stellenbezeichnung *
              </Label>
              <Input
                id="jobTitle"
                placeholder="z. B. Software Engineer, Marketing Manager"
                value={data.jobTitle || ''}
                onChange={(e) => onUpdate({ jobTitle: e.target.value })}
              />
            </div>

            {/* Employment Type */}
            <div className="space-y-2">
              <Label htmlFor="employmentType" className="text-base font-medium">
                Beschäftigungsart *
              </Label>
              <Select
                value={data.employmentType || ''}
                onValueChange={(value: any) => onUpdate({ employmentType: value })}
              >
                <SelectTrigger id="employmentType">
                  <SelectValue placeholder="Wählen Sie eine Beschäftigungsart" />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="jobLocation" className="text-base font-medium">
                Standort
              </Label>
              <Input
                id="jobLocation"
                placeholder="z. B. Berlin, München, Remote"
                value={data.jobLocation || ''}
                onChange={(e) => onUpdate({ jobLocation: e.target.value })}
              />
            </div>

            {/* Remote Option */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remote"
                checked={data.remote || false}
                onCheckedChange={(checked) => onUpdate({ remote: checked === true })}
              />
              <Label htmlFor="remote" className="text-sm font-normal cursor-pointer">
                Remote möglich
              </Label>
            </div>
          </>
        )}
      </div>

      {/* Navigation - Always visible at bottom */}
      <div className="flex-shrink-0 flex items-center justify-between pt-4 border-t border-gray-200">
        <Button variant="ghost" onClick={onBack} disabled={loading}>
          Zurück
        </Button>
        <Button onClick={onComplete} disabled={!isValid() || loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Wird gespeichert...
            </>
          ) : (
            'Als Entwurf speichern & Dashboard öffnen'
          )}
        </Button>
      </div>
    </div>
  );
}

