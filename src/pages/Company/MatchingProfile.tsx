import React, { useEffect, useMemo, useState } from "react";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { TagPicker, TagType } from "@/components/Company/matching/TagPicker";
import { Separator } from "@/components/ui/separator";

const TAG_TYPES: TagType[] = [
  "profession",
  "target_group",
  "benefit",
  "must",
  "nice",
  "work_env",
];

export default function MatchingProfilePage() {
  const { company, loading: companyLoading } = useCompany();
  const { toast } = useToast();

  // Text fields
  const [about, setAbout] = useState("");
  const [benefitsText, setBenefitsText] = useState("");
  const [mustText, setMustText] = useState("");
  const [niceText, setNiceText] = useState("");
  const [radius, setRadius] = useState<number>(25);

  // Selected tags (flat set of tag ids)
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Matching‑Profil – Unternehmen";
    const desc = "Definiere Berufsgruppen, Zielgruppen und Benefits für bessere Azubi‑Vorschläge.";
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.content = desc;
  }, []);

  // Load existing data
  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!company) return;
      setLoading(true);
      try {
        // Load existing text fields
        setAbout(company.matching_about || "");
        setBenefitsText(company.matching_benefits_text || "");
        setMustText(company.matching_must_text || "");
        setNiceText(company.matching_nice_text || "");
        setRadius(typeof company.location_radius_km === 'number' ? company.location_radius_km : 25);

        // Load company tags
        const { data: ct, error } = await supabase
          .from("company_tags")
          .select("tag_id")
          .eq("company_id", company.id);
        if (!error && ct && mounted) {
          setSelectedTagIds(ct.map((r) => r.tag_id));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [company?.id]);

  const setForType = (type: TagType) => (ids: string[]) => {
    // We receive only the ids for this type; we must merge them into the global set.
    setSelectedTagIds((prev) => {
      // Fetch all tag ids for this type to filter prev. We don't have them here, so we optimistically merge:
      // We'll just compute as: remove none (can't know) -> add toggled from TagPicker which passed the full intended ids state for that type.
      // To be precise, TagPicker only knows within its list; we can replace by dedup union/minus based on current list of tags of that type
      // To avoid extra queries here, we let TagPicker communicate the full intended selection for this type along with the catalog ids it used.
      return prev; // Placeholder replaced below with improved handler
    });
  };

  // Improved handler: We need TagPicker to tell us which tag universe it had for this type to reconcile.
  // To avoid changing TagPicker API now, we perform a targeted reconciliation by re-fetching ids of this type and then merging.
  async function reconcileType(type: TagType, idsForType: string[]) {
    const { data } = await supabase
      .from("vocab_tags")
      .select("id")
      .eq("type", type);
    const universe = new Set((data || []).map((r) => r.id));
    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      // remove all existing ids for this type
      for (const id of Array.from(next)) {
        if (universe.has(id)) next.delete(id);
      }
      // add the new ones
      for (const id of idsForType) next.add(id);
      return Array.from(next);
    });
  }

  const onSave = async () => {
    if (!company) return;
    setSaving(true);
    try {
      // Update company fields
      const { error: uErr } = await supabase
        .from("companies")
        .update({
          matching_about: about || null,
          matching_benefits_text: benefitsText || null,
          matching_must_text: mustText || null,
          matching_nice_text: niceText || null,
          location_radius_km: radius,
        })
        .eq("id", company.id);
      if (uErr) throw uErr;

      // Replace company tags (simple approach)
      const { error: dErr } = await supabase
        .from("company_tags")
        .delete()
        .eq("company_id", company.id);
      if (dErr) throw dErr;

      if (selectedTagIds.length > 0) {
        const payload = selectedTagIds.map((tag_id) => ({ company_id: company.id, tag_id }));
        const { error: iErr } = await supabase.from("company_tags").insert(payload);
        if (iErr) throw iErr;
      }

      toast({ title: "Matching‑Profil aktualisiert", description: "Bessere Vorschläge sind jetzt aktiv." });
    } catch (e: any) {
      console.error("Save matching profile error", e);
      toast({ title: "Speichern fehlgeschlagen", description: e?.message || "Bitte später erneut versuchen.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const charCount = useMemo(() => about.length, [about]);

  return (
    <div className="container mx-auto p-4 md:p-6">
      <header className="mb-4 md:mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Matching‑Profil</h1>
        <p className="text-muted-foreground">Definiere, wen ihr sucht und was euch ausmacht – für bessere Vorschläge.</p>
      </header>

      <main className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Wen wir grundsätzlich suchen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <TagPicker
              type="profession"
              title="Berufsgruppen"
              description="In welchen Ausbildungsbereichen sucht ihr?"
              selected={selectedTagIds}
              onChange={(ids) => reconcileType("profession", ids)}
            />
            <TagPicker
              type="target_group"
              title="Zielgruppen"
              description="Welche Profile passen generell zu euch?"
              selected={selectedTagIds}
              onChange={(ids) => reconcileType("target_group", ids)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Was wir bieten / Benefits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <TagPicker
              type="benefit"
              title="Benefits (Tags)"
              selected={selectedTagIds}
              onChange={(ids) => reconcileType("benefit", ids)}
            />
            <div className="space-y-2">
              <label className="text-sm font-medium">Was uns besonders macht</label>
              <Textarea
                value={benefitsText}
                onChange={(e) => setBenefitsText(e.target.value)}
                maxLength={400}
                placeholder="Kurz & konkret: Z. B. Azubi‑Wohnheim, Werkzeug gestellt, Übernahmegarantie …"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Wer passt zu uns</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <TagPicker
              type="must"
              title="Muss‑Kriterien (Tags)"
              selected={selectedTagIds}
              onChange={(ids) => reconcileType("must", ids)}
            />
            <Textarea
              value={mustText}
              onChange={(e) => setMustText(e.target.value)}
              maxLength={400}
              placeholder="Ohne diese Voraussetzungen geht es nicht (max. 400 Zeichen)"
            />
            <Separator />
            <TagPicker
              type="nice"
              title="Nice‑to‑Have (Tags)"
              selected={selectedTagIds}
              onChange={(ids) => reconcileType("nice", ids)}
            />
            <Textarea
              value={niceText}
              onChange={(e) => setNiceText(e.target.value)}
              maxLength={400}
              placeholder="Schön, aber nicht zwingend (max. 400 Zeichen)"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Arbeitsumfeld</CardTitle>
          </CardHeader>
          <CardContent>
            <TagPicker
              type="work_env"
              title="Umfeld‑Tags"
              selected={selectedTagIds}
              onChange={(ids) => reconcileType("work_env", ids)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Standort & Radius</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Standort: <span className="font-medium text-foreground">{company?.main_location || "–"}</span>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Radius</label>
                <span className="text-sm text-muted-foreground">{radius} km</span>
              </div>
              <Slider value={[radius]} max={100} step={1} onValueChange={(v) => setRadius(v[0] ?? 25)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kurzbeschreibung für Talente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Textarea
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              maxLength={400}
              placeholder="2–3 Sätze: Was macht euch als Ausbildungsbetrieb besonders?"
            />
            <div className="text-xs text-muted-foreground">{charCount}/400 Zeichen</div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button onClick={onSave} disabled={saving || companyLoading}>
            {saving ? "Speichern…" : "Speichern"}
          </Button>
          <Button variant="secondary" asChild>
            <a href="/company/dashboard">Später vervollständigen</a>
          </Button>
        </div>
      </main>
    </div>
  );
}
