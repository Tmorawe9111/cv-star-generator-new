/** Single unlocked candidate (profile + company_candidate metadata) */
export interface UnlockedCandidate {
  id: string;
  vorname: string;
  nachname: string;
  status: string;
  branche: string;
  ort: string;
  plz: string;
  avatar_url?: string;
  headline?: string;
  faehigkeiten?: string[];
  email?: string;
  telefon?: string;
  cv_url?: string;
  job_search_preferences?: string[];
  has_drivers_license?: boolean;
  stage?: string;
  company_candidate_id?: string;
  unlocked_at?: string;
  unlock_source?: "bewerbung" | "initiativ";
  unlock_notes?: string;
  linkedJobTitles?: Array<{ id: string; title: string }>;
  match_score?: number | null;
  geplanter_abschluss?: string | null;
  schulbildung?: unknown;
  available_from?: string | null;
  interview_date?: string | null;
}

/** Filter state for unlocked candidates */
export interface UnlockedFilters {
  selectedStageFilters: string[];
  showArchived: boolean;
  jobTitleFilter: string;
  industryFilter: string;
  locationFilter: string;
  abschlussFilter: string[];
  searchKindFilters: string[];
  unlockedOnly: boolean;
  selectedJobId: string | null;
}

export type ViewMode = "grid" | "list";

export type ExportFormat = "csv" | "xlsx";

export type ProcessStageValue =
  | "FREIGESCHALTET"
  | "INTERVIEW_GEPLANT"
  | "INTERVIEW_DURCHGEFÜHRT"
  | "ANGEBOT_GESENDET"
  | "EINGESTELLT"
  | "ABGESAGT"
  | "ABGELEHNT"
  | "ON_HOLD";

export interface ProcessStageAction {
  key: string;
  label: string;
  onClick: () => void;
  variant: "primary" | "outline" | "destructive";
  disabled?: boolean;
}
