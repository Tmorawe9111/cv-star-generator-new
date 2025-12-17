import { supabase } from "@/integrations/supabase/client";

export interface CandidateCompanyMatch {
  id: string;
  company_id: string;
  candidate_id: string;
  is_eligible: boolean;
  ineligible_reasons?: string[];
  base_score: number | null;
  values_score: number | null;
  role_score: number | null;
  interview_score: number | null;
  overall_score: number;
  score_breakdown?: {
    base?: {
      score: number;
      components?: {
        industry_score?: number;
        level_score?: number;
      };
    };
    values?: {
      score: number | null;
      status: string;
    };
    role?: {
      score: number | null;
      status: string;
    };
    interview?: {
      score: number | null;
      status: string;
    };
    overall?: {
      score: number;
      calculation_method: string;
      weights: {
        base: number;
        values: number;
        role: number;
        interview: number;
      };
    };
    calculated_at?: string;
  };
  last_calculated_at: string;
  created_at: string;
  updated_at: string;
  // New fields from views (v_company_locked_matches / v_company_unlocked_matches)
  token_cost?: number;
  is_application?: boolean;
}

export interface CalculateMatchResult {
  success: boolean;
  is_eligible?: boolean;
  base_score?: number;
  overall_score?: number;
  score_breakdown?: any;
  ineligible_reasons?: string[];
  message?: string;
  error?: string;
}

/**
 * Calculate match for a company and candidate
 */
export async function calculateCandidateCompanyMatch(
  companyId: string,
  candidateId: string
): Promise<CalculateMatchResult> {
  try {
    // @ts-expect-error - RPC function not yet in generated types
    const { data, error } = await (supabase.rpc as any)('calculate_candidate_company_match', {
      p_company_id: companyId,
      p_candidate_id: candidateId,
    });

    if (error) throw error;

    return data as CalculateMatchResult;
  } catch (error: any) {
    console.error('Error calculating match:', error);
    return {
      success: false,
      error: error.message || 'Failed to calculate match',
    };
  }
}

/**
 * Get match for a company and candidate
 */
export async function getCandidateCompanyMatch(
  companyId: string,
  candidateId: string
): Promise<CandidateCompanyMatch | null> {
  try {
    // @ts-expect-error - Table not yet in generated types
    const { data, error } = await supabase
      .from('candidate_company_matches' as any)
      .select('*')
      .eq('company_id', companyId)
      .eq('candidate_id', candidateId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No match found
        return null;
      }
      throw error;
    }

    return data as CandidateCompanyMatch;
  } catch (error: any) {
    console.error('Error getting match:', error);
    throw error;
  }
}

/**
 * Get all matches for a company
 */
export async function getCompanyMatches(
  companyId: string,
  options?: {
    eligibleOnly?: boolean;
    minScore?: number;
    limit?: number;
    offset?: number;
  }
): Promise<CandidateCompanyMatch[]> {
  try {
    // @ts-expect-error - Table not yet in generated types
    let query = supabase
      .from('candidate_company_matches' as any)
      .select('*')
      .eq('company_id', companyId)
      .order('overall_score', { ascending: false })
      .order('last_calculated_at', { ascending: false });

    if (options?.eligibleOnly) {
      query = query.eq('is_eligible', true);
    }

    if (options?.minScore !== undefined) {
      query = query.gte('overall_score', options.minScore);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []) as CandidateCompanyMatch[];
  } catch (error: any) {
    console.error('Error getting company matches:', error);
    throw error;
  }
}

/**
 * Get matches with profile data
 * Supports reading from views (v_company_locked_matches / v_company_unlocked_matches) 
 * or base table (candidate_company_matches) based on visibility option
 */
export async function getCompanyMatchesWithProfiles(
  companyId: string,
  options?: {
    eligibleOnly?: boolean;
    minScore?: number;
    limit?: number;
    offset?: number;
    visibility?: "locked" | "unlocked" | "all";
  }
) {
  try {
    // Determine which table/view to query based on visibility option
    const visibility = options?.visibility || "all";
    let tableName: string;
    
    if (visibility === "locked") {
      // Read from v_company_locked_matches view (includes token_cost, is_application, profile data)
      tableName = "v_company_locked_matches";
    } else if (visibility === "unlocked") {
      // Read from v_company_unlocked_matches view (includes token_cost, is_application, profile data)
      tableName = "v_company_unlocked_matches";
    } else {
      // Default: Read from candidate_company_matches with join to profiles
      tableName = "candidate_company_matches";
    }

    // Build query - views already include profile data, so we don't need join for them
    let query: any;
    if (visibility === "locked" || visibility === "unlocked") {
      // Views already include all profile fields and token_cost/is_application
      // Using v_company_locked_matches or v_company_unlocked_matches
      // @ts-expect-error - Views not yet in generated types (v_company_locked_matches, v_company_unlocked_matches)
      query = supabase
        .from(tableName as any)
        .select('*')
        .eq('company_id', companyId)
        .order('overall_score', { ascending: false })
        .order('last_calculated_at', { ascending: false });
    } else {
      // Base table: need join to profiles
      // Using candidate_company_matches table
      // @ts-expect-error - Table not yet in generated types (candidate_company_matches)
      query = supabase
        .from(tableName as any)
        .select(`
          *,
          profiles:candidate_id (
            id,
            vorname,
            nachname,
            email,
            telefon,
            avatar_url,
            ort,
            plz,
            branche,
            status,
            headline,
            faehigkeiten,
            cv_url,
            profile_published
          )
        `)
        .eq('company_id', companyId)
        .order('overall_score', { ascending: false })
        .order('last_calculated_at', { ascending: false });
    }

    // Apply filters (views already filter eligibleOnly and minScore, but we can add additional filters)
    if (options?.eligibleOnly && visibility === "all") {
      // Views already filter by is_eligible = true, so only apply for "all"
      query = query.eq('is_eligible', true);
    }

    if (options?.minScore !== undefined && visibility === "all") {
      // Views already filter by overall_score >= 60 (locked) or no filter (unlocked), so only apply for "all"
      query = query.gte('overall_score', options.minScore);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data;
  } catch (error: any) {
    console.error('Error getting company matches with profiles:', error);
    throw error;
  }
}

/**
 * Get top match count for a company (locked matches with score >= 80)
 * Uses RPC function get_company_top_match_count
 */
export async function getTopMatchCountForCompany(
  companyId: string
): Promise<number> {
  try {
    // @ts-expect-error - RPC function not yet in generated types
    const { data, error } = await (supabase.rpc as any)('get_company_top_match_count', {
      p_company_id: companyId,
    });

    if (error) {
      console.error('Error getting top match count:', error);
      return 0;
    }

    return typeof data === 'number' ? data : 0;
  } catch (error: any) {
    console.error('Error getting top match count:', error);
    return 0;
  }
}

/**
 * Recalculate all matches for a company (batch operation)
 * Note: This should be used carefully as it can be resource-intensive
 */
export async function recalculateAllCompanyMatches(
  companyId: string,
  candidateIds?: string[]
): Promise<{ success: number; failed: number; errors: string[] }> {
  try {
    // Get candidate IDs to recalculate
    let candidateIdsToProcess: string[] = [];

    if (candidateIds && candidateIds.length > 0) {
      candidateIdsToProcess = candidateIds;
    } else {
      // Get all published profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id')
        .eq('profile_published', true);

      if (profilesError) throw profilesError;
      candidateIdsToProcess = (profiles || []).map(p => p.id);
    }

    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    // Process in batches to avoid overwhelming the database
    const BATCH_SIZE = 10;
    for (let i = 0; i < candidateIdsToProcess.length; i += BATCH_SIZE) {
      const batch = candidateIdsToProcess.slice(i, i + BATCH_SIZE);
      
      await Promise.all(
        batch.map(async (candidateId) => {
          try {
            const result = await calculateCandidateCompanyMatch(companyId, candidateId);
            if (result.success) {
              success++;
            } else {
              failed++;
              errors.push(`Candidate ${candidateId}: ${result.error || 'Unknown error'}`);
            }
          } catch (error: any) {
            failed++;
            errors.push(`Candidate ${candidateId}: ${error.message}`);
          }
        })
      );

      // Small delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < candidateIdsToProcess.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return { success, failed, errors };
  } catch (error: any) {
    console.error('Error recalculating all matches:', error);
    throw error;
  }
}

