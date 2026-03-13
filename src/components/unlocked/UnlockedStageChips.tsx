import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { STAGE_FILTERS, ARCHIVED_FILTERS } from "@/hooks/useUnlockedFilters";

export interface UnlockedStageChipsProps {
  selectedStageFilters: string[];
  showArchived: boolean;
  selectedJobId: string | null;
  stageCounts: Record<string, number>;
  availableJobs: Array<{ id: string; title: string }>;
  onStageFiltersChange: (filters: string[]) => void;
  onShowArchivedChange: (show: boolean) => void;
  onSelectedJobIdChange: (jobId: string | null) => void;
}

export function UnlockedStageChips({
  selectedStageFilters,
  showArchived,
  selectedJobId,
  stageCounts,
  availableJobs,
  onStageFiltersChange,
  onShowArchivedChange,
  onSelectedJobIdChange,
}: UnlockedStageChipsProps) {
  return (
    <div className="-mx-2 overflow-x-auto px-2">
      <div className="flex items-center gap-2 min-w-max">
        {selectedJobId && (
          <Button
            size="sm"
            variant="secondary"
            className="gap-2 whitespace-nowrap bg-blue-100 text-blue-700 hover:bg-blue-200"
            onClick={() => onSelectedJobIdChange(null)}
          >
            {availableJobs.find((j) => j.id === selectedJobId)?.title || "Stelle"}
            <span className="ml-1">×</span>
          </Button>
        )}
        <Button
          size="sm"
          variant={selectedStageFilters.length === STAGE_FILTERS.length ? "secondary" : "outline"}
          className="gap-2 whitespace-nowrap"
          onClick={() => {
            onStageFiltersChange(STAGE_FILTERS.map((s) => s.key));
            onShowArchivedChange(false);
          }}
        >
          Alle
        </Button>
        {STAGE_FILTERS.map((stage) => {
          const active = selectedStageFilters.includes(stage.key);
          return (
            <Button
              key={stage.key}
              size="sm"
              variant={active ? "secondary" : "outline"}
              className="gap-2 whitespace-nowrap"
              title={stage.description}
              onClick={() => {
                if (active) {
                  onStageFiltersChange(selectedStageFilters.filter((s) => s !== stage.key));
                } else {
                  onStageFiltersChange([stage.key]);
                }
              }}
            >
              {stage.label}
              <Badge variant={active ? "default" : "secondary"} className="ml-1">
                {stageCounts[stage.key] ?? 0}
              </Badge>
            </Button>
          );
        })}
        {showArchived ? (
          <Button
            size="sm"
            variant="outline"
            className="gap-2 whitespace-nowrap text-muted-foreground"
            onClick={() => {
              onShowArchivedChange(false);
              onStageFiltersChange([STAGE_FILTERS[0].key]);
            }}
          >
            Archiv ausblenden
          </Button>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            className="gap-2 whitespace-nowrap text-muted-foreground"
            onClick={() => {
              onShowArchivedChange(true);
              onStageFiltersChange([]);
            }}
          >
            Archiv anzeigen
          </Button>
        )}
      </div>
    </div>
  );
}
