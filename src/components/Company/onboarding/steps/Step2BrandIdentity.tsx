import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { OnboardingData } from '../AppleOnboardingWizard';
import { CompanyCardPreview } from '../components/CompanyCardPreview';

interface Step2BrandIdentityProps {
  data: OnboardingData;
  onUpdate: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step2BrandIdentity({ data, onUpdate, onNext, onBack }: Step2BrandIdentityProps) {
  const companyId = useCompanyId();
  const { toast } = useToast();
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !companyId) return;

    setUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${companyId}/logo-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('company-media')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('company-media')
        .getPublicUrl(fileName);

      onUpdate({ logoUrl: publicUrl });
      toast({
        title: 'Logo hochgeladen',
        description: 'Ihr Logo wurde erfolgreich hochgeladen.',
      });
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast({
        title: 'Fehler',
        description: 'Logo konnte nicht hochgeladen werden',
        variant: 'destructive',
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !companyId) return;

    setUploadingCover(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${companyId}/cover-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('company-media')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('company-media')
        .getPublicUrl(fileName);

      onUpdate({ coverImageUrl: publicUrl });
      toast({
        title: 'Cover-Bild hochgeladen',
        description: 'Ihr Cover-Bild wurde erfolgreich hochgeladen.',
      });
    } catch (error: any) {
      console.error('Error uploading cover:', error);
      toast({
        title: 'Fehler',
        description: 'Cover-Bild konnte nicht hochgeladen werden',
        variant: 'destructive',
      });
    } finally {
      setUploadingCover(false);
    }
  };

  const removeLogo = () => {
    onUpdate({ logoUrl: undefined });
  };

  const removeCover = () => {
    onUpdate({ coverImageUrl: undefined });
  };

  const isValid = () => {
    return !!data.logoUrl && !!data.companyBio && data.companyBio.trim().length >= 20 && !!data.websiteUrl && data.websiteUrl.length > 0;
  };

  return (
    <div className="flex flex-col h-full space-y-8 overflow-hidden">
      {/* Header */}
      <div className="text-center space-y-3 flex-shrink-0">
        <h2 className="text-3xl font-light text-gray-900 tracking-tight">
          Markenidentität
        </h2>
        <p className="text-lg text-gray-600 leading-relaxed">
          Gestalten Sie Ihr Unternehmensprofil und zeigen Sie sich von Ihrer besten Seite
        </p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0 overflow-hidden">
        {/* Left: Form */}
        <div className="space-y-6 overflow-y-auto min-h-0 pr-2">
          {/* Logo Upload */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Firmenlogo *</Label>
            <div className="flex items-center gap-4">
              {data.logoUrl ? (
                <div className="relative">
                  <img
                    src={data.logoUrl}
                    alt="Logo"
                    className="w-24 h-24 rounded-2xl object-cover border border-gray-200 shadow-sm"
                  />
                  <button
                    onClick={removeLogo}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => logoInputRef.current?.click()}
                  className="w-24 h-24 rounded-2xl border border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-gray-50 transition-all duration-300 ease-out"
                >
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadingLogo}
                  className="border-gray-300 bg-white text-gray-900 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploadingLogo ? 'Wird hochgeladen...' : 'Logo hochladen'}
                </Button>
                <p className="text-sm text-gray-500 mt-1">
                  Empfohlen: Quadratisch, mind. 200x200px
                </p>
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Cover Image */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Cover-Bild (Optional)</Label>
            {data.coverImageUrl ? (
              <div className="relative">
                <img
                  src={data.coverImageUrl}
                  alt="Cover"
                  className="w-full h-48 rounded-xl object-cover border border-gray-200 shadow-sm"
                />
                <button
                  onClick={removeCover}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => coverInputRef.current?.click()}
                className="w-full h-48 rounded-xl border border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-gray-50 transition-all duration-300 ease-out"
              >
                <div className="text-center">
                  <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Cover-Bild hinzufügen</p>
                </div>
              </div>
            )}
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              onChange={handleCoverUpload}
              className="hidden"
            />
          </div>

          {/* Company Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio" className="text-base font-medium">
              Unternehmensbeschreibung *
            </Label>
            <Textarea
              id="bio"
              placeholder="Beschreiben Sie Ihr Unternehmen in wenigen Sätzen..."
              value={data.companyBio || ''}
              onChange={(e) => onUpdate({ companyBio: e.target.value })}
              maxLength={500}
              rows={5}
              className="resize-none"
            />
            <p className="text-sm text-gray-500">
              {data.companyBio?.length || 0} / 500 Zeichen
            </p>
          </div>

          {/* Website URL */}
          <div className="space-y-2">
            <Label htmlFor="website" className="text-base font-medium">
              Website URL *
            </Label>
            <Input
              id="website"
              type="url"
              placeholder="https://www.example.com"
              value={data.websiteUrl || ''}
              onChange={(e) => onUpdate({ websiteUrl: e.target.value })}
              required
            />
            <p className="text-sm text-gray-500">
              Die URL Ihrer Unternehmenswebsite
            </p>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="lg:sticky lg:top-0 h-fit flex-shrink-0">
          <div className="space-y-4">
            <Label className="text-base font-medium text-gray-700">Vorschau</Label>
            <CompanyCardPreview
              logoUrl={data.logoUrl}
              coverImageUrl={data.coverImageUrl}
              companyBio={data.companyBio}
              websiteUrl={data.websiteUrl}
            />
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

