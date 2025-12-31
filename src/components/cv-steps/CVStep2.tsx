import React, { useState, useEffect, useMemo } from 'react';
import { useCVForm } from '@/contexts/CVFormContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { FormFieldError } from '@/components/ui/form-field-error';
import { Button } from '@/components/ui/button';
import { LocationAutocomplete } from '@/components/Company/LocationAutocomplete';
import { useAutoSave } from '@/hooks/useAutoSave';
import { User, X, Camera, CheckCircle2, Info } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { compressImage } from '@/utils/imageCompression';

const CVStep2 = () => {
  const { formData, updateFormData, validationErrors } = useCVForm();
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [showUploadSuccess, setShowUploadSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showTipsDialog, setShowTipsDialog] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  
  // Auto-Save
  useAutoSave(formData, 'cv-form-data-step2', 1000);

  // If user already has an avatar_url (or a saved profilbild URL), show it as preview
  useEffect(() => {
    if (previewUrl) return;
    const fromAvatar = typeof formData.avatar_url === 'string' ? formData.avatar_url.trim() : '';
    const fromProfilbild = typeof formData.profilbild === 'string' ? formData.profilbild.trim() : '';
    const url = fromAvatar || fromProfilbild;
    if (url) setPreviewUrl(url);
  }, [formData.avatar_url, formData.profilbild, previewUrl]);

  // Zeige Erfolgsnachricht nach Upload
  useEffect(() => {
    if (previewUrl && formData.profilbild) {
      setShowUploadSuccess(true);
      const timer = setTimeout(() => {
        setShowUploadSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [previewUrl, formData.profilbild]);

  // Parse location string (format: "PLZ Ort" or "Ort")
  // Fixed: Verhindert doppelte PLZ-Werte
  const parseLocation = (locationStr: string) => {
    if (!locationStr || !locationStr.trim()) {
      return { plz: '', ort: '' };
    }
    
    const trimmed = locationStr.trim();
    
    // Prüfe ob Format "PLZ Ort" (z.B. "10115 Berlin")
    const plzOrtMatch = trimmed.match(/^(\d{5})\s+(.+)$/);
    if (plzOrtMatch) {
      const [, plz, ort] = plzOrtMatch;
      return { plz: plz.trim(), ort: ort.trim() };
    }
    
    // Wenn nur PLZ ohne Ort (z.B. "10115")
    if (/^\d{5}$/.test(trimmed)) {
      return { plz: trimmed, ort: formData.ort || '' };
    }
    
    // Wenn nur Text (Stadt), setze nur Ort und behalte vorhandene PLZ
    // WICHTIG: Wenn der Text bereits eine PLZ enthält, extrahiere sie nicht nochmal
    return { plz: formData.plz || '', ort: trimmed };
  };

  const abschlussOptions = [
    'Hauptschulabschluss',
    'Realschulabschluss / Mittlere Reife',
    'Fachhochschulreife',
    'Abitur',
    'Ohne Abschluss'
  ];

  const handleFileSelect = async (file: File | null) => {
    if (file) {
      setIsUploading(true);
      try {
        // Prüfe Dateityp (nur JPEG und PNG)
        if (!file.type.match(/^image\/(jpeg|jpg|png)$/i)) {
          alert('Bitte wählen Sie ein JPEG oder PNG Bild aus.');
          setIsUploading(false);
          return;
        }

        // Komprimiere Bild
        const compressedFile = await compressImage(file, 800, 800, 0.85);
        
        const url = URL.createObjectURL(compressedFile);
        setPreviewUrl(url);
        updateFormData({ profilbild: compressedFile });
        setShowTipsDialog(false);
      } catch (error) {
        console.error('Fehler beim Komprimieren des Bildes:', error);
        // Fallback: Verwende Original-File
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        updateFormData({ profilbild: file });
        setShowTipsDialog(false);
      } finally {
        setIsUploading(false);
      }
    } else {
      setPreviewUrl('');
      updateFormData({ profilbild: undefined });
      setShowUploadSuccess(false);
    }
  };

  // Calculate max date (16 years ago)
  const getMaxDate = () => {
    const today = new Date();
    return new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());
  };

  const maxDate = getMaxDate();

  return (
    // Apple-like form behavior: header + bottom nav fixed, content scrolls internally when needed.
    <div
      className="h-full min-h-0 w-full max-w-2xl mx-auto px-2 md:px-4 overflow-y-auto pb-24"
      style={{ WebkitOverflowScrolling: 'touch', paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))' as any }}
    >
      <Card className="p-3 md:p-4 border-0 shadow-sm bg-white">
        <div className="space-y-2 md:space-y-3">
          {/* Row 1: Profilbild + Name + Geburtsdatum */}
          <div className="flex flex-col md:flex-row items-start gap-2 md:gap-3">
            {/* Profilbild - Circle */}
            <FormFieldError error={validationErrors.profilbild}>
              <div className="flex-shrink-0 w-full md:w-auto flex flex-col items-center md:items-start gap-2">
                <div className="flex items-center gap-2">
                  {previewUrl ? (
                    <div className="relative group">
                      <div className="w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden border-2 border-gray-200 shadow-sm ring-1 ring-gray-100 transition-all duration-200 group-hover:ring-2 group-hover:ring-blue-500/20">
                        <img
                          src={previewUrl}
                          alt="Profile preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-1 -right-1 h-4 w-4 md:h-5 md:w-5 rounded-full p-0 shadow-md hover:scale-110 transition-transform"
                        onClick={() => handleFileSelect(null)}
                      >
                        <X className="h-2.5 w-2.5 md:h-3 md:w-3" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Dialog open={showTipsDialog} onOpenChange={(open) => {
                        if (!open && pendingFile) {
                          // Don't allow closing without uploading if file is selected
                          return;
                        }
                        setShowTipsDialog(open);
                      }}>
                        <DialogTrigger asChild>
                          <label
                            htmlFor="profilbild-input"
                            className="w-14 h-14 md:w-16 md:h-16 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-200 group touch-manipulation"
                          >
                            <Camera className="h-5 w-5 md:h-6 md:w-6 text-gray-400 group-hover:text-blue-500 transition-colors" />
                            <input
                              id="profilbild-input"
                              type="file"
                              accept="image/jpeg,image/jpg,image/png"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setPendingFile(file);
                                  setShowTipsDialog(true);
                                }
                              }}
                            />
                          </label>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle className="text-lg font-semibold">Profilbild Tipps & Tricks</DialogTitle>
                            <DialogDescription className="text-sm text-gray-600 mt-2">
                              So sieht dein perfektes Profilbild aus:
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <div className="flex items-start gap-2">
                                <CheckCircle2 className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">Gut ausgeleuchtet</p>
                                  <p className="text-xs text-gray-600">Nutze natürliches Licht oder einen gut beleuchteten Raum</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <CheckCircle2 className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">Klarer Hintergrund</p>
                                  <p className="text-xs text-gray-600">Ein neutraler oder einfarbiger Hintergrund lenkt nicht ab</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <CheckCircle2 className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">Professionell</p>
                                  <p className="text-xs text-gray-600">Lächele freundlich und schaue direkt in die Kamera</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <CheckCircle2 className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">Gute Qualität</p>
                                  <p className="text-xs text-gray-600">JPEG oder PNG, mindestens 400x400 Pixel</p>
                                </div>
                              </div>
                            </div>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <div className="flex items-start gap-2">
                                <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-blue-800">
                                  <strong>Tipp:</strong> Dein Bild wird automatisch optimiert, um die beste Qualität bei kleiner Dateigröße zu gewährleisten.
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="pt-2">
                            <Button
                              type="button"
                              onClick={async () => {
                                if (pendingFile) {
                                  await handleFileSelect(pendingFile);
                                } else {
                                  document.getElementById('profilbild-input')?.click();
                                }
                              }}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11 font-medium"
                              disabled={isUploading}
                            >
                              {isUploading ? 'Wird verarbeitet...' : 'Profilbild hochladen'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </>
                  )}
                  {showUploadSuccess && (
                    <div className="flex items-center gap-1.5 text-green-600 animate-in fade-in slide-in-from-right-2 duration-300">
                      <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5" />
                      <span className="text-[10px] md:text-xs font-medium">Hochgeladen</span>
                    </div>
                  )}
                </div>
                {!previewUrl && !(typeof formData.avatar_url === 'string' && formData.avatar_url.trim().length > 0) && (
                  <p className="text-[9px] md:text-[10px] text-red-600 font-medium text-center md:text-left max-w-[140px] md:max-w-none">
                    Profilbild ist erforderlich *
                  </p>
                )}
                {isUploading && (
                  <p className="text-[9px] md:text-[10px] text-blue-600 text-center md:text-left">
                    Wird verarbeitet...
                  </p>
                )}
              </div>
            </FormFieldError>

            {/* Name + Geburtsdatum */}
            <div className="flex-1 space-y-2 md:space-y-2.5 min-w-0 w-full">
              {/* Vorname + Nachname */}
              {/* Mobile: side-by-side to reduce vertical scrolling */}
              <div className="grid grid-cols-2 gap-2 md:gap-2.5">
                <FormFieldError error={validationErrors.vorname}>
                  <div className="space-y-1 md:space-y-1.5">
                    <Label htmlFor="vorname" className="text-[10px] md:text-xs font-medium text-gray-700">Vorname *</Label>
                    <Input
                      id="vorname"
                      value={formData.vorname || ''}
                      onChange={(e) => updateFormData({ vorname: e.target.value })}
                      placeholder="Max"
                      className="h-9 md:h-10 text-xs md:text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors touch-manipulation"
                    />
                  </div>
                </FormFieldError>
                <FormFieldError error={validationErrors.nachname}>
                  <div className="space-y-1 md:space-y-1.5">
                    <Label htmlFor="nachname" className="text-[10px] md:text-xs font-medium text-gray-700">Nachname *</Label>
                    <Input
                      id="nachname"
                      value={formData.nachname || ''}
                      onChange={(e) => updateFormData({ nachname: e.target.value })}
                      placeholder="Mustermann"
                      className="h-9 md:h-10 text-xs md:text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors touch-manipulation"
                    />
                  </div>
                </FormFieldError>
              </div>

              {/* Geburtsdatum */}
              <FormFieldError error={validationErrors.geburtsdatum}>
                <div className="space-y-1 md:space-y-1.5">
                  <Label className="text-[10px] md:text-xs font-medium text-gray-700">Geburtsdatum *</Label>
                  <p className="text-[9px] md:text-[10px] text-gray-500 -mt-0.5">Mindestens 16 Jahre alt</p>
                  <div className="grid grid-cols-3 gap-1.5 md:gap-2">
                    {/* Tag */}
                    <Select
                      value={formData.geburtsdatum ? String(new Date(formData.geburtsdatum instanceof Date ? formData.geburtsdatum : new Date(formData.geburtsdatum)).getDate()).padStart(2, '0') : ''}
                      onValueChange={(day) => {
                        const currentDate = formData.geburtsdatum 
                          ? (formData.geburtsdatum instanceof Date ? formData.geburtsdatum : new Date(formData.geburtsdatum))
                          : new Date(maxDate.getFullYear(), 0, 1);
                        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), parseInt(day));
                        if (newDate > maxDate) {
                          updateFormData({ geburtsdatum: maxDate });
                        } else {
                          updateFormData({ geburtsdatum: newDate });
                        }
                      }}
                    >
                      <SelectTrigger className="h-9 md:h-10 text-xs md:text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500 touch-manipulation">
                        <SelectValue placeholder="Tag" />
                      </SelectTrigger>
                      <SelectContent className="z-50">
                        {(() => {
                          const currentDate = formData.geburtsdatum 
                            ? (formData.geburtsdatum instanceof Date ? formData.geburtsdatum : new Date(formData.geburtsdatum))
                            : null;
                          const daysInMonth = currentDate 
                            ? new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
                            : 31;
                          const maxDay = currentDate && currentDate.getFullYear() === maxDate.getFullYear() && 
                                         currentDate.getMonth() === maxDate.getMonth()
                            ? maxDate.getDate()
                            : daysInMonth;
                          return Array.from({ length: maxDay }, (_, i) => i + 1).map((day) => (
                          // IMPORTANT: keep values zero-padded to match the Select value (prevents "day not selectable" on mobile)
                          <SelectItem key={day} value={String(day).padStart(2, '0')}>
                              {String(day).padStart(2, '0')}
                            </SelectItem>
                          ));
                        })()}
                      </SelectContent>
                    </Select>

                    {/* Monat */}
                    <Select
                      value={formData.geburtsdatum ? String(new Date(formData.geburtsdatum instanceof Date ? formData.geburtsdatum : new Date(formData.geburtsdatum)).getMonth() + 1).padStart(2, '0') : ''}
                      onValueChange={(month) => {
                        const currentDate = formData.geburtsdatum 
                          ? (formData.geburtsdatum instanceof Date ? formData.geburtsdatum : new Date(formData.geburtsdatum))
                          : new Date(maxDate.getFullYear(), 0, 1);
                        const day = currentDate.getDate();
                        const daysInMonth = new Date(currentDate.getFullYear(), parseInt(month), 0).getDate();
                        let newDate = new Date(currentDate.getFullYear(), parseInt(month) - 1, Math.min(day, daysInMonth));
                        if (newDate > maxDate) {
                          newDate = maxDate;
                        }
                        updateFormData({ geburtsdatum: newDate });
                      }}
                    >
                      <SelectTrigger className="h-9 md:h-10 text-xs md:text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500 touch-manipulation">
                        <SelectValue placeholder="Monat" />
                      </SelectTrigger>
                      <SelectContent className="z-50">
                        {(() => {
                          const currentDate = formData.geburtsdatum 
                            ? (formData.geburtsdatum instanceof Date ? formData.geburtsdatum : new Date(formData.geburtsdatum))
                            : null;
                          const months = [
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
                            { value: '12', label: 'Dezember' },
                          ];
                          if (currentDate && currentDate.getFullYear() === maxDate.getFullYear()) {
                            return months.slice(0, maxDate.getMonth() + 1).map((month) => (
                              <SelectItem key={month.value} value={month.value}>
                                {month.label}
                              </SelectItem>
                            ));
                          }
                          return months.map((month) => (
                            <SelectItem key={month.value} value={month.value}>
                              {month.label}
                            </SelectItem>
                          ));
                        })()}
                      </SelectContent>
                    </Select>

                    {/* Jahr */}
                    <Select
                      value={formData.geburtsdatum ? String(new Date(formData.geburtsdatum instanceof Date ? formData.geburtsdatum : new Date(formData.geburtsdatum)).getFullYear()) : ''}
                      onValueChange={(year) => {
                        const currentDate = formData.geburtsdatum 
                          ? (formData.geburtsdatum instanceof Date ? formData.geburtsdatum : new Date(formData.geburtsdatum))
                          : new Date(maxDate.getFullYear(), 0, 1);
                        const day = currentDate.getDate();
                        const month = currentDate.getMonth();
                        const daysInMonth = new Date(parseInt(year), month + 1, 0).getDate();
                        let newDate = new Date(parseInt(year), month, Math.min(day, daysInMonth));
                        if (newDate > maxDate) {
                          newDate = maxDate;
                        }
                        updateFormData({ geburtsdatum: newDate });
                      }}
                    >
                      <SelectTrigger className="h-9 md:h-10 text-xs md:text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500 touch-manipulation">
                        <SelectValue placeholder="Jahr" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px] z-50">
                        {(() => {
                          const maxYear = maxDate.getFullYear();
                          const minYear = maxYear - 100;
                          return Array.from({ length: maxYear - minYear + 1 }, (_, i) => {
                            const year = maxYear - i;
                            return (
                              <SelectItem key={year} value={String(year)}>
                                {year}
                              </SelectItem>
                            );
                          });
                        })()}
                      </SelectContent>
                    </Select>
                  </div>
                  {validationErrors.geburtsdatum && (
                    <p className="text-xs text-red-600 mt-1">{validationErrors.geburtsdatum}</p>
                  )}
                </div>
              </FormFieldError>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200"></div>

          {/* Row 2: Email + Telefon */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-2.5">
            <FormFieldError error={validationErrors.email}>
              <div className="space-y-1 md:space-y-1.5">
                <Label htmlFor="email" className="text-[10px] md:text-xs font-medium text-gray-700">E-Mail *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => updateFormData({ email: e.target.value })}
                  placeholder="max@email.com"
                  className="h-9 md:h-10 text-xs md:text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors touch-manipulation"
                />
              </div>
            </FormFieldError>
            
            <FormFieldError error={validationErrors.telefon}>
              <div className="space-y-1 md:space-y-1.5">
                <Label htmlFor="telefon" className="text-[10px] md:text-xs font-medium text-gray-700">Telefon *</Label>
                <Input
                  id="telefon"
                  value={formData.telefon || ''}
                  onChange={(e) => updateFormData({ telefon: e.target.value })}
                  placeholder="+49 123 456789"
                  className="h-9 md:h-10 text-xs md:text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors touch-manipulation"
                />
              </div>
            </FormFieldError>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200"></div>

          {/* Row 3: Straße + Nr. */}
          {/* Mobile: Straße & Hausnummer side-by-side */}
          <div className="grid grid-cols-3 gap-2 md:gap-2.5 relative z-10">
            <FormFieldError error={validationErrors.strasse} className="col-span-2 md:col-span-2">
              <div className="space-y-1 md:space-y-1.5">
                <Label htmlFor="strasse" className="text-[10px] md:text-xs font-medium text-gray-700">Straße *</Label>
                <Input
                  id="strasse"
                  value={formData.strasse || ''}
                  onChange={(e) => updateFormData({ strasse: e.target.value })}
                  placeholder="Musterstraße"
                  className="h-9 md:h-10 text-xs md:text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors touch-manipulation relative z-10"
                />
              </div>
            </FormFieldError>
            <FormFieldError error={validationErrors.hausnummer}>
              <div className="space-y-1 md:space-y-1.5">
                <Label htmlFor="hausnummer" className="text-[10px] md:text-xs font-medium text-gray-700">Hausnummer *</Label>
                <Input
                  id="hausnummer"
                  value={formData.hausnummer || ''}
                  onChange={(e) => updateFormData({ hausnummer: e.target.value })}
                  placeholder="123a"
                  className="h-9 md:h-10 text-xs md:text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors touch-manipulation relative z-10"
                />
              </div>
            </FormFieldError>
          </div>
          
          {/* Row 4: PLZ & Ort */}
          <FormFieldError error={validationErrors.plz || validationErrors.ort}>
            <div className="space-y-1 md:space-y-1.5 relative z-10">
              <Label className="text-[10px] md:text-xs font-medium text-gray-700">PLZ & Ort *</Label>
              <LocationAutocomplete
                value={
                  formData.plz && formData.ort 
                    ? `${formData.plz} ${formData.ort}` 
                    : formData.plz 
                      ? formData.plz 
                      : formData.ort || ''
                }
                onChange={(value) => {
                  if (!value || !value.trim()) {
                    updateFormData({ plz: '', ort: '' });
                    return;
                  }
                  // Fixed: Verhindert doppelte PLZ-Werte durch bessere parseLocation-Logik
                  const { plz, ort } = parseLocation(value);
                  // Nur updaten wenn sich etwas geändert hat, um unnötige Re-Renders zu vermeiden
                  if (plz !== formData.plz || ort !== formData.ort) {
                    updateFormData({ plz, ort });
                  }
                }}
                placeholder="PLZ oder Stadt eingeben..."
                className="h-9 md:h-10 text-xs md:text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors touch-manipulation"
              />
            </div>
          </FormFieldError>

          {/* Divider */}
          <div className="border-t border-gray-200"></div>

          {/* Row 5: Führerschein */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-2.5">
            <FormFieldError error={validationErrors.has_drivers_license}>
              <div className="space-y-1 md:space-y-1.5">
                <Label className="text-[10px] md:text-xs font-medium text-gray-700">Führerschein vorhanden? *</Label>
                <Select 
                  value={formData.has_drivers_license !== undefined ? String(formData.has_drivers_license) : ''} 
                  onValueChange={(value) => {
                    const hasLicense = value === 'true';
                    updateFormData({ 
                      has_drivers_license: hasLicense,
                      driver_license_class: hasLicense ? formData.driver_license_class : undefined
                    });
                  }}
                >
                  <SelectTrigger className="h-9 md:h-10 text-xs md:text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500 touch-manipulation">
                    <SelectValue placeholder="Bitte auswählen" />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    <SelectItem value="true">Ja</SelectItem>
                    <SelectItem value="false">Nein</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </FormFieldError>
            
            {formData.has_drivers_license && (
              <FormFieldError error={validationErrors.driver_license_class}>
                <div className="space-y-1 md:space-y-1.5">
                  <Label className="text-[10px] md:text-xs font-medium text-gray-700">Führerscheinklasse *</Label>
                  <Select 
                    value={formData.driver_license_class || ''} 
                    onValueChange={(value) => updateFormData({ driver_license_class: value })}
                  >
                    <SelectTrigger className="h-9 md:h-10 text-xs md:text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500 touch-manipulation">
                      <SelectValue placeholder="Klasse auswählen" />
                    </SelectTrigger>
                    <SelectContent className="z-50">
                      <SelectItem value="AM">AM</SelectItem>
                      <SelectItem value="A1">A1</SelectItem>
                      <SelectItem value="A2">A2</SelectItem>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                      <SelectItem value="BE">BE</SelectItem>
                      <SelectItem value="C1">C1</SelectItem>
                      <SelectItem value="C1E">C1E</SelectItem>
                      <SelectItem value="C">C</SelectItem>
                      <SelectItem value="CE">CE</SelectItem>
                      <SelectItem value="D1">D1</SelectItem>
                      <SelectItem value="D1E">D1E</SelectItem>
                      <SelectItem value="D">D</SelectItem>
                      <SelectItem value="DE">DE</SelectItem>
                      <SelectItem value="L">L</SelectItem>
                      <SelectItem value="T">T</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </FormFieldError>
            )}
          </div>

          {/* Schüler-spezifische Felder */}
          {/* NOTE: school details for Schüler/Azubi/Fachkraft are captured in the Werdegang step (Step 4).
              Keeping Step 2 compact avoids any scrolling. */}
        </div>
      </Card>
    </div>
  );
};

export default CVStep2;
