import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings as SettingsIcon, 
  Users, 
  Target, 
  Bell,
  Plus,
  Trash2
} from "lucide-react";
import { BranchSelector } from "@/components/Company/BranchSelector";
import { EmploymentRequestsCard } from "@/components/Company/EmploymentRequestsCard";
import { CompanyPeople } from "@/components/Company/CompanyPeople";
import { BillingOverview } from "@/components/billing/BillingOverview";
import { LocationAutocomplete } from "@/components/Company/LocationAutocomplete";
import { saveCompanyLocation } from "@/lib/location-utils";

interface TeamMember {
  id: string;
  user_id: string | null;
  role: string;
  invited_at: string | null;
  accepted_at: string | null;
  profile?: {
    vorname?: string | null;
    nachname?: string | null;
    email?: string | null;
    avatar_url?: string | null;
  } | null;
}

interface CompanySettings {
  target_industries: string[];
  target_locations: string[];
  target_status: string[];
  notification_prefs: {
    email_matches: boolean;
    email_tokens: boolean;
    email_team: boolean;
  };
}

export default function CompanySettings() {
  const navigate = useNavigate();
  const FEATURE_BILLING_V2 = import.meta.env.NEXT_PUBLIC_FEATURE_BILLING_V2 === "1";
  const { company, updateCompany, loading, refetch } = useCompany();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [settings, setSettings] = useState<CompanySettings>({
    target_industries: [],
    target_locations: [],
    target_status: ["azubi", "schueler", "ausgelernt"],
    notification_prefs: {
      email_matches: true,
      email_tokens: true,
      email_team: true,
    },
  });
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();


  useEffect(() => {
    if (company) {
      loadTeamMembers();
      loadCompanySettings();
    }
  }, [company]);

  const loadTeamMembers = async () => {
    if (!company) return;

    try {
      const { data, error } = await supabase
        .from('company_users')
        .select('id, user_id, role, invited_at, accepted_at')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const rows = (data as TeamMember[]) || [];

      const userIds = Array.from(new Set(rows.map((row) => row.user_id).filter(Boolean))) as string[];
      let profileMap = new Map<string, TeamMember['profile']>();

      if (userIds.length > 0) {
        const { data: profileRows, error: profilesError } = await supabase
          .from('profiles')
          .select('id, vorname, nachname, email, avatar_url')
          .in('id', userIds);

        if (!profilesError && profileRows) {
          profileMap = new Map(
            profileRows.map((profile: any) => [profile.id, {
              vorname: profile.vorname ?? null,
              nachname: profile.nachname ?? null,
              email: profile.email ?? null,
              avatar_url: profile.avatar_url ?? null,
            }])
          );
        }
      }

      const enriched = rows.map((row) => ({
        ...row,
        profile: row.user_id ? profileMap.get(row.user_id) ?? null : null,
      }));

      setTeamMembers(enriched);
    } catch (error) {
      console.error('Error loading team members:', error);
    }
  };

  const loadCompanySettings = async () => {
    if (!company) return;

    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .eq('company_id', company.id)
        .single();

      if (data) {
        // Initialize target_industries from company.industry if available, otherwise from settings
        const industriesFromCompany = company?.industry 
          ? (Array.isArray(company.industry) ? company.industry : [company.industry])
          : [];
        
        setSettings({
          target_industries: Array.isArray(data.target_industries) && data.target_industries.length > 0
            ? data.target_industries.map(String) 
            : industriesFromCompany.length > 0
            ? industriesFromCompany.map(String)
            : [],
          target_locations: Array.isArray(data.target_locations) 
            ? data.target_locations.map(String) 
            : [],
          target_status: Array.isArray(data.target_status) 
            ? data.target_status.map(String) 
            : ["azubi", "schueler", "ausgelernt"],
          notification_prefs: (typeof data.notification_prefs === 'object' && data.notification_prefs !== null) 
            ? data.notification_prefs as { email_matches: boolean; email_tokens: boolean; email_team: boolean; }
            : {
                email_matches: true,
                email_tokens: true,
                email_team: true,
              },
        });
      } else if (company?.industry) {
        // If no settings exist yet, initialize from company.industry
        const industriesFromCompany = Array.isArray(company.industry) 
          ? company.industry 
          : [company.industry];
        setSettings(prev => ({
          ...prev,
          target_industries: industriesFromCompany.map(String),
        }));
      }
    } catch (error) {
      console.error('Error loading company settings:', error);
    }
  };


  const saveSettings = async () => {
    if (!company) return;

    setSaving(true);
    try {
      // Save company_settings
      const { error: settingsError } = await supabase
        .from('company_settings')
        .upsert({
          company_id: company.id,
          target_industries: settings.target_industries,
          target_locations: settings.target_locations,
          target_status: settings.target_status,
          notification_prefs: settings.notification_prefs,
        }, {
          onConflict: 'company_id'
        });

      if (settingsError) throw settingsError;

      // Also update company.industry to match target_industries
      const { error: companyError } = await supabase
        .from('companies')
        .update({
          industry: settings.target_industries.length === 1 
            ? settings.target_industries[0] 
            : settings.target_industries.length > 1 
            ? settings.target_industries 
            : null,
        })
        .eq('id', company.id);

      if (companyError) throw companyError;

      // Refetch company data to update UI
      await refetch();

      toast({ title: "Einstellungen gespeichert" });
    } catch (error: any) {
      toast({ 
        title: "Fehler beim Speichern", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setSaving(false);
    }
  };

  const inviteTeamMember = async () => {
    if (!company || !newMemberEmail) return;

    try {
      // In a real app, you'd send an invitation email
      const { error } = await supabase
        .from('company_users')
        .insert({
          company_id: company.id,
          // user_id would be set when they accept the invitation
          role: 'viewer',
        });

      if (error) throw error;
      toast({ title: "Einladung versendet" });
      setNewMemberEmail("");
      loadTeamMembers();
    } catch (error: any) {
      toast({ 
        title: "Fehler beim Einladen", 
        description: error.message,
        variant: "destructive" 
      });
    }
  };

  const removeTeamMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('company_users')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
      toast({ title: "Mitglied entfernt" });
      loadTeamMembers();
    } catch (error: any) {
      toast({ 
        title: "Fehler beim Entfernen", 
        description: error.message,
        variant: "destructive" 
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-6 min-h-screen bg-background max-w-full overflow-x-hidden pb-24 pt-safe space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Einstellungen</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            type="button"
            onClick={() => navigate("/company/settings/locations")}
          >
            Standorte verwalten
          </Button>
          <Button onClick={saveSettings} disabled={saving}>
            {saving ? "Speichern..." : "Änderungen speichern"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">Allgemein</TabsTrigger>
          <TabsTrigger value="team">Team & Sitze</TabsTrigger>
          <TabsTrigger value="targeting">Zielgruppen</TabsTrigger>
          <TabsTrigger value="billing">Tokens & Abrechnung</TabsTrigger>
          <TabsTrigger value="notifications">Benachrichtigungen</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Allgemeine Informationen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Unternehmensname</Label>
                  <Input
                    id="company_name"
                    value={company?.name || ""}
                    onChange={(e) => updateCompany({ name: e.target.value })}
                    placeholder="Unternehmensname"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Branche</Label>
                  <Input
                    id="industry"
                    value={company?.industry || ""}
                    onChange={(e) => updateCompany({ industry: e.target.value })}
                    placeholder="z.B. IT, Handwerk"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Unternehmensbeschreibung</Label>
                <Input
                  id="description"
                  value={company?.description || ""}
                  onChange={(e) => updateCompany({ description: e.target.value })}
                  placeholder="Beschreiben Sie Ihr Unternehmen..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={company?.website_url || ""}
                    onChange={(e) => updateCompany({ website_url: e.target.value })}
                    placeholder="https://www.ihr-unternehmen.de"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Hauptsitz (PLZ & Stadt)</Label>
                  <LocationAutocomplete
                    id="location"
                    value={company?.main_location || ""}
                    onChange={async (value) => {
                      if (!company?.id) return;
                      
                      // Save location using utility function
                      const result = await saveCompanyLocation(company.id, value);
                      
                      if (result.success) {
                        // Refetch company data to get updated location_id and coordinates
                        await refetch();
                      } else if (result.error) {
                        toast({
                          title: 'Standort gespeichert',
                          description: 'Standort wurde gespeichert, aber Koordinaten konnten nicht ermittelt werden.',
                          variant: 'default'
                        });
                      }
                    }}
                    placeholder="z. B. 10115 Berlin oder Berlin"
                  />
                  <p className="text-xs text-muted-foreground">
                    Geben Sie PLZ und Stadt ein, um automatisch Koordinaten zu erhalten
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Team-Mitglieder ({teamMembers.length}/{company?.seats ?? "–"})
                  </span>
                  <Badge variant="secondary">
                    {company?.seats || 0} Sitze verfügbar
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="E-Mail-Adresse des neuen Mitglieds"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                  />
                  <Button onClick={inviteTeamMember} disabled={!newMemberEmail}>
                    <Plus className="h-4 w-4 mr-2" />
                    Einladen
                  </Button>
                </div>

                <div className="space-y-2">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {member.profile?.vorname?.charAt(0) || "U"}
                            {member.profile?.nachname?.charAt(0) || "N"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.profile?.vorname || "Unbekannter"} {member.profile?.nachname || "Mitarbeiter"}</p>
                          <Badge variant="outline" className="text-xs">
                            {member.profile?.email || "Keine E-Mail"}
                          </Badge>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => removeTeamMember(member.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {teamMembers.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">
                      Noch keine Team-Mitglieder eingeladen
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Employment Requests Card */}
            <EmploymentRequestsCard company={company} />

            {/* Company People (Team) */}
            {company && <CompanyPeople companyId={company.id} />}
          </div>
        </TabsContent>

        <TabsContent value="targeting">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Zielgruppen-Einstellungen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Was suchen Sie? (Mindestens eine Auswahl erforderlich)</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Wählen Sie aus, welche Art von Kandidaten Sie suchen. Nur Personen, die entsprechende Suchpräferenzen haben, werden Ihnen angezeigt.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { key: "azubi", label: "Azubis", description: "Auszubildende suchen" },
                      { key: "schueler", label: "Schüler:innen", description: "Praktikant:innen suchen" },
                      { key: "ausgelernt", label: "Fachkräfte", description: "Fertige Gesellen/Fachkräfte" }
                    ].map((option) => (
                      <div key={option.key} className="border rounded-lg p-3">
                        <label className="flex items-start space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.target_status.includes(option.key)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSettings(prev => ({
                                  ...prev,
                                  target_status: [...prev.target_status, option.key]
                                }));
                              } else {
                                setSettings(prev => ({
                                  ...prev,
                                  target_status: prev.target_status.filter(s => s !== option.key)
                                }));
                              }
                            }}
                            className="mt-0.5"
                          />
                          <div>
                            <span className="font-medium">{option.label}</span>
                            <p className="text-sm text-muted-foreground">{option.description}</p>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                  {settings.target_status.length === 0 && (
                    <p className="text-sm text-red-600 mt-2">
                      ⚠️ Sie müssen mindestens eine Zielgruppe auswählen
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <BranchSelector
                    selectedBranches={settings.target_industries}
                    onSelectionChange={(branches) => setSettings(prev => ({
                      ...prev,
                      target_industries: branches
                    }))}
                  />
                  <p className="text-sm text-muted-foreground">
                    Wählen Sie alle Branchen aus, in denen Sie Kandidaten suchen möchten.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Zielregionen (kommagetrennt)</Label>
                  <Input
                    value={settings.target_locations.join(", ")}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      target_locations: e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                    }))}
                    placeholder="Berlin, München, Hamburg"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="billing">
          {FEATURE_BILLING_V2 && (
            <Card className="mb-6 border-blue-200 bg-blue-50/60">
              <CardHeader>
                <CardTitle>Neue Abrechnung (Beta)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-blue-900">
                <p>
                  Testen Sie die neue Abrechnungs- und Token-Ansicht mit erweiterten Funktionen für Käufe, Rechnungen und Plan-Upgrades.
                </p>
                <Button onClick={() => navigate("/company/billing-v2")}>Billing V2 öffnen</Button>
              </CardContent>
            </Card>
          )}
          <BillingOverview variant="embedded" />
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Benachrichtigungseinstellungen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <label className="flex items-center justify-between">
                  <span>E-Mail bei neuen Matches</span>
                  <input
                    type="checkbox"
                    checked={settings.notification_prefs.email_matches}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      notification_prefs: {
                        ...prev.notification_prefs,
                        email_matches: e.target.checked
                      }
                    }))}
                  />
                </label>

                <label className="flex items-center justify-between">
                  <span>E-Mail bei niedrigem Token-Stand</span>
                  <input
                    type="checkbox"
                    checked={settings.notification_prefs.email_tokens}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      notification_prefs: {
                        ...prev.notification_prefs,
                        email_tokens: e.target.checked
                      }
                    }))}
                  />
                </label>

                <label className="flex items-center justify-between">
                  <span>E-Mail bei Team-Änderungen</span>
                  <input
                    type="checkbox"
                    checked={settings.notification_prefs.email_team}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      notification_prefs: {
                        ...prev.notification_prefs,
                        email_team: e.target.checked
                      }
                    }))}
                  />
                </label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}