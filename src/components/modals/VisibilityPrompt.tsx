import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { notifyVisibilityPromptOpened, notifyVisibilityPromptClosed, subscribeOpenVisibilityPrompt } from "@/lib/event-bus";

const JOB_OPTIONS = [
  { value: "Praktikum", label: "Praktikum" },
  { value: "Ausbildung", label: "Ausbildung" },
  { value: "Nach der Ausbildung einen Job", label: "Nach der Ausbildung einen Job" },
  { value: "Ausbildungsplatzwechsel", label: "Ausbildungsplatzwechsel" },
] as const;

type JobOption = typeof JOB_OPTIONS[number]["value"];

export function VisibilityPrompt() {
  const { profile, isLoading, refetchProfile, session } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<JobOption[]>([]);
  const [availabilityType, setAvailabilityType] = useState<'immediate' | 'custom'>('immediate');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');

  const allowedOptions = useMemo<JobOption[]>(() => {
    const status = (profile as any)?.status;
    switch (status) {
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
  }, [profile]);

  const defaultByStatus = useMemo<Record<string, JobOption[]>>(() => ({
    schueler: ["Praktikum", "Ausbildung"],
    azubi: ["Ausbildungsplatzwechsel"],
    ausgelernt: ["Nach der Ausbildung einen Job"],
    geselle: ["Nach der Ausbildung einen Job"],
  }), []);

  useEffect(() => {
    if (!isLoading && profile) {
      const existing = ((profile as any)?.job_search_preferences ?? []) as JobOption[];
      const filteredExisting = existing.filter(v => allowedOptions.includes(v));
      if (filteredExisting.length > 0) {
        setSelected(filteredExisting);
      } else {
        const status = (profile as any)?.status as string | undefined;
        const defaults = status ? defaultByStatus[status] ?? [] : [];
        const validDefaults = (defaults || []).filter(v => allowedOptions.includes(v)) as JobOption[];
        setSelected(validDefaults);
      }

      if (!profile.profile_published) {
        const uid = profile.id;
        const token = session?.access_token || "";
        const tokenKey = `visibility_prompt_last_token:${uid}`;
        const declineKey = `visibility_prompt_declined:${uid}`;
        const counterKey = `visibility_prompt_counter:${uid}`;

        const declined = localStorage.getItem(declineKey) === "1";

        // Detect new login via token change
        if (token) {
          const lastToken = localStorage.getItem(tokenKey);
          if (lastToken !== token) {
            localStorage.setItem(tokenKey, token);
            if (declined) {
              const n = parseInt(localStorage.getItem(counterKey) || "0", 10) + 1;
              localStorage.setItem(counterKey, String(n));
            }
          }
        }

        // Decide if we open the prompt
        if (!declined) {
          setTimeout(() => {
            setOpen(true);
            notifyVisibilityPromptOpened();
          }, 0);
        } else {
          const n = parseInt(localStorage.getItem(counterKey) || "0", 10);
          if (n >= 3) {
            setTimeout(() => {
              setOpen(true);
              notifyVisibilityPromptOpened();
              localStorage.setItem(counterKey, "0");
            }, 0);
          }
        }
      }
    }
  }, [isLoading, profile, session, allowedOptions, defaultByStatus]);

  // Allow opening the prompt explicitly from UI (e.g. "Offen für Jobs" button)
  useEffect(() => {
    const unsubscribe = subscribeOpenVisibilityPrompt(() => {
      setOpen(true);
    });
    return unsubscribe;
  }, []);

  // Notify when dialog opens/closes
  useEffect(() => {
    if (open) {
      notifyVisibilityPromptOpened();
    } else {
      notifyVisibilityPromptClosed();
    }
  }, [open]);

  const summary = useMemo(() => {
    if (!selected?.length) return "dein Profil";
    return selected.join(", ");
  }, [selected]);

  // Calculate "Ab sofort" date: if today <= 10th, use current month, else next month
  const getImmediateDate = (): string => {
    const today = new Date();
    const day = today.getDate();
    let month = today.getMonth() + 1; // 1-12
    let year = today.getFullYear();

    if (day > 10) {
      // If after 10th, use next month
      month += 1;
      if (month > 12) {
        month = 1;
        year += 1;
      }
    }

    // Format as YYYY-MM
    return `${year}-${String(month).padStart(2, '0')}`;
  };

  // Generate month options
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

  // Get available months based on selected year
  const getAvailableMonths = (year?: string): typeof allMonthOptions => {
    const yearToCheck = year || selectedYear;
    if (!yearToCheck) {
      // If no year selected, return only future months from next month
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth() + 1;
      
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

  // Generate year options (only future years)
  const yearOptions = useMemo(() => {
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

  // Get available date based on selection
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

  // Validate custom date selection
  const isCustomDateValid = (): boolean => {
    if (availabilityType === 'immediate') return true;
    if (!selectedMonth || !selectedYear) return false;

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const selectedYearNum = parseInt(selectedYear);
    const selectedMonthNum = parseInt(selectedMonth);

    // Must be in the future (not in the past)
    if (selectedYearNum < currentYear) return false;
    if (selectedYearNum === currentYear && selectedMonthNum <= currentMonth) return false;

    // Must be within 1 year in the future
    const maxYear = currentYear + 1;
    if (selectedYearNum > maxYear) return false;
    if (selectedYearNum === maxYear && selectedMonthNum > currentMonth) return false;

    return true;
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
        // Single options are exclusive
        next = prev.length === 1 && prev[0] === value ? [] : [value];
      } else {
        // Dual options can be combined only with each other
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

  const makeVisibleNow = async () => {
    if (!profile) return;
    if (selected.length === 0) {
      toast({
        title: "Bitte Auswahl treffen",
        description: "Wähle mindestens eine Option aus (z. B. Ausbildung oder Praktikum).",
        variant: "destructive",
      });
      return;
    }

    if (availabilityType === 'custom' && !isCustomDateValid()) {
      toast({
        title: "Ungültiges Datum",
        description: "Bitte wähle ein gültiges Datum in der Zukunft (max. 1 Jahr im Voraus).",
        variant: "destructive",
      });
      return;
    }

    const availableFrom = getAvailableFrom();

    const { error } = await supabase
      .from("profiles")
      .update({ 
        profile_published: true, 
        visibility_mode: 'visible', // Set visibility mode to visible
        job_search_preferences: selected,
        available_from: availableFrom // Store availability date
      })
      .eq("id", profile.id);

    if (error) {
      toast({
        title: "Speichern fehlgeschlagen",
        description: "Bitte versuche es später erneut.",
        variant: "destructive",
      });
      return;
    }

    await refetchProfile();
    // Clear decline throttling since user is now visible
    try {
      const uid = profile.id;
      localStorage.removeItem(`visibility_prompt_declined:${uid}`);
      localStorage.removeItem(`visibility_prompt_counter:${uid}`);
    } catch {}
    setOpen(false);
    notifyVisibilityPromptClosed();
    toast({
      title: "Sichtbarkeit aktiviert",
      description: `Du bist jetzt für Unternehmen sichtbar, die nach ${summary} suchen. Du kannst dich weiterhin aktiv bewerben.`,
    });
  };
  const stayHidden = async () => {
    if (!profile) return;
    
    // Set visibility_mode to invisible
    const { error } = await supabase
      .from("profiles")
      .update({ visibility_mode: 'invisible' })
      .eq("id", profile.id);
    
    if (error) {
      console.error('Error setting visibility to invisible:', error);
    }
    
    try {
      const uid = profile.id;
      localStorage.setItem(`visibility_prompt_declined:${uid}`, "1");
      localStorage.setItem(`visibility_prompt_counter:${uid}`, "0");
    } catch {}
    setOpen(false);
    notifyVisibilityPromptClosed();
    toast({
      title: "Profil unsichtbar",
      description: "Du erscheinst nicht in Unternehmenssuchen, kannst dich aber weiterhin aktiv bewerben.",
    });
  };

  if (isLoading || !profile) return null;

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      notifyVisibilityPromptOpened();
    } else {
      notifyVisibilityPromptClosed();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[calc(100vw-1.5rem)] sm:max-w-xl max-h-[85vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
            <DialogTitle>Vorschau: Für Unternehmen sichtbar werden</DialogTitle>
            <DialogDescription>
              Wähle, wonach du suchst. So sehen Unternehmen deine Sichtbarkeits‑Einstellungen.
            </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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
            <p className="text-xs text-muted-foreground">
              Mehrfachauswahl ist nur bei „Praktikum“ und „Ausbildung“ möglich. Andere Optionen sind Einzelwahl.
            </p>
          </div>

          {/* Availability Date Selection - only show if at least one option is selected */}
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
                        // Reset month if it becomes invalid
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
                        {yearOptions && yearOptions.length > 0 ? (
                          yearOptions.map((year) => (
                            <SelectItem key={year.value} value={year.value}>
                              {year.label}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="" disabled>Keine Jahre verfügbar</SelectItem>
                        )}
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
                        {getAvailableMonths().length > 0 ? (
                          getAvailableMonths().map((month) => (
                            <SelectItem key={month.value} value={month.value}>
                              {month.label}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="" disabled>Keine Monate verfügbar</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedMonth && selectedYear && !isCustomDateValid() && (
                    <p className="text-xs text-red-500 col-span-2">
                      Bitte wähle ein Datum in der Zukunft (max. 1 Jahr im Voraus).
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="rounded-md bg-muted p-3 text-sm">
            Bevor du zustimmst: Dein Profil wird für Unternehmen sichtbar, die nach {summary} suchen. Du kannst das später jederzeit in den Einstellungen ändern.
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2">
          <Button className="w-full sm:w-auto" variant="outline" onClick={() => setOpen(false)}>Später</Button>
          <Button className="w-full sm:w-auto" variant="outline" onClick={stayHidden}>Nicht sichtbar bleiben</Button>
          <Button className="w-full sm:w-auto" onClick={makeVisibleNow} disabled={selected.length === 0}>Jetzt sichtbar machen</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
