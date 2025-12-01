import React from "react";
import { LucideIcon } from "lucide-react";

export function KpiCard({ 
  title, 
  value, 
  delta, 
  format = "number", 
  hint,
  icon: Icon 
}: { 
  title: string; 
  value: number | string; 
  delta?: number; 
  format?: "number" | "currency" | "percent"; 
  hint?: string;
  icon?: LucideIcon;
}) {
  const formatted = React.useMemo(() => {
    if (typeof value === "string") return value;
    if (format === "currency") return new Intl.NumberFormat(undefined, { style: "currency", currency: "EUR" }).format(value);
    if (format === "percent") return `${value}%`;
    return new Intl.NumberFormat().format(value);
  }, [value, format]);

  const deltaText = delta !== undefined ? `${delta > 0 ? "+" : ""}${delta}%` : null;
  const deltaColor = delta && delta >= 0 ? "text-green-600" : "text-red-600";

  return (
    <article className="rounded-2xl border bg-card shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow">
      <header className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </header>
      <div className="flex items-end gap-2">
        <div className="text-2xl sm:text-3xl font-semibold">{formatted}</div>
        {deltaText && <div className={`text-xs sm:text-sm ${deltaColor}`}>{deltaText}</div>}
      </div>
      {hint && <p className="text-xs text-muted-foreground mt-2">{hint}</p>}
    </article>
  );
}

export default KpiCard;
