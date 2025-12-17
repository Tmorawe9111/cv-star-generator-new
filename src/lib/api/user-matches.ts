import { supabase } from "@/integrations/supabase/client";

// ============================================
// Types
// ============================================

export interface JobMatch {
  job_id: string;
  job_title: string;
  company_id: string;
  company_name: string;
  company_slug?: string;
  city?: string;
  postal_code?: string;
  match_score: number;
  match_breakdown?: any;
  description_preview?: string;
  employment_type?: string;
  created_at: string;
}

export interface CompanyMatch {
  company_id: string;
  company_name: string;
  company_slug?: string;
  industry?: string;
  location?: string;
  postal_code?: string;
  match_score: number;
  match_breakdown?: any;
  description?: string;
  logo_url?: string;
  created_at: string;
}

// ============================================
// API Functions
// ============================================

/**
 * Get job matches for a candidate
 * This queries job_posts and calculates match scores based on candidate profile
 */
export async function getJobMatchesForCandidate(
  candidateId: string,
  options?: {
    minScore?: number;
    limit?: number;
    offset?: number;
  }
): Promise<JobMatch[]> {
  try {
    const minScore = options?.minScore || 60;
    const limit = options?.limit || 20;
    const offset = options?.offset || 0;

    // Get candidate profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, branche, ort, plz, status, faehigkeiten, experience_years")
      .eq("id", candidateId)
      .single();

    if (profileError || !profile) {
      console.error("Error fetching candidate profile:", profileError);
      return [];
    }

    // Get active job posts
    const { data: jobs, error: jobsError } = await supabase
      .from("job_posts")
      .select(`
        id,
        title,
        company_id,
        city,
        postal_code,
        description_md,
        employment_type,
        created_at,
        companies:company_id (
          id,
          name,
          slug
        )
      `)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (jobsError) {
      console.error("Error fetching jobs:", jobsError);
      return [];
    }

    // Calculate match scores for each job
    const matches: JobMatch[] = [];

    for (const job of jobs || []) {
      let score = 0;
      const breakdown: any = {};

      // Industry/Branche match (40 points)
      if (profile.branche && job.companies) {
        // Simple match: if candidate branche matches job company industry
        // This is a simplified version - in production, you'd use a more sophisticated matching algorithm
        score += 30; // Base score
        breakdown.industry_match = 30;
      }

      // Location match (30 points)
      if (profile.ort && job.city) {
        if (profile.ort.toLowerCase() === job.city.toLowerCase()) {
          score += 30;
          breakdown.location_match = 30;
        } else if (profile.plz && job.postal_code) {
          // Same postal code area (first 2 digits)
          if (profile.plz.substring(0, 2) === job.postal_code.substring(0, 2)) {
            score += 20;
            breakdown.location_match = 20;
          } else {
            score += 10;
            breakdown.location_match = 10;
          }
        } else {
          score += 10;
          breakdown.location_match = 10;
        }
      }

      // Status match (20 points)
      if (profile.status) {
        // Match candidate status with job requirements
        // Simplified: if candidate is "azubi" and job is for "azubi", add points
        score += 20;
        breakdown.status_match = 20;
      }

      // Skills match (10 points) - simplified
      if (profile.faehigkeiten && Array.isArray(profile.faehigkeiten) && profile.faehigkeiten.length > 0) {
        score += 10;
        breakdown.skills_match = 10;
      }

      // Cap score at 100
      score = Math.min(100, score);

      // Only include if score meets minimum
      if (score >= minScore) {
        const company = Array.isArray(job.companies) ? job.companies[0] : job.companies;
        
        matches.push({
          job_id: job.id,
          job_title: job.title,
          company_id: job.company_id,
          company_name: company?.name || "Unbekanntes Unternehmen",
          company_slug: company?.slug,
          city: job.city,
          postal_code: job.postal_code,
          match_score: score,
          match_breakdown: breakdown,
          description_preview: job.description_md
            ? job.description_md.substring(0, 150).replace(/[#*]/g, "") + "..."
            : undefined,
          employment_type: job.employment_type,
          created_at: job.created_at,
        });
      }
    }

    // Sort by match score descending
    matches.sort((a, b) => b.match_score - a.match_score);

    return matches;
  } catch (error: any) {
    console.error("Error getting job matches:", error);
    return [];
  }
}

/**
 * Get company matches for a candidate
 * Uses the candidate_company_matches table
 */
export async function getCompanyMatchesForCandidate(
  candidateId: string,
  options?: {
    minScore?: number;
    limit?: number;
    offset?: number;
  }
): Promise<CompanyMatch[]> {
  try {
    const minScore = options?.minScore || 60;
    const limit = options?.limit || 20;
    const offset = options?.offset || 0;

    // Query candidate_company_matches table
    // @ts-expect-error - Table might not be in generated types yet
    const { data: matches, error: matchesError } = await supabase
      .from("candidate_company_matches")
      .select(`
        company_id,
        overall_score,
        score_breakdown,
        last_calculated_at,
        companies:company_id (
          id,
          name,
          slug,
          industry,
          location,
          postal_code,
          description,
          logo_url
        )
      `)
      .eq("candidate_id", candidateId)
      .eq("is_eligible", true)
      .gte("overall_score", minScore)
      .order("overall_score", { ascending: false })
      .range(offset, offset + limit - 1);

    if (matchesError) {
      console.error("Error fetching company matches:", matchesError);
      return [];
    }

    // Transform to CompanyMatch format
    const companyMatches: CompanyMatch[] = (matches || []).map((match: any) => {
      const company = Array.isArray(match.companies) ? match.companies[0] : match.companies;
      
      return {
        company_id: match.company_id,
        company_name: company?.name || "Unbekanntes Unternehmen",
        company_slug: company?.slug,
        industry: company?.industry,
        location: company?.location,
        postal_code: company?.postal_code,
        match_score: match.overall_score,
        match_breakdown: match.score_breakdown,
        description: company?.description,
        logo_url: company?.logo_url,
        created_at: match.last_calculated_at,
      };
    });

    return companyMatches;
  } catch (error: any) {
    console.error("Error getting company matches:", error);
    return [];
  }
}

