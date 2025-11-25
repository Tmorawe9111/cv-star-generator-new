import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { LocationAutocomplete } from '@/components/Company/LocationAutocomplete';
import { parseLocation } from '@/lib/location-utils';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface AddressData {
  zip: string;
  city: string;
  street?: string;
  houseNo?: string;
  lat?: number;
  lng?: number;
}

interface AddressConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: AddressData;
  onConfirm: (data: AddressData) => Promise<void>;
}

export function AddressConfirmModal({ open, onOpenChange, initialData, onConfirm }: AddressConfirmModalProps) {
  // Combine zip and city into location string for LocationAutocomplete
  const getLocationString = (zip: string, city: string) => {
    if (zip && city) return `${zip} ${city}`;
    if (city) return city;
    return '';
  };

  const [locationString, setLocationString] = useState(
    getLocationString(initialData.zip, initialData.city)
  );
  const [data, setData] = useState<AddressData>(initialData);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const { toast } = useToast();

  // Update location string when zip or city changes
  React.useEffect(() => {
    setLocationString(getLocationString(data.zip, data.city));
  }, [data.zip, data.city]);

  const handleLocationChange = (value: string) => {
    setLocationString(value);
    const { postalCode, city } = parseLocation(value);
    setData(prev => ({ 
      ...prev, 
      zip: postalCode, 
      city: city || value 
    }));
    // Reset validation error when user changes input
    setValidationError(null);
  };

  // Validate PLZ against database
  const validatePostalCode = async (postalCode: string, city: string): Promise<boolean> => {
    if (!postalCode || postalCode.trim() === '') {
      setValidationError('Bitte geben Sie eine PLZ ein.');
      return false;
    }

    if (!city || city.trim() === '') {
      setValidationError('Bitte geben Sie eine Stadt ein.');
      return false;
    }

    setValidating(true);
    try {
      // Check if PLZ exists in postal_codes table
      const { data: postalData, error } = await supabase
        .from('postal_codes')
        .select('plz, ort')
        .eq('plz', postalCode.trim())
        .limit(1);

      if (error) {
        console.error('Error validating postal code:', error);
        setValidationError('Fehler bei der Validierung. Bitte versuchen Sie es erneut.');
        return false;
      }

      if (!postalData || postalData.length === 0) {
        setValidationError(`Die PLZ ${postalCode} existiert nicht in unserer Datenbank. Bitte geben Sie eine gültige PLZ ein.`);
        return false;
      }

      // Check if city matches (case-insensitive)
      const postalCity = postalData[0].ort?.toLowerCase().trim();
      const inputCity = city.toLowerCase().trim();
      
      if (postalCity && !postalCity.includes(inputCity) && !inputCity.includes(postalCity)) {
        setValidationError(`Die PLZ ${postalCode} gehört nicht zu ${city}. Bitte korrigieren Sie die Eingabe.`);
        return false;
      }

      // Validation successful
      setValidationError(null);
      return true;
    } catch (error) {
      console.error('Error validating postal code:', error);
      setValidationError('Fehler bei der Validierung. Bitte versuchen Sie es erneut.');
      return false;
    } finally {
      setValidating(false);
    }
  };

  const isValid = () => {
    // PLZ and city are required
    return data.zip.trim() !== '' && data.city.trim() !== '' && !validationError;
  };

  const handleConfirm = async () => {
    // Validate PLZ and city before saving
    const isValidPostalCode = await validatePostalCode(data.zip, data.city);
    
    if (!isValidPostalCode) {
      return; // Error message is already set by validatePostalCode
    }

    if (!isValid()) {
      toast({
        title: "Ungültige Daten",
        description: "Bitte geben Sie eine gültige PLZ und Stadt ein.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await onConfirm(data);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Die Adresse konnte nicht gespeichert werden.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Prevent closing modal without validation
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Don't allow closing - address confirmation is required
      toast({
        title: "Adresse bestätigen erforderlich",
        description: "Bitte bestätigen Sie Ihre Adresse, um fortzufahren.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent 
        className="w-[min(560px,92vw)] max-h-[90dvh] overflow-auto p-4 sm:p-6"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Adresse bestätigen</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Wir gleichen deine PLZ mit unserer Datenbank ab, um Ort & Radius-Matching zu aktivieren.
          </p>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-1">
            <Label htmlFor="location">Standort (PLZ & Stadt) *</Label>
            <LocationAutocomplete
              id="location"
              value={locationString}
              onChange={handleLocationChange}
              placeholder="z. B. 10115 Berlin oder Berlin"
              className={cn(
                validationError && "border-red-500 focus-visible:ring-red-500"
              )}
            />
            {validationError && (
              <p className="text-xs text-red-500 font-medium mt-1">
                {validationError}
              </p>
            )}
            {!validationError && (
              <p className="text-xs text-muted-foreground">
                Geben Sie PLZ und Stadt ein für präzise Standortangabe und Radius-Matching. Die Datenbank wird den Standort validieren.
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="street">Straße</Label>
            <Input
              id="street"
              value={data.street || ''}
              onChange={(e) => setData(prev => ({ ...prev, street: e.target.value }))}
              placeholder="Musterstraße"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="houseNo">Hausnummer</Label>
            <Input
              id="houseNo"
              value={data.houseNo || ''}
              onChange={(e) => setData(prev => ({ ...prev, houseNo: e.target.value }))}
              placeholder="123"
              className="mt-1"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <Button
            onClick={handleConfirm}
            disabled={!isValid() || loading || validating}
            className="flex-1 min-h-[44px]"
          >
            {loading ? "Wird gespeichert..." : validating ? "Wird validiert..." : "Bestätigen & Speichern"}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          Wir speichern die PLZ und den Ort für das Matching im Radius. Keine Weitergabe an Dritte.
        </p>
      </DialogContent>
    </Dialog>
  );
}