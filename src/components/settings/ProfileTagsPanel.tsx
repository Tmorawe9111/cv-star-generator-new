import React, { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import TagPicker, { TagType } from "@/components/Company/matching/TagPicker";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const GROUPS: { type: TagType; title: string; description?: string }[] = [
  { type: "profession", title: "Berufe & Richtungen", description: "Wähle Ausbildungsberufe, die dich interessieren." },
  { type: "must", title: "Stärken (Muss)", description: "Was zeichnet dich auf jeden Fall aus?" },
  { type: "nice", title: "Nice-to-have", description: "Weitere Pluspunkte und Interessen." },
  { type: "work_env", title: "Arbeitsumfeld", description: "In welchem Umfeld möchtest du arbeiten?" },
  { type: "benefit", title: "Benefits", description: "Was ist dir bei Arbeitgebern wichtig?" },
  { type: "target_group", title: "Zielstatus", description: "Dein aktueller Status." },
];

export interface ProfileTagsPanelProps {
  autoSave?: boolean;
}

export const ProfileTagsPanel: React.FC<ProfileTagsPanelProps> = ({ autoSave = false }) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [selectedByType, setSelectedByType] = useState<Record<TagType, string[]>>({
    profession: [],
    target_group: [],
    benefit: [],
    must: [],
    nice: [],
    work_env: [],
  });
  const [initialAll, setInitialAll] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const allSelected = useMemo(() => Object.values(selectedByType).flat(), [selectedByType]);

  useEffect(() => {
    if (!user?.id) return;
    let mounted = true;
    (async () => {
      const { data: pt, error } = await supabase
        .from("profile_tags")
        .select("tag_id")
        .eq("profile_id", user.id);
      if (error) return;
      const tagIds = (pt || []).map((r) => r.tag_id as string);

      // fetch their types to split into groups
      const { data: vocab } = await supabase
        .from("vocab_tags")
        .select("id,type")
        .in("id", tagIds.length ? tagIds : ["00000000-0000-0000-0000-000000000000"]);

      const byType: Record<TagType, string[]> = {
        profession: [],
        target_group: [],
        benefit: [],
        must: [],
        nice: [],
        work_env: [],
      };
      (vocab || []).forEach((t) => {
        const type = t.type as TagType;
        if (byType[type]) byType[type].push(t.id as string);
      });
      if (mounted) {
        setSelectedByType(byType);
        setInitialAll(tagIds);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const persist = useCallback(async (ids: string[]) => {
    if (!user?.id) return true;
    setSaving(true);
    try {
      const before = new Set(initialAll);
      const after = new Set(ids);
      const toAdd = Array.from(after).filter((id) => !before.has(id));
      const toRemove = Array.from(before).filter((id) => !after.has(id));

      if (toAdd.length) {
        const rows = toAdd.map((tag_id) => ({ profile_id: user.id, tag_id }));
        const { error: insErr } = await supabase.from("profile_tags").insert(rows);
        if (insErr) throw insErr;
      }
      if (toRemove.length) {
        const { error: delErr } = await supabase
          .from("profile_tags")
          .delete()
          .eq("profile_id", user.id)
          .in("tag_id", toRemove);
        if (delErr) throw delErr;
      }
      setInitialAll(ids);
      toast({ title: "Gespeichert", description: "Deine Profil-Tags wurden aktualisiert." });
      return true;
    } catch (e) {
      console.error(e);
      toast({ title: "Fehler", description: "Tags konnten nicht gespeichert werden.", variant: "destructive" });
      return false;
    } finally {
      setSaving(false);
    }
  }, [initialAll, supabase, user?.id, toast]);

  const handleChange = (type: TagType, ids: string[]) => {
    const next = { ...selectedByType, [type]: ids };
    setSelectedByType(next);
    if (autoSave) {
      const merged = Object.values(next).flat();
      void persist(merged);
    }
  };

  const handleSave = async () => {
    const merged = allSelected;
    await persist(merged);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profil‑Tags</CardTitle>
        <CardDescription>Hilf uns, bessere Matches zu finden – wähle passende Tags aus.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {GROUPS.map((g) => (
          <TagPicker
            key={g.type}
            type={g.type}
            title={g.title}
            description={g.description}
            selected={selectedByType[g.type]}
            onChange={(ids) => handleChange(g.type, ids)}
            className=""
          />
        ))}

        {!autoSave && (
          <div className="pt-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Speichern…" : "Änderungen speichern"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileTagsPanel;
