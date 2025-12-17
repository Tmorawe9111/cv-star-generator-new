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

  useEffect(() => {
    if (profile) {
      setSettings(prev => ({
        ...prev,
        profile_published: profile.profile_published || false,
        visibility_industry: profile.visibility_industry || [],
        job_search_preferences: (profile as any).job_search_preferences || [],
      }));
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

  const toggleJobPref = (opt: string) => {
    const current = settings.job_search_preferences || [];
    const DUAL_ALLOWED = ["Praktikum", "Ausbildung"];
    const SINGLE_ONLY = ["Nach der Ausbildung einen Job", "Ausbildungsplatzwechsel"];

    const isDual = DUAL_ALLOWED.includes(opt);
    const isSingle = SINGLE_ONLY.includes(opt);

    let next: string[] = [];
    if (isSingle) {
      next = current.length === 1 && current[0] === opt ? [] : [opt];
    } else {
      if (current.some((c) => SINGLE_ONLY.includes(c))) {
        next = [opt];
      } else if (current.includes(opt)) {
        next = current.filter((c) => c !== opt);
      } else {
        next = [...current, opt].filter((v) => DUAL_ALLOWED.includes(v));
      }
    }

    updateSetting('job_search_preferences', next);
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
                    <Label htmlFor="publish-profile">Profil veröffentlichen</Label>
                    <p className="text-sm text-muted-foreground">
                      Dein Profil im Marketplace für Unternehmen sichtbar machen
                    </p>
                  </div>
                  <Switch 
                    id="publish-profile" 
                    checked={settings.profile_published}
                    onCheckedChange={(checked) => updateSetting('profile_published', checked)}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Sichtbarkeits‑Ziele</h4>
                  <p className="text-sm text-muted-foreground">Was suchst du? (Mehrfachauswahl nur bei Praktikum & Ausbildung)</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {allowedOptions.map((opt) => (
                      <label key={opt} className="flex items-center gap-3 rounded-md border p-3 cursor-pointer hover:bg-accent/40">
                        <Checkbox
                          checked={settings.job_search_preferences.includes(opt)}
                          onCheckedChange={() => toggleJobPref(opt)}
                          aria-label={opt}
                        />
                        <span className="text-sm">{opt}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">Mehrfachauswahl ist nur bei „Praktikum“ und „Ausbildung“ möglich. Andere Optionen sind Einzelwahl.</p>
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
    </div>
  );
};

export default Settings;