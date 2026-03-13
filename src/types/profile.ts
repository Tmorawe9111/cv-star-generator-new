import type { Database } from "@/integrations/supabase/types";

/** Profile row - matches profiles table */
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

/** Experience entry in berufserfahrung JSON */
export interface ProfileExperience {
  von?: string;
  bis?: string;
  position?: string;
  arbeitgeber?: string;
  beschreibung?: string;
  [key: string]: unknown;
}

/** Education entry in schulbildung JSON */
export interface ProfileEducation {
  von?: string;
  bis?: string;
  abschluss?: string;
  schule?: string;
  [key: string]: unknown;
}

/** Language entry in sprachen JSON */
export interface ProfileLanguage {
  sprache?: string;
  niveau?: string;
  [key: string]: unknown;
}

/** Note in candidate notes JSONB */
export interface ProfileNote {
  id: string;
  content: string;
  createdAt: string;
  authorId?: string | null;
  authorName?: string | null;
}

/** Schulbildung JSONB entry (education) */
export interface Schulbildung {
  von?: string;
  bis?: string;
  abschluss?: string;
  schule?: string;
  name?: string;
  [key: string]: unknown;
}

/** Berufserfahrung JSONB entry (experience) */
export interface Berufserfahrung {
  von?: string;
  bis?: string;
  position?: string;
  titel?: string;
  beruf?: string;
  arbeitgeber?: string;
  unternehmen?: string;
  company?: string;
  beschreibung?: string;
  [key: string]: unknown;
}

/** Profile stage / candidate status */
export type ProfileStage =
  | "FREIGESCHALTET"
  | "INTERVIEW_GEPLANT"
  | "INTERVIEW_DURCHGEFÜHRT"
  | "ABGESAGT"
  | "ANGEBOT_GESENDET"
  | "EINGESTELLT"
  | "ABGELEHNT"
  | "ON_HOLD";

/** Interest request status */
export type InterestRequestStatus = "none" | "pending" | "accepted" | "rejected";

/** Follow status */
export type FollowStatus = "none" | "pending" | "accepted";
