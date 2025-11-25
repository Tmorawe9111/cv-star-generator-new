import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { OnboardingData } from '../AppleOnboardingWizard';

interface Step4LocationProps {
  data: OnboardingData;
  onUpdate: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const COUNTRIES = [
  { code: 'DE', name: 'Deutschland' },
  { code: 'AT', name: 'Österreich' },
  { code: 'CH', name: 'Schweiz' },
];

export function Step4Location({ data, onUpdate, onNext, onBack }: Step4LocationProps) {
  const [isLoadingCity, setIsLoadingCity] = useState(false);

  // Auto-fill city when PLZ changes (5 digits)
  const handlePostalCodeChange = async (value: string) => {
    onUpdate({ zipCode: value });
    
    // Only lookup if 5 digits
    if (/^\d{5}$/.test(value)) {
      setIsLoadingCity(true);
      try {
        const { data: plzData } = await supabase
          .from('postal_codes')
          .select('ort')
          .eq('plz', value)
          .limit(1)
          .single();
        
        if (plzData?.ort) {
          onUpdate({ zipCode: value, city: plzData.ort });
        }
      } catch (e) {
        console.log('PLZ not found:', value);
      } finally {
        setIsLoadingCity(false);
      }
    }
  };

  const isValid = () => {
    return !!data.city && !!data.zipCode && !!data.country && !!data.street && !!data.streetNumber;
  };

  return (
    <div className="flex flex-col h-full space-y-8 overflow-hidden">
      {/* Header */}
      <div className="text-center space-y-3 flex-shrink-0">
        <h2 className="text-3xl font-light text-gray-900 tracking-tight">
          Hauptstandort
        </h2>
        <p className="text-lg text-gray-600 leading-relaxed">
          Wo befindet sich Ihr Unternehmen?
        </p>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto min-h-0 pr-2">
        {/* Country Dropdown */}
        <div className="space-y-2">
          <Label htmlFor="country" className="text-sm font-medium">
            Land *
          </Label>
          <Select
            value={data.country || 'DE'}
            onValueChange={(value) => onUpdate({ country: value })}
          >
            <SelectTrigger id="country" className="h-12 rounded-xl">
              <SelectValue placeholder="Land auswählen" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* PLZ & City */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="zipCode" className="text-sm font-medium">
              PLZ *
            </Label>
            <Input
              id="zipCode"
              placeholder="10115"
              value={data.zipCode || ''}
              onChange={(e) => handlePostalCodeChange(e.target.value)}
              maxLength={5}
              className="h-12 rounded-xl"
            />
          </div>
          
          <div className="col-span-2 space-y-2">
            <Label htmlFor="city" className="text-sm font-medium flex items-center gap-2">
              Stadt *
              {isLoadingCity && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
            </Label>
            <Input
              id="city"
              placeholder="Wird automatisch ausgefüllt"
              value={data.city || ''}
              onChange={(e) => onUpdate({ city: e.target.value })}
              className="h-12 rounded-xl"
            />
          </div>
        </div>
        
        {/* Street & House Number */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-2">
            <Label htmlFor="street" className="text-sm font-medium">
              Straße *
            </Label>
            <Input
              id="street"
              placeholder="Musterstraße"
              value={data.street || ''}
              onChange={(e) => onUpdate({ street: e.target.value })}
              className="h-12 rounded-xl"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="streetNumber" className="text-sm font-medium">
              Nr. *
            </Label>
            <Input
              id="streetNumber"
              placeholder="123"
              value={data.streetNumber || ''}
              onChange={(e) => onUpdate({ streetNumber: e.target.value })}
              className="h-12 rounded-xl"
            />
          </div>
        </div>

        <p className="text-xs text-gray-500 flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          Dieser Standort wird als Ihr Hauptstandort gespeichert. Weitere Standorte können Sie später hinzufügen.
        </p>
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

