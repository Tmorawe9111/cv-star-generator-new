import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TokenChip } from "@/components/ui/token-chip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type TagType = "profession" | "target_group" | "benefit" | "must" | "nice" | "work_env";

type VocabTag = {
  id: string;
  type: TagType;
  key: string;
  label: string;
};

export interface TagPickerProps {
  type: TagType;
  title: string;
  description?: string;
  selected: string[]; // tag ids
  onChange: (ids: string[]) => void;
  className?: string;
}

export function TagPicker({ type, title, description, selected, onChange, className }: TagPickerProps) {
  const [tags, setTags] = useState<VocabTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("vocab_tags")
        .select("id,type,key,label")
        .eq("type", type)
        .order("label", { ascending: true });
      if (mounted) {
        if (!error) setTags(data || []);
        setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [type]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tags;
    return tags.filter((t) => t.label.toLowerCase().includes(q) || t.key.toLowerCase().includes(q));
  }, [tags, search]);

  const toggle = (id: string) => {
    const set = new Set(selected);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    onChange(Array.from(set));
  };

  return (
    <section className={cn("space-y-3", className)}>
      <div>
        <Label className="text-base font-medium">{title}</Label>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      <div className="flex items-center gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Suchen oder filtern"
          className="max-w-sm"
        />
        <div className="text-sm text-muted-foreground">{selected.length} ausgewählt</div>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Lade Tags…</div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {filtered.map((t) => {
            const isSelected = selected.includes(t.id);
            return (
              <button
                type="button"
                key={t.id}
                onClick={() => toggle(t.id)}
                aria-pressed={isSelected}
                aria-label={`${t.label} ${isSelected ? "ausgewählt" : "auswählen"}`}
                className="focus:outline-none"
              >
                <TokenChip
                  selected={isSelected}
                  className={cn(
                    "cursor-pointer",
                    isSelected ? "ring-1 ring-ring bg-primary/10" : "bg-secondary"
                  )}
                >
                  {t.label}
                </TokenChip>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-sm text-muted-foreground">Keine Treffer – such' anders oder schlage neue Tags vor.</div>
          )}
        </div>
      )}
    </section>
  );
}

export default TagPicker;
