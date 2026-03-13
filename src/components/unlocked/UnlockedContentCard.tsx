import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UnlockedCandidateCard } from "./UnlockedCandidateCard";
import { UnlockedCandidateRow } from "./UnlockedCandidateRow";
import { UnlockedPagination } from "./UnlockedPagination";
import { UnlockedEmptyState } from "./UnlockedEmptyState";
import type { UnlockedCandidate } from "@/types/unlocked";
import type { ProcessStageAction } from "@/types/unlocked";

export interface UnlockedContentCardProps {
  loading: boolean;
  isEmpty: boolean;
  search: string;
  activeTab: "unlocked" | "viewed";
  viewMode: "grid" | "list";
  currentProfiles: UnlockedCandidate[];
  currentPage: number;
  totalPages: number;
  filters: { selectedJobId: string | null };
  availableJobs: Array<{ id: string; title: string; is_active: boolean }>;
  buildProcessActions: (p: UnlockedCandidate) => ProcessStageAction[];
  isSelected: (id: string) => boolean;
  onToggleSelect: (id: string) => void;
  onView: (p: UnlockedCandidate) => void;
  onDownload: (id: string) => void;
  onToggleFavorite?: () => void;
  onJobFilterClick: (jobId: string) => void;
  onTabChange: (tab: "unlocked" | "viewed") => void;
  onPageChange: (page: number) => void;
  onNavigateToSearch: () => void;
  gridRef: React.RefObject<HTMLDivElement | null>;
}

export function UnlockedContentCard({
  loading,
  isEmpty,
  search,
  activeTab,
  viewMode,
  currentProfiles,
  currentPage,
  totalPages,
  filters,
  availableJobs,
  buildProcessActions,
  isSelected,
  onToggleSelect,
  onView,
  onDownload,
  onToggleFavorite,
  onJobFilterClick,
  onTabChange,
  onPageChange,
  onNavigateToSearch,
  gridRef,
}: UnlockedContentCardProps) {
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Kürzlich</CardTitle>
        <div className="mt-2 flex gap-2">
          <Button size="sm" variant={activeTab === "unlocked" ? "default" : "outline"} onClick={() => onTabChange("unlocked")}>
            Freigeschaltet
          </Button>
          <Button size="sm" variant={activeTab === "viewed" ? "default" : "outline"} onClick={() => onTabChange("viewed")}>
            Angeschaut
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        ) : isEmpty ? (
          <UnlockedEmptyState hasSearch={!!search.trim()} tab={activeTab} onNavigateToSearch={onNavigateToSearch} />
        ) : viewMode === "grid" ? (
          <>
            <div ref={gridRef} className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {currentProfiles.map((p) => (
                <UnlockedCandidateCard
                  key={p.id}
                  profile={p}
                  isSelected={isSelected(p.id)}
                  onToggleSelect={() => onToggleSelect(p.id)}
                  processActions={activeTab === "unlocked" ? buildProcessActions(p) : []}
                  onView={() => onView(p)}
                  onDownload={() => onDownload(p.id)}
                  onToggleFavorite={onToggleFavorite}
                />
              ))}
            </div>
            <UnlockedPagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
          </>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12" />
                    <TableHead className="min-w-[150px]">Name</TableHead>
                    <TableHead className="min-w-[120px]">Ort</TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                    <TableHead className="min-w-[120px]">Art der Suche</TableHead>
                    <TableHead className="min-w-[100px]">Verfügbar ab</TableHead>
                    <TableHead className="min-w-[80px]">Führerschein</TableHead>
                    <TableHead className="min-w-[100px]">Kontakt</TableHead>
                    <TableHead className="min-w-[120px]">Interview</TableHead>
                    <TableHead className="min-w-[150px]">Verknüpfte Stelle(n)</TableHead>
                    <TableHead className="min-w-[140px]">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentProfiles.map((p) => (
                    <UnlockedCandidateRow
                      key={p.id}
                      profile={p}
                      isSelected={isSelected(p.id)}
                      selectedJobId={filters.selectedJobId}
                      availableJobs={availableJobs}
                      onToggleSelect={() => onToggleSelect(p.id)}
                      onView={() => onView(p)}
                      onDownload={() => onDownload(p.id)}
                      onJobFilterClick={onJobFilterClick}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
            <UnlockedPagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
          </>
        )}
      </CardContent>
    </Card>
  );
}
