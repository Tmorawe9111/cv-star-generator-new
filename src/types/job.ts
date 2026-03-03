import type { Database } from "@/integrations/supabase/types";

/** Job post row - matches job_posts table */
export type JobPostRow = Database["public"]["Tables"]["job_posts"]["Row"];

/** Job status from database enum */
export type JobStatus = "draft" | "published" | "paused" | "inactive";

/** Skill item for job form */
export interface JobSkillInput {
  name: string;
  level: "must_have" | "nice_to_have";
}

/** Document requirement for job form */
export interface JobDocumentInput {
  type: string;
  label: string;
}

/** Job create/update input */
export interface JobCreateInput {
  title?: string;
  industry?: string;
  city?: string;
  employment_type?: string;
  start_date?: string | null;
  description_md?: string;
  tasks_md?: string;
  requirements_md?: string;
  benefits_description?: string;
  salary_min?: number | null;
  salary_max?: number | null;
  work_mode?: string | null;
  working_hours?: string | null;
  is_public?: boolean;
  is_active?: boolean;
  skills?: JobSkillInput[];
  required_documents?: JobDocumentInput[];
  optional_documents?: JobDocumentInput[];
  required_languages?: unknown[];
  certifications?: unknown[];
  contact_person_name?: string;
  contact_person_email?: string;
  contact_person_phone?: string | null;
  contact_person_role?: string | null;
  contact_person_photo_url?: string | null;
}
