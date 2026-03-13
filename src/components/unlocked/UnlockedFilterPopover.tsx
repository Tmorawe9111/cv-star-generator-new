import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  STAGE_FILTERS,
  ARCHIVED_FILTERS,
  ABSCHLUSS_OPTIONS,
  SEARCH_KIND_OPTIONS,
  SELECT_ALL_JOBS,
} from "@/hooks/useUnlockedFilters";
import type { UnlockedFilters } from "@/types/unlocked";

export interface UnlockedFilterPopoverProps {
  filters: UnlockedFilters;
  stageCounts: Record<string, number>;
  availableJobs: Array<{ id: string; title: string; is_active: boolean }>;
  onStageFiltersChange: (v: string[] | ((prev: string[]) => string[])) => void;
  onShowArchivedChange: (v: boolean) => void;
  onJobTitleFilterChange: (v: string) => void;
  onIndustryFilterChange: (v: string) => void;
  onLocationFilterChange: (v: string) => void;
  onAbschlussFilterChange: (v: string[] | ((prev: string[]) => string[])) => void;
  onSearchKindFiltersChange: (v: string[] | ((prev: string[]) => string[])) => void;
  onUnlockedOnlyChange: (v: boolean) => void;
  onSelectedJobIdChange: (v: string | null) => void;
  onReset: () => void;
}

export function UnlockedFilterPopover(props: UnlockedFilterPopoverProps) {
  const { filters, stageCounts, availableJobs } = props;
  const { selectedJobId, jobTitleFilter, industryFilter, locationFilter, abschlussFilter, searchKindFilters, unlockedOnly, selectedStageFilters, showArchived } = filters;

  const toggleStage = (key: string, checked: boolean) => {
    props.onStageFiltersChange((prev) => {
      const set = new Set(prev);
      if (checked) set.add(key); else set.delete(key);
      return Array.from(set);
    });
  };
  const toggleAbschluss = (value: string, checked: boolean) => {
    props.onAbschlussFilterChange((prev) => {
      const set = new Set(prev);
      if (checked) set.add(value); else set.delete(value);
      return Array.from(set);
    });
  };
  const toggleSearchKind = (key: string, checked: boolean) => {
    props.onSearchKindFiltersChange((prev) => {
      const set = new Set(prev);
      if (checked) set.add(key); else set.delete(key);
      return Array.from(set);
    });
  };

  return (
    <div className="w-[400px] space-y-4 max-h-[80vh] overflow-y-auto">
      <div className="space-y-2 pb-3 border-b">
        <Label className="text-sm font-semibold">Stellenanzeige</Label>
        <Select value={selectedJobId || SELECT_ALL_JOBS} onValueChange={(v) => props.onSelectedJobIdChange(v === SELECT_ALL_JOBS ? null : v)}>
          <SelectTrigger className="w-full"><SelectValue placeholder="Alle Stellenanzeigen" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={SELECT_ALL_JOBS}>Alle Stellenanzeigen</SelectItem>
            {availableJobs.map((job) => (
              <SelectItem key={job.id} value={job.id}>
                <div className="flex items-center gap-2">
                  <span>{job.title}</span>
                  {job.is_active ? <Badge variant="default" className="ml-auto text-xs">Aktiv</Badge> : <Badge variant="secondary" className="ml-auto text-xs">Inaktiv</Badge>}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">Zeigt nur Kandidaten, die mit der ausgewählten Stelle verknüpft sind</p>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm font-semibold">Status</Label>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => props.onStageFiltersChange(STAGE_FILTERS.map((s) => s.key))}>Alle</Button>
            <Button variant="ghost" size="sm" onClick={() => props.onStageFiltersChange([STAGE_FILTERS[0].key])}>Zurücksetzen</Button>
          </div>
        </div>
        <div className="space-y-2">
          {STAGE_FILTERS.map((stage) => (
            <label key={stage.key} className="flex items-start gap-2 cursor-pointer p-2 rounded hover:bg-muted/50">
              <Checkbox checked={selectedStageFilters.includes(stage.key)} onCheckedChange={(v) => toggleStage(stage.key, !!v)} className="mt-0.5" />
              <div className="flex-1">
                <span className="text-sm font-medium">{stage.label}</span>
                {stage.description && <p className="text-xs text-muted-foreground mt-0.5">{stage.description}</p>}
                <Badge variant="secondary" className="ml-2 text-xs">{stageCounts[stage.key] ?? 0}</Badge>
              </div>
            </label>
          ))}
        </div>
        {ARCHIVED_FILTERS.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-semibold text-muted-foreground">Archiv</Label>
              <Switch checked={showArchived} onCheckedChange={props.onShowArchivedChange} />
            </div>
            <p className="text-xs text-muted-foreground">Abgelehnte oder abgesagte Kandidaten</p>
          </div>
        )}
      </div>
      <div className="space-y-2 pt-3 border-t">
        <Label className="text-sm font-semibold">Weitere Filter</Label>
        <Input value={jobTitleFilter} onChange={(e) => props.onJobTitleFilterChange(e.target.value)} placeholder="Jobtitel z. B. Azubi im Handwerk" className="text-sm" />
        <Input value={industryFilter} onChange={(e) => props.onIndustryFilterChange(e.target.value)} placeholder="Branche z. B. Bau, IT" className="text-sm" />
        <Input value={locationFilter} onChange={(e) => props.onLocationFilterChange(e.target.value)} placeholder="Standort z. B. Berlin" className="text-sm" />
      </div>
      <div className="border-t pt-3 space-y-2">
        <span className="text-sm font-semibold">Abschluss</span>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {ABSCHLUSS_OPTIONS.map((option) => (
            <label key={option.value} className="flex items-center gap-2 text-sm">
              <Checkbox checked={abschlussFilter.includes(option.value)} onCheckedChange={(v) => toggleAbschluss(option.value, !!v)} />
              {option.label}
            </label>
          ))}
        </div>
      </div>
      <div className="border-t pt-3">
        <span className="text-sm font-semibold">Art der Suche</span>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {SEARCH_KIND_OPTIONS.map((option) => (
            <label key={option.key} className="flex items-center gap-2 text-sm">
              <Checkbox checked={searchKindFilters.includes(option.key)} onCheckedChange={(v) => toggleSearchKind(option.key, !!v)} />
              {option.label}
            </label>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between border-t pt-3">
        <Label htmlFor="unlocked-only" className="text-sm">Nur freigeschaltete</Label>
        <Switch id="unlocked-only" checked={unlockedOnly} onCheckedChange={props.onUnlockedOnlyChange} />
      </div>
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={props.onReset}>Zurücksetzen</Button>
      </div>
    </div>
  );
}
