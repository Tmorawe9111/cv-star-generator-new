import { Button } from "@/components/ui/button";

interface SelectionBarProps {
  count: number;
  onClear: () => void;
  onExportCsv: () => void;
  onExportXlsx: () => void;
  busy?: boolean;
}

export function SelectionBar({
  count,
  onClear,
  onExportCsv,
  onExportXlsx,
  busy = false
}: SelectionBarProps) {
  return (
    <div className="sticky top-12 z-30 mb-2 flex items-center justify-between rounded-2xl border bg-white/90 p-3 backdrop-blur shadow-sm">
      <div className="text-sm font-medium">
        <span className="font-semibold text-primary">{count}</span> ausgewählt
      </div>
      
      <div className="flex items-center gap-3">
        <p className="text-xs text-muted-foreground">Statusänderungen nimmst du direkt im Profil vor.</p>
        
        <div className="h-6 w-px bg-border" />
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onExportCsv} 
            disabled={busy}
            className="h-8"
          >
            Export CSV
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onExportXlsx} 
            disabled={busy}
            className="h-8"
          >
            Export Excel
          </Button>
        </div>
        
        <div className="h-6 w-px bg-border" />
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClear}
          className="h-8"
        >
          Auswahl aufheben
        </Button>
      </div>
    </div>
  );
}