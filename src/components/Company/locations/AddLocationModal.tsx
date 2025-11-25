import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Building2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { CompanyLocation, LocationFormData } from './types';
import { EMPTY_LOCATION_FORM } from './types';

const COUNTRIES = [
  { code: 'DE', name: 'Deutschland' },
  { code: 'AT', name: 'Österreich' },
  { code: 'CH', name: 'Schweiz' },
];

interface AddLocationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  editLocation?: CompanyLocation | null;
  onSuccess: () => void;
  isFirstLocation?: boolean;
}

export function AddLocationModal({
  open,
  onOpenChange,
  companyId,
  editLocation,
  onSuccess,
  isFirstLocation = false,
}: AddLocationModalProps) {
  const [formData, setFormData] = useState<LocationFormData>(EMPTY_LOCATION_FORM);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCity, setIsLoadingCity] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof LocationFormData, string>>>({});

  const isEditMode = !!editLocation;

  useEffect(() => {
    if (editLocation) {
      setFormData({
        name: editLocation.name || '',
        street: editLocation.street || '',
        house_number: editLocation.house_number || '',
        postal_code: editLocation.postal_code || '',
        city: editLocation.city || '',
        country: editLocation.country || 'Deutschland',
        is_primary: editLocation.is_primary,
      });
    } else {
      setFormData({
        ...EMPTY_LOCATION_FORM,
        is_primary: isFirstLocation,
      });
    }
    setErrors({});
  }, [editLocation, open, isFirstLocation]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof LocationFormData, string>> = {};

    if (!formData.postal_code.trim()) {
      newErrors.postal_code = 'PLZ ist erforderlich';
    } else if (!/^\d{5}$/.test(formData.postal_code.trim())) {
      newErrors.postal_code = 'Bitte geben Sie eine gültige 5-stellige PLZ ein';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'Stadt ist erforderlich';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const geocodeAddress = async () => {
    const address = [
      formData.street,
      formData.house_number,
      formData.postal_code,
      formData.city,
      formData.country,
    ].filter(Boolean).join(' ');

    try {
      const { data } = await supabase
        .from('postal_codes')
        .select('latitude, longitude')
        .eq('plz', formData.postal_code)
        .single();

      if (data?.latitude && data?.longitude) {
        return { lat: data.latitude, lon: data.longitude };
      }
    } catch (e) {
      console.warn('Geocoding failed:', e);
    }

    return { lat: null, lon: null };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    setIsLoading(true);

    try {
      const coords = await geocodeAddress();

      const locationData = {
        company_id: companyId,
        name: formData.name.trim() || null,
        street: formData.street.trim() || null,
        house_number: formData.house_number.trim() || null,
        postal_code: formData.postal_code.trim(),
        city: formData.city.trim(),
        country: formData.country.trim() || 'Deutschland',
        is_primary: formData.is_primary,
        lat: coords.lat,
        lon: coords.lon,
      };

      if (isEditMode && editLocation) {
        const { error } = await supabase
          .from('company_locations')
          .update(locationData)
          .eq('id', editLocation.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('company_locations')
          .insert(locationData);

        if (error) throw error;
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving location:', error);
      setErrors({ city: error.message || 'Fehler beim Speichern' });
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: keyof LocationFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Auto-fill city when PLZ changes (5 digits)
  const handlePostalCodeChange = async (value: string) => {
    updateField('postal_code', value);
    
    // Only lookup if 5 digits
    if (/^\d{5}$/.test(value)) {
      setIsLoadingCity(true);
      try {
        const { data } = await supabase
          .from('postal_codes')
          .select('ort, latitude, longitude')
          .eq('plz', value)
          .limit(1)
          .single();
        
        if (data?.ort) {
          setFormData(prev => ({ 
            ...prev, 
            city: data.ort,
            postal_code: value 
          }));
        }
      } catch (e) {
        // PLZ not found, user can enter manually
        console.log('PLZ not found:', value);
      } finally {
        setIsLoadingCity(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="px-8 pt-8 pb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              {isEditMode ? (
                <Building2 className="w-6 h-6 text-blue-600" />
              ) : (
                <MapPin className="w-6 h-6 text-blue-600" />
              )}
            </div>
            <div>
              <DialogTitle className="text-2xl font-light text-gray-900">
                {isEditMode ? 'Standort bearbeiten' : 'Neuer Standort'}
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-1">
                {isEditMode 
                  ? 'Aktualisieren Sie die Adressdaten'
                  : 'Fügen Sie einen neuen Unternehmensstandort hinzu'}
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-6">
          {/* Name (optional) */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
              Standortname <span className="text-gray-400">(optional)</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="z.B. Hauptsitz, Filiale Berlin"
              className="h-12 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Street & House Number */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="street" className="text-sm font-medium text-gray-700">
                Straße
              </Label>
              <Input
                id="street"
                value={formData.street}
                onChange={(e) => updateField('street', e.target.value)}
                placeholder="Musterstraße"
                className="h-12 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="house_number" className="text-sm font-medium text-gray-700">
                Nr.
              </Label>
              <Input
                id="house_number"
                value={formData.house_number}
                onChange={(e) => updateField('house_number', e.target.value)}
                placeholder="123"
                className="h-12 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Country Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="country" className="text-sm font-medium text-gray-700">
              Land *
            </Label>
            <Select
              value={formData.country}
              onValueChange={(value) => updateField('country', value)}
            >
              <SelectTrigger className="h-12 rounded-xl border-gray-300">
                <SelectValue placeholder="Land auswählen" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((country) => (
                  <SelectItem key={country.code} value={country.name}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* PLZ & City */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="postal_code" className="text-sm font-medium text-gray-700">
                PLZ *
              </Label>
              <Input
                id="postal_code"
                value={formData.postal_code}
                onChange={(e) => handlePostalCodeChange(e.target.value)}
                placeholder="10115"
                maxLength={5}
                className={`h-12 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                  errors.postal_code ? 'border-red-500' : ''
                }`}
              />
              {errors.postal_code && (
                <p className="text-xs text-red-500">{errors.postal_code}</p>
              )}
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="city" className="text-sm font-medium text-gray-700">
                Stadt * {isLoadingCity && <span className="text-blue-500 text-xs">(wird geladen...)</span>}
              </Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => updateField('city', e.target.value)}
                placeholder="Wird automatisch ausgefüllt"
                className={`h-12 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                  errors.city ? 'border-red-500' : ''
                }`}
              />
              {errors.city && (
                <p className="text-xs text-red-500">{errors.city}</p>
              )}
            </div>
          </div>

          {/* Primary Location Toggle */}
          {!isFirstLocation && (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="font-medium text-gray-900">Hauptstandort</p>
                <p className="text-sm text-gray-500">
                  Wird als primärer Standort angezeigt
                </p>
              </div>
              <Switch
                checked={formData.is_primary}
                onCheckedChange={(checked) => updateField('is_primary', checked)}
                className="data-[state=checked]:bg-blue-600"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-12 rounded-xl border-gray-300 hover:bg-gray-50"
              disabled={isLoading}
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Speichern...
                </>
              ) : (
                isEditMode ? 'Aktualisieren' : 'Hinzufügen'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

