import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export interface JobHighlightItem {
  job_id: string;
  title: string;
  location?: string | null;
  created_at?: string | null;
  applicants_count?: number | null;
}

interface JobHighlightsProps {
  jobs: JobHighlightItem[];
  loading?: boolean;
  onOpenJobs?: () => void;
}

function formatDate(value?: string | null) {
  if (!value) return null;
  try {
    return format(new Date(value), "dd.MM.yyyy", { locale: de });
  } catch (error) {
    return null;
  }
}

export function JobHighlights({ jobs, loading, onOpenJobs }: JobHighlightsProps) {
  if (loading) {
    return (
      <Card className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <Skeleton className="h-6 w-40 rounded-full" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-20 rounded-xl" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm.font-semibold uppercase tracking-wide text-primary">Job-Highlights</p>
          <h3 className="text-lg font-semibold text-slate-900">Ihre aktivsten Stellen</h3>
        </div>
        <Button variant="outline" className="rounded-full" onClick={onOpenJobs}>
          Alle Stellen ansehen
        </Button>
      </div>

      {jobs.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-muted-foreground">
          Keine aktiven Stellen gefunden.
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {jobs.map(job => (
            <div
              key={job.job_id}
              className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-base font-semibold text-slate-900">{job.title}</p>
                <p className="text-xs text-muted-foreground">
                  {job.location || "Standort offen"}
                  {job.created_at && ` · Seit ${formatDate(job.created_at)}`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-700">
                  Bewerbungen: {job.applicants_count ?? 0}
                </span>
                <Button variant="ghost" className="text-primary">
                  Stellen-Detail
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
