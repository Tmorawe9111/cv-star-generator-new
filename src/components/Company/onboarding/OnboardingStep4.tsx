import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Upload, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { LocationAutocomplete } from '@/components/Company/LocationAutocomplete';
import { saveCompanyLocation } from '@/lib/location-utils';
import { uploadFile } from '@/lib/supabase-storage';

interface OnboardingStep4Props {
  data: {
    logo_url?: string;
    header_image?: string;
    main_location?: string;
    contact_person?: string;
    contact_position?: string;
    primary_email?: string;
    phone?: string;
    matching_about?: string;
    description?: string;
    employee_count?: number;
    website_url?: string;
    linkedin_url?: string;
    instagram_url?: string;
  };
  updateData: (data: any) => void;
  onNext: () => void;
  onPrev: () => void;
  companyId: string;
}

export function OnboardingStep4({ data, updateData, onNext, onPrev, companyId }: OnboardingStep4Props) {
  const { toast } = useToast();
  const [logoPreview, setLogoPreview] = useState<string | null>(data.logo_url || null);
  const [headerPreview, setHeaderPreview] = useState<string | null>(data.header_image || null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingHeader, setUploadingHeader] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'Datei zu groß',
        description: 'Das Logo darf maximal 2MB groß sein',
        variant: 'destructive',
      });
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast({
        title: 'Ungültiges Format',
        description: 'Nur JPG, PNG und WEBP werden unterstützt',
        variant: 'destructive',
      });
      return;
    }

    setUploadingLogo(true);
    try {
      // Use the uploadFile helper function that handles authentication and proper paths
      const { url } = await uploadFile(file, 'company-media', `companies/${companyId}/logo`);
      
      // Save to database immediately so it updates everywhere
      const { error: updateError } = await supabase
        .from('companies')
        .update({ logo_url: url })
        .eq('id', companyId);

      if (updateError) {
        console.error('Database update error:', updateError);
        throw new Error(`Datenbank-Update fehlgeschlagen: ${updateError.message || 'Unbekannter Fehler'}`);
      }

      setLogoPreview(url);
      updateData({ logo_url: url });

      toast({ 
        title: 'Logo hochgeladen',
        description: 'Das Logo wurde erfolgreich gespeichert.',
      });
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      const errorMessage = error?.message || error?.error?.message || 'Unbekannter Fehler';
      toast({
        title: 'Upload fehlgeschlagen',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleHeaderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Datei zu groß',
        description: 'Das Titelbild darf maximal 5MB groß sein',
        variant: 'destructive',
      });
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast({
        title: 'Ungültiges Format',
        description: 'Nur JPG, PNG und WEBP werden unterstützt',
        variant: 'destructive',
      });
      return;
    }

    setUploadingHeader(true);
    try {
      // Use the uploadFile helper function
      const { url } = await uploadFile(file, 'company-media', `companies/${companyId}/header`);
      
      // Save to database immediately
      const { error: updateError } = await supabase
        .from('companies')
        .update({ header_image: url })
        .eq('id', companyId);

      if (updateError) {
        console.error('Database update error:', updateError);
        throw new Error(`Datenbank-Update fehlgeschlagen: ${updateError.message || 'Unbekannter Fehler'}`);
      }

      setHeaderPreview(url);
      updateData({ header_image: url });

      toast({ 
        title: 'Titelbild hochgeladen',
        description: 'Das Titelbild wurde erfolgreich gespeichert.',
      });
    } catch (error: any) {
      console.error('Error uploading header:', error);
      const errorMessage = error?.message || error?.error?.message || 'Unbekannter Fehler';
      toast({
        title: 'Upload fehlgeschlagen',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setUploadingHeader(false);
    }
  };

  const validateStep = () => {
    const newErrors: Record<string, string> = {};

    if (!data.main_location) newErrors.main_location = 'Standort ist erforderlich';
    if (!data.contact_person) newErrors.contact_person = 'Ansprechpartner ist erforderlich';
    if (!data.primary_email) newErrors.primary_email = 'E-Mail ist erforderlich';
    if (!data.matching_about) newErrors.matching_about = 'Kurzbeschreibung ist erforderlich';
    if (data.matching_about && data.matching_about.length > 280) {
      newErrors.matching_about = 'Kurzbeschreibung darf maximal 280 Zeichen haben';
    }
    if (data.description && data.description.length > 2000) {
      newErrors.description = 'Beschreibung darf maximal 2000 Zeichen haben';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      onNext();
    } else {
      toast({
        title: 'Bitte füllen Sie alle Pflichtfelder aus',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Unternehmensprofil vervollständigen</h2>
        <p className="text-muted-foreground">
          Erstellen Sie ein ansprechendes Profil für Ihr Unternehmen
        </p>
      </div>

      {/* Logo Upload */}
      <div className="space-y-2">
        <Label>Unternehmenslogo</Label>
        <div className="flex items-center gap-4">
          {logoPreview && (
            <div className="relative">
              <img src={logoPreview} alt="Logo" className="w-24 h-24 object-contain rounded border" />
              <Button
                variant="ghost"
                size="icon"
                className="absolute -top-2 -right-2"
                onClick={() => {
                  setLogoPreview(null);
                  updateData({ logo_url: null });
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          <div>
            <Input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleLogoUpload}
              disabled={uploadingLogo}
              className="hidden"
              id="logo-upload"
            />
            <Label htmlFor="logo-upload" className="cursor-pointer">
              <div className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-accent">
                <Upload className="h-4 w-4" />
                {uploadingLogo ? 'Hochladen...' : 'Logo hochladen'}
              </div>
            </Label>
            <p className="text-sm text-muted-foreground mt-1">Max 2MB, JPG/PNG/WEBP</p>
          </div>
        </div>
      </div>

      {/* Header Image Upload */}
      <div className="space-y-2">
        <Label>Titelbild</Label>
        <div className="flex items-center gap-4">
          {headerPreview && (
            <div className="relative">
              <img src={headerPreview} alt="Header" className="w-48 h-24 object-cover rounded border" />
              <Button
                variant="ghost"
                size="icon"
                className="absolute -top-2 -right-2"
                onClick={() => {
                  setHeaderPreview(null);
                  updateData({ header_image: null });
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          <div>
            <Input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleHeaderUpload}
              disabled={uploadingHeader}
              className="hidden"
              id="header-upload"
            />
            <Label htmlFor="header-upload" className="cursor-pointer">
              <div className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-accent">
                <Upload className="h-4 w-4" />
                {uploadingHeader ? 'Hochladen...' : 'Titelbild hochladen'}
              </div>
            </Label>
            <p className="text-sm text-muted-foreground mt-1">Max 5MB, JPG/PNG/WEBP</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Hauptstandort (PLZ & Stadt) *</Label>
        <LocationAutocomplete
          id="location"
          value={data.main_location || ''}
          onChange={async (value) => {
            updateData({ main_location: value });
            // Save location with coordinates
            if (value && companyId) {
              await saveCompanyLocation(companyId, value);
            }
          }}
          placeholder="z. B. 10115 Berlin oder Berlin"
          className={errors.main_location ? 'border-destructive' : ''}
        />
        {errors.main_location && (
          <p className="text-sm text-destructive">{errors.main_location}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Geben Sie PLZ und Stadt ein, um automatisch Koordinaten zu erhalten
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contact_person">Ansprechpartner *</Label>
          <Input
            id="contact_person"
            value={data.contact_person || ''}
            onChange={(e) => updateData({ contact_person: e.target.value })}
            placeholder="Max Mustermann"
            className={errors.contact_person ? 'border-destructive' : ''}
          />
          {errors.contact_person && (
            <p className="text-sm text-destructive">{errors.contact_person}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact_position">Position</Label>
          <Input
            id="contact_position"
            value={data.contact_position || ''}
            onChange={(e) => updateData({ contact_position: e.target.value })}
            placeholder="z.B. Geschäftsführer"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="primary_email">E-Mail *</Label>
          <Input
            id="primary_email"
            type="email"
            value={data.primary_email || ''}
            onChange={(e) => updateData({ primary_email: e.target.value })}
            placeholder="kontakt@unternehmen.de"
            className={errors.primary_email ? 'border-destructive' : ''}
          />
          {errors.primary_email && (
            <p className="text-sm text-destructive">{errors.primary_email}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Telefon</Label>
          <Input
            id="phone"
            type="tel"
            value={data.phone || ''}
            onChange={(e) => updateData({ phone: e.target.value })}
            placeholder="+49 123 456789"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="matching_about">Kurzbeschreibung * (max 280 Zeichen)</Label>
        <Textarea
          id="matching_about"
          value={data.matching_about || ''}
          onChange={(e) => updateData({ matching_about: e.target.value })}
          placeholder="Eine kurze Beschreibung Ihres Unternehmens..."
          maxLength={280}
          rows={3}
          className={errors.matching_about ? 'border-destructive' : ''}
        />
        <p className="text-sm text-muted-foreground">
          {(data.matching_about || '').length}/280 Zeichen
        </p>
        {errors.matching_about && (
          <p className="text-sm text-destructive">{errors.matching_about}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Ausführliche Beschreibung (max 2000 Zeichen)</Label>
        <Textarea
          id="description"
          value={data.description || ''}
          onChange={(e) => updateData({ description: e.target.value })}
          placeholder="Detaillierte Beschreibung Ihres Unternehmens..."
          maxLength={2000}
          rows={5}
          className={errors.description ? 'border-destructive' : ''}
        />
        <p className="text-sm text-muted-foreground">
          {(data.description || '').length}/2000 Zeichen
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="employee_count">Anzahl Mitarbeiter</Label>
        <Select
          value={data.employee_count?.toString() || ''}
          onValueChange={(value) => updateData({ employee_count: parseInt(value) })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Wählen Sie eine Größe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1-10</SelectItem>
            <SelectItem value="11">11-50</SelectItem>
            <SelectItem value="51">51-200</SelectItem>
            <SelectItem value="201">201-500</SelectItem>
            <SelectItem value="501">501+</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="website_url">Website</Label>
          <Input
            id="website_url"
            type="url"
            value={data.website_url || ''}
            onChange={(e) => updateData({ website_url: e.target.value })}
            placeholder="https://..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="linkedin_url">LinkedIn</Label>
          <Input
            id="linkedin_url"
            type="url"
            value={data.linkedin_url || ''}
            onChange={(e) => updateData({ linkedin_url: e.target.value })}
            placeholder="https://linkedin.com/company/..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="instagram_url">Instagram</Label>
          <Input
            id="instagram_url"
            type="url"
            value={data.instagram_url || ''}
            onChange={(e) => updateData({ instagram_url: e.target.value })}
            placeholder="https://instagram.com/..."
          />
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrev}>
          Zurück
        </Button>
        <Button onClick={handleNext}>
          Weiter
        </Button>
      </div>
    </div>
  );
}
