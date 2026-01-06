import React, { useEffect, useState } from 'react';
import { useCVForm } from '@/contexts/CVFormContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, CalendarIcon, Sparkles, Loader2 } from 'lucide-react';
import { SchulbildungEntry, BerufserfahrungEntry } from '@/contexts/CVFormContext';
import { PLZOrtSelector } from '@/components/shared/PLZOrtSelector';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FormFieldError } from '@/components/ui/form-field-error';

const CVStep4 = () => {
  const { formData, updateFormData, validationErrors } = useCVForm();
  const { toast } = useToast();
  
  // Local states for dynamic entry inputs to prevent focus loss
  const [localEntryInputs, setLocalEntryInputs] = useState<Record<string, string>>({});
  const [generatingBulletsFor, setGeneratingBulletsFor] = useState<number | null>(null);

  // Debounced update function with stable reference
  const debouncedUpdate = useDebounce((updates: any) => {
    updateFormData(updates);
  }, 500);

  // Helper functions to handle local state for dynamic entries
  const getLocalInputKey = (type: 'schul' | 'berufs', index: number, field: string) => {
    return `${type}_${index}_${field}`;
  };

  const handleDynamicInputChange = (type: 'schul' | 'berufs', index: number, field: string, value: string) => {
    const key = getLocalInputKey(type, index, field);
    setLocalEntryInputs(prev => ({ ...prev, [key]: value }));
    
    // Update formData with debouncing
    if (type === 'schul') {
      const schulbildung = formData.schulbildung || [];
      const updated = [...schulbildung];
      updated[index] = { ...updated[index], [field]: value };
      debouncedUpdate({ schulbildung: updated });
    } else {
      const berufserfahrung = formData.berufserfahrung || [];
      const updated = [...berufserfahrung];
      updated[index] = { ...updated[index], [field]: value };
      debouncedUpdate({ berufserfahrung: updated });
    }
  };

  const handleDynamicInputBlur = (type: 'schul' | 'berufs', index: number, field: string, value: string) => {
    if (type === 'schul') {
      const schulbildung = formData.schulbildung || [];
      const updated = [...schulbildung];
      updated[index] = { ...updated[index], [field]: value };
      updateFormData({ schulbildung: updated });
    } else {
      const berufserfahrung = formData.berufserfahrung || [];
      const updated = [...berufserfahrung];
      updated[index] = { ...updated[index], [field]: value };
      updateFormData({ berufserfahrung: updated });
    }
  };

  const getLocalInputValue = (type: 'schul' | 'berufs', index: number, field: string, defaultValue: string) => {
    const key = getLocalInputKey(type, index, field);
    return localEntryInputs[key] !== undefined ? localEntryInputs[key] : defaultValue;
  };

  // Generate year options (current year + 1 future max, back to 1950)
  const currentYear = new Date().getFullYear();
  const maxFutureYear = currentYear + 1; // Max 1 year in the future
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

  // Helper function to get available months/years for "Bis" based on "Von"
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

    // If same year, only allow months >= vonMonth
    // If later year, allow all months
    const availableMonths = vonYear > 0 ? monthOptions.filter((month, index) => {
      const monthNum = index + 1;
      return monthNum >= vonMonth;
    }) : monthOptions;

    // Years: only allow years >= vonYear
    const availableYears = yearOptions.filter(year => year >= vonYear);

    return {
      availableMonths,
      availableYears,
      minYear: vonYear,
      minMonth: vonMonth
    };
  };

  // Schulform-Optionen: Nur die gewünschten Optionen
  // Wird für ALLE Status-Typen verwendet (Schüler, Azubi, Fachkraft)
  const schulformOptions = [
    'Realschule',
    'Hauptschule',
    'Berufsschule',
    'Gymnasium',
    'Andere'
  ];

  // Schüler-spezifische Abschlussoptionen (nur für Step 2: "Geplanter Abschluss")
  const studentAbschlussOptions = [
    'Hauptschulabschluss',
    'Realschulabschluss / Mittlere Reife',
    'Fachhochschulreife',
    'Abitur',
    'Ohne Abschluss'
  ];

  // Alle Status-Typen (Schüler, Azubi, Fachkraft) verwenden die gleichen Schulform-Optionen
  const schoolTitleOptions = schulformOptions;

  const currentYearForStudent = new Date().getFullYear();
  const studentYearOptions = Array.from({ length: 7 }, (_, i) => (currentYearForStudent - 1 + i).toString());

  // Auto-add entry for students, apprentices and graduates
  React.useEffect(() => {
    // Auto-add school entry for students
    if (formData.status === 'schueler' && formData.schule && formData.geplanter_abschluss) {
      const schulbildung = formData.schulbildung || [];
      
      // Check if automatic entry already exists
      const hasAutoEntry = schulbildung.some(entry => 
        entry.name === formData.schule && entry.schulform === formData.geplanter_abschluss
      );
      
      if (!hasAutoEntry) {
        // Calculate school period (assume 4 years for typical graduation)
        const abschlussJahr = parseInt(formData.abschlussjahr || new Date().getFullYear().toString());
        const startJahr = abschlussJahr - 4;
        
        const autoEntry: SchulbildungEntry = {
          schulform: formData.geplanter_abschluss,
          name: formData.schule,
          ort: formData.ort || '',
          zeitraum_von: startJahr.toString(),
          zeitraum_bis: formData.abschlussjahr || '',
          beschreibung: `Angestrebter Abschluss: ${formData.geplanter_abschluss}`
        };
        
        updateFormData({ schulbildung: [autoEntry, ...schulbildung] });
      }
    }
    
    // Auto-add work entry for apprentices
    if (formData.status === 'azubi' && formData.ausbildungsberuf && formData.ausbildungsbetrieb) {
      const berufserfahrung = formData.berufserfahrung || [];
      
      // Check if automatic entry already exists
      const hasAutoEntry = berufserfahrung.some(entry => 
        entry.titel === formData.ausbildungsberuf && entry.unternehmen === formData.ausbildungsbetrieb
      );
      
      if (!hasAutoEntry) {
        const autoEntry: BerufserfahrungEntry = {
          titel: formData.ausbildungsberuf,
          unternehmen: formData.ausbildungsbetrieb,
          ort: formData.ort || '',
          zeitraum_von: formData.startjahr || '',
          zeitraum_bis: formData.voraussichtliches_ende || '',
          beschreibung: `Ausbildung zum ${formData.ausbildungsberuf}`
        };
        
        updateFormData({ berufserfahrung: [autoEntry, ...berufserfahrung] });
      }
    }
    
    // Auto-add work entry for graduates
    if (formData.status === 'fachkraft' && formData.aktueller_beruf) {
      const berufserfahrung = formData.berufserfahrung || [];
      
      // Check if automatic entry already exists
      const hasAutoEntry = berufserfahrung.some(entry => 
        entry.titel === formData.aktueller_beruf && entry.zeitraum_bis === 'heute'
      );
      
      if (!hasAutoEntry) {
        const autoEntry: BerufserfahrungEntry = {
          titel: formData.aktueller_beruf,
          unternehmen: '', // Will be filled by user
          ort: formData.ort || '',
          zeitraum_von: formData.abschlussjahr_fachkraft || '',
          zeitraum_bis: 'heute',
          beschreibung: `Berufstätigkeit als ${formData.aktueller_beruf}`
        };
        
        updateFormData({ berufserfahrung: [autoEntry, ...berufserfahrung] });
      }
    }
  }, [formData.status, formData.schule, formData.geplanter_abschluss, formData.abschlussjahr, formData.ausbildungsberuf, formData.ausbildungsbetrieb, formData.aktueller_beruf]);

  const addSchulbildungEntry = () => {
    const newEntry: SchulbildungEntry = {
      schulform: '',
      abschluss: '',
      name: '',
      ort: '',
      zeitraum_von: '', // Format: YYYY-MM
      zeitraum_bis: '', // Format: YYYY-MM
      beschreibung: ''
    };
    
    const schulbildung = formData.schulbildung || [];
    updateFormData({ schulbildung: [...schulbildung, newEntry] });
  };

  const updateSchulbildungEntry = (index: number, field: keyof SchulbildungEntry, value: string) => {
    const schulbildung = formData.schulbildung || [];
    const updated = [...schulbildung];
    updated[index] = { ...updated[index], [field]: value };
    updateFormData({ schulbildung: updated });
    
    // Update local state for consistency
    const key = getLocalInputKey('schul', index, field);
    setLocalEntryInputs(prev => ({ ...prev, [key]: value }));
  };

  // Update Schulbildung Date with Year only (Format: YYYY)
  const updateSchulbildungDate = (index: number, field: 'zeitraum_von' | 'zeitraum_bis', year: string) => {
    // Validate year is not more than 1 year in the future
    const currentYearNum = new Date().getFullYear();
    const maxFutureYear = currentYearNum + 1;
    
    if (year) {
      const yearNum = parseInt(year);
      if (!isNaN(yearNum) && yearNum > maxFutureYear) {
        toast({
          title: "Ungültiges Datum",
          description: `Das Datum darf nicht mehr als 1 Jahr in der Zukunft liegen (maximal ${maxFutureYear}).`,
          variant: "destructive"
        });
        return; // Don't update if invalid
      }
    }
    
    // Store only the year (Format: YYYY)
    updateSchulbildungEntry(index, field, year);
    
    // Validate: "Bis" darf nicht vor "Von" sein
    if (field === 'zeitraum_von') {
      const schulbildung = formData.schulbildung || [];
      const schule = schulbildung[index];
      if (schule && schule.zeitraum_bis) {
        // Extract year from bis (could be YYYY or YYYY-MM format)
        const bisYearStr = schule.zeitraum_bis.split('-')[0];
        const bisYear = parseInt(bisYearStr || '0');
        const vonYear = parseInt(year || '0');
        
        // If bis is before von, reset bis
        if (bisYear > 0 && vonYear > 0 && bisYear < vonYear) {
          updateSchulbildungEntry(index, 'zeitraum_bis', '');
          toast({
            title: "Ungültiges Datum",
            description: "Das Enddatum wurde zurückgesetzt, da es vor dem Startdatum lag.",
            variant: "destructive"
          });
        }
      }
    } else if (field === 'zeitraum_bis') {
      // Validate: "Bis" darf nicht vor "Von" sein
      const schulbildung = formData.schulbildung || [];
      const schule = schulbildung[index];
      if (schule && schule.zeitraum_von) {
        // Extract year from von (could be YYYY or YYYY-MM format)
        const vonYearStr = schule.zeitraum_von.split('-')[0];
        const vonYear = parseInt(vonYearStr || '0');
        const bisYear = parseInt(year || '0');
        
        // If bis is before von, don't save it
        if (vonYear > 0 && bisYear > 0 && bisYear < vonYear) {
          toast({
            title: "Ungültiges Datum",
            description: "Das Enddatum darf nicht vor dem Startdatum liegen.",
            variant: "destructive"
          });
          return; // Don't update if invalid
        }
      }
    }
  };

  // Helper function to get available years for "Bis" based on "Von" for Schulbildung
  const getAvailableSchulbildungBisYears = (vonValue: string) => {
    if (!vonValue || vonValue === 'heute') {
      return yearOptions;
    }

    // Extract year from von (could be YYYY or YYYY-MM format)
    const vonYearStr = vonValue.split('-')[0];
    const vonYear = parseInt(vonYearStr || '0');

    if (vonYear === 0) {
      return yearOptions;
    }

    // Years: nur Jahre >= vonYear erlauben
    return yearOptions.filter(year => year >= vonYear);
  };

  const updateBerufserfahrungDate = (index: number, field: 'zeitraum_von' | 'zeitraum_bis', month: string, year: string) => {
    const currentValue = formData.berufserfahrung?.[index]?.[field] || '';
    const parts = currentValue.split('-');
    const currentYear = parts[0] || '';
    const currentMonth = parts[1] || '';
    
    const finalYear = year || currentYear;
    const finalMonth = month || currentMonth;
    
    // Validate year is not more than 1 year in the future
    const currentYearNum = new Date().getFullYear();
    const maxFutureYear = currentYearNum + 1;
    
    if (finalYear && finalYear !== '0000') {
      const yearNum = parseInt(finalYear);
      if (!isNaN(yearNum) && yearNum > maxFutureYear) {
        toast({
          title: "Ungültiges Datum",
          description: `Das Datum darf nicht mehr als 1 Jahr in der Zukunft liegen (maximal ${maxFutureYear}).`,
          variant: "destructive"
        });
        return; // Don't update if invalid
      }
    }
    
    // If only month is provided, store it temporarily with placeholder year
    if (finalMonth && !finalYear) {
      updateBerufserfahrungEntry(index, field, `0000-${finalMonth}`);
    } else if (finalYear && finalMonth) {
      // If both are provided, store the complete date
      const monthYear = `${finalYear}-${finalMonth}`;
      updateBerufserfahrungEntry(index, field, monthYear);
      
      // If updating "Von", validate and reset "Bis" if it's before "Von"
      if (field === 'zeitraum_von') {
        const berufserfahrung = formData.berufserfahrung || [];
        const arbeit = berufserfahrung[index];
        if (arbeit && arbeit.zeitraum_bis && arbeit.zeitraum_bis !== 'heute') {
          const bisParts = arbeit.zeitraum_bis.split('-');
          const bisYear = parseInt(bisParts[0] || '0');
          const bisMonth = parseInt(bisParts[1] || '0');
          const vonYear = parseInt(finalYear);
          const vonMonth = parseInt(finalMonth);
          
          // If bis is before von, reset bis
          if (bisYear < vonYear || (bisYear === vonYear && bisMonth < vonMonth)) {
            updateBerufserfahrungEntry(index, 'zeitraum_bis', '');
          }
        }
      }
      
      // If updating "Bis", validate it's not before "Von"
      if (field === 'zeitraum_bis') {
        const berufserfahrung = formData.berufserfahrung || [];
        const arbeit = berufserfahrung[index];
        if (arbeit && arbeit.zeitraum_von && arbeit.zeitraum_von.split('-')[0] !== '0000') {
          const vonParts = arbeit.zeitraum_von.split('-');
          const vonYear = parseInt(vonParts[0] || '0');
          const vonMonth = parseInt(vonParts[1] || '0');
          const bisYear = parseInt(finalYear);
          const bisMonth = parseInt(finalMonth);
          
          // If bis is before von, don't save it
          if (bisYear < vonYear || (bisYear === vonYear && bisMonth < vonMonth)) {
            toast({
              title: "Ungültiges Datum",
              description: "Das Enddatum muss nach dem Startdatum liegen.",
              variant: "destructive"
            });
            return; // Don't update if invalid
          }
        }
      }
    } else if (finalYear && !finalMonth && currentMonth) {
      // If only year is provided but month exists, combine them
      updateBerufserfahrungEntry(index, field, `${finalYear}-${currentMonth}`);
      
      // Same validation as above
      if (field === 'zeitraum_von') {
        const berufserfahrung = formData.berufserfahrung || [];
        const arbeit = berufserfahrung[index];
        if (arbeit && arbeit.zeitraum_bis && arbeit.zeitraum_bis !== 'heute') {
          const bisParts = arbeit.zeitraum_bis.split('-');
          const bisYear = parseInt(bisParts[0] || '0');
          const bisMonth = parseInt(bisParts[1] || '0');
          const vonYear = parseInt(finalYear);
          const vonMonth = parseInt(currentMonth);
          
          if (bisYear < vonYear || (bisYear === vonYear && bisMonth < vonMonth)) {
            updateBerufserfahrungEntry(index, 'zeitraum_bis', '');
          }
        }
      }
    }
  };

  const toggleCurrentJob = (index: number, isCurrent: boolean) => {
    const berufserfahrung = formData.berufserfahrung || [];
    const updated = [...berufserfahrung];
    
    if (isCurrent) {
      // Mark as current job - set a special marker value
      updated[index] = { ...updated[index], zeitraum_bis: 'heute' };
    } else {
      // Not a current job - clear the end date so user can set it
      updated[index] = { ...updated[index], zeitraum_bis: '' };
    }
    
    updateFormData({ berufserfahrung: updated });
  };

  const isCurrentJob = (arbeit: BerufserfahrungEntry) => {
    return arbeit.zeitraum_bis === 'heute';
  };

  const removeSchulbildungEntry = (index: number) => {
    const schulbildung = formData.schulbildung || [];
    updateFormData({ schulbildung: schulbildung.filter((_, i) => i !== index) });
  };

  const addBerufserfahrungEntry = () => {
    const newEntry: BerufserfahrungEntry = {
      titel: '',
      art: '',
      unternehmen: '',
      ort: '',
      zeitraum_von: '',
      zeitraum_bis: '',
      beschreibung: ''
    };
    
    const berufserfahrung = formData.berufserfahrung || [];
    updateFormData({ berufserfahrung: [...berufserfahrung, newEntry] });
  };

  const updateBerufserfahrungEntry = (index: number, field: keyof BerufserfahrungEntry, value: string) => {
    const berufserfahrung = formData.berufserfahrung || [];
    const updated = [...berufserfahrung];
    updated[index] = { ...updated[index], [field]: value };
    updateFormData({ berufserfahrung: updated });
    
    // Update local state for consistency
    const key = getLocalInputKey('berufs', index, field);
    setLocalEntryInputs(prev => ({ ...prev, [key]: value }));
  };

  const removeBerufserfahrungEntry = (index: number) => {
    const berufserfahrung = formData.berufserfahrung || [];
    updateFormData({ berufserfahrung: berufserfahrung.filter((_, i) => i !== index) });
  };

  const handleGenerateJobBullets = async (index: number) => {
    const arbeit = formData.berufserfahrung?.[index];
    if (!arbeit?.titel || !arbeit?.unternehmen) {
      toast({
        title: "Fehler",
        description: "Bitte fülle zuerst Titel und Unternehmen aus.",
        variant: "destructive"
      });
      return;
    }

    setGeneratingBulletsFor(index);
    try {
      const { data, error } = await supabase.functions.invoke('ai-generate-job-bullets', {
        body: { 
          jobTitle: arbeit.titel,
          company: arbeit.unternehmen,
          industry: formData.branche
        }
      });

      if (error) throw error;

      if (data.success && data.bullets) {
        // Clean bullets: Remove any remaining JSON artifacts
        const cleanBullets = data.bullets.map((bullet: string) => 
          bullet
            .replace(/^["'\[\]]+|["'\[\]]+$/g, '') // Remove quotes & brackets
            .replace(/^[•\-\*\d\.]\s*/, '') // Remove existing bullet symbols
            .trim()
        ).filter((b: string) => b.length > 0);

        // Join with bullet points
        const bulletText = cleanBullets
          .map((bullet: string) => `• ${bullet}`)
          .join('\n');
        
        updateBerufserfahrungEntry(index, 'beschreibung', bulletText);
        
        toast({
          title: "Erfolgreich",
          description: `${cleanBullets.length} Aufgaben wurden generiert!`
        });
      }
    } catch (error) {
      console.error('Error generating job bullets:', error);
      toast({
        title: "Fehler",
        description: "Fehler beim Generieren der Aufgaben.",
        variant: "destructive"
      });
    } finally {
      setGeneratingBulletsFor(null);
    }
  };


  const hasMinimumSchulbildung = (formData.schulbildung?.length || 0) > 0;
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

  const latestSchoolIndex = (() => {
    const schools = formData.schulbildung || [];
    let idx = schools.length ? 0 : -1;
    let best = Number.NEGATIVE_INFINITY;
    for (let i = 0; i < schools.length; i++) {
      const s = schools[i];
      const bis = parseInt((s.zeitraum_bis || '').toString(), 10);
      const von = parseInt((s.zeitraum_von || '').toString(), 10);
      const candidate = Number.isFinite(bis) ? bis : (Number.isFinite(von) ? von : Number.NEGATIVE_INFINITY);
      if (candidate > best) {
        best = candidate;
        idx = i;
      }
    }
    return idx;
  })();

  return (
    <div
      className="h-full min-h-0 w-full max-w-2xl mx-auto px-2 md:px-4 overflow-y-auto pb-24 space-y-3"
      style={{ WebkitOverflowScrolling: 'touch', paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))' as any }}
    >
      {/* Apple-like: linear screen (no tabs). Single scroll container; header + bottom nav stay fixed. */}
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

              {formData.status === 'schueler' && (
                <div className="mt-3 rounded-lg border bg-muted/10 p-3">
                  <div className="text-xs font-semibold text-foreground mb-2">Schüler:in Angaben</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="md:col-span-2">
                      <Label className="text-xs">Schule *</Label>
                      <FormFieldError error={validationErrors.schule}>
                        <Input
                          placeholder="z.B. Friedrich-Schiller-Gymnasium"
                          value={formData.schule || ''}
                          onChange={(e) => updateFormData({ schule: e.target.value })}
                        />
                      </FormFieldError>
                    </div>
                    <div>
                      <Label className="text-xs">Abschlussjahr *</Label>
                      <FormFieldError error={validationErrors.abschlussjahr}>
                        <Select
                          value={formData.abschlussjahr || ''}
                          onValueChange={(value) => updateFormData({ abschlussjahr: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Jahr" />
                          </SelectTrigger>
                          <SelectContent>
                            {studentYearOptions.map((y) => (
                              <SelectItem key={y} value={y}>
                                {y}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormFieldError>
                    </div>
                    <div className="md:col-span-3">
                      <Label className="text-xs">Geplanter Abschluss *</Label>
                      {/* FormFieldError doesn't work cleanly with Select wrappers; show error text manually */}
                      <Select
                        value={formData.geplanter_abschluss || ''}
                        onValueChange={(value) => updateFormData({ geplanter_abschluss: value })}
                      >
                        <SelectTrigger className={validationErrors.geplanter_abschluss ? 'border-destructive' : ''}>
                          <SelectValue placeholder="Abschluss wählen" />
                        </SelectTrigger>
                        <SelectContent className="z-50">
                          {studentAbschlussOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {validationErrors.geplanter_abschluss && (
                        <p className="mt-1 text-sm text-destructive font-medium">
                          {validationErrors.geplanter_abschluss}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-3 space-y-3">
                {!formData.schulbildung?.length && (
                  <div className="rounded-lg bg-muted/20 p-3 text-sm text-muted-foreground">
                    Noch keine Schulbildung hinzugefügt.
                  </div>
                )}

                {formData.schulbildung?.map((schule, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
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

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`schulform-${index}`}>Schulform/Titel *</Label>
                        <Select
                          value={schule.schulform || ''}
                          onValueChange={(value) => updateSchulbildungEntry(index, 'schulform', value)}
                        >
                          <SelectTrigger className={cn('bg-background', !schule.schulform ? 'border-destructive' : '')}>
                            <SelectValue placeholder="Schulform wählen" />
                          </SelectTrigger>
                          <SelectContent className="bg-background border shadow-lg z-50">
                            {schoolTitleOptions.map((option) => (
                              <SelectItem key={option} value={option} className="hover:bg-muted">
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor={`schulname-${index}`}>Name der Schule *</Label>
                        <Input
                          id={`schulname-${index}`}
                          placeholder="z.B. Friedrich-Schiller-Gymnasium"
                          value={getLocalInputValue('schul', index, 'name', schule.name)}
                          onChange={(e) => handleDynamicInputChange('schul', index, 'name', e.target.value)}
                          onBlur={(e) => handleDynamicInputBlur('schul', index, 'name', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`schulabschluss-${index}`}>
                          Abschluss {index === latestSchoolIndex ? '*' : '(optional)'}
                        </Label>
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
                          <SelectTrigger
                            className={cn(
                              'bg-background',
                              validationErrors[`schulbildung_${index}_abschluss`] ? 'border-destructive' : ''
                            )}
                          >
                            <SelectValue placeholder="Abschluss wählen" />
                          </SelectTrigger>
                          <SelectContent className="bg-background border shadow-lg z-50">
                            {schulabschlussOptions.map((option) => (
                              <SelectItem key={option} value={option} className="hover:bg-muted">
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {validationErrors[`schulbildung_${index}_abschluss`] && (
                          <p className="mt-1 text-sm text-destructive font-medium">
                            {validationErrors[`schulbildung_${index}_abschluss`]}
                          </p>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label htmlFor={`schule-plz-${index}`}>PLZ</Label>
                          <Input
                            id={`schule-plz-${index}`}
                            placeholder="12345"
                            value={getLocalInputValue('schul', index, 'plz', schule.plz || '')}
                            onChange={(e) => handleDynamicInputChange('schul', index, 'plz', e.target.value)}
                            onBlur={(e) => handleDynamicInputBlur('schul', index, 'plz', e.target.value)}
                          />
                        </div>
                        <div className="col-span-2">
                          <Label htmlFor={`schule-ort-${index}`}>Ort *</Label>
                          <Input
                            id={`schule-ort-${index}`}
                            placeholder="z.B. Berlin"
                            value={getLocalInputValue('schul', index, 'ort', schule.ort)}
                            onChange={(e) => handleDynamicInputChange('schul', index, 'ort', e.target.value)}
                            onBlur={(e) => handleDynamicInputBlur('schul', index, 'ort', e.target.value)}
                          />
                        </div>
                      </div>
                      {/* Zeitraum: Von Jahr bis Jahr (nur Jahr, größere Felder) */}
                      <div className="space-y-3">
                        <Label>Zeitraum *</Label>
                        <div className="grid grid-cols-2 gap-4">
                          {/* Von */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Von</Label>
                            <Select
                              value={
                                schule.zeitraum_von 
                                  ? (schule.zeitraum_von.split('-')[0] || schule.zeitraum_von)
                                  : ''
                              }
                              onValueChange={(year) => {
                                updateSchulbildungDate(index, 'zeitraum_von', year);
                              }}
                            >
                              <SelectTrigger className="h-11 text-base">
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
                          
                          {/* Bis */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Bis</Label>
                            <Select
                              value={
                                schule.zeitraum_bis 
                                  ? (schule.zeitraum_bis.split('-')[0] || schule.zeitraum_bis)
                                  : ''
                              }
                              onValueChange={(year) => {
                                updateSchulbildungDate(index, 'zeitraum_bis', year);
                              }}
                            >
                              <SelectTrigger className="h-11 text-base">
                                <SelectValue placeholder="Jahr wählen" />
                              </SelectTrigger>
                              <SelectContent>
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
                      <Label htmlFor={`schulbeschreibung-${index}`}>Beschreibung (optional)</Label>
                      <Textarea
                        id={`schulbeschreibung-${index}`}
                        placeholder="z.B. Schwerpunkte, besondere Leistungen, Projekte..."
                        value={getLocalInputValue('schul', index, 'beschreibung', schule.beschreibung || '')}
                        onChange={(e) => handleDynamicInputChange('schul', index, 'beschreibung', e.target.value)}
                        onBlur={(e) => handleDynamicInputBlur('schul', index, 'beschreibung', e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
      </Card>

      <Card className="p-3 md:p-4 border-0 shadow-sm bg-white">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-base leading-tight">Praktische Erfahrung</h3>
                  <p className="text-xs text-muted-foreground">
                    {formData.status === 'azubi' || formData.status === 'fachkraft'
                      ? 'Mindestens ein Eintrag ist erforderlich.'
                      : 'Optional: Praktika, Ferienjobs oder Nebenjobs.'}
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addBerufserfahrungEntry} className="shrink-0">
                  <Plus className="h-4 w-4 mr-2" />
                  Hinzufügen
                </Button>
              </div>

              <div className="mt-3 space-y-3">
                {!formData.berufserfahrung?.length && (
                  <div className="rounded-lg bg-muted/20 p-3 text-sm text-muted-foreground">
                    Noch keine praktische Erfahrung hinzugefügt.
                  </div>
                )}

                {formData.berufserfahrung?.map((arbeit, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
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

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`titel-${index}`}>Titel *</Label>
                        <Input
                          id={`titel-${index}`}
                          placeholder="z.B. Softwareentwickler, Verkäufer"
                          value={getLocalInputValue('berufs', index, 'titel', arbeit.titel)}
                          onChange={(e) => handleDynamicInputChange('berufs', index, 'titel', e.target.value)}
                          onBlur={(e) => handleDynamicInputBlur('berufs', index, 'titel', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`art-${index}`}>Art *</Label>
                        <Select
                          value={arbeit.art || ''}
                          onValueChange={(value) => updateBerufserfahrungEntry(index, 'art', value)}
                        >
                          <SelectTrigger className={cn(
                            'bg-background',
                            validationErrors[`berufserfahrung_${index}_art`] || !arbeit.art ? 'border-destructive' : ''
                          )}>
                            <SelectValue placeholder="Art wählen" />
                          </SelectTrigger>
                          <SelectContent className="bg-background border shadow-lg z-50">
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
                        {validationErrors[`berufserfahrung_${index}_art`] && (
                          <p className="mt-1 text-sm text-destructive font-medium">
                            {validationErrors[`berufserfahrung_${index}_art`]}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor={`unternehmen-${index}`}>Unternehmen/Einrichtung *</Label>
                        <Input
                          id={`unternehmen-${index}`}
                          placeholder="z.B. Müller GmbH"
                          value={getLocalInputValue('berufs', index, 'unternehmen', arbeit.unternehmen)}
                          onChange={(e) => handleDynamicInputChange('berufs', index, 'unternehmen', e.target.value)}
                          onBlur={(e) => handleDynamicInputBlur('berufs', index, 'unternehmen', e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label htmlFor={`arbeit-plz-${index}`}>PLZ</Label>
                          <Input
                            id={`arbeit-plz-${index}`}
                            placeholder="12345"
                            value={getLocalInputValue('berufs', index, 'plz', arbeit.plz || '')}
                            onChange={(e) => handleDynamicInputChange('berufs', index, 'plz', e.target.value)}
                            onBlur={(e) => handleDynamicInputBlur('berufs', index, 'plz', e.target.value)}
                          />
                        </div>
                        <div className="col-span-2">
                          <Label htmlFor={`arbeit-ort-${index}`}>Ort *</Label>
                          <Input
                            id={`arbeit-ort-${index}`}
                            placeholder="z.B. München"
                            value={getLocalInputValue('berufs', index, 'ort', arbeit.ort)}
                            onChange={(e) => handleDynamicInputChange('berufs', index, 'ort', e.target.value)}
                            onBlur={(e) => handleDynamicInputBlur('berufs', index, 'ort', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label>Von Monat *</Label>
                          <Select
                            value={arbeit.zeitraum_von ? (arbeit.zeitraum_von.split('-')[1] || '') : ''}
                            onValueChange={(month) => {
                              const currentValue = arbeit.zeitraum_von || '';
                              const parts = currentValue.split('-');
                              const currentYear = parts[0] === '0000' ? '' : (parts[0] || '');
                              updateBerufserfahrungDate(index, 'zeitraum_von', month, currentYear);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Monat" />
                            </SelectTrigger>
                            <SelectContent>
                              {monthOptions.map((month) => (
                                <SelectItem key={month.value} value={month.value}>
                                  {month.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Von Jahr *</Label>
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
                            disabled={
                              !arbeit.zeitraum_von ||
                              (arbeit.zeitraum_von.split('-')[0] !== '0000' && !arbeit.zeitraum_von.split('-')[1])
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Jahr" />
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
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`current-job-${index}`}
                          checked={isCurrentJob(arbeit)}
                          onCheckedChange={(checked) => toggleCurrentJob(index, checked as boolean)}
                        />
                        <Label htmlFor={`current-job-${index}`}>Aktueller Job (bis heute)</Label>
                      </div>

                      {!isCurrentJob(arbeit) &&
                        (() => {
                          const bisOptions = getAvailableBisOptions(arbeit.zeitraum_von || '');
                          const currentBisValue = arbeit.zeitraum_bis || '';
                          const bisParts = currentBisValue.split('-');
                          const bisYear = bisParts[0] === '0000' ? '' : (bisParts[0] || '');
                          const bisMonth = bisParts[1] || '';

                          let isValidBisDate = true;
                          if (
                            arbeit.zeitraum_von &&
                            arbeit.zeitraum_von.split('-')[0] !== '0000' &&
                            bisYear &&
                            bisMonth
                          ) {
                            const vonYear = parseInt(arbeit.zeitraum_von.split('-')[0] || '0');
                            const vonMonth = parseInt(arbeit.zeitraum_von.split('-')[1] || '0');
                            const bisYearNum = parseInt(bisYear);
                            const bisMonthNum = parseInt(bisMonth);
                            if (bisYearNum < vonYear || (bisYearNum === vonYear && bisMonthNum < vonMonth)) {
                              isValidBisDate = false;
                            }
                          }

                          const getAvailableMonthsForBis = () => {
                            if (!bisYear || bisYear === '0000') return bisOptions.availableMonths;
                            const bisYearNum = parseInt(bisYear);
                            const vonYear = arbeit.zeitraum_von
                              ? parseInt(arbeit.zeitraum_von.split('-')[0] || '0')
                              : 0;
                            const vonMonth = arbeit.zeitraum_von
                              ? parseInt(arbeit.zeitraum_von.split('-')[1] || '0')
                              : 0;
                            if (bisYearNum === vonYear && vonMonth > 0) {
                              return monthOptions.filter((month, index) => index + 1 >= vonMonth);
                            }
                            return monthOptions;
                          };

                          return (
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label>Bis Monat</Label>
                                <Select
                                  value={
                                    arbeit.zeitraum_bis && arbeit.zeitraum_bis !== 'heute'
                                      ? (arbeit.zeitraum_bis.split('-')[1] || '')
                                      : ''
                                  }
                                  onValueChange={(month) => {
                                    const currentValue = arbeit.zeitraum_bis || '';
                                    const parts = currentValue.split('-');
                                    const currentYear = parts[0] === '0000' ? '' : (parts[0] || '');
                                    updateBerufserfahrungDate(index, 'zeitraum_bis', month, currentYear);
                                  }}
                                  disabled={
                                    !arbeit.zeitraum_von ||
                                    arbeit.zeitraum_von.split('-')[0] === '0000' ||
                                    !arbeit.zeitraum_von.split('-')[1]
                                  }
                                >
                                  <SelectTrigger className={!isValidBisDate ? 'border-destructive' : ''}>
                                    <SelectValue placeholder="Monat" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {getAvailableMonthsForBis().map((month) => (
                                      <SelectItem key={month.value} value={month.value}>
                                        {month.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Bis Jahr</Label>
                                <Select
                                  value={
                                    arbeit.zeitraum_bis &&
                                    arbeit.zeitraum_bis !== 'heute' &&
                                    arbeit.zeitraum_bis.split('-')[0] !== '0000'
                                      ? (arbeit.zeitraum_bis.split('-')[0] || '')
                                      : ''
                                  }
                                  onValueChange={(year) => {
                                    const currentValue = arbeit.zeitraum_bis || '';
                                    const parts = currentValue.split('-');
                                    const currentMonth = parts[1] || '';
                                    updateBerufserfahrungDate(index, 'zeitraum_bis', currentMonth, year);
                                  }}
                                  disabled={
                                    !arbeit.zeitraum_bis ||
                                    arbeit.zeitraum_bis === 'heute' ||
                                    (arbeit.zeitraum_bis.split('-')[0] !== '0000' &&
                                      !arbeit.zeitraum_bis.split('-')[1]) ||
                                    !arbeit.zeitraum_von ||
                                    arbeit.zeitraum_von.split('-')[0] === '0000' ||
                                    !arbeit.zeitraum_von.split('-')[1]
                                  }
                                >
                                  <SelectTrigger className={!isValidBisDate ? 'border-destructive' : ''}>
                                    <SelectValue placeholder="Jahr" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {bisOptions.availableYears.map((year) => (
                                      <SelectItem key={year} value={year.toString()}>
                                        {year}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              {!isValidBisDate && (
                                <div className="col-span-2">
                                  <p className="text-xs text-destructive mt-1">
                                    ⚠️ Das Enddatum muss nach dem Startdatum liegen.
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label htmlFor={`arbeitbeschreibung-${index}`}>Beschreibung (optional)</Label>
                        <Button
                          onClick={() => handleGenerateJobBullets(index)}
                          disabled={generatingBulletsFor === index || !arbeit.titel || !arbeit.unternehmen}
                          variant="outline"
                          size="sm"
                        >
                          {generatingBulletsFor === index ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Sparkles className="h-4 w-4 mr-2" />
                          )}
                          KI-Aufgaben
                        </Button>
                      </div>
                      <Textarea
                        id={`arbeitbeschreibung-${index}`}
                        placeholder="z.B. Tätigkeiten, erworbene Fähigkeiten..."
                        value={getLocalInputValue('berufs', index, 'beschreibung', arbeit.beschreibung || '')}
                        onChange={(e) => handleDynamicInputChange('berufs', index, 'beschreibung', e.target.value)}
                        onBlur={(e) => handleDynamicInputBlur('berufs', index, 'beschreibung', e.target.value)}
                        rows={5}
                      />
                    </div>
                  </div>
                ))}
              </div>
      </Card>

      {!hasMinimumSchulbildung && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
          <p className="text-sm text-yellow-800">
            ⚠️ <strong>Hinweis:</strong> Du musst mindestens eine schulische Erfahrung hinzufügen, um fortfahren zu können.
          </p>
        </div>
      )}
    </div>
  );
};

export default CVStep4;