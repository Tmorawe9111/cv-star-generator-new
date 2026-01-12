import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

type JobPost = any; // Simplified to avoid deep type instantiation
type JobInsert = any;
type JobUpdate = any;
type JobStatus = "draft" | "published" | "paused" | "inactive";

export class JobsService {
  // Fetch jobs for a company
  static async getCompanyJobs(companyId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('job_posts')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Fetch a single job by ID
  static async getJobById(jobId: string): Promise<any> {
    const { data, error } = await supabase
      .from('job_posts')
      .select(`
        *,
        company:companies!job_posts_company_id_fkey(*)
      `)
      .eq('id', jobId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  // Fetch public jobs (for candidates)
  // If user is logged in, uses branch filtering. If not, shows all jobs.
  static async getPublicJobs(filters?: {
    employment_type?: string;
    profession_id?: string;
    location?: string;
    work_mode?: string;
    userId?: string; // Optional: if provided, will filter by branch
    skipBranchFilter?: boolean; // Optional: if true, shows all jobs (for search)
  }): Promise<any[]> {
    // If user is logged in and branch filtering is not skipped, use branch-filtered function
    if (filters?.userId && !filters?.skipBranchFilter) {
      try {
        const { data, error } = await supabase
          .rpc('get_jobs_by_branch', {
            p_viewer_id: filters.userId,
            p_limit: 100, // Get more jobs, client-side filtering will handle the rest
            p_offset: 0
          });

        if (error) {
          console.error('[JobsService] get_jobs_by_branch error:', error);
          // Don't fall back to showing all jobs - return empty array instead
          return [];
        } else if (data && data.length > 0) {
          // Transform the data to match expected format
          const transformedJobs = await Promise.all(
            (data || []).map(async (job: any) => {
              // Fetch company info if not included
              let company = null;
              if (job.company_id) {
                const { data: companyData } = await supabase
                  .from('companies')
                  .select('id, name, logo_url')
                  .eq('id', job.company_id)
                  .single();
                company = companyData;
              }

              return {
                ...job,
                company: company || { id: job.company_id, name: job.company_name, logo_url: null }
              };
            })
          );

          // Apply additional filters client-side
          let filtered = transformedJobs;
          
          if (filters?.employment_type) {
            filtered = filtered.filter(j => j.employment_type === filters.employment_type);
          }
          
          if (filters?.work_mode) {
            filtered = filtered.filter(j => j.work_mode === filters.work_mode);
          }
          
          if (filters?.location) {
            const searchLower = filters.location.toLowerCase();
            filtered = filtered.filter(j => 
              j.city?.toLowerCase().includes(searchLower) ||
              j.state?.toLowerCase().includes(searchLower) ||
              j.country?.toLowerCase().includes(searchLower)
            );
          }

          return filtered;
        }
      } catch (error) {
        console.error('[JobsService] Error in get_jobs_by_branch:', error);
        // Don't fall back to showing all jobs - return empty array instead
        return [];
      }
    }

    // Only show all jobs if:
    // 1. User is not logged in (no userId provided), OR
    // 2. Branch filter is explicitly skipped (skipBranchFilter = true)
    // For logged-in users with branch, always filter by branch
    if (filters?.userId && !filters?.skipBranchFilter) {
      // User is logged in but branch filter failed - return empty array instead of all jobs
      console.warn('[JobsService] User logged in but branch filter not applied - returning empty array');
      return [];
    }

    // Build base query (for non-logged-in users or when branch filter is explicitly skipped)
    const baseQuery = supabase
      .from('job_posts')
      .select(`
        *,
        company:companies!job_posts_company_id_fkey(id, name, logo_url)
      `)
      .eq('status', 'published')
      .eq('is_active', true)
      .eq('is_public', true);

    // Apply filters if provided
    let query = baseQuery;
    
    if (filters?.employment_type) {
      query = query.eq('employment_type', filters.employment_type);
    }
    
    if (filters?.work_mode) {
      query = query.eq('work_mode', filters.work_mode);
    }
    
    if (filters?.location) {
      // Search across city, state, country
      const searchPattern = `%${filters.location}%`;
      query = query.or(`city.ilike.${searchPattern},state.ilike.${searchPattern},country.ilike.${searchPattern}`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  // Create a new job (draft)
  static async createJob(companyId: string, jobData: any): Promise<any> {
    // Transform skills array to must_have/nice_to_have arrays
    const mustHave = jobData.skills?.filter((s: any) => s.level === 'must_have').map((s: any) => s.name) || [];
    const niceToHave = jobData.skills?.filter((s: any) => s.level === 'nice_to_have').map((s: any) => s.name) || [];
    
    // Transform document requirements to JSONB format expected by database
    const requiredDocs = jobData.required_documents?.map((doc: any) => ({
      type: doc.type,
      label: doc.label
    })) || [];
    
    const optionalDocs = jobData.optional_documents?.map((doc: any) => ({
      type: doc.type,
      label: doc.label
    })) || [];

    // Map employment_type values to database-compatible values
    // Handles both English and German values
    const mapEmploymentType = (type: string | undefined): string => {
      if (!type) return 'full-time';
      const normalizedType = type.toLowerCase().trim();
      const mapping: Record<string, string> = {
        // English variations
        'fulltime': 'full-time',
        'parttime': 'part-time',
        'temporary': 'contract',
        'temp': 'contract',
        'freelance': 'contract',
        'freelancer': 'contract',
        'apprenticeship': 'apprenticeship',
        'internship': 'internship',
        'full-time': 'full-time',
        'part-time': 'part-time',
        'contract': 'contract',
        // German values
        'vollzeit': 'full-time',
        'teilzeit': 'part-time',
        'ausbildung': 'apprenticeship',
        'praktikum': 'internship',
        'zeitarbeit': 'contract',
        'befristet': 'contract',
      };
      return mapping[normalizedType] || 'full-time'; // Default fallback
    };

    const insertData: any = {
      company_id: companyId,
      status: 'published',
      title: jobData.title || 'Neue Stelle',
      industry: jobData.industry || '',
      city: jobData.city || '',
      employment_type: mapEmploymentType(jobData.employment_type),
      start_date: jobData.start_date || null,
      description_md: jobData.description_md || '',
      tasks_md: jobData.tasks_md || '',
      requirements_md: jobData.requirements_md || '',
      benefits_description: jobData.benefits_description || '',
      salary_min: jobData.salary_min || null,
      salary_max: jobData.salary_max || null,
      work_mode: jobData.work_mode || null,
      working_hours: jobData.working_hours || null,
      is_public: jobData.is_public ?? true,
      is_active: jobData.is_active ?? true,
      must_have: mustHave,
      nice_to_have: niceToHave,
      languages: jobData.required_languages || [],
      required_certificates: jobData.certifications || [],
      required_documents: requiredDocs,
      optional_documents: optionalDocs,
      contact_person_name: jobData.contact_person_name || '',
      contact_person_email: jobData.contact_person_email || '',
      contact_person_phone: jobData.contact_person_phone || null,
      contact_person_role: jobData.contact_person_role || null,
      contact_person_photo_url: jobData.contact_person_photo_url || null,
    };

    const { data, error } = await supabase
      .from('job_posts')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update a job
  static async updateJob(jobId: string, updates: any): Promise<any> {
    const { data, error } = await supabase
      .from('job_posts')
      .update(updates)
      .eq('id', jobId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Delete a job
  static async deleteJob(jobId: string): Promise<void> {
    const { error } = await supabase
      .from('job_posts')
      .delete()
      .eq('id', jobId);

    if (error) throw error;
  }

  // Publish a job (uses RPC to deduct token)
  static async publishJob(jobId: string, userId: string): Promise<any> {
    const { data, error } = await supabase.rpc('publish_job', {
      job_uuid: jobId,
      actor: userId,
    });

    if (error) throw error;
    return data;
  }

  // Pause a job
  static async pauseJob(jobId: string, userId: string): Promise<any> {
    const { data, error } = await supabase.rpc('pause_job', {
      job_uuid: jobId,
      actor: userId,
    });

    if (error) throw error;
    return data;
  }

  // Resume a job
  static async resumeJob(jobId: string, userId: string): Promise<any> {
    const { data, error } = await supabase.rpc('resume_job', {
      job_uuid: jobId,
      actor: userId,
    });

    if (error) throw error;
    return data;
  }

  // Inactivate a job
  static async inactivateJob(jobId: string, userId: string): Promise<any> {
    const { data, error } = await supabase.rpc('inactivate_job', {
      job_uuid: jobId,
      actor: userId,
    });

    if (error) throw error;
    return data;
  }

  // Get job status history
  static async getJobHistory(jobId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('job_status_history')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Check missing documents for a user/job
  static async getMissingDocuments(userId: string, jobId: string): Promise<any> {
    const { data, error } = await supabase.rpc('missing_required_documents', {
      p_user: userId,
      p_job: jobId,
    });

    if (error) throw error;
    return data;
  }

  // Compute match score
  static async computeMatch(userId: string, jobId: string): Promise<any> {
    const { data, error } = await supabase.rpc('compute_match', {
      p_user: userId,
      p_job: jobId,
    });

    if (error) throw error;
    return data;
  }
}

// Export types for backward compatibility
export type JobPosting = JobPost;

// Exported functions for backward compatibility
export const getJobs = JobsService.getCompanyJobs;
export const getJobById = JobsService.getJobById;
export const getPublicJobs = JobsService.getPublicJobs;
export const getCompanyJobs = JobsService.getCompanyJobs;
export const createJob = JobsService.createJob;
export const updateJob = JobsService.updateJob;
export const deleteJob = JobsService.deleteJob;


