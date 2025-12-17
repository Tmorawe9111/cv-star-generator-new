import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Prefs = {
  email_matches: boolean;
  email_tokens: boolean;
  email_team: boolean;
};

const DEFAULT_PREFS: Prefs = {
  email_matches: true,
  email_tokens: true,
  email_team: true,
};

export default function CompanySettingsNotifications() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { company, loading } = useCompany();

  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [savingKey, setSavingKey] = useState<keyof Prefs | null>(null);

  useEffect(() => {
    if (!company?.id) return;
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from("company_settings")
        .select("notification_prefs")
        .eq("company_id", company.id)
        .maybeSingle();
      if (!mounted) return;
      if (error) return;
      const raw = (data as any)?.notification_prefs;
      if (raw && typeof raw === "object") {
        setPrefs({
          email_matches: raw.email_matches ?? true,
          email_tokens: raw.email_tokens ?? true,
          email_team: raw.email_team ?? true,
        });
      }
    })();
    return () => {
      mounted = false;
    };
  }, [company?.id]);

  const updatePref = async (key: keyof Prefs, value: boolean) => {
    if (!company?.id) return;
    setPrefs((p) => ({ ...p, [key]: value }));
    setSavingKey(key);
    try {
      const next = { ...prefs, [key]: value };
      const { error } = await supabase
        .from("company_settings")
        .upsert(
          {
            company_id: company.id,
            notification_prefs: next,
          },
          { onConflict: "company_id" },
        );
      if (error) throw error;
      toast({ title: "Gespeichert", description: "Benachrichtigungen wurden aktualisiert." });
    } catch (e: any) {
      toast({
        title: "Fehler",
        description: e?.message || "Konnte nicht speichern.",
        variant: "destructive",
      });
    } finally {
      setSavingKey(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!company) {
    return <div className="p-6 text-center text-muted-foreground">Kein Unternehmen gefunden.</div>;
  }

  return (
    <div className="p-6 md:p-8 min-h-screen bg-gray-50/50">
      <div className="max-w-3xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/unternehmen/einstellungen")}
          className="-ml-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zurück zu Einstellungen
        </Button>

        <header className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
              <Bell className="h-5 w-5 text-slate-700" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Benachrichtigungen</h1>
              <p className="text-muted-foreground">Steuern Sie, welche E‑Mails Sie erhalten.</p>
            </div>
          </div>
        </header>

        <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>E‑Mail Einstellungen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Neue Matches</p>
                <p className="text-xs text-muted-foreground">E‑Mail wenn neue passende Kandidat:innen verfügbar sind.</p>
              </div>
              <Switch
                checked={prefs.email_matches}
                disabled={savingKey === "email_matches"}
                onCheckedChange={(v) => updatePref("email_matches", v)}
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Niedriger Token‑Stand</p>
                <p className="text-xs text-muted-foreground">E‑Mail sobald Tokens knapp werden.</p>
              </div>
              <Switch
                checked={prefs.email_tokens}
                disabled={savingKey === "email_tokens"}
                onCheckedChange={(v) => updatePref("email_tokens", v)}
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Team‑Änderungen</p>
                <p className="text-xs text-muted-foreground">E‑Mail bei Einladungen/Änderungen im Team.</p>
              </div>
              <Switch
                checked={prefs.email_team}
                disabled={savingKey === "email_team"}
                onCheckedChange={(v) => updatePref("email_team", v)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


