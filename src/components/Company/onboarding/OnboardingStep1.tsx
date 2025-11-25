import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { OnboardingData } from './OnboardingWizard';
import { useToast } from '@/hooks/use-toast';

interface OnboardingStep1Props {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
}

export function OnboardingStep1({ data, updateData, onNext }: OnboardingStep1Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const validateStep = () => {
    const newErrors: Record<string, string> = {};
    
    if (!data.companyName.trim()) {
      newErrors.companyName = 'Firmenname ist erforderlich';
    }
    if (!data.email.trim()) {
      newErrors.email = 'E-Mail ist erforderlich';
    } else if (!/\S+@\S+\.\S+/.test(data.email)) {
      newErrors.email = 'Gültige E-Mail-Adresse eingeben';
    }
    if (!data.password.trim()) {
      newErrors.password = 'Passwort ist erforderlich';
    } else if (data.password.length < 6) {
      newErrors.password = 'Passwort muss mindestens 6 Zeichen haben';
    }
    if (!data.phone.trim()) {
      newErrors.phone = 'Telefonnummer ist erforderlich';
    }
    if (!data.location.trim()) {
      newErrors.location = 'Standort ist erforderlich';
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
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="companyName">Firmenname *</Label>
          <Input
            id="companyName"
            value={data.companyName}
            onChange={(e) => updateData({ companyName: e.target.value })}
            placeholder="Ihre Firma GmbH"
            className={errors.companyName ? 'border-destructive' : ''}
          />
          {errors.companyName && (
            <p className="text-sm text-destructive">{errors.companyName}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Telefonnummer *</Label>
          <Input
            id="phone"
            value={data.phone}
            onChange={(e) => updateData({ phone: e.target.value })}
            placeholder="+49 123 456789"
            className={errors.phone ? 'border-destructive' : ''}
          />
          {errors.phone && (
            <p className="text-sm text-destructive">{errors.phone}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">E-Mail *</Label>
          <Input
            id="email"
            type="email"
            value={data.email}
            onChange={(e) => updateData({ email: e.target.value })}
            placeholder="kontakt@ihrefirma.de"
            className={errors.email ? 'border-destructive' : ''}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Standort (PLZ + Stadt) *</Label>
          <Input
            id="location"
            value={data.location}
            onChange={(e) => updateData({ location: e.target.value })}
            placeholder="z.B. 10115 Berlin"
            className={errors.location ? 'border-destructive' : ''}
          />
          {errors.location && (
            <p className="text-sm text-destructive">{errors.location}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Passwort *</Label>
          <Input
            id="password"
            type="password"
            value={data.password}
            onChange={(e) => updateData({ password: e.target.value })}
            placeholder="Mindestens 6 Zeichen"
            className={errors.password ? 'border-destructive' : ''}
          />
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Passwort bestätigen *</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Passwort wiederholen"
          />
        </div>
      </div>

      <div className="flex justify-end pt-6">
        <Button 
          onClick={handleNext}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground px-8"
        >
          Weiter
        </Button>
      </div>
    </div>
  );
}
