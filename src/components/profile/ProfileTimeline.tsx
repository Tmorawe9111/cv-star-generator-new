import { LinkedInProfileExperience } from "@/components/linkedin/LinkedInProfileExperience";
import { LinkedInProfileEducation } from "@/components/linkedin/LinkedInProfileEducation";
import type { Berufserfahrung, Schulbildung } from "@/types/profile";

export interface ProfileTimelineProps {
  berufserfahrung: Berufserfahrung[] | unknown[];
  schulbildung: Schulbildung[] | unknown[];
}

export function ProfileTimeline({ berufserfahrung, schulbildung }: ProfileTimelineProps) {
  return (
    <>
      <LinkedInProfileExperience
        experiences={berufserfahrung}
        isEditing={false}
        onExperiencesUpdate={() => {}}
      />
      <LinkedInProfileEducation
        education={schulbildung}
        isEditing={false}
        onEducationUpdate={() => {}}
      />
    </>
  );
}
