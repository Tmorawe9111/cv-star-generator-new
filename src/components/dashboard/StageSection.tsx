import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export interface StageSectionProps {
  title: string;
  subtitle: string;
  count: number;
  children: ReactNode;
  onViewAll?: () => void;
}

export function StageSection({
  title,
  subtitle,
  count,
  children,
  onViewAll,
}: StageSectionProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">{title}</p>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
            {count}
          </span>
          {onViewAll && (
            <Button size="sm" variant="outline" className="whitespace-nowrap text-xs" onClick={onViewAll}>
              Alle anzeigen
            </Button>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}
