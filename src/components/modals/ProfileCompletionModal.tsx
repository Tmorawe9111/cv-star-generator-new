import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Camera, X, Plus, Trash2, CheckCircle2, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { compressImage } from '@/utils/imageCompression';
import { uploadProfileImage } from '@/lib/supabase-storage';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ProfileCompletionModalProps {
  open: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

interface SchulbildungEntry {
  schule: string;
  abschluss: string;
  ort: string;
  plz: string;
  zeitraum_von: string;
  zeitraum_bis: string;
  beschreibung?: string;
}

interface BerufserfahrungEntry {
  titel: string;
  unternehmen: string;
  ort: string;
  zeitraum_von: string;
  zeitraum_bis: string;
  beschreibung?: string;
  art?: string;
}

export const ProfileCompletionModal: React.FC<ProfileCompletionModalProps> = ({
  open,
  onClose,
  onComplete
}) => {
  const { profile, refetchProfile } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  // Step 1: Profilbild + Bio
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [bio, setBio] = useState('');

  // Step 2: Schule + Berufserfahrung
  const [schulbildung, setSchulbildung] = useState<SchulbildungEntry[]>([
    { schule: '', abschluss: '', ort: '', plz: '', zeitraum_von: '', zeitraum_bis: '', beschreibung: '' }
  ]);
  const [berufserfahrung, setBerufserfahrung] = useState<BerufserfahrungEntry[]>([
    { titel: '', unternehmen: '', ort: '', zeitraum_von: '', zeitraum_bis: '', beschreibung: '', art: '' }
  ]);

  // Load existing data when modal opens
  useEffect(() => {
    if (open && profile) {
      // Load avatar
      if (profile.avatar_url) {
        setAvatarPreview(profile.avatar_url);
      } else {
        setAvatarPreview('');
      }
      // Load bio
      setBio(profile.uebermich || profile.bio || '');
      // Load schulbildung
      if (profile.schulbildung && Array.isArray(profile.schulbildung) && profile.schulbildung.length > 0) {
        setSchulbildung(profile.schulbildung as SchulbildungEntry[]);
      } else {
        setSchulbildung([
          { schule: '', abschluss: '', ort: '', plz: '', zeitraum_von: '', zeitraum_bis: '', beschreibung: '' }
        ]);
      }
      // Load berufserfahrung
      if (profile.berufserfahrung && Array.isArray(profile.berufserfahrung) && profile.berufserfahrung.length > 0) {
        setBerufserfahrung(profile.berufserfahrung as BerufserfahrungEntry[]);
      } else {
        setBerufserfahrung([
          { titel: '', unternehmen: '', ort: '', zeitraum_von: '', zeitraum_bis: '', beschreibung: '', art: '' }
        ]);
      }
    }
  }, [open, profile]);

  // Reset step to 1 when modal opens (separate effect to avoid resetting when profile changes)
  useEffect(() => {
    if (open) {
      setStep(1);
    }
  }, [open]);

  const handleAvatarSelect = async (file: File | null) => {
    if (!file) {
      setAvatarFile(null);
      setAvatarPreview('');
      return;
    }

    if (!file.type.match(/^image\/(jpeg|jpg|png)$/i)) {
      toast({
        title: "Ungültiges Bildformat",
        description: "Bitte wählen Sie ein JPEG oder PNG Bild aus.",
        variant: "destructive"
      });
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const compressedFile = await compressImage(file, 800, 800, 0.85);
      const url = URL.createObjectURL(compressedFile);
      setAvatarPreview(url);
      setAvatarFile(compressedFile);
    } catch (error) {
      console.error('Error compressing image:', error);
      const url = URL.createObjectURL(file);
      setAvatarPreview(url);
      setAvatarFile(file);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const addSchulbildungEntry = () => {
    setSchulbildung([...schulbildung, { schule: '', abschluss: '', ort: '', plz: '', zeitraum_von: '', zeitraum_bis: '', beschreibung: '' }]);
  };

  const removeSchulbildungEntry = (index: number) => {
    setSchulbildung(schulbildung.filter((_, i) => i !== index));
  };

  const updateSchulbildungEntry = (index: number, field: keyof SchulbildungEntry, value: string) => {
    const updated = [...schulbildung];
    updated[index] = { ...updated[index], [field]: value };
    setSchulbildung(updated);
  };

  const addBerufserfahrungEntry = () => {
    setBerufserfahrung([...berufserfahrung, { titel: '', unternehmen: '', ort: '', zeitraum_von: '', zeitraum_bis: '', beschreibung: '', art: '' }]);
  };

  const removeBerufserfahrungEntry = (index: number) => {
    setBerufserfahrung(berufserfahrung.filter((_, i) => i !== index));
  };

  const updateBerufserfahrungEntry = (index: number, field: keyof BerufserfahrungEntry, value: string) => {
    const updated = [...berufserfahrung];
    updated[index] = { ...updated[index], [field]: value };
    setBerufserfahrung(updated);
  };

  const validateStep1 = (): boolean => {
    if (!avatarPreview && !avatarFile) {
      toast({
        title: "Profilbild erforderlich",
        description: "Bitte laden Sie ein Profilbild hoch.",
        variant: "destructive"
      });
      return false;
    }
    if (!bio.trim() || bio.trim().length < 20) {
      toast({
        title: "Bio erforderlich",
        description: "Bitte geben Sie einen Text über sich selbst ein (mindestens 20 Zeichen).",
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    // Check if at least one schulbildung entry is complete
    const hasValidSchulbildung = schulbildung.some(entry => 
      entry.schule.trim() && entry.abschluss.trim() && entry.ort.trim() && entry.zeitraum_von.trim()
    );
    
    if (!hasValidSchulbildung) {
      toast({
        title: "Schulbildung erforderlich",
        description: "Bitte geben Sie mindestens eine Schulbildung ein.",
        variant: "destructive"
      });
      return false;
    }

    // Check if at least one berufserfahrung entry is complete
    const hasValidBerufserfahrung = berufserfahrung.some(entry => 
      entry.titel.trim() && entry.unternehmen.trim() && entry.ort.trim() && entry.zeitraum_von.trim()
    );
    
    if (!hasValidBerufserfahrung) {
      toast({
        title: "Berufserfahrung erforderlich",
        description: "Bitte geben Sie mindestens eine Berufserfahrung ein.",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!profile) return;

    setIsSaving(true);
    try {
      let avatarUrl = profile.avatar_url;

      // Upload avatar if new file selected
      if (avatarFile) {
        const { url } = await uploadProfileImage(avatarFile);
        avatarUrl = url;
      }

      // Prepare update data
      const updateData: any = {
        avatar_url: avatarUrl,
        uebermich: bio.trim(),
        schulbildung: schulbildung.filter(entry => entry.schule.trim() && entry.abschluss.trim()),
        berufserfahrung: berufserfahrung.filter(entry => entry.titel.trim() && entry.unternehmen.trim()),
        profile_complete: true,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profile.id);

      if (error) throw error;

      toast({
        title: "Profil vervollständigt",
        description: "Ihr Profil wurde erfolgreich aktualisiert.",
      });

      await refetchProfile();
      onComplete?.();
      onClose();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Fehler beim Speichern",
        description: "Bitte versuchen Sie es erneut.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (validateStep1()) {
        setStep(2);
      }
    } else if (step === 2) {
      if (validateStep2()) {
        handleSave();
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Generate year options (last 50 years to current year + 5)
  const yearOptions = Array.from({ length: 55 }, (_, i) => {
    const currentYear = new Date().getFullYear();
    return currentYear - 50 + i;
  }).reverse();

  const abschlussOptions = [
    'Hauptschulabschluss',
    'Realschulabschluss / Mittlere Reife',
    'Fachhochschulreife',
    'Abitur',
    'Ohne Abschluss'
  ];

  return (
    <Dialog open={open} onOpenChange={() => {}} modal={true}>
      <DialogContent 
        className="w-[95vw] max-w-[95vw] sm:w-[90vw] sm:max-w-2xl md:max-w-3xl max-h-[95vh] sm:max-h-[90vh] p-0 gap-0 flex flex-col"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b flex-shrink-0">
          <DialogTitle className="text-lg sm:text-xl md:text-2xl">
            Profil vervollständigen
          </DialogTitle>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
            Schritt {step} von 2
          </p>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
          {step === 1 && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <Card className="p-4 sm:p-6">
                <div className="space-y-6">
                  {/* Profilbild */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Profilbild *</Label>
                    <div className="flex flex-col items-center gap-4">
                      {avatarPreview ? (
                        <div className="relative">
                          <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-gray-200 shadow-sm">
                            <img
                              src={avatarPreview}
                              alt="Profile preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute -top-2 -right-2 h-8 w-8 rounded-full p-0 shadow-md"
                            onClick={() => {
                              setAvatarFile(null);
                              setAvatarPreview('');
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <label
                          htmlFor="avatar-input"
                          className="w-32 h-32 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
                        >
                          <Camera className="h-8 w-8 text-gray-400" />
                          <input
                            id="avatar-input"
                            type="file"
                            accept="image/jpeg,image/jpg,image/png"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleAvatarSelect(file);
                            }}
                            disabled={isUploadingAvatar}
                          />
                        </label>
                      )}
                      {isUploadingAvatar && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Wird verarbeitet...</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="space-y-3">
                    <Label htmlFor="bio" className="text-base font-semibold">
                      Über dich * (mindestens 20 Zeichen)
                    </Label>
                    <Textarea
                      id="bio"
                      placeholder="Erzähle etwas über dich..."
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={6}
                      className="min-h-[120px] resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      {bio.length} Zeichen
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 max-w-2xl mx-auto">
              {/* Schulbildung */}
              <Card className="p-4 sm:p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold">Schulbildung *</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Mindestens ein Eintrag erforderlich
                      </p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addSchulbildungEntry}>
                      <Plus className="h-4 w-4 mr-2" />
                      Hinzufügen
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {schulbildung.map((entry, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">Schule {index + 1}</h4>
                          {schulbildung.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSchulbildungEntry(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Schule *</Label>
                            <Input
                              value={entry.schule}
                              onChange={(e) => updateSchulbildungEntry(index, 'schule', e.target.value)}
                              placeholder="z.B. Gymnasium Berlin"
                            />
                          </div>
                          <div>
                            <Label>Abschluss *</Label>
                            <Select
                              value={entry.abschluss}
                              onValueChange={(value) => updateSchulbildungEntry(index, 'abschluss', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Abschluss wählen" />
                              </SelectTrigger>
                              <SelectContent>
                                {abschlussOptions.map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>PLZ</Label>
                            <Input
                              value={entry.plz}
                              onChange={(e) => updateSchulbildungEntry(index, 'plz', e.target.value)}
                              placeholder="12345"
                            />
                          </div>
                          <div>
                            <Label>Ort *</Label>
                            <Input
                              value={entry.ort}
                              onChange={(e) => updateSchulbildungEntry(index, 'ort', e.target.value)}
                              placeholder="z.B. Berlin"
                            />
                          </div>
                          <div>
                            <Label>Von (Jahr) *</Label>
                            <Select
                              value={entry.zeitraum_von}
                              onValueChange={(value) => updateSchulbildungEntry(index, 'zeitraum_von', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Jahr wählen" />
                              </SelectTrigger>
                              <SelectContent>
                                {yearOptions.map((year) => (
                                  <SelectItem key={year} value={year.toString()}>
                                    {year}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Bis (Jahr)</Label>
                            <Select
                              value={entry.zeitraum_bis}
                              onValueChange={(value) => updateSchulbildungEntry(index, 'zeitraum_bis', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Jahr wählen" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">Laufend</SelectItem>
                                {yearOptions.map((year) => (
                                  <SelectItem key={year} value={year.toString()}>
                                    {year}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label>Beschreibung (optional)</Label>
                          <Textarea
                            value={entry.beschreibung || ''}
                            onChange={(e) => updateSchulbildungEntry(index, 'beschreibung', e.target.value)}
                            placeholder="z.B. Schwerpunkte, besondere Leistungen..."
                            rows={3}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Berufserfahrung */}
              <Card className="p-4 sm:p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold">Berufserfahrung *</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Mindestens ein Eintrag erforderlich
                      </p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addBerufserfahrungEntry}>
                      <Plus className="h-4 w-4 mr-2" />
                      Hinzufügen
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {berufserfahrung.map((entry, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">Erfahrung {index + 1}</h4>
                          {berufserfahrung.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeBerufserfahrungEntry(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Titel *</Label>
                            <Input
                              value={entry.titel}
                              onChange={(e) => updateBerufserfahrungEntry(index, 'titel', e.target.value)}
                              placeholder="z.B. Softwareentwickler"
                            />
                          </div>
                          <div>
                            <Label>Unternehmen *</Label>
                            <Input
                              value={entry.unternehmen}
                              onChange={(e) => updateBerufserfahrungEntry(index, 'unternehmen', e.target.value)}
                              placeholder="z.B. Musterfirma GmbH"
                            />
                          </div>
                          <div>
                            <Label>Ort *</Label>
                            <Input
                              value={entry.ort}
                              onChange={(e) => updateBerufserfahrungEntry(index, 'ort', e.target.value)}
                              placeholder="z.B. Berlin"
                            />
                          </div>
                          <div>
                            <Label>Von (Jahr) *</Label>
                            <Select
                              value={entry.zeitraum_von}
                              onValueChange={(value) => updateBerufserfahrungEntry(index, 'zeitraum_von', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Jahr wählen" />
                              </SelectTrigger>
                              <SelectContent>
                                {yearOptions.map((year) => (
                                  <SelectItem key={year} value={year.toString()}>
                                    {year}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Bis (Jahr)</Label>
                            <Select
                              value={entry.zeitraum_bis}
                              onValueChange={(value) => updateBerufserfahrungEntry(index, 'zeitraum_bis', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Jahr wählen" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">Heute</SelectItem>
                                {yearOptions.map((year) => (
                                  <SelectItem key={year} value={year.toString()}>
                                    {year}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label>Beschreibung (optional)</Label>
                          <Textarea
                            value={entry.beschreibung || ''}
                            onChange={(e) => updateBerufserfahrungEntry(index, 'beschreibung', e.target.value)}
                            placeholder="z.B. Aufgaben, Verantwortlichkeiten..."
                            rows={3}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Footer with Navigation */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t flex justify-between items-center flex-shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={step === 1 || isSaving}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück
          </Button>
          <Button
            type="button"
            onClick={handleNext}
            disabled={isSaving || isUploadingAvatar}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Wird gespeichert...
              </>
            ) : step === 2 ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Fertig
              </>
            ) : (
              <>
                Weiter
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

