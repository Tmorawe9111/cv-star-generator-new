import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { UnlockedSearchBar } from "./UnlockedSearchBar";
import { UnlockedFilterBar } from "./UnlockedFilterBar";
import { UnlockedStageChips } from "./UnlockedStageChips";
import type { UnlockedFilters } from "@/types/unlocked";

export interface UnlockedHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  filters: UnlockedFilters;
  stageCounts: Record<string, number>;
  availableJobs: Array<{ id: string; title: string; is_active: boolean }>;
  filterHandlers: {
    setSelectedStageFilters: (v: string[] | ((p: string[]) => string[])) => void;
    setShowArchived: (v: boolean) => void;
    setJobTitleFilter: (v: string) => void;
    setIndustryFilter: (v: string) => void;
    setLocationFilter: (v: string) => void;
    setAbschlussFilter: (v: string[] | ((p: string[]) => string[])) => void;
    setSearchKindFilters: (v: string[] | ((p: string[]) => string[])) => void;
    setUnlockedOnly: (v: boolean) => void;
    setSelectedJobId: (v: string | null) => void;
  };
  onResetFilters: () => void;
  onExportCsv: () => void;
}

export function UnlockedHeader({
  search,
  onSearchChange,
  viewMode,
  onViewModeChange,
  filters,
  stageCounts,
  availableJobs,
  filterHandlers,
  onResetFilters,
  onExportCsv,
}: UnlockedHeaderProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Freigeschaltete Talente</h1>
          <UnlockedSearchBar search={search} onSearchChange={onSearchChange} viewMode={viewMode} onViewModeChange={onViewModeChange} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <UnlockedFilterBar
            filters={filters}
            stageCounts={stageCounts}
            availableJobs={availableJobs}
            onStageFiltersChange={filterHandlers.setSelectedStageFilters}
            onShowArchivedChange={filterHandlers.setShowArchived}
            onJobTitleFilterChange={filterHandlers.setJobTitleFilter}
            onIndustryFilterChange={filterHandlers.setIndustryFilter}
            onLocationFilterChange={filterHandlers.setLocationFilter}
            onAbschlussFilterChange={filterHandlers.setAbschlussFilter}
            onSearchKindFiltersChange={filterHandlers.setSearchKindFilters}
            onUnlockedOnlyChange={filterHandlers.setUnlockedOnly}
            onSelectedJobIdChange={filterHandlers.setSelectedJobId}
            onReset={onResetFilters}
          />
          <Button size="sm" onClick={onExportCsv}>
            <Download className="h-4 w-4 mr-2" /> Export (CSV)
          </Button>
        </div>
      </div>
      <UnlockedStageChips
        selectedStageFilters={filters.selectedStageFilters}
        showArchived={filters.showArchived}
        selectedJobId={filters.selectedJobId}
        stageCounts={stageCounts}
        availableJobs={availableJobs}
        onStageFiltersChange={filterHandlers.setSelectedStageFilters}
        onShowArchivedChange={filterHandlers.setShowArchived}
        onSelectedJobIdChange={filterHandlers.setSelectedJobId}
      />
    </div>
  );
}
