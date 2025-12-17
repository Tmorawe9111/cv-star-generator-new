import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, Shield, Bell, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NotifSettingsPanel from '@/components/notifications/NotifSettingsPanel';
import { ProfileEmployerSection } from '@/components/settings/ProfileEmployerSection';
import { ChangePasswordCard } from "@/components/settings/ChangePasswordCard";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const JOB_OPTIONS = [
  { value: "Praktikum", label: "Praktikum" },
  { value: "Ausbildung", label: "Ausbildung" },
  { value: "Nach der Ausbildung einen Job", label: "Nach der Ausbildung einen Job" },
  { value: "Ausbildungsplatzwechsel", label: "Ausbildungsplatzwechsel" },
] as const;

type JobOption = typeof JOB_OPTIONS[number]["value"];

const Settings = () => {
  const { profile, refetchProfile } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    profile_published: false,
    show_contact: true,
    show_documents: true,
    profile_analytics: true,
    profile_views: true,
    weekly_summary: true,
    marketplace_updates: false,
    regional_visibility: true,
    visibility_industry: [] as string[],
    job_search_preferences: [] as string[],
  });
  const [showVisibilityDialog, setShowVisibilityDialog] = useState(false);
  const [selectedJobOptions, setSelectedJobOptions] = useState<JobOption[]>([]);
  const [availabilityType, setAvailabilityType] = useState<'immediate' | 'custom'>('immediate');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');

  useEffect(() => {
    if (profile) {
      setSettings(prev => ({
        ...prev,
        profile_published: profile.profile_published || false,
        visibility_industry: profile.visibility_industry || [],
        job_search_preferences: (profile as any).job_search_preferences || [],
      }));
      // Initialize selected job options from profile
      const existing = ((profile as any)?.job_search_preferences ?? []) as JobOption[];
      setSelectedJobOptions(existing);
    }
  }, [profile]);

  const updateSetting = async (key: string, value: any) => {
    if (!profile) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ [key]: value })
        .eq('id', profile.id);

      if (error) throw error;

      setSettings(prev => ({ ...prev, [key]: value }));
      refetchProfile();
      
      toast({
        title: "Einstellung gespeichert",
        description: "Deine Änderung wurde erfolgreich übernommen."
      });
    } catch (error) {
      console.error('Error updating setting:', error);
      toast({
        title: "Fehler",
        description: "Die Einstellung konnte nicht gespeichert werden.",
        variant: "destructive"
      });
    }
  };

  const toggleIndustryVisibility = (industry: string) => {
    const currentIndustries = settings.visibility_industry;
    const newIndustries = currentIndustries.includes(industry)
      ? currentIndustries.filter(i => i !== industry)
      : [...currentIndustries, industry];
    
    updateSetting('visibility_industry', newIndustries);
  };

  const allowedOptions = useMemo(() => {
    const status = (profile as any)?.status;
    switch (status) {
      case 'schueler':
        return ["Praktikum","Ausbildung"];
      case 'azubi':
        return ["Ausbildungsplatzwechsel","Nach der Ausbildung einen Job"];
      case 'ausgelernt':
      case 'geselle':
        return ["Nach der Ausbildung einen Job"];
      default:
        return ["Praktikum","Ausbildung","Nach der Ausbildung einen Job","Ausbildungsplatzwechsel"];
    }
  }, [profile]);

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
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth() + 1;
      
      if (currentMonth >= 12) {
        return allMonthOptions;
      }
      
      return allMonthOptions.filter(month => parseInt(month.value) > currentMonth);
    }
    
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const selectedYearNum = parseInt(yearToCheck);

    if (selectedYearNum === currentYear) {
      return allMonthOptions.filter(month => parseInt(month.value) > currentMonth);
    }

    if (selectedYearNum > currentYear) {
      return allMonthOptions;
    }

    return [];
  };

  // Generate year options (only future years)
  const yearOptions = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    
    const years: Array<{ value: string; label: string }> = [];
    
    if (currentMonth >= 12) {
      years.push({ value: String(currentYear + 1), label: String(currentYear + 1) });
    } else {
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

    if (selectedYearNum < currentYear) return false;
    if (selectedYearNum === currentYear && selectedMonthNum <= currentMonth) return false;

    const maxYear = currentYear + 1;
    if (selectedYearNum > maxYear) return false;
    if (selectedYearNum === maxYear && selectedMonthNum > currentMonth) return false;

    return true;
  };

  const toggleJobOption = (value: JobOption) => {
    const DUAL_ALLOWED: JobOption[] = ["Praktikum", "Ausbildung"];
    const SINGLE_ONLY: JobOption[] = [
      "Nach der Ausbildung einen Job",
      "Ausbildungsplatzwechsel",
    ];

    setSelectedJobOptions((prev) => {
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

  const handleVisibilityToggle = async (checked: boolean) => {
    if (checked) {
      // Open dialog to configure visibility
      setShowVisibilityDialog(true);
    } else {
      // Set to invisible
      if (!profile) return;
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ 
            profile_published: false,
            visibility_mode: 'invisible'
          })
          .eq('id', profile.id);

        if (error) throw error;

        setSettings(prev => ({ ...prev, profile_published: false }));
        refetchProfile();
        
        toast({
          title: "Profil unsichtbar",
          description: "Dein Profil ist jetzt für Unternehmen nicht mehr sichtbar."
        });
      } catch (error) {
        console.error('Error updating visibility:', error);
        toast({
          title: "Fehler",
          description: "Die Einstellung konnte nicht gespeichert werden.",
          variant: "destructive"
        });
      }
    }
  };

  const handleSaveVisibility = async () => {
    if (!profile) return;
    if (selectedJobOptions.length === 0) {
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

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ 
          profile_published: true, 
          visibility_mode: 'visible',
          job_search_preferences: selectedJobOptions,
          available_from: availableFrom
        })
        .eq("id", profile.id);

      if (error) throw error;

      setSettings(prev => ({ 
        ...prev, 
        profile_published: true,
        job_search_preferences: selectedJobOptions
      }));
      refetchProfile();
      setShowVisibilityDialog(false);
      
      toast({
        title: "Sichtbarkeit aktiviert",
        description: `Du bist jetzt für Unternehmen sichtbar, die nach ${selectedJobOptions.join(", ")} suchen.`,
      });
    } catch (error) {
      console.error('Error saving visibility:', error);
      toast({
        title: "Fehler",
        description: "Die Einstellung konnte nicht gespeichert werden.",
        variant: "destructive"
      });
    }
  };
  return (
    <div className="p-3 md:p-6 min-h-screen bg-background max-w-full overflow-x-hidden pb-20 md:pb-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Einstellungen</h1>
        <p className="text-muted-foreground">
          Verwalte deine Privatsphäre und Profil-Einstellungen
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="general">Allgemein</TabsTrigger>
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="notifications">Benachrichtigungen</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Privacy Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <CardTitle>Datenschutz & Sichtbarkeit</CardTitle>
                </div>
                <CardDescription>
                  Kontrolliere, wer dein Profil sehen kann
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="visibility-toggle">Sichtbar</Label>
                    <p className="text-sm text-muted-foreground">
                      Dein Profil im Marketplace für Unternehmen sichtbar machen
                    </p>
                  </div>
                  <Switch 
                    id="visibility-toggle" 
                    checked={settings.profile_published}
                    onCheckedChange={handleVisibilityToggle}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Branchen-Sichtbarkeit</h4>
                  {['IT', 'Handwerk', 'Gesundheit', 'Handel', 'Industrie'].map((branch) => (
                    <div key={branch} className="flex items-center justify-between">
                      <Label htmlFor={`branch-${branch}`} className="text-sm">
                        {branch}
                      </Label>
                      <Switch 
                        id={`branch-${branch}`} 
                        checked={settings.visibility_industry.includes(branch)}
                        onCheckedChange={() => toggleIndustryVisibility(branch)}
                      />
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="regional-visibility">Regionale Sichtbarkeit</Label>
                  <p className="text-sm text-muted-foreground">
                    Nur für Unternehmen in deiner Region sichtbar
                  </p>
                  <Switch 
                    id="regional-visibility" 
                    checked={settings.regional_visibility}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, regional_visibility: checked }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Profile Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Eye className="h-5 w-5" />
                  <CardTitle>Profil-Einstellungen</CardTitle>
                </div>
                <CardDescription>
                  Konfiguriere deine Profil-Darstellung
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="show-contact">Kontaktdaten anzeigen</Label>
                    <p className="text-sm text-muted-foreground">
                      E-Mail und Telefonnummer für Unternehmen sichtbar
                    </p>
                  </div>
                  <Switch id="show-contact" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="show-documents">Dokumente anzeigen</Label>
                    <p className="text-sm text-muted-foreground">
                      Hochgeladene Zeugnisse und Bescheinigungen zeigen
                    </p>
                  </div>
                  <Switch id="show-documents" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="profile-analytics">Profil-Statistiken</Label>
                    <p className="text-sm text-muted-foreground">
                      Erlaube uns, Statistiken über dein Profil zu sammeln
                    </p>
                  </div>
                  <Switch id="profile-analytics" defaultChecked />
                </div>
              </CardContent>
            </Card>

            {/* Employer Settings */}
            <ProfileEmployerSection 
              profileData={{
                headline: profile?.headline,
                employer_free: (profile as any)?.employer_free,
                employer_slogan: (profile as any)?.employer_slogan,
              }}
            />

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <CardTitle>Benachrichtigungen</CardTitle>
                </div>
                <CardDescription>
                  Verwalte deine E-Mail-Benachrichtigungen
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="profile-views">Profil-Aufrufe</Label>
                    <p className="text-sm text-muted-foreground">
                      Benachrichtigung bei neuen Profil-Ansichten
                    </p>
                  </div>
                  <Switch id="profile-views" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="weekly-summary">Wöchentliche Zusammenfassung</Label>
                    <p className="text-sm text-muted-foreground">
                      Wöchentlicher Bericht über deine Aktivitäten
                    </p>
                  </div>
                  <Switch id="weekly-summary" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="marketplace-updates">Marketplace Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Neuigkeiten und Updates zum Marketplace
                    </p>
                  </div>
                  <Switch id="marketplace-updates" />
                </div>
              </CardContent>
            </Card>

            {/* Password */}
            <ChangePasswordCard />

            {/* Account Management */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Trash2 className="h-5 w-5" />
                  <CardTitle>Account-Verwaltung</CardTitle>
                </div>
                <CardDescription>
                  Verwalte deine Account-Daten
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Button variant="outline" className="w-full">
                    Daten exportieren
                  </Button>
                  <Button variant="outline" className="w-full">
                    Account deaktivieren
                  </Button>
                  <Button variant="destructive" className="w-full">
                    Account löschen
                  </Button>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  <p>
                    <strong>Hinweis:</strong> Inaktive Profile werden nach 6 Monaten automatisch gelöscht.
                    Durch die Nutzung unserer Plattform stimmst du unseren AGB und Datenschutzbestimmungen zu.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <div className="max-w-3xl">
            <NotifSettingsPanel userId={profile?.id ?? null} />
          </div>
        </TabsContent>
      </Tabs>

      {/* Visibility Configuration Dialog */}
      <Dialog open={showVisibilityDialog} onOpenChange={setShowVisibilityDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Sichtbarkeit konfigurieren</DialogTitle>
            <DialogDescription>
              Wähle aus, was du suchst und ab wann du verfügbar bist.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* What are you looking for */}
            <div className="space-y-3">
              <Label>Was suchst du?</Label>
              <p className="text-sm text-muted-foreground">
                Mehrfachauswahl nur bei Praktikum & Ausbildung
              </p>
              <div className="grid grid-cols-1 gap-2">
                {allowedOptions.map((opt) => (
                  <label key={opt} className="flex items-center gap-3 rounded-md border p-3 cursor-pointer hover:bg-accent/40">
                    <Checkbox
                      checked={selectedJobOptions.includes(opt as JobOption)}
                      onCheckedChange={() => toggleJobOption(opt as JobOption)}
                      aria-label={opt}
                    />
                    <span className="text-sm">{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Availability Date */}
            <div className="space-y-3">
              <Label>Ab wann?</Label>
              <RadioGroup value={availabilityType} onValueChange={(value) => setAvailabilityType(value as 'immediate' | 'custom')}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="immediate" id="immediate" />
                  <Label htmlFor="immediate" className="cursor-pointer">Ab sofort</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="custom" />
                  <Label htmlFor="custom" className="cursor-pointer">Ab einem bestimmten Datum</Label>
                </div>
              </RadioGroup>

              {availabilityType === 'custom' && (
                <div className="grid grid-cols-2 gap-3 pl-6">
                  <div className="space-y-2">
                    <Label htmlFor="year-select">Jahr</Label>
                    <Select value={selectedYear} onValueChange={(value) => {
                      setSelectedYear(value);
                      setSelectedMonth(''); // Reset month when year changes
                    }}>
                      <SelectTrigger id="year-select">
                        <SelectValue placeholder="Jahr wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        {yearOptions.map((year) => (
                          <SelectItem key={year.value} value={year.value}>
                            {year.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="month-select">Monat</Label>
                    <Select 
                      value={selectedMonth} 
                      onValueChange={setSelectedMonth}
                      disabled={!selectedYear}
                    >
                      <SelectTrigger id="month-select">
                        <SelectValue placeholder="Monat wählen" />
                      </SelectTrigger>
                      <SelectContent>
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVisibilityDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSaveVisibility}>
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;