import { useState, useCallback, useEffect } from "react";
import { useExportCandidates } from "@/hooks/useUnlockedBulk";

export interface UseUnlockedExportOptions {
  companyId: string;
  filterKey?: string;
}

export interface UseUnlockedExportResult {
  selectedIds: Set<string>;
  isSelected: (id: string) => boolean;
  toggleSelection: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  selectedCount: number;
  exportCsv: () => Promise<void>;
  exportXlsx: () => Promise<void>;
  isExporting: boolean;
}

export function useUnlockedExport({
  companyId,
  filterKey = "",
}: UseUnlockedExportOptions): UseUnlockedExportResult {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const exporter = useExportCandidates(companyId);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [filterKey]);

  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds]);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) return next.delete(id), new Set(next);
      next.add(id);
      return new Set(next);
    });
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const exportCsv = useCallback(async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    try {
      const url = await exporter.export("csv", ids);
      window.open(url, "_blank");
      clearSelection();
    } catch (error) {
      console.error("CSV export failed:", error);
    }
  }, [selectedIds, exporter, clearSelection]);

  const exportXlsx = useCallback(async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    try {
      const url = await exporter.export("xlsx", ids);
      window.open(url, "_blank");
      clearSelection();
    } catch (error) {
      console.error("Excel export failed:", error);
    }
  }, [selectedIds, exporter, clearSelection]);

  const selectedCount = selectedIds.size;

  return {
    selectedIds,
    isSelected,
    toggleSelection,
    selectAll,
    clearSelection,
    selectedCount,
    exportCsv,
    exportXlsx,
    isExporting: exporter.isPending,
  };
}
