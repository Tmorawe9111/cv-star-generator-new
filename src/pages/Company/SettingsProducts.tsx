import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Briefcase, ClipboardList, HeartHandshake, SlidersHorizontal, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BranchSelector } from "@/components/Company/BranchSelector";
import { CompanyValuesEditModal } from "@/components/modals/CompanyValuesEditModal";
import { CompanyInterviewEditModal } from "@/components/modals/CompanyInterviewEditModal";

type CompanySettingsRow = {
  target_industries: string[] | null;
  target_status: string[] | null;
};

const TARGET_OPTIONS: Array<{ key: string; label: string; description: string }> = [
  { key: "azubi", label: "Azubis", description: "Auszubildende" },
  { key: "schueler", label: "Schüler:innen", description: "Praktikant:innen" },
  { key: "ausgelernt", label: "Fachkräfte", description: "Ausgelernte / erfahrene Profile" },
];

export default function CompanySettingsProducts() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { company, loading, refetch } = useCompany();

  const [settings, setSettings] = useState<CompanySettingsRow>({
    target_industries: [],
    target_status: ["azubi", "schueler", "ausgelernt"],
  });
  const [saving, setSaving] = useState(false);
  const [openValues, setOpenValues] = useState(false);
  const [openQuestions, setOpenQuestions] = useState(false);
  const [valuesConfigured, setValuesConfigured] = useState<boolean | null>(null);
  const [questionsCount, setQuestionsCount] = useState<number | null>(null);

  useEffect(() => {
    if (!company?.id) return;
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase
          .from("company_settings")
          .select("target_industries, target_status")
          .eq("company_id", company.id)
          .maybeSingle();

        if (!mounted) return;
        const industriesFromCompany = company?.industry
          ? Array.isArray(company.industry)
            ? company.industry
            : [company.industry]
          : [];

        setSettings({
          target_industries:
            (Array.isArray(data?.target_industries) && data?.target_industries?.length
              ? data?.target_industries
              : industriesFromCompany) || [],
          target_status:
            (Array.isArray(data?.target_status) && data?.target_status?.length
              ? data?.target_status
              : ["azubi", "schueler", "ausgelernt"]) || ["azubi", "schueler", "ausgelernt"],
        });

        // Values configured?
        const { data: companyValues, error: valuesErr } = await supabase
          .from("company_values")
          .select("company_id")
          .eq("company_id", company.id)
          .maybeSingle();
        if (!valuesErr && mounted) {
          setValuesConfigured(!!companyValues);
        }

        // General questions count (role_id is null)
        const { data: qRows, error: qErr } = await supabase
          .from("company_interview_questions")
          .select("id", { count: "exact", head: true })
          .eq("company_id", company.id)
          .is("role_id", null);
        if (!qErr && mounted) {
          // When head: true, data is null, count is on response; supabase types don't expose it cleanly.
          // We do a second lightweight select without head when count is not available.
          // @ts-expect-error count exists at runtime
          const cnt = (qRows as any)?.count;
          if (typeof cnt === "number") setQuestionsCount(cnt);
        }
      } catch (e: any) {
        console.warn("[SettingsProducts] load error", e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [company?.id]);

  useEffect(() => {
    // Fallback: fetch questions list length if count head doesn't yield
    if (!company?.id) return;
    if (questionsCount !== null) return;
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from("company_interview_questions")
        .select("id")
        .eq("company_id", company.id)
        .is("role_id", null);
      if (!mounted) return;
      if (!error) setQuestionsCount((data || []).length);
    })();
    return () => {
      mounted = false;
    };
  }, [company?.id, questionsCount]);

  const industriesPreview = useMemo(() => {
    const list = settings.target_industries || [];
    if (list.length === 0) return "Nicht gesetzt";
    if (list.length <= 2) return list.join(", ");
    return `${list.slice(0, 2).join(", ")} +${list.length - 2}`;
  }, [settings.target_industries]);

  const targetsPreview = useMemo(() => {
    const list = new Set(settings.target_status || []);
    const labels = TARGET_OPTIONS.filter((o) => list.has(o.key)).map((o) => o.label);
    if (labels.length === 0) return "Nicht gesetzt";
    if (labels.length <= 2) return labels.join(", ");
    return `${labels.slice(0, 2).join(", ")} +${labels.length - 2}`;
  }, [settings.target_status]);

  const save = async () => {
    if (!company?.id) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("company_settings")
        .upsert(
          {
            company_id: company.id,
            target_industries: settings.target_industries || [],
            target_status: settings.target_status || [],
          },
          { onConflict: "company_id" },
        );
      if (error) throw error;

      // Keep companies.industry aligned (single string or array)
      const inds = settings.target_industries || [];
      const { error: cErr } = await supabase
        .from("companies")
        .update({
          industry: inds.length === 1 ? inds[0] : inds.length > 1 ? inds : null,
        })
        .eq("id", company.id);
      if (cErr) throw cErr;

      await refetch();
      toast({ title: "Gespeichert", description: "Produkteinstellungen wurden aktualisiert." });
    } catch (e: any) {
      toast({
        title: "Fehler",
        description: e?.message || "Konnte nicht speichern.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
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
      <div className="max-w-4xl mx-auto space-y-6">
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
              <SlidersHorizontal className="h-5 w-5 text-slate-700" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Produkteinstellungen</h1>
              <p className="text-muted-foreground">
                Definieren Sie, was Sie suchen – für besseres Matching und schnellere Prozesse.
              </p>
            </div>
          </div>
        </header>

        <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Branche
              <Badge variant="secondary" className="ml-2">{industriesPreview}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Welche Branchen passen zu Ihrem Bedarf? (Mehrfachauswahl möglich)
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Bearbeiten</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Branche auswählen</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <BranchSelector
                    selectedBranches={settings.target_industries || []}
                    onSelectionChange={(branches) =>
                      setSettings((prev) => ({ ...prev, target_industries: branches }))
                    }
                  />
                  <div className="flex justify-end">
                    <Button onClick={save} disabled={saving}>
                      {saving ? "Speichern…" : "Speichern"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Zielgruppen
              <Badge variant="secondary" className="ml-2">{targetsPreview}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Welche Profile möchten Sie primär erreichen?
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Bearbeiten</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Zielgruppen auswählen</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {TARGET_OPTIONS.map((opt) => {
                    const checked = (settings.target_status || []).includes(opt.key);
                    return (
                      <div key={opt.key} className="flex items-center justify-between rounded-xl border p-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{opt.label}</p>
                          <p className="text-xs text-muted-foreground">{opt.description}</p>
                        </div>
                        <Switch
                          checked={checked}
                          onCheckedChange={(v) => {
                            setSettings((prev) => {
                              const current = new Set(prev.target_status || []);
                              if (v) current.add(opt.key);
                              else current.delete(opt.key);
                              return { ...prev, target_status: Array.from(current) };
                            });
                          }}
                        />
                      </div>
                    );
                  })}
                  <div className="flex justify-end">
                    <Button onClick={save} disabled={saving}>
                      {saving ? "Speichern…" : "Speichern"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HeartHandshake className="h-5 w-5" />
              Werteprofil (Company‑Werte)
              <Badge variant="secondary" className="ml-2">
                {valuesConfigured === null ? "…" : valuesConfigured ? "Konfiguriert" : "Nicht gesetzt"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Definieren Sie, welche Werte und Arbeitsweise zu Ihnen passen – das verbessert das Matching.
            </p>
            <Button variant="outline" onClick={() => setOpenValues(true)}>
              Werte bearbeiten
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Allgemeine Fragen (Unlock‑Phase)
              <Badge variant="secondary" className="ml-2">
                {questionsCount === null ? "…" : `${questionsCount} Fragen`}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Diese Fragen werden Kandidat:innen nach dem Freischalten gestellt und fließen ins Matching ein.
            </p>
            <Button variant="outline" onClick={() => setOpenQuestions(true)}>
              Fragen bearbeiten
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Matching Targets
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Berufsgruppen, Must‑/Nice‑to‑Have, Benefits und Radius – für präzisere Vorschläge.
            </p>
            <Button variant="outline" onClick={() => navigate("/unternehmen/einstellungen/matching-targets")}>
              Öffnen
            </Button>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}>
            {saving ? "Speichern…" : "Speichern"}
          </Button>
        </div>
      </div>

      <CompanyValuesEditModal
        open={openValues}
        onOpenChange={(o) => setOpenValues(o)}
        onComplete={async () => {
          setOpenValues(false);
          setValuesConfigured(true);
        }}
      />
      <CompanyInterviewEditModal
        open={openQuestions}
        onOpenChange={(o) => setOpenQuestions(o)}
        onComplete={async () => {
          setOpenQuestions(false);
          // refresh count
          if (!company?.id) return;
          const { data } = await supabase
            .from("company_interview_questions")
            .select("id")
            .eq("company_id", company.id)
            .is("role_id", null);
          setQuestionsCount((data || []).length);
        }}
      />
    </div>
  );
}


