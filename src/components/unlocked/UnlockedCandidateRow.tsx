import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { UnlockedCandidate } from "@/types/unlocked";
import { STAGE_FILTERS } from "@/hooks/useUnlockedFilters";

export interface UnlockedCandidateRowProps {
  profile: UnlockedCandidate;
  isSelected: boolean;
  selectedJobId: string | null;
  availableJobs: Array<{ id: string; title: string; is_active: boolean }>;
  onToggleSelect: () => void;
  onView: () => void;
  onDownload: () => void;
  onJobFilterClick: (jobId: string) => void;
}

function formatAvailableFrom(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    const [year, month] = dateStr.split("-");
    const monthNames = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
    return `${monthNames[parseInt(month, 10) - 1]} ${year}`;
  } catch {
    return dateStr;
  }
}

function formatInterviewDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export function UnlockedCandidateRow({
  profile,
  isSelected,
  selectedJobId,
  availableJobs,
  onToggleSelect,
  onView,
  onDownload,
  onJobFilterClick,
}: UnlockedCandidateRowProps) {
  const statusLabel = profile.stage || profile.status || "FREIGESCHALTET";
  const statusDisplay = STAGE_FILTERS.find((s) => s.key === statusLabel.toUpperCase())?.label || statusLabel;
  const jobSearchPrefs = Array.isArray(profile.job_search_preferences)
    ? profile.job_search_preferences.join(", ")
    : profile.job_search_preferences || "—";

  return (
    <TableRow>
      <TableCell>
        <Checkbox checked={isSelected} onCheckedChange={onToggleSelect} aria-label={`${profile.vorname} ${profile.nachname} auswählen`} />
      </TableCell>
      <TableCell className="font-medium">{profile.vorname} {profile.nachname}</TableCell>
      <TableCell>
        <div className="text-sm">
          {profile.ort || "—"}
          {profile.plz && <span className="text-muted-foreground"> ({profile.plz})</span>}
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm">
          <div className="font-medium">{profile.branche || "—"}</div>
          <div className="text-xs text-muted-foreground">{profile.headline || profile.status || ""}</div>
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm max-w-[120px] truncate" title={jobSearchPrefs}>{jobSearchPrefs}</div>
      </TableCell>
      <TableCell className="text-sm">{formatAvailableFrom(profile.available_from)}</TableCell>
      <TableCell>
        {profile.has_drivers_license ? (
          <Badge variant="default" className="bg-green-600">Ja</Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell>
        <div className="text-xs space-y-0.5">
          {profile.email && <div className="truncate max-w-[100px]" title={profile.email}>{profile.email}</div>}
          {profile.telefon && <div>{profile.telefon}</div>}
          {!profile.email && !profile.telefon && <span className="text-muted-foreground">—</span>}
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm">
          <div className="font-medium">{statusDisplay}</div>
          {profile.interview_date && (
            <div className="text-xs text-muted-foreground">{formatInterviewDate(profile.interview_date)}</div>
          )}
        </div>
      </TableCell>
      <TableCell>
        {profile.linkedJobTitles && profile.linkedJobTitles.length > 0 ? (
          <div className="space-y-1.5">
            {profile.linkedJobTitles.map((job) => {
              const isSelectedJob = selectedJobId === job.id;
              const jobData = availableJobs.find((j) => j.id === job.id);
              return (
                <div key={job.id} className="flex items-center gap-1.5 flex-wrap">
                  <Badge
                    variant={isSelectedJob ? "default" : "outline"}
                    className={cn(
                      "text-xs cursor-pointer hover:bg-primary/10",
                      isSelectedJob ? "bg-blue-600 text-white border-blue-600" : "bg-blue-50 text-blue-700 border-blue-200"
                    )}
                    onClick={() => onJobFilterClick(job.id)}
                    title="Klicken zum Filtern nach dieser Stelle"
                  >
                    {job.title}
                  </Badge>
                  {jobData && (
                    <Badge variant={jobData.is_active ? "default" : "secondary"} className="text-[10px]">
                      {jobData.is_active ? "Aktiv" : "Inaktiv"}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">Keine Stelle verknüpft</span>
        )}
      </TableCell>
      <TableCell>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5">
          <Button size="sm" variant="outline" onClick={onView} className="text-xs px-2 w-full sm:w-auto">Profil</Button>
          <Button size="sm" variant="outline" onClick={onDownload} className="text-xs px-2 w-full sm:w-auto">CV</Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
