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
import { Checkbox } from '@/components/ui/checkbox';
import { SchulbildungEntry, BerufserfahrungEntry } from '@/contexts/CVFormContext';
import { cn } from '@/lib/utils';

interface ProfileCompletionModalProps {
  open: boolean;
  onClose: () => void;
  onComplete?: () => void;
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

  // Step 2: Schule + Berufserfahrung (using CVFormContext interfaces)
  const [schulbildung, setSchulbildung] = useState<SchulbildungEntry[]>([
    { schulform: '', abschluss: '', name: '', ort: '', plz: '', zeitraum_von: '', zeitraum_bis: '', beschreibung: '' }
  ]);
  const [berufserfahrung, setBerufserfahrung] = useState<BerufserfahrungEntry[]>([
    { titel: '', art: '', unternehmen: '', ort: '', plz: '', zeitraum_von: '', zeitraum_bis: '', beschreibung: '' }
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
      // Load schulbildung - convert old format to new format if needed
      if (profile.schulbildung && Array.isArray(profile.schulbildung) && profile.schulbildung.length > 0) {
        const converted = profile.schulbildung.map((entry: any) => {
          // Convert old format (schule) to new format (schulform/name)
          if (entry.schule && !entry.name) {
            return {
              schulform: entry.schulform || '',
              abschluss: entry.abschluss || '',
              name: entry.schule || entry.name || '',
              ort: entry.ort || '',
              plz: entry.plz || '',
              zeitraum_von: entry.zeitraum_von || '',
              zeitraum_bis: entry.zeitraum_bis || '',
              beschreibung: entry.beschreibung || ''
            };
          }
          return entry;
        });
        setSchulbildung(converted as SchulbildungEntry[]);
      } else {
        setSchulbildung([
          { schulform: '', abschluss: '', name: '', ort: '', plz: '', zeitraum_von: '', zeitraum_bis: '', beschreibung: '' }
        ]);
      }
      // Load berufserfahrung
      if (profile.berufserfahrung && Array.isArray(profile.berufserfahrung) && profile.berufserfahrung.length > 0) {
        setBerufserfahrung(profile.berufserfahrung as BerufserfahrungEntry[]);
      } else {
        setBerufserfahrung([
          { titel: '', art: '', unternehmen: '', ort: '', plz: '', zeitraum_von: '', zeitraum_bis: '', beschreibung: '' }
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
    setSchulbildung([...schulbildung, { schulform: '', abschluss: '', name: '', ort: '', plz: '', zeitraum_von: '', zeitraum_bis: '', beschreibung: '' }]);
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
    setBerufserfahrung([...berufserfahrung, { titel: '', art: '', unternehmen: '', ort: '', plz: '', zeitraum_von: '', zeitraum_bis: '', beschreibung: '' }]);
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
      entry.schulform.trim() && entry.name.trim() && entry.ort.trim() && entry.zeitraum_von.trim()
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
      entry.titel.trim() && entry.art.trim() && entry.unternehmen.trim() && entry.ort.trim() && entry.zeitraum_von.trim()
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

      // Prepare update data - filter valid entries
      // Profile is visible for other users but NOT for companies until CV is created
      const updateData: any = {
        avatar_url: avatarUrl,
        uebermich: bio.trim(),
        schulbildung: schulbildung.filter(entry => entry.schulform.trim() && entry.name.trim()),
        berufserfahrung: berufserfahrung.filter(entry => entry.titel.trim() && entry.unternehmen.trim()),
        profile_complete: true,
        profile_published: false, // Not visible for companies until CV is created
        visibility_mode: 'invisible', // Set to invisible until CV is created and user chooses visibility
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
      // Don't close immediately - let the parent component handle showing CV creation prompt
      // onClose();
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

  // Generate year options (current year + 1 future max, back to 1950)
  const currentYear = new Date().getFullYear();
  const maxFutureYear = currentYear + 1;
  const yearOptions = Array.from({ length: maxFutureYear - 1950 + 1 }, (_, i) => maxFutureYear - i);

  // Month options
  const monthOptions = [
    { value: '01', label: 'Januar' },
    { value: '02', label: 'Februar' },
    { value: '03', label: 'März' },
    { value: '04', label: 'April' },
    { value: '05', label: 'Mai' },
    { value: '06', label: 'Juni' },
    { value: '07', label: 'Juli' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Dezember' }
  ];

  // Schulform options
  const schulformOptions = [
    'Realschule',
    'Hauptschule',
    'Berufsschule',
    'Gymnasium',
    'Andere'
  ];

  const schulabschlussOptions = [
    'Ohne Abschluss',
    'Hauptschulabschluss',
    'Realschulabschluss / Mittlere Reife',
    'Fachhochschulreife',
    'Abitur',
    'Berufsabschluss (IHK/HWK)',
    'Bachelor',
    'Master',
    'Andere'
  ];

  // Helper functions for date handling
  const updateSchulbildungDate = (index: number, field: 'zeitraum_von' | 'zeitraum_bis', year: string) => {
    const updated = [...schulbildung];
    updated[index] = { ...updated[index], [field]: year };
    setSchulbildung(updated);
  };

  const updateBerufserfahrungDate = (index: number, field: 'zeitraum_von' | 'zeitraum_bis', month: string, year: string) => {
    const updated = [...berufserfahrung];
    const currentValue = updated[index][field] || '';
    const parts = currentValue.split('-');
    const currentYear = parts[0] || '';
    const currentMonth = parts[1] || '';
    
    const finalYear = year || currentYear;
    const finalMonth = month || currentMonth;
    
    if (finalYear && finalMonth) {
      updated[index] = { ...updated[index], [field]: `${finalYear}-${finalMonth}` };
    } else if (finalYear) {
      updated[index] = { ...updated[index], [field]: finalYear };
    } else if (finalMonth) {
      updated[index] = { ...updated[index], [field]: `0000-${finalMonth}` };
    } else {
      updated[index] = { ...updated[index], [field]: '' };
    }
    setBerufserfahrung(updated);
  };

  const isCurrentJob = (arbeit: BerufserfahrungEntry) => {
    return arbeit.zeitraum_bis === 'heute';
  };

  const toggleCurrentJob = (index: number, checked: boolean) => {
    const updated = [...berufserfahrung];
    if (checked) {
      updated[index] = { ...updated[index], zeitraum_bis: 'heute' };
    } else {
      updated[index] = { ...updated[index], zeitraum_bis: '' };
    }
    setBerufserfahrung(updated);
  };

  const getAvailableBisOptions = (vonValue: string) => {
    if (!vonValue || vonValue === 'heute' || vonValue.split('-')[0] === '0000') {
      return {
        availableMonths: monthOptions,
        availableYears: yearOptions,
        minYear: null,
        minMonth: null
      };
    }

    const vonParts = vonValue.split('-');
    const vonYear = parseInt(vonParts[0] || '0');
    const vonMonth = parseInt(vonParts[1] || '0');

    if (vonYear === 0 || vonMonth === 0) {
      return {
        availableMonths: monthOptions,
        availableYears: yearOptions,
        minYear: null,
        minMonth: null
      };
    }

    const availableMonths = vonYear > 0 ? monthOptions.filter((month, index) => {
      const monthNum = index + 1;
      return monthNum >= vonMonth;
    }) : monthOptions;

    const availableYears = yearOptions.filter(year => year >= vonYear);

    return {
      availableMonths,
      availableYears,
      minYear: vonYear,
      minMonth: vonMonth
    };
  };

  const getAvailableSchulbildungBisYears = (vonValue: string) => {
    if (!vonValue || vonValue === 'heute') {
      return yearOptions;
    }

    const vonYearStr = vonValue.split('-')[0];
    const vonYear = parseInt(vonYearStr || '0');

    if (vonYear === 0) {
      return yearOptions;
    }

    return yearOptions.filter(year => year >= vonYear);
  };

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
              <Card className="p-3 md:p-4 border-0 shadow-sm bg-white">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-base leading-tight">Schulbildung</h3>
                    <p className="text-xs text-muted-foreground">
                      Mindestens ein Eintrag ist erforderlich.
                    </p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addSchulbildungEntry} className="shrink-0">
                    <Plus className="h-4 w-4 mr-2" />
                    Hinzufügen
                  </Button>
                </div>

                <div className="mt-3 space-y-3">
                  {!schulbildung.length && (
                    <div className="rounded-lg bg-muted/20 p-3 text-sm text-muted-foreground">
                      Noch keine Schulbildung hinzugefügt.
                    </div>
                  )}

                  {schulbildung.map((schule, index) => (
                    <div key={index} className="border rounded-lg p-3 md:p-4 space-y-3 md:space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Schulbildung {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSchulbildungEntry(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                        <div>
                          <Label htmlFor={`schulform-${index}`} className="text-sm md:text-base">Schulform/Titel *</Label>
                          <Select
                            value={schule.schulform || ''}
                            onValueChange={(value) => updateSchulbildungEntry(index, 'schulform', value)}
                          >
                            <SelectTrigger className={cn('bg-background h-10 md:h-11 text-sm md:text-base', !schule.schulform ? 'border-destructive' : '')}>
                              <SelectValue placeholder="Schulform wählen" />
                            </SelectTrigger>
                            <SelectContent className="bg-background border shadow-lg z-[10000]">
                              {schulformOptions.map((option) => (
                                <SelectItem key={option} value={option} className="hover:bg-muted">
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor={`schulname-${index}`} className="text-sm md:text-base">Name der Schule *</Label>
                          <Input
                            id={`schulname-${index}`}
                            placeholder="z.B. Friedrich-Schiller-Gymnasium"
                            value={schule.name || ''}
                            onChange={(e) => updateSchulbildungEntry(index, 'name', e.target.value)}
                            className="h-10 md:h-11 text-sm md:text-base"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`schulabschluss-${index}`} className="text-sm md:text-base">Abschluss *</Label>
                          <Select
                            value={schule.abschluss || ''}
                            onValueChange={(value) => {
                              if (value === 'Andere') {
                                const input = prompt('Bitte gib deinen Abschluss ein:');
                                if (input) updateSchulbildungEntry(index, 'abschluss', input);
                              } else {
                                updateSchulbildungEntry(index, 'abschluss', value);
                              }
                            }}
                          >
                            <SelectTrigger className="bg-background h-10 md:h-11 text-sm md:text-base">
                              <SelectValue placeholder="Abschluss wählen" />
                            </SelectTrigger>
                            <SelectContent className="bg-background border shadow-lg z-[10000]">
                              {schulabschlussOptions.map((option) => (
                                <SelectItem key={option} value={option} className="hover:bg-muted">
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label htmlFor={`schule-plz-${index}`} className="text-sm md:text-base">PLZ</Label>
                            <Input
                              id={`schule-plz-${index}`}
                              placeholder="12345"
                              value={schule.plz || ''}
                              onChange={(e) => updateSchulbildungEntry(index, 'plz', e.target.value)}
                              className="h-10 md:h-11 text-sm md:text-base"
                            />
                          </div>
                          <div className="col-span-2">
                            <Label htmlFor={`schule-ort-${index}`} className="text-sm md:text-base">Ort *</Label>
                            <Input
                              id={`schule-ort-${index}`}
                              placeholder="z.B. Berlin"
                              value={schule.ort || ''}
                              onChange={(e) => updateSchulbildungEntry(index, 'ort', e.target.value)}
                              className="h-10 md:h-11 text-sm md:text-base"
                            />
                          </div>
                        </div>
                        {/* Zeitraum: Von Jahr bis Jahr */}
                        <div className="space-y-2 md:space-y-3">
                          <Label className="text-sm md:text-base">Zeitraum *</Label>
                          <div className="grid grid-cols-2 gap-2 md:gap-4">
                            <div className="space-y-1 md:space-y-2">
                              <Label className="text-xs md:text-sm font-medium text-gray-700">Von</Label>
                              <Select
                                value={schule.zeitraum_von ? (schule.zeitraum_von.split('-')[0] || schule.zeitraum_von) : ''}
                                onValueChange={(year) => {
                                  updateSchulbildungDate(index, 'zeitraum_von', year);
                                }}
                              >
                                <SelectTrigger className="h-10 md:h-11 text-sm md:text-base">
                                  <SelectValue placeholder="Jahr wählen" />
                                </SelectTrigger>
                                <SelectContent className="z-[10000]">
                                  {yearOptions.map((year) => (
                                    <SelectItem key={year} value={year.toString()}>
                                      {year}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1 md:space-y-2">
                              <Label className="text-xs md:text-sm font-medium text-gray-700">Bis</Label>
                              <Select
                                value={schule.zeitraum_bis ? (schule.zeitraum_bis.split('-')[0] || schule.zeitraum_bis) : ''}
                                onValueChange={(year) => {
                                  updateSchulbildungDate(index, 'zeitraum_bis', year);
                                }}
                              >
                                <SelectTrigger className="h-10 md:h-11 text-sm md:text-base">
                                  <SelectValue placeholder="Jahr wählen" />
                                </SelectTrigger>
                                <SelectContent className="z-[10000]">
                                  {getAvailableSchulbildungBisYears(schule.zeitraum_von || '').map((year) => (
                                    <SelectItem key={year} value={year.toString()}>
                                      {year}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor={`schulbeschreibung-${index}`} className="text-sm md:text-base">Beschreibung (optional)</Label>
                        <Textarea
                          id={`schulbeschreibung-${index}`}
                          placeholder="z.B. Schwerpunkte, besondere Leistungen, Projekte..."
                          value={schule.beschreibung || ''}
                          onChange={(e) => updateSchulbildungEntry(index, 'beschreibung', e.target.value)}
                          rows={3}
                          className="text-sm md:text-base"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Berufserfahrung */}
              <Card className="p-3 md:p-4 border-0 shadow-sm bg-white">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-base leading-tight">Praktische Erfahrung</h3>
                    <p className="text-xs text-muted-foreground">
                      Mindestens ein Eintrag ist erforderlich.
                    </p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addBerufserfahrungEntry} className="shrink-0">
                    <Plus className="h-4 w-4 mr-2" />
                    Hinzufügen
                  </Button>
                </div>

                <div className="mt-3 space-y-3">
                  {!berufserfahrung.length && (
                    <div className="rounded-lg bg-muted/20 p-3 text-sm text-muted-foreground">
                      Noch keine praktische Erfahrung hinzugefügt.
                    </div>
                  )}

                  {berufserfahrung.map((arbeit, index) => (
                    <div key={index} className="border rounded-lg p-3 md:p-4 space-y-3 md:space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Erfahrung {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBerufserfahrungEntry(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                        <div>
                          <Label htmlFor={`titel-${index}`} className="text-sm md:text-base">Titel *</Label>
                          <Input
                            id={`titel-${index}`}
                            placeholder="z.B. Softwareentwickler, Verkäufer"
                            value={arbeit.titel || ''}
                            onChange={(e) => updateBerufserfahrungEntry(index, 'titel', e.target.value)}
                            className="h-10 md:h-11 text-sm md:text-base"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`art-${index}`} className="text-sm md:text-base">Art *</Label>
                          <Select
                            value={arbeit.art || ''}
                            onValueChange={(value) => updateBerufserfahrungEntry(index, 'art', value)}
                          >
                            <SelectTrigger className={cn('bg-background h-10 md:h-11 text-sm md:text-base', !arbeit.art ? 'border-destructive' : '')}>
                              <SelectValue placeholder="Art wählen" />
                            </SelectTrigger>
                            <SelectContent className="bg-background border shadow-lg z-[10000]">
                              <SelectItem value="Ausbildung">Ausbildung</SelectItem>
                              <SelectItem value="Praktikum">Praktikum</SelectItem>
                              <SelectItem value="Ferienjob">Ferienjob</SelectItem>
                              <SelectItem value="Aushilfe">Aushilfe</SelectItem>
                              <SelectItem value="Vollzeit">Vollzeit</SelectItem>
                              <SelectItem value="Teilzeit">Teilzeit</SelectItem>
                              <SelectItem value="Werkstudent">Werkstudent</SelectItem>
                              <SelectItem value="Minijob">Minijob</SelectItem>
                              <SelectItem value="Freelance">Freelance</SelectItem>
                              <SelectItem value="Selbstständig">Selbstständig</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor={`unternehmen-${index}`} className="text-sm md:text-base">Unternehmen/Einrichtung *</Label>
                          <Input
                            id={`unternehmen-${index}`}
                            placeholder="z.B. Müller GmbH"
                            value={arbeit.unternehmen || ''}
                            onChange={(e) => updateBerufserfahrungEntry(index, 'unternehmen', e.target.value)}
                            className="h-10 md:h-11 text-sm md:text-base"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label htmlFor={`arbeit-plz-${index}`} className="text-sm md:text-base">PLZ</Label>
                            <Input
                              id={`arbeit-plz-${index}`}
                              placeholder="12345"
                              value={arbeit.plz || ''}
                              onChange={(e) => updateBerufserfahrungEntry(index, 'plz', e.target.value)}
                              className="h-10 md:h-11 text-sm md:text-base"
                            />
                          </div>
                          <div className="col-span-2">
                            <Label htmlFor={`arbeit-ort-${index}`} className="text-sm md:text-base">Ort *</Label>
                            <Input
                              id={`arbeit-ort-${index}`}
                              placeholder="z.B. München"
                              value={arbeit.ort || ''}
                              onChange={(e) => updateBerufserfahrungEntry(index, 'ort', e.target.value)}
                              className="h-10 md:h-11 text-sm md:text-base"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 md:space-y-4">
                        <div>
                          <Label className="text-sm md:text-base mb-2 block">Von *</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs md:text-sm text-muted-foreground">Monat</Label>
                              <Select
                                value={arbeit.zeitraum_von ? (arbeit.zeitraum_von.split('-')[1] || '') : ''}
                                onValueChange={(month) => {
                                  const currentValue = arbeit.zeitraum_von || '';
                                  const parts = currentValue.split('-');
                                  const currentYear = parts[0] === '0000' ? '' : (parts[0] || '');
                                  updateBerufserfahrungDate(index, 'zeitraum_von', month, currentYear);
                                }}
                              >
                                <SelectTrigger className="h-10 md:h-11 text-sm md:text-base">
                                  <SelectValue placeholder="Monat" />
                                </SelectTrigger>
                                <SelectContent className="z-[10000]">
                                  {monthOptions.map((month) => (
                                    <SelectItem key={month.value} value={month.value}>
                                      {month.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs md:text-sm text-muted-foreground">Jahr</Label>
                              <Select
                                value={
                                  arbeit.zeitraum_von && arbeit.zeitraum_von.split('-')[0] !== '0000'
                                    ? (arbeit.zeitraum_von.split('-')[0] || '')
                                    : ''
                                }
                                onValueChange={(year) => {
                                  const currentValue = arbeit.zeitraum_von || '';
                                  const parts = currentValue.split('-');
                                  const currentMonth = parts[1] || '';
                                  updateBerufserfahrungDate(index, 'zeitraum_von', currentMonth, year);
                                }}
                              >
                                <SelectTrigger className="h-10 md:h-11 text-sm md:text-base">
                                  <SelectValue placeholder="Jahr" />
                                </SelectTrigger>
                                <SelectContent className="z-[10000]">
                                  {yearOptions.map((year) => (
                                    <SelectItem key={year} value={year.toString()}>
                                      {year}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`current-job-${index}`}
                            checked={isCurrentJob(arbeit)}
                            onCheckedChange={(checked) => toggleCurrentJob(index, checked as boolean)}
                          />
                          <Label htmlFor={`current-job-${index}`}>Aktueller Job (bis heute)</Label>
                        </div>

                        {!isCurrentJob(arbeit) && (() => {
                          const bisOptions = getAvailableBisOptions(arbeit.zeitraum_von || '');
                          const currentBisValue = arbeit.zeitraum_bis || '';
                          const bisParts = currentBisValue.split('-');
                          const bisYear = bisParts[0] === '0000' ? '' : (bisParts[0] || '');
                          const bisMonth = bisParts[1] || '';

                          return (
                            <div>
                              <Label className="text-sm md:text-base mb-2 block">Bis</Label>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label className="text-xs md:text-sm text-muted-foreground">Monat</Label>
                                  <Select
                                    value={bisMonth}
                                    onValueChange={(month) => {
                                      updateBerufserfahrungDate(index, 'zeitraum_bis', month, bisYear);
                                    }}
                                    disabled={!arbeit.zeitraum_von || arbeit.zeitraum_von.split('-')[0] === '0000' || !arbeit.zeitraum_von.split('-')[1]}
                                  >
                                    <SelectTrigger className="h-10 md:h-11 text-sm md:text-base">
                                      <SelectValue placeholder="Monat" />
                                    </SelectTrigger>
                                    <SelectContent className="z-[10000]">
                                      {bisOptions.availableMonths.map((month) => (
                                        <SelectItem key={month.value} value={month.value}>
                                          {month.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label className="text-xs md:text-sm text-muted-foreground">Jahr</Label>
                                  <Select
                                    value={bisYear}
                                    onValueChange={(year) => {
                                      updateBerufserfahrungDate(index, 'zeitraum_bis', bisMonth, year);
                                    }}
                                    disabled={!arbeit.zeitraum_von || arbeit.zeitraum_von.split('-')[0] === '0000' || !arbeit.zeitraum_von.split('-')[1]}
                                  >
                                    <SelectTrigger className="h-10 md:h-11 text-sm md:text-base">
                                      <SelectValue placeholder="Jahr" />
                                    </SelectTrigger>
                                    <SelectContent className="z-[10000]">
                                      {bisOptions.availableYears.map((year) => (
                                        <SelectItem key={year} value={year.toString()}>
                                          {year}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      <div>
                        <Label htmlFor={`arbeitbeschreibung-${index}`} className="text-sm md:text-base">Beschreibung (optional)</Label>
                        <Textarea
                          id={`arbeitbeschreibung-${index}`}
                          placeholder="z.B. Tätigkeiten, erworbene Fähigkeiten..."
                          value={arbeit.beschreibung || ''}
                          onChange={(e) => updateBerufserfahrungEntry(index, 'beschreibung', e.target.value)}
                          rows={4}
                          className="text-sm md:text-base min-h-[80px] md:min-h-[100px]"
                        />
                      </div>
                    </div>
                  ))}
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

