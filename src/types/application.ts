import type { Database } from "@/integrations/supabase/types";

/** Application status from database enum */
export type ApplicationStatus =
  | "new"
  | "unlocked"
  | "interview"
  | "offer"
  | "hired"
  | "rejected"
  | "archived";

/** Application source from database enum */
export type ApplicationSource = "applied" | "sourced";

/** Application row - matches applications table */
export type ApplicationRow = Database["public"]["Tables"]["applications"]["Row"];

/** Application with optional joined data (e.g. from select) */
export interface ApplicationWithDetails extends ApplicationRow {
  id: string;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
  unlocked_at: string | null;
  reason_short: string | null;
  reason_custom: string | null;
}

/** Minimal application fields returned by useQuickApply myApplication query */
export interface MyApplicationPreview {
  id: string;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
  unlocked_at: string | null;
  reason_short: string | null;
  reason_custom: string | null;
}
