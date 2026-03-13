/** Dashboard tab keys */
export type DashboardTab = "new" | "unlocked" | "planned";

/** Company user role for dashboard access */
export type CompanyRole = "owner" | "admin" | "recruiter" | "viewer" | "marketing";

/** Metrics from get_company_dashboard_metrics RPC */
export interface DashboardMetrics {
  active_jobs?: number;
  applications_total?: number;
  interviews_planned?: number;
  hires_total?: number;
  unlocked_profiles?: number;
  seats_used?: number;
  seats_total?: number;
}

/** Pipeline stage counts */
export interface PipelineCounts {
  new_apps: number;
  unlocked_and_plan: number;
  interviews_planned: number;
}

/** List state for candidate lists */
export interface ListState<T> {
  items: T[];
  loading: boolean;
  hasMore: boolean;
}

/** Job state for highlights */
export interface JobState {
  items: JobHighlightItem[];
  loading: boolean;
}

/** Job highlight item for sidebar */
export interface JobHighlightItem {
  job_id: string;
  title: string;
  location?: string | null;
  created_at?: string | null;
  applicants_count?: number | null;
}

/** Community post for spotlight */
export interface CommunityPost {
  id: string;
  title: string;
  topic: string | null;
}

/** Success modal state */
export interface SuccessModalState {
  open: boolean;
  type: "tokens" | "plan";
  tokenAmount?: number;
  planKey?: string;
}
