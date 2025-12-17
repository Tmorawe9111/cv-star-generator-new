import { useCallback, useMemo, useState } from "react";
import AdminAuthGate from "@/components/admin/AdminAuthGate";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Download, Eye, Upload, ClipboardCopy, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { parseCsvToObjects } from "@/lib/csv";

type ImportKind = "companies" | "company_locations" | "job_posts" | "seed_users";
type ValidationError = { index: number; field: string; message: string };

const templates: Record<ImportKind, string> = {
  companies:
    'company_external_id,name,primary_email,industry,website_url,description\nacme-001,ACME GmbH,admin@acme.de,Handwerk,https://acme.de,"Kurzbeschreibung"\n',
  company_locations:
    'company_external_id,location_external_id,name,street,house_number,postal_code,city,country,is_primary,is_active,lat,lon\nacme-001,acme-berlin,"Standort Berlin","Musterstraße",12,10115,Berlin,Deutschland,true,true,52.5200,13.4050\n',
  job_posts:
    'company_external_id,job_external_id,title,is_active,is_public,status,industry,description_md,tasks_md,requirements_md,location_external_id,city,postal_code,address_street,address_number,country,contact_email,contact_person_name,contact_person_phone,contact_person_role\nacme-001,acme-job-001,"Pflegefachkraft (m/w/d)",true,true,published,Pflege,"**Beschreibung** ...","**Aufgaben** ...","**Anforderungen** ...",acme-berlin,,,,,,recruiter@acme.de,,,\n',
  seed_users:
    'user_external_id,email,first_name,last_name,telefon,headline,bio,branche,status,location_city,location_postal_code,cv_url,avatar_url,profile_published\nseed-001,bevisible.seed+0001@gmail.com,Vorname,Nachname,+49 170 0000000,"Kurz-Headline","Kurz-Bio",pflege,ausgelernt,Berlin,10115,https://.../cv.pdf,https://.../avatar.png,true\n',
};

const geminiPrompt = `Du bist ein Daten-Generator für Seed-Profile (Deutschland). Erzeuge ein JSON-ARRAY mit exakt dem Schema unten, ohne zusätzliche Keys. Die Profile müssen realistisch, vielfältig und vollständig sein.

WICHTIG:
- email muss eine PRIVATE Domain haben: gmail.com, web.de, gmx.de, outlook.com, icloud.com (keine Firmen-Domains!)
- user_external_id eindeutig (z.B. seed-0001..)
- status ist eines von: schueler | azubi | ausgelernt
- branche ist eines von: pflege | handwerk | industrie | buero | verkauf | gastronomie | bau
- location_postal_code ist 5-stellig, location_city in DE
- consent gilt als vorhanden (wir importieren echte Accounts) – trotzdem keine Marketing-Texte.

JSON Schema (exakt so):
[
  {
    "user_external_id": "seed-0001",
    "email": "bevisible.seed+0001@gmail.com",
    "first_name": "…",
    "last_name": "…",
    "telefon": "+49 …",
    "headline": "… (max 80 Zeichen)",
    "bio": "… (3-6 Sätze, deutsch, ohne Platzhalter)",
    "branche": "pflege",
    "status": "ausgelernt",
    "location_city": "Berlin",
    "location_postal_code": "10115",
    "cv_url": null,
    "avatar_url": null,
    "profile_published": true,

    "uebermich": "… (optional, länger)",
    "kenntnisse": "… (optional)",
    "motivation": "… (optional)",
    "praktische_erfahrung": "… (optional)",

    "sprachen": ["Deutsch (C1)", "Englisch (B1)"],
    "faehigkeiten": ["Teamarbeit", "Empathie", "Dokumentation"],
    "schulbildung": [{"abschluss":"…","schule":"…","ort":"…","jahr":"…"}],
    "berufserfahrung": [{"rolle":"…","arbeitgeber":"…","ort":"…","von":"YYYY-MM","bis":"YYYY-MM oder null","beschreibung":"…"}]
  }
]

Erzeuge 50 Profile pro Antwort.`;

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function groupErrors(errors: ValidationError[]) {
  const byRow = new Map<number, ValidationError[]>();
  for (const e of errors) {
    const arr = byRow.get(e.index) ?? [];
    arr.push(e);
    byRow.set(e.index, arr);
  }
  return byRow;
}

