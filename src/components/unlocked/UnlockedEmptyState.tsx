import { Button } from "@/components/ui/button";
import { Coins } from "lucide-react";

export interface UnlockedEmptyStateProps {
  hasSearch: boolean;
  tab: "unlocked" | "viewed";
  onNavigateToSearch: () => void;
}

export function UnlockedEmptyState({
  hasSearch,
  tab,
  onNavigateToSearch,
}: UnlockedEmptyStateProps) {
  const message =
    tab === "unlocked"
      ? hasSearch
        ? "Keine Treffer für deine Suche."
        : "Noch keine Profile freigeschaltet."
      : hasSearch
        ? "Keine Treffer für deine Suche."
        : "Noch keine Profile angesehen.";

  return (
    <div className="text-center py-16 text-muted-foreground">
      {message}
      {tab === "unlocked" && !hasSearch && (
        <div className="mt-4">
          <Button onClick={onNavigateToSearch}>
            <Coins className="h-4 w-4 mr-2" /> Kandidaten suchen
          </Button>
        </div>
      )}
    </div>
  );
}
