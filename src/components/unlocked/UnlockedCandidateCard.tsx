import { Checkbox } from "@/components/ui/checkbox";
import { ProfileCard } from "@/components/profile/ProfileCard";
import type { UnlockedCandidate } from "@/types/unlocked";
import type { ProcessStageAction } from "@/types/unlocked";

export interface UnlockedCandidateCardProps {
  profile: UnlockedCandidate;
  isSelected: boolean;
  onToggleSelect: () => void;
  processActions: ProcessStageAction[];
  onView: () => void;
  onDownload: () => void;
  onToggleFavorite?: () => void;
}

export function UnlockedCandidateCard({
  profile,
  isSelected,
  onToggleSelect,
  processActions,
  onView,
  onDownload,
  onToggleFavorite,
}: UnlockedCandidateCardProps) {
  const name = `${profile.vorname} ${profile.nachname}`.trim();
  const seeking = profile.job_search_preferences
    ? Array.isArray(profile.job_search_preferences)
      ? profile.job_search_preferences.join(", ")
      : profile.job_search_preferences
    : null;
  const skills = profile.faehigkeiten ? (Array.isArray(profile.faehigkeiten) ? profile.faehigkeiten : []) : [];

  return (
    <div className="relative">
      <Checkbox
        checked={isSelected}
        onCheckedChange={onToggleSelect}
        className="absolute left-3 top-3 z-10 bg-white shadow-sm"
        aria-label={`${profile.vorname} ${profile.nachname} auswählen`}
      />
      <ProfileCard
        profile={{
          id: profile.id,
          name,
          avatar_url: profile.avatar_url || null,
          role: profile.headline || undefined,
          industry: profile.branche || undefined,
          occupation: profile.headline || undefined,
          city: profile.ort,
          seeking,
          status: profile.status,
          email: profile.email || null,
          phone: profile.telefon || null,
          skills,
          match: typeof profile.match_score === "number" ? Math.round(profile.match_score) : null,
          stage: profile.stage,
          educationForm: (profile as Record<string, unknown>).schulform as string | undefined,
          available_from: profile.available_from || undefined,
          visibility_mode: (profile as Record<string, unknown>).visibility_mode as string | undefined,
        }}
        variant="unlocked"
        unlockReason={
          profile.unlock_source === "bewerbung"
            ? `Bewerbung ${profile.linkedJobTitles?.[0]?.title ? `auf ${profile.linkedJobTitles[0].title}` : ""}`
            : undefined
        }
        unlockNotes={profile.unlock_notes}
        unlockSource={profile.unlock_source ?? null}
        unlockJobTitle={profile.linkedJobTitles?.[0]?.title ?? null}
        actions={processActions}
        onView={onView}
        onDownload={onDownload}
        onToggleFavorite={onToggleFavorite}
      />
    </div>
  );
}
