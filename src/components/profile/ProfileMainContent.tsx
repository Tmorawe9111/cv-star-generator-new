import { LinkedInProfileHeader } from "@/components/linkedin/LinkedInProfileHeader";
import { LinkedInProfileMain } from "@/components/linkedin/LinkedInProfileMain";
import { WeitereDokumenteSection } from "@/components/linkedin/right-rail/WeitereDokumenteSection";
import { LinkedInProfileActivity } from "@/components/linkedin/LinkedInProfileActivity";
import { ProfileTimeline } from "./ProfileTimeline";

export interface ProfileMainContentProps {
  displayProfile: unknown;
  isUnlocked: boolean;
  userId: string;
  followStatus: "none" | "pending" | "accepted";
  berufserfahrung?: unknown[];
  schulbildung?: unknown[];
}

export function ProfileMainContent({
  displayProfile,
  isUnlocked,
  userId,
  followStatus,
  berufserfahrung = [],
  schulbildung = [],
}: ProfileMainContentProps) {
  return (
    <div className="lg:col-span-8 space-y-6">
      <LinkedInProfileHeader profile={displayProfile} isEditing={false} onProfileUpdate={() => {}} />
      <LinkedInProfileMain profile={displayProfile} isEditing={false} onProfileUpdate={() => {}} readOnly />
      {isUnlocked && (
        <WeitereDokumenteSection userId={userId} readOnly openWidget={() => {}} refreshTrigger={0} />
      )}
      <ProfileTimeline berufserfahrung={berufserfahrung} schulbildung={schulbildung} />
      {followStatus === "accepted" && <LinkedInProfileActivity profile={displayProfile} />}
    </div>
  );
}
