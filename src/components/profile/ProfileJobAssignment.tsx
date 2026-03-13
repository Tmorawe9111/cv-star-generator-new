import { Badge } from "@/components/ui/badge";
import { MultiSelect } from "@/components/ui/multi-select";
import type { Option } from "@/components/ui/multi-select";

export interface ProfileJobAssignmentProps {
  jobOptions: Option[];
  selectedJobIds: string[];
  jobBadgeData: Array<{ id: string; label: string }>;
  jobsLoading: boolean;
  updatingJobs: boolean;
  onJobAssignmentChange: (values: string[]) => Promise<void>;
}

export function ProfileJobAssignment({
  jobOptions,
  selectedJobIds,
  jobBadgeData,
  jobsLoading,
  updatingJobs,
  onJobAssignmentChange,
}: ProfileJobAssignmentProps) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">Stellenzuordnung</p>
      <MultiSelect
        options={jobOptions}
        selected={selectedJobIds}
        onChange={onJobAssignmentChange}
        placeholder={jobsLoading ? "Stellen werden geladen..." : "Stellen auswählen"}
      />
      {jobsLoading && (
        <p className="text-xs text-muted-foreground">Aktive Stellen werden geladen ...</p>
      )}
      {!jobsLoading && jobBadgeData.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {jobBadgeData.map((job) => (
            <Badge key={job.id} variant="secondary" className="px-2 py-1 text-xs">
              {job.label}
            </Badge>
          ))}
        </div>
      )}
      {!jobsLoading && jobBadgeData.length === 0 && (
        <p className="text-xs text-muted-foreground">Noch keiner Stelle zugeordnet.</p>
      )}
      {updatingJobs && (
        <p className="text-xs text-muted-foreground">Speichere Zuordnung ...</p>
      )}
    </div>
  );
}
