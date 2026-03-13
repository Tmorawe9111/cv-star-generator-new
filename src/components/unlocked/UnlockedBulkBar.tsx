import { SelectionBar } from "@/components/Company/SelectionBar";

export interface UnlockedBulkBarProps {
  selectedCount: number;
  onClear: () => void;
  onExportCsv: () => void;
  onExportXlsx: () => void;
  isExporting: boolean;
}

export function UnlockedBulkBar({
  selectedCount,
  onClear,
  onExportCsv,
  onExportXlsx,
  isExporting,
}: UnlockedBulkBarProps) {
  if (selectedCount === 0) return null;

  return (
    <SelectionBar
      count={selectedCount}
      onClear={onClear}
      onExportCsv={onExportCsv}
      onExportXlsx={onExportXlsx}
      busy={isExporting}
    />
  );
}
