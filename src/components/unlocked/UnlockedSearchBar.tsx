import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List } from "lucide-react";
import type { ViewMode } from "@/types/unlocked";

export interface UnlockedSearchBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function UnlockedSearchBar({
  search,
  onSearchChange,
  viewMode,
  onViewModeChange,
}: UnlockedSearchBarProps) {
  return (
    <div className="flex items-center gap-3">
      <Input
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Suchen nach Name, Ort, Branche..."
        className="w-[260px] md:w-[320px]"
      />
      <div className="flex items-center gap-1 rounded-full border border-gray-200 bg-white p-1">
        <Button size="icon" variant={viewMode === "grid" ? "default" : "ghost"} className="h-9 w-9" onClick={() => onViewModeChange("grid")}>
          <LayoutGrid className="h-4 w-4" />
        </Button>
        <Button size="icon" variant={viewMode === "list" ? "default" : "ghost"} className="h-9 w-9" onClick={() => onViewModeChange("list")}>
          <List className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
