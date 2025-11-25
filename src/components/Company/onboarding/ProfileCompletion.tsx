import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// @ts-ignore - Textarea might not exist, using textarea element instead
// import { Textarea } from '@/components/ui/textarea';
import { OnboardingPopup } from './OnboardingPopup';
import { Building2, Upload, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCompany } from '@/hooks/useCompany';
import { uploadFile } from '@/lib/supabase-storage';

interface ProfileCompletionProps {
  onNext: () => void;
  onSkip: () => void;
  stepNumber: number;
  totalSteps: number;
}

export function ProfileCompletion({ onNext, onSkip, stepNumber, totalSteps }: ProfileCompletionProps) {
  const { company, refetch } = useCompany();
  const { toast } = useToast();
  const [description, setDescription] = useState(company?.description || '');
  const [uploading, setUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState(company?.logo_url || '');

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !company) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Ungültiger Dateityp',
        description: 'Bitte wählen Sie eine Bilddatei (JPG, PNG, SVG oder WEBP).',
        variant: 'destructive',
      });
      return;
    }

    // Note: No size limit - user requested files larger than 5MB should be allowed
    // Supabase storage has default limits, but we don't restrict here

    setUploading(true);
    try {
      // Use the uploadFile helper function that handles authentication and proper paths
      const { url } = await uploadFile(file, 'company-media', `companies/${company.id}/logo`);

      setLogoUrl(url);

      const { error: updateError } = await supabase
        .from('companies')
        .update({ logo_url: url })
        .eq('id', company.id);

      if (updateError) throw updateError;

      // Refetch company data to update all components
      await refetch();

      toast({
        title: 'Logo hochgeladen',
        description: 'Ihr Logo wurde erfolgreich gespeichert.',
      });
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      const errorMessage = error?.message || error?.error?.message || 'Unbekannter Fehler';
      toast({
        title: 'Fehler',
        description: `Logo konnte nicht hochgeladen werden: ${errorMessage}`,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!company) return;

    try {
      const { error } = await supabase
        .from('companies')
        .update({ description: description.trim() || null })
        .eq('id', company.id);

      if (error) throw error;

      await refetch();
      toast({
        title: 'Profil aktualisiert',
        description: 'Ihre Unternehmensbeschreibung wurde gespeichert.',
      });

      onNext();
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Fehler',
        description: 'Profil konnte nicht gespeichert werden.',
        variant: 'destructive',
      });
    }
  };

  const isComplete = description.trim().length > 20 || (company?.description && company.description.length > 20);

  return (
    <OnboardingPopup onSkip={onSkip} showSkip={true} stepNumber={stepNumber} totalSteps={totalSteps}>
      <div className="p-8">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-3xl font-bold mb-2">Unternehmensprofil vervollständigen</h2>
          <p className="text-muted-foreground">
            Erzählen Sie Kandidaten von Ihrem Unternehmen und laden Sie Ihr Logo hoch
          </p>
        </div>

        <div className="space-y-6 mb-6">
          {/* Logo Upload */}
          <Card className="p-6">
            <Label className="text-sm font-semibold mb-3 block">Unternehmenslogo</Label>
            <div className="flex items-center gap-4">
              {logoUrl ? (
                <div className="relative">
                  <img src={logoUrl} alt="Logo" className="w-24 h-24 object-contain rounded-lg border" />
                  <CheckCircle2 className="absolute -top-1 -right-1 h-5 w-5 text-green-500 bg-white rounded-full" />
                </div>
              ) : (
                <div className="w-24 h-24 border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={uploading}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG, SVG oder WEBP (keine Größenbeschränkung)
                </p>
              </div>
            </div>
          </Card>

          {/* Description */}
          <Card className="p-6">
            <Label htmlFor="description" className="text-sm font-semibold mb-3 block">
              Unternehmensbeschreibung *
            </Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Erzählen Sie von Ihrem Unternehmen, Ihrer Kultur und was Sie besonders macht..."
              rows={6}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Mindestens 20 Zeichen empfohlen ({description.length} Zeichen)
            </p>
          </Card>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onSkip}
            className="flex-1"
          >
            Überspringen
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isComplete || uploading}
            className="flex-1"
            size="lg"
          >
            {uploading ? 'Wird hochgeladen...' : 'Speichern & Weiter'}
          </Button>
        </div>
      </div>
    </OnboardingPopup>
  );
}

