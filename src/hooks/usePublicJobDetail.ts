import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Job post with company for public job detail page.
 */
export interface PublicJobDetail {
  id: string;
  title: string;
  description_md?: string | null;
  tasks_md?: string | null;
  requirements_md?: string | null;
  benefits_description?: string | null;
  additional_qualifications?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postal_code?: string | null;
  employment_type?: string | null;
  work_mode?: string | null;
  start_date?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  industry?: string | null;
  skills?: unknown[];
  required_languages?: unknown[];
  required_documents?: unknown[];
  optional_documents?: unknown[];
  contact_person_name?: string | null;
  contact_person_role?: string | null;
  contact_person_email?: string | null;
  contact_person_phone?: string | null;
  contact_person_photo_url?: string | null;
  created_at: string;
  expires_at?: string | null;
  is_public?: boolean;
  status?: string;
  is_active?: boolean;
  company_id?: string;
  company?: {
    id: string;
    name: string;
    logo_url?: string | null;
    description?: string | null;
    industry?: string | null;
  } | null;
}

/**
 * Fetches a single job post by ID for the public job detail page.
 * Also fetches applications count for the same job.
 *
 * @param jobId - Job post UUID
 * @returns { job, applicationsCount, isLoading, error, refetch }
 */
export function usePublicJobDetail(jobId: string | undefined) {
  const jobQuery = useQuery({
    queryKey: ["public-job-detail", jobId],
    queryFn: async (): Promise<PublicJobDetail> => {
      const { data, error } = await supabase
        .from("job_posts")
        .select(
          `
          *,
          company:companies!job_posts_company_id_fkey(*)
        `
        )
        .eq("id", jobId!)
        .single();

      if (error) throw error;
      return data as PublicJobDetail;
    },
    enabled: !!jobId,
  });

  const countQuery = useQuery({
    queryKey: ["applications-count", jobId],
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from("applications")
        .select("*", { count: "exact", head: true })
        .eq("job_id", jobId!);

      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!jobId,
  });

  return {
    job: jobQuery.data,
    applicationsCount: countQuery.data ?? 0,
    isLoading: jobQuery.isLoading,
    error: jobQuery.error,
    refetch: () => {
      jobQuery.refetch();
      countQuery.refetch();
    },
  };
}
