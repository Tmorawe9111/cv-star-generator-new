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
