import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Info } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import type { OnboardingData } from '../AppleOnboardingWizard';

interface Step4ContactPersonProps {
  data: OnboardingData;
  onUpdate: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step4ContactPerson({ data, onUpdate, onNext, onBack }: Step4ContactPersonProps) {
  const { user } = useAuth();

  // Pre-fill from auth context
  useEffect(() => {
    if (user) {
      const firstName = user.user_metadata?.first_name || '';
      const lastName = user.user_metadata?.last_name || '';
      const email = user.email || '';

      if (!data.contactFirstName && firstName) {
        onUpdate({ contactFirstName: firstName });
      }
      if (!data.contactLastName && lastName) {
        onUpdate({ contactLastName: lastName });
      }
      if (!data.contactPublicEmail && email) {
        onUpdate({ contactPublicEmail: email });
      }
    }
  }, [user]);

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValidPhone = (phone: string) => {
    if (!phone) return true; // Optional field
    // Allow various phone formats: +49 123 456789, 0123-456789, etc.
    return /^[\d\s\-+()]{6,20}$/.test(phone.replace(/\s/g, ''));
  };

  const isValid = () => {
    const hasName = !!(data.contactFirstName && data.contactLastName);
    const hasValidEmail = !!data.contactPublicEmail && isValidEmail(data.contactPublicEmail);
    const hasValidPhone = isValidPhone(data.contactPhone || '');
    return hasName && hasValidEmail && hasValidPhone;
  };

  const getPhoneError = () => {
    if (!data.contactPhone) return null;
    if (!isValidPhone(data.contactPhone)) return 'Bitte geben Sie eine gültige Telefonnummer ein';
    return null;
  };

  const getEmailError = () => {
    if (!data.contactPublicEmail) return null;
    if (!isValidEmail(data.contactPublicEmail)) return 'Bitte geben Sie eine gültige E-Mail-Adresse ein';
    return null;
  };

  return (
    <div className="flex flex-col h-full space-y-8 overflow-hidden">
      {/* Header */}
      <div className="text-center space-y-3 flex-shrink-0">
        <h2 className="text-3xl font-light text-gray-900 tracking-tight">
          Kontaktperson
        </h2>
        <p className="text-lg text-gray-600 leading-relaxed">
          Diese Informationen werden für Bewerber sichtbar sein
        </p>
      </div>

      <div className="flex-1 flex flex-col space-y-6 min-h-0 overflow-hidden">
        {/* Info Box */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-5 flex items-start gap-3 flex-shrink-0 shadow-sm">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-900 leading-relaxed">
            <p className="font-medium mb-1.5">Hinweis</p>
            <p>
              Die hier angegebenen Kontaktdaten werden in Ihrem Unternehmensprofil angezeigt und sind für Bewerber sichtbar.
              Sie können diese später jederzeit in den Einstellungen ändern.
            </p>
          </div>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto min-h-0 pr-2">
        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-base font-medium">
              Vorname *
            </Label>
            <Input
              id="firstName"
              placeholder="Max"
              value={data.contactFirstName || ''}
              onChange={(e) => onUpdate({ contactFirstName: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-base font-medium">
              Nachname *
            </Label>
            <Input
              id="lastName"
              placeholder="Mustermann"
              value={data.contactLastName || ''}
              onChange={(e) => onUpdate({ contactLastName: e.target.value })}
              required
            />
          </div>
        </div>

        {/* Job Title */}
        <div className="space-y-2">
          <Label htmlFor="jobTitle" className="text-base font-medium">
            Position / Jobtitel
          </Label>
          <Input
            id="jobTitle"
            placeholder="z. B. HR Manager, Recruiter, Talent Acquisition"
            value={data.contactJobTitle || ''}
            onChange={(e) => onUpdate({ contactJobTitle: e.target.value })}
          />
          <p className="text-sm text-gray-500">
            Ihre Position im Unternehmen
          </p>
        </div>

        {/* Public Email */}
        <div className="space-y-2">
          <Label htmlFor="publicEmail" className="text-base font-medium">
            Öffentliche E-Mail-Adresse *
          </Label>
          <Input
            id="publicEmail"
            type="email"
            placeholder="kontakt@unternehmen.de"
            value={data.contactPublicEmail || ''}
            onChange={(e) => onUpdate({ contactPublicEmail: e.target.value })}
            className={getEmailError() ? 'border-red-500' : ''}
            required
          />
          {getEmailError() ? (
            <p className="text-sm text-red-500">{getEmailError()}</p>
          ) : (
            <p className="text-sm text-gray-500">
              Diese E-Mail wird in Ihrem Profil angezeigt. Kann von Ihrer Login-E-Mail abweichen.
            </p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-base font-medium">
            Telefonnummer (Optional)
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+49 123 456789"
            value={data.contactPhone || ''}
            onChange={(e) => onUpdate({ contactPhone: e.target.value })}
            className={getPhoneError() ? 'border-red-500' : ''}
          />
          {getPhoneError() ? (
            <p className="text-sm text-red-500">{getPhoneError()}</p>
          ) : (
            <p className="text-sm text-gray-500">
              Optional: Telefonnummer für direkten Kontakt
            </p>
          )}
        </div>
        </div>
      </div>

      {/* Navigation - Always visible at bottom */}
      <div className="flex-shrink-0 flex items-center justify-between pt-4 border-t border-gray-200">
        <Button variant="ghost" onClick={onBack}>
          Zurück
        </Button>
        <Button onClick={onNext} disabled={!isValid()}>
          Weiter
        </Button>
      </div>
    </div>
  );
}

