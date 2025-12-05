import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Edit2, Eye, EyeOff } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const JOB_OPTIONS = [
  { value: "Praktikum", label: "Praktikum" },
  { value: "Ausbildung", label: "Ausbildung" },
  { value: "Nach der Ausbildung einen Job", label: "Nach der Ausbildung einen Job" },
  { value: "Ausbildungsplatzwechsel", label: "Ausbildungsplatzwechsel" },
] as const;

type JobOption = typeof JOB_OPTIONS[number]["value"];

interface AvailabilityCardProps {
  availableFrom?: string | null;
  visibilityMode?: string;
  jobSearchPreferences?: string[] | null;
  profileStatus?: string;
  profileId?: string;
  readOnly?: boolean;
  onUpdate?: () => void;
}

export function AvailabilityCard({ 
  availableFrom, 
  visibilityMode, 
  jobSearchPreferences = [],
  profileStatus,
  profileId,
  readOnly = false,
  onUpdate
}: AvailabilityCardProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [selected, setSelected] = useState<JobOption[]>([]);
  const [availabilityType, setAvailabilityType] = useState<'immediate' | 'custom'>('immediate');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [isInvisible, setIsInvisible] = useState(false);

  React.useEffect(() => {
    // Check if user is invisible
    const isCurrentlyInvisible = visibilityMode === 'invisible' || (!jobSearchPreferences || jobSearchPreferences.length === 0);
    setIsInvisible(isCurrentlyInvisible);
    
    if (jobSearchPreferences && Array.isArray(jobSearchPreferences) && jobSearchPreferences.length > 0) {
      setSelected(jobSearchPreferences.filter(v => JOB_OPTIONS.some(o => o.value === v)) as JobOption[]);
    } else {
      setSelected([]);
    }
    
    if (availableFrom && !isCurrentlyInvisible) {
      setAvailabilityType('custom');
      const [year, month] = availableFrom.split('-');
      setSelectedYear(year || '');
      setSelectedMonth(month || '');
    } else {
      setAvailabilityType('immediate');
    }
  }, [jobSearchPreferences, availableFrom, visibilityMode]);

  const allowedOptions = React.useMemo<JobOption[]>(() => {
    switch (profileStatus) {
      case "schueler":
        return ["Praktikum", "Ausbildung"];
      case "azubi":
        return ["Ausbildungsplatzwechsel", "Nach der Ausbildung einen Job"];
      case "ausgelernt":
      case "geselle":
        return ["Nach der Ausbildung einen Job"];
      default:
        return JOB_OPTIONS.map(o => o.value as JobOption);
    }
  }, [profileStatus]);

  const getImmediateDate = (): string => {
    const today = new Date();
    const day = today.getDate();
    let month = today.getMonth() + 1;
    let year = today.getFullYear();

    if (day > 10) {
      month += 1;
      if (month > 12) {
        month = 1;
        year += 1;
      }
    }

    return `${year}-${String(month).padStart(2, '0')}`;
  };

  const allMonthOptions = [
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

  const getAvailableMonths = (year?: string): typeof allMonthOptions => {
    const yearToCheck = year || selectedYear;
    if (!yearToCheck) {
      // If no year selected, return only future months from next month
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth() + 1;
      const nextMonth = currentMonth + 1;
      
      // If we're in December or later, only show months from next year
      if (currentMonth >= 12) {
        return allMonthOptions; // All months of next year
      }
      
      // Otherwise show months from next month onwards
      return allMonthOptions.filter(month => parseInt(month.value) > currentMonth);
    }
    
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const selectedYearNum = parseInt(yearToCheck);

    // If selected year is current year, only show future months
    if (selectedYearNum === currentYear) {
      return allMonthOptions.filter(month => parseInt(month.value) > currentMonth);
    }

    // If selected year is future year, show all months
    if (selectedYearNum > currentYear) {
      return allMonthOptions;
    }

    // Past years: return empty (shouldn't happen with yearOptions filter)
    return [];
  };

  const yearOptions = React.useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    
    // If we're in December or later, only show next year
    // Otherwise show current year (if future months available) and next year
    const years: Array<{ value: string; label: string }> = [];
    
    if (currentMonth >= 12) {
      // December or later: only show next year
      years.push({ value: String(currentYear + 1), label: String(currentYear + 1) });
    } else {
      // Before December: show current year (if future months available) and next year
      // Current year is only valid if there are future months
      if (currentMonth < 12) {
        years.push({ value: String(currentYear), label: String(currentYear) });
      }
      years.push({ value: String(currentYear + 1), label: String(currentYear + 1) });
    }
    
    return years;
  }, []);

  const getAvailableFrom = (): string | null => {
    if (availabilityType === 'immediate') {
      return getImmediateDate();
    } else {
      if (selectedMonth && selectedYear) {
        return `${selectedYear}-${selectedMonth}`;
      }
      return null;
    }
  };

  const toggle = (value: JobOption) => {
    const DUAL_ALLOWED: JobOption[] = ["Praktikum", "Ausbildung"];
    const SINGLE_ONLY: JobOption[] = [
      "Nach der Ausbildung einen Job",
      "Ausbildungsplatzwechsel",
    ];

    setSelected((prev) => {
      const isDual = DUAL_ALLOWED.includes(value);
      const isSingle = SINGLE_ONLY.includes(value);

      let next: JobOption[] = [];
      if (isSingle) {
        next = prev.length === 1 && prev[0] === value ? [] : [value];
      } else {
        if (prev.some((p) => SINGLE_ONLY.includes(p))) {
          next = [value];
        } else if (prev.includes(value)) {
          next = prev.filter((v) => v !== value) as JobOption[];
        } else {
          next = [...prev, value].filter((v) => DUAL_ALLOWED.includes(v)) as JobOption[];
        }
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!profileId) return;

    // If invisible, clear everything
    if (isInvisible) {
      const { error } = await supabase
        .from("profiles")
        .update({ 
          visibility_mode: 'invisible',
          job_search_preferences: [],
          available_from: null,
          profile_published: false
        })
        .eq("id", profileId);

      if (error) {
        toast({
          title: "Fehler",
          description: "Einstellungen konnten nicht gespeichert werden.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Gespeichert",
        description: "Du bist jetzt unsichtbar für Unternehmen.",
      });

      setIsEditing(false);
      if (onUpdate) {
        onUpdate();
      }
      return;
    }

    // If visible, save preferences and availability
    const availableFromValue = getAvailableFrom();

    const { error } = await supabase
      .from("profiles")
      .update({ 
        visibility_mode: 'visible',
        job_search_preferences: selected,
        available_from: availableFromValue,
        profile_published: selected.length > 0
      })
      .eq("id", profileId);

    if (error) {
      toast({
        title: "Fehler",
        description: "Einstellungen konnten nicht gespeichert werden.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Gespeichert",
      description: "Deine Verfügbarkeitseinstellungen wurden aktualisiert.",
    });

    setIsEditing(false);
    if (onUpdate) {
      // Call onUpdate to trigger profile refetch
      onUpdate();
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const [year, month] = dateStr.split('-');
      const monthNames = [
        'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
        'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
      ];
      const monthIndex = parseInt(month) - 1;
      return `${monthNames[monthIndex]} ${year}`;
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = () => {
    if (visibilityMode === 'visible') {
      return <Badge variant="default" className="bg-green-600">Sichtbar</Badge>;
    }
    return <Badge variant="secondary">Unsichtbar</Badge>;
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-4 pt-4 sm:pt-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg sm:text-lg font-semibold flex items-center gap-2">
              {visibilityMode === 'visible' ? (
                <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
              ) : (
                <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
              Verfügbarkeit
            </CardTitle>
            {!readOnly && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="h-8 w-8 p-0"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-4 pb-4 sm:pb-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            {getStatusBadge()}
          </div>
          
          {visibilityMode === 'invisible' ? (
            <p className="text-sm text-muted-foreground">Du bist unsichtbar für Unternehmen.</p>
          ) : (
            <>
              {jobSearchPreferences && jobSearchPreferences.length > 0 && (
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Art der Suche</span>
                  <div className="flex flex-wrap gap-1">
                    {jobSearchPreferences.map((pref, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {pref}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {availableFrom && (
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Verfügbar ab</span>
                  <p className="text-sm font-medium">{formatDate(availableFrom)}</p>
                </div>
              )}
              {!availableFrom && visibilityMode === 'visible' && (
                <p className="text-xs text-muted-foreground">Ab sofort verfügbar</p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Verfügbarkeit bearbeiten</DialogTitle>
            <DialogDescription>
              Wähle, wonach du suchst und ab wann du verfügbar bist.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-3 border-b pb-4">
              <Label>Status</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="invisible"
                  checked={isInvisible}
                  onCheckedChange={(checked) => {
                    setIsInvisible(checked as boolean);
                    if (checked) {
                      setSelected([]);
                    }
                  }}
                />
                <Label htmlFor="invisible" className="cursor-pointer font-normal flex items-center gap-2">
                  <EyeOff className="h-4 w-4" />
                  Unsichtbar für Unternehmen
                </Label>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                Wenn du unsichtbar bist, werden deine Verfügbarkeit und Suchpräferenzen nicht angezeigt.
              </p>
            </div>

            {!isInvisible && (
              <>
                <div className="space-y-2">
                  <Label>Was suchst du? (Mehrfachauswahl nur bei Praktikum & Ausbildung)</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {allowedOptions.map((value) => {
                      const opt = JOB_OPTIONS.find(o => o.value === value)!;
                      return (
                        <label key={opt.value} className="flex items-center gap-3 rounded-md border p-3 cursor-pointer hover:bg-accent/40">
                          <Checkbox
                            checked={selected.includes(opt.value)}
                            onCheckedChange={() => toggle(opt.value)}
                            aria-label={opt.label}
                          />
                          <span className="text-sm">{opt.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {selected.length > 0 && (
              <div className="space-y-3 border-t pt-4">
                <Label>Ab wann bist du verfügbar?</Label>
                <RadioGroup value={availabilityType} onValueChange={(value) => setAvailabilityType(value as 'immediate' | 'custom')}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="immediate" id="immediate" />
                    <Label htmlFor="immediate" className="cursor-pointer font-normal">
                      Ab sofort ({new Date(getImmediateDate() + '-01').toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })})
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="custom" id="custom" />
                    <Label htmlFor="custom" className="cursor-pointer font-normal">
                      Ab einem bestimmten Datum
                    </Label>
                  </div>
                </RadioGroup>

                {availabilityType === 'custom' && (
                  <div className="grid grid-cols-2 gap-3 ml-6">
                    <div className="space-y-1">
                      <Label htmlFor="year" className="text-xs">Jahr</Label>
                      <Select 
                        value={selectedYear} 
                        onValueChange={(value) => {
                          setSelectedYear(value);
                          const availableMonths = getAvailableMonths(value);
                          if (selectedMonth && !availableMonths.find(m => m.value === selectedMonth)) {
                            setSelectedMonth('');
                          }
                        }}
                      >
                        <SelectTrigger id="year">
                          <SelectValue placeholder="Jahr wählen" />
                        </SelectTrigger>
                        <SelectContent className="z-[200]">
                          {yearOptions.map((year) => (
                            <SelectItem key={year.value} value={year.value}>
                              {year.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="month" className="text-xs">Monat</Label>
                      <Select 
                        value={selectedMonth} 
                        onValueChange={setSelectedMonth}
                        disabled={!selectedYear}
                      >
                        <SelectTrigger id="month">
                          <SelectValue placeholder={selectedYear ? "Monat wählen" : "Zuerst Jahr wählen"} />
                        </SelectTrigger>
                        <SelectContent className="z-[200]">
                          {getAvailableMonths().map((month) => (
                            <SelectItem key={month.value} value={month.value}>
                              {month.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
                )}
              </>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)}>Abbrechen</Button>
            <Button onClick={handleSave} disabled={!isInvisible && selected.length === 0}>
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

