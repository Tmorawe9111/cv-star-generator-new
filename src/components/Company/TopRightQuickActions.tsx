import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Role = "Admin" | "Recruiter" | "Editor";

type Props = {
  role: Role;
  newApplicationsCount?: number;
  onPostJob: () => void;
  onReviewApplications: () => void;
  onUpgradePlan: () => void;
  onBuyTokens: () => void;
};

export function TopRightQuickActions({
  role,
  newApplicationsCount = 0,
  onPostJob,
  onReviewApplications,
  onUpgradePlan,
  onBuyTokens,
}: Props) {
  const isAdmin = role === "Admin";
  const showBadge = useMemo(() => newApplicationsCount > 0, [newApplicationsCount]);

  return (
    <div className="flex flex-wrap items-center justify-end gap-2" aria-label="Schnellaktionen">
      <Button
        aria-label="Neue Stelle veröffentlichen"
        onClick={onPostJob}
        className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
      >
        + Stelle posten
      </Button>

      <button
        aria-label="Neue Bewerbungen prüfen"
        onClick={onReviewApplications}
        className={cn(
          "relative inline-flex items-center gap-2 rounded-xl border border-transparent bg-slate-900/5 px-4 py-2 text-sm font-semibold text-slate-900 transition",
          "hover:bg-slate-900/10 active:scale-[.98]"
        )}
      >
        Bewerbungen prüfen
        {showBadge && (
          <span
            aria-live="polite"
            className="ml-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-cyan-500 px-1.5 text-xs font-semibold text-white"
          >
            {newApplicationsCount}
          </span>
        )}
      </button>

      {isAdmin && (
        <button
          aria-label="Plan upgraden"
          onClick={onUpgradePlan}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 active:scale-[.98]"
        >
          Plan upgraden
        </button>
      )}

      {isAdmin && (
        <button
          aria-label="Neue Tokens kaufen"
          onClick={onBuyTokens}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 active:scale-[.98]"
        >
          Tokens kaufen
        </button>
      )}
    </div>
  );
}
