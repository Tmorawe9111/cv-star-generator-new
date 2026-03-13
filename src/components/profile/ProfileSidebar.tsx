import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, X } from "lucide-react";
import { ContactInfoCard } from "@/components/linkedin/right-rail/ContactInfoCard";
import { LinkedInProfileSidebar } from "@/components/linkedin/LinkedInProfileSidebar";
import { AdCard } from "@/components/linkedin/right-rail/AdCard";

export interface ProfileSidebarProps {
  loadingEmploymentRequest: boolean;
  employmentRequest: { status: string; created_at: string } | null;
  employmentRequestUpdating: boolean;
  getEmploymentRequestBadge: (status: string) => React.ReactNode;
  onEmploymentRequestAccept: () => void;
  onEmploymentRequestDecline: () => void;
  isUnlocked: boolean;
  profile: { email?: string | null; telefon?: string | null; ort?: string | null; website?: string | null } | null;
  displayProfile: unknown;
  profileId: string;
}

export function ProfileSidebar({
  loadingEmploymentRequest,
  employmentRequest,
  employmentRequestUpdating,
  getEmploymentRequestBadge,
  onEmploymentRequestAccept,
  onEmploymentRequestDecline,
  isUnlocked,
  profile,
  displayProfile,
  profileId,
}: ProfileSidebarProps) {
  return (
    <div className="lg:sticky lg:top-20 space-y-4">
      {(loadingEmploymentRequest || employmentRequest) && (
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Beschäftigungsanfrage
            </p>
            {employmentRequest && getEmploymentRequestBadge(employmentRequest.status)}
          </div>
          {loadingEmploymentRequest ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Anfrage wird geladen ...
            </div>
          ) : employmentRequest ? (
            <>
              <p className="text-sm text-muted-foreground">
                Eingegangen am{" "}
                {employmentRequest.created_at
                  ? new Date(employmentRequest.created_at).toLocaleDateString("de-DE", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })
                  : ""}
              </p>
              {employmentRequest.status === "pending" ? (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={onEmploymentRequestAccept}
                    disabled={employmentRequestUpdating}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Annehmen
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onEmploymentRequestDecline}
                    disabled={employmentRequestUpdating}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Ablehnen
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Diese Anfrage wurde{" "}
                  {employmentRequest.status === "accepted"
                    ? "bereits angenommen."
                    : "bereits abgelehnt."}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Keine offene Anfrage.</p>
          )}
        </div>
      )}
      {isUnlocked && (
        <ContactInfoCard
          email={profile?.email || profile?.telefon}
          phone={profile?.telefon}
          location={profile?.ort}
          website={profile?.website}
        />
      )}
      <LinkedInProfileSidebar
        profile={displayProfile}
        isEditing={false}
        onProfileUpdate={() => {}}
        onEditingChange={() => {}}
        readOnly
        showCVSection={isUnlocked}
        showLanguagesAndSkills
        showLicenseAndStats
        showValuesAndInterview={isUnlocked}
        profileId={profileId}
      />
      <AdCard />
    </div>
  );
}
