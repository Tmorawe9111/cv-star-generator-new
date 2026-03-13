import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Filter } from "lucide-react";
import { UnlockedFilterPopover } from "./UnlockedFilterPopover";
import type { UnlockedFilters } from "@/types/unlocked";

export interface UnlockedFilterBarProps {
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

export function UnlockedFilterBar(props: UnlockedFilterBarProps) {
  const { filters, stageCounts, availableJobs } = props;
  const { selectedJobId } = filters;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="h-4 w-4" /> Filter
          {selectedJobId && (
            <Badge variant="secondary" className="ml-1">
              {availableJobs.find((j) => j.id === selectedJobId)?.title || "Stelle"}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end">
        <UnlockedFilterPopover {...props} />
      </PopoverContent>
    </Popover>
  );
}