export default function BulkImport() {
  const [activeTab, setActiveTab] = useState<ImportKind>("companies");

  const [csvInput, setCsvInput] = useState<Record<ImportKind, string>>({
    companies: "",
    company_locations: "",
    job_posts: "",
    seed_users: "",
  });

  const [jsonInputSeed, setJsonInputSeed] = useState<string>("");

  const [parsed, setParsed] = useState<Record<ImportKind, any[]>>({
    companies: [],
    company_locations: [],
    job_posts: [],
    seed_users: [],
  });

  const [errors, setErrors] = useState<Record<ImportKind, ValidationError[]>>({
    companies: [],
    company_locations: [],
    job_posts: [],
    seed_users: [],
  });

  const [busy, setBusy] = useState(false);
  const [impersonatingEmail, setImpersonatingEmail] = useState<string | null>(null);

  const validateLocal = useCallback((kind: ImportKind, rows: any[]): ValidationError[] => {
    const out: ValidationError[] = [];
    const req = (idx: number, field: string) => out.push({ index: idx, field, message: "Pflichtfeld fehlt" });

    rows.forEach((r, idx) => {
      if (kind === "companies") {
        if (!String(r.company_external_id || "").trim()) req(idx, "company_external_id");
        if (!String(r.name || "").trim()) req(idx, "name");
      }
      if (kind === "company_locations") {
        if (!String(r.company_external_id || "").trim()) req(idx, "company_external_id");
        if (!String(r.location_external_id || "").trim()) req(idx, "location_external_id");
        if (!String(r.city || "").trim()) req(idx, "city");
      }
      if (kind === "job_posts") {
        if (!String(r.company_external_id || "").trim()) req(idx, "company_external_id");
        if (!String(r.job_external_id || "").trim()) req(idx, "job_external_id");
        if (!String(r.title || "").trim()) req(idx, "title");
      }
      if (kind === "seed_users") {
        if (!String(r.user_external_id || "").trim()) req(idx, "user_external_id");
        if (!String(r.email || "").trim()) req(idx, "email");
        if (!String(r.first_name || "").trim()) req(idx, "first_name");
        if (!String(r.last_name || "").trim()) req(idx, "last_name");
        if (!String(r.branche || "").trim()) req(idx, "branche");
        if (!String(r.status || "").trim()) req(idx, "status");
        if (!String(r.location_city || "").trim()) req(idx, "location_city");
        if (!String(r.location_postal_code || "").trim()) req(idx, "location_postal_code");
      }
    });

    return out;
  }, []);

  const parseCsv = useCallback(
    (kind: ImportKind) => {
      try {
        const { rows } = parseCsvToObjects(csvInput[kind]);
        setParsed((p) => ({ ...p, [kind]: rows }));
        const localErrors = validateLocal(kind, rows);
        setErrors((e) => ({ ...e, [kind]: localErrors }));
        if (localErrors.length) toast.warning(`${localErrors.length} Validierungsfehler gefunden (lokal).`);
        else toast.success(`${rows.length} Zeile(n) geparst.`);
      } catch (err: any) {
        toast.error(`CSV Parse Fehler: ${err?.message || String(err)}`);
        setParsed((p) => ({ ...p, [kind]: [] }));
        setErrors((e) => ({ ...e, [kind]: [{ index: 0, field: "csv", message: "Parse fehlgeschlagen" }] }));
      }
    },
    [csvInput, validateLocal]
  );

  const parseSeedJson = useCallback(() => {
    try {
      const data = JSON.parse(jsonInputSeed);
      if (!Array.isArray(data)) throw new Error("JSON muss ein Array sein");
      setParsed((p) => ({ ...p, seed_users: data }));
      const localErrors = validateLocal("seed_users", data);
      setErrors((e) => ({ ...e, seed_users: localErrors }));
      if (localErrors.length) toast.warning(`${localErrors.length} Validierungsfehler gefunden (lokal).`);
      else toast.success(`${data.length} Seed-Profile geladen.`);
    } catch (err: any) {
      toast.error(`JSON Parse Fehler: ${err?.message || String(err)}`);
      setParsed((p) => ({ ...p, seed_users: [] }));
      setErrors((e) => ({ ...e, seed_users: [{ index: 0, field: "json", message: "Parse fehlgeschlagen" }] }));
    }
  }, [jsonInputSeed, validateLocal]);

  const callDryRun = useCallback(async (kind: ImportKind) => {
    if (!parsed[kind]?.length) {
      toast.error("Bitte erst parsen (keine Daten).");
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-bulk-import", {
        body: { kind, rows: parsed[kind], dryRun: true },
      });
      if (error) throw error;
      if (data?.errors?.length) {
        setErrors((e) => ({ ...e, [kind]: data.errors as ValidationError[] }));
        toast.warning(`${data.errors.length} Fehler vom Backend.`);
      } else {
        setErrors((e) => ({ ...e, [kind]: [] }));
        toast.success(`Backend-Check ok (${data?.count ?? parsed[kind].length} Zeilen).`);
      }
    } catch (err: any) {
      toast.error(`DryRun fehlgeschlagen: ${err?.message || String(err)}`);
    } finally {
      setBusy(false);
    }
  }, [parsed]);

  const callImport = useCallback(async (kind: ImportKind) => {
    if (!parsed[kind]?.length) {
      toast.error("Bitte erst parsen (keine Daten).");
      return;
    }
    if (errors[kind]?.length) {
      toast.error("Bitte zuerst Fehler beheben (lokal oder DryRun).");
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-bulk-import", {
        body: { kind, rows: parsed[kind], dryRun: false },
      });
      if (error) throw error;
      if (!data?.ok) {
        toast.error(data?.error || "Import fehlgeschlagen");
        return;
      }
      toast.success(`Import erfolgreich: ${data.imported ?? 0} Datensätze`);
    } catch (err: any) {
      toast.error(`Import fehlgeschlagen: ${err?.message || String(err)}`);
    } finally {
      setBusy(false);
    }
  }, [parsed, errors]);

  const getMagicLinkForSeedEmail = useCallback(async (email: string) => {
    const clean = String(email || "").trim().toLowerCase();
    if (!clean) throw new Error("E-Mail fehlt");
    const { data, error } = await supabase.functions.invoke("admin-user-actions", {
      body: {
        action: "impersonate",
        email: clean,
        redirectTo: `${window.location.origin}/profil`,
      },
    });
    if (error) throw error;
    const url = data?.url as string | undefined;
    if (!url) throw new Error("Magic-Link nicht verfügbar");
    return url;
  }, []);

  const openSeedUserInNewWindow = useCallback(async (email: string) => {
    try {
      const clean = String(email || "").trim().toLowerCase();
      setImpersonatingEmail(clean);
      const url = await getMagicLinkForSeedEmail(clean);
      const win = window.open(url, "_blank", "noopener,noreferrer");
      if (!win) {
        toast.warning("Popup blockiert. Bitte Popups erlauben oder 'Link kopieren' nutzen.");
      }
    } catch (e: any) {
      toast.error(e?.message || "Öffnen fehlgeschlagen");
    } finally {
      setImpersonatingEmail(null);
    }
  }, [getMagicLinkForSeedEmail]);

  const copySeedUserLink = useCallback(async (email: string) => {
    try {
      const clean = String(email || "").trim().toLowerCase();
      setImpersonatingEmail(clean);
      const url = await getMagicLinkForSeedEmail(clean);
      await navigator.clipboard.writeText(url);
      toast.success("Magic-Link kopiert (öffnet das Profil als Seed-User)");
    } catch (e: any) {
      toast.error(e?.message || "Kopieren fehlgeschlagen");
    } finally {
      setImpersonatingEmail(null);
    }
  }, [getMagicLinkForSeedEmail]);

  const currentErrors = errors[activeTab] || [];
  const grouped = useMemo(() => groupErrors(currentErrors), [currentErrors]);
  const preview = (parsed[activeTab] || []).slice(0, 8);
  const previewHeaders = useMemo(() => {
    const first = preview?.[0];
    return first ? Object.keys(first) : [];
  }, [preview]);

  const Header = ({ title, desc }: { title: string; desc: string }) => (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Badge variant="secondary">CSV → Preview → DryRun → Import</Badge>
      </div>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  );

  return (
    <AdminAuthGate requiredRole="SuperAdmin">
      <div className="p-4 md:p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Bulk Import</CardTitle>
            <CardDescription>
              Massenupload für Unternehmen, Standorte, Stellenanzeigen und Seed-Profile (inkl. Auth-Accounts). Import ist idempotent über external_id.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ImportKind)}>
              <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full">
                <TabsTrigger value="companies">Unternehmen</TabsTrigger>
                <TabsTrigger value="company_locations">Standorte</TabsTrigger>
                <TabsTrigger value="job_posts">Stellenanzeigen</TabsTrigger>
                <TabsTrigger value="seed_users">Seed-Profile</TabsTrigger>
              </TabsList>

              <TabsContent value="companies" className="mt-6 space-y-4">
                <Header title="Unternehmen importieren" desc="Upsert nach companies.external_id (company_external_id)." />
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => downloadText("companies-template.csv", templates.companies)}>
                    <Download className="h-4 w-4 mr-2" /> Template
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setCsvInput((s) => ({ ...s, companies: templates.companies }))}>
                    <ClipboardCopy className="h-4 w-4 mr-2" /> Template einfügen
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>CSV</Label>
                  <Textarea value={csvInput.companies} onChange={(e) => setCsvInput((s) => ({ ...s, companies: e.target.value }))} rows={10} placeholder={templates.companies} />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" onClick={() => parseCsv("companies")} disabled={busy}>
                    <Eye className="h-4 w-4 mr-2" /> Parsen & prüfen
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => callDryRun("companies")} disabled={busy}>
                    <CheckCircle2 className="h-4 w-4 mr-2" /> DryRun (Backend)
                  </Button>
                  <Button size="sm" variant="default" onClick={() => callImport("companies")} disabled={busy}>
                    <Upload className="h-4 w-4 mr-2" /> Import
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="company_locations" className="mt-6 space-y-4">
                <Header title="Standorte importieren" desc="Upsert nach (company_id, company_locations.external_id). company_external_id muss existieren." />
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => downloadText("company_locations-template.csv", templates.company_locations)}>
                    <Download className="h-4 w-4 mr-2" /> Template
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setCsvInput((s) => ({ ...s, company_locations: templates.company_locations }))}>
                    <ClipboardCopy className="h-4 w-4 mr-2" /> Template einfügen
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>CSV</Label>
                  <Textarea value={csvInput.company_locations} onChange={(e) => setCsvInput((s) => ({ ...s, company_locations: e.target.value }))} rows={10} placeholder={templates.company_locations} />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" onClick={() => parseCsv("company_locations")} disabled={busy}>
                    <Eye className="h-4 w-4 mr-2" /> Parsen & prüfen
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => callDryRun("company_locations")} disabled={busy}>
                    <CheckCircle2 className="h-4 w-4 mr-2" /> DryRun (Backend)
                  </Button>
                  <Button size="sm" variant="default" onClick={() => callImport("company_locations")} disabled={busy}>
                    <Upload className="h-4 w-4 mr-2" /> Import
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="job_posts" className="mt-6 space-y-4">
                <Header title="Stellenanzeigen importieren" desc="Upsert nach (company_id, job_posts.external_id). Optional: location_external_id & contact_email." />
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => downloadText("job_posts-template.csv", templates.job_posts)}>
                    <Download className="h-4 w-4 mr-2" /> Template
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setCsvInput((s) => ({ ...s, job_posts: templates.job_posts }))}>
                    <ClipboardCopy className="h-4 w-4 mr-2" /> Template einfügen
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>CSV</Label>
                  <Textarea value={csvInput.job_posts} onChange={(e) => setCsvInput((s) => ({ ...s, job_posts: e.target.value }))} rows={10} placeholder={templates.job_posts} />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" onClick={() => parseCsv("job_posts")} disabled={busy}>
                    <Eye className="h-4 w-4 mr-2" /> Parsen & prüfen
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => callDryRun("job_posts")} disabled={busy}>
                    <CheckCircle2 className="h-4 w-4 mr-2" /> DryRun (Backend)
                  </Button>
                  <Button size="sm" variant="default" onClick={() => callImport("job_posts")} disabled={busy}>
                    <Upload className="h-4 w-4 mr-2" /> Import
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="seed_users" className="mt-6 space-y-4">
                <Header title="Seed-Profile importieren" desc="Erstellt echte Auth-Accounts + upsert profiles. Du loggst dich via Admin-Magic-Link ein (kein Passwort)."/>

                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Gemini Prompt (Copy/Paste)</CardTitle>
                      <CardDescription>Erzeuge 50 Profile pro Batch als JSON-Array (siehe Schema).</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            await navigator.clipboard.writeText(geminiPrompt);
                            toast.success("Prompt kopiert");
                          }}
                        >
                          <ClipboardCopy className="h-4 w-4 mr-2" /> Prompt kopieren
                        </Button>
                      </div>
                      <Textarea value={geminiPrompt} readOnly rows={10} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Import-Input</CardTitle>
                      <CardDescription>Du kannst CSV (einfach) oder JSON (vollständig) nutzen.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex gap-2 flex-wrap">
                        <Button variant="outline" size="sm" onClick={() => downloadText("seed_users-template.csv", templates.seed_users)}>
                          <Download className="h-4 w-4 mr-2" /> CSV Template
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setCsvInput((s) => ({ ...s, seed_users: templates.seed_users }))}>
                          <ClipboardCopy className="h-4 w-4 mr-2" /> CSV Template einfügen
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Label>CSV</Label>
                        <Textarea value={csvInput.seed_users} onChange={(e) => setCsvInput((s) => ({ ...s, seed_users: e.target.value }))} rows={6} placeholder={templates.seed_users} />
                        <div className="flex gap-2 flex-wrap">
                          <Button size="sm" onClick={() => parseCsv("seed_users")} disabled={busy}>
                            <Eye className="h-4 w-4 mr-2" /> CSV parsen
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>JSON (Gemini Output)</Label>
                        <Textarea value={jsonInputSeed} onChange={(e) => setJsonInputSeed(e.target.value)} rows={8} placeholder='[ { "user_external_id": "seed-0001", ... } ]' />
                        <div className="flex gap-2 flex-wrap">
                          <Button size="sm" variant="outline" onClick={parseSeedJson} disabled={busy}>
                            <Eye className="h-4 w-4 mr-2" /> JSON laden
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => callDryRun("seed_users")} disabled={busy}>
                    <CheckCircle2 className="h-4 w-4 mr-2" /> DryRun (Backend)
                  </Button>
                  <Button size="sm" variant="default" onClick={() => callImport("seed_users")} disabled={busy}>
                    <Upload className="h-4 w-4 mr-2" /> Import
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold">Preview</h3>
                <Badge variant="outline">{(parsed[activeTab] || []).length} Zeile(n)</Badge>
                {currentErrors.length > 0 ? (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <XCircle className="h-3 w-3" /> {currentErrors.length} Fehler
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> OK
                  </Badge>
                )}
              </div>

              {currentErrors.length > 0 && (
                <Alert>
                  <AlertDescription className="space-y-1">
                    {Array.from(grouped.entries()).slice(0, 6).map(([rowIdx, errs]) => (
                      <div key={rowIdx} className="text-sm">
                        <span className="font-medium">Zeile {rowIdx + 1}:</span>{" "}
                        {errs.map((e) => `${e.field}: ${e.message}`).join(" · ")}
                      </div>
                    ))}
                    {grouped.size > 6 && <div className="text-sm text-muted-foreground">… weitere Fehler</div>}
                  </AlertDescription>
                </Alert>
              )}

              {preview.length > 0 && (
                <div className="overflow-auto rounded-md border">
                  <table className="min-w-full text-sm">
                    <thead className="bg-muted/40">
                      <tr>
                        {activeTab === "seed_users" && (
                          <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Aktion</th>
                        )}
                        {previewHeaders.slice(0, 10).map((h) => (
                          <th key={h} className="text-left px-3 py-2 font-medium whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, idx) => (
                        <tr key={idx} className="border-t">
                          {activeTab === "seed_users" && (
                            <td className="px-3 py-2 whitespace-nowrap">
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => openSeedUserInNewWindow(String((row as any)?.email || ""))}
                                  disabled={!String((row as any)?.email || "").trim() || !!impersonatingEmail}
                                >
                                  Als Seed‑User öffnen
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => copySeedUserLink(String((row as any)?.email || ""))}
                                  disabled={!String((row as any)?.email || "").trim() || !!impersonatingEmail}
                                >
                                  Link kopieren
                                </Button>
                              </div>
                            </td>
                          )}
                          {previewHeaders.slice(0, 10).map((h) => (
                            <td key={h} className="px-3 py-2 whitespace-nowrap max-w-[240px] truncate">
                              {String(row[h] ?? "")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminAuthGate>
  );
}


