// ============================================
// STEP 6: Frontend Feature-Checks
// ============================================

import { supabase } from "@/integrations/supabase/client";
import type { PlanKey } from "@/lib/billing-v2/plans";

export type FeatureKey = 
  | 'tokens_per_month'
  | 'max_industries'
  | 'max_active_jobs'
  | 'max_seats'
  | 'max_locations'
  | 'crm_export'
  | 'team_access'
  | 'api_sso';

export interface FeatureStatus {
  enabled: boolean;
  limitValue: number | null; // null = unlimited
  currentUsage: number;
}

/**
 * Prüft ob ein Feature für eine Company aktiviert ist
 */
export async function hasFeature(
  companyId: string,
  featureKey: FeatureKey
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('has_feature', {
      p_company_id: companyId,
      p_feature_key: featureKey,
    });

    if (error) {
      console.error('Error checking feature:', error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error('Error checking feature:', error);
    return false;
  }
}

/**
 * Prüft ob ein Feature-Limit erreicht ist
 */
export async function checkFeatureLimit(
  companyId: string,
  featureKey: FeatureKey,
  currentUsage?: number
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('check_feature_limit', {
      p_company_id: companyId,
      p_feature_key: featureKey,
      p_current_usage: currentUsage ?? null,
    });

    if (error) {
      console.error('Error checking feature limit:', error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error('Error checking feature limit:', error);
    return false;
  }
}

/**
 * Holt den Feature-Status für eine Company
 */
export async function getFeatureStatus(
  companyId: string,
  featureKey: FeatureKey
): Promise<FeatureStatus | null> {
  try {
    const { data, error } = await supabase
      .from('company_features')
      .select('enabled, limit_value, current_usage')
      .eq('company_id', companyId)
      .eq('feature_key', featureKey)
      .single();

    if (error || !data) {
      console.error('Error fetching feature status:', error);
      return null;
    }

    return {
      enabled: data.enabled ?? false,
      limitValue: data.limit_value,
      currentUsage: data.current_usage ?? 0,
    };
  } catch (error) {
    console.error('Error fetching feature status:', error);
    return null;
  }
}

/**
 * Holt alle Features für eine Company
 */
export async function getAllFeatures(companyId: string): Promise<Record<FeatureKey, FeatureStatus>> {
  try {
    const { data, error } = await supabase
      .from('company_features')
      .select('feature_key, enabled, limit_value, current_usage')
      .eq('company_id', companyId);

    if (error || !data) {
      console.error('Error fetching features:', error);
      return {} as Record<FeatureKey, FeatureStatus>;
    }

    const features: Record<string, FeatureStatus> = {};
    for (const feature of data) {
      features[feature.feature_key] = {
        enabled: feature.enabled ?? false,
        limitValue: feature.limit_value,
        currentUsage: feature.current_usage ?? 0,
      };
    }

    return features as Record<FeatureKey, FeatureStatus>;
  } catch (error) {
    console.error('Error fetching features:', error);
    return {} as Record<FeatureKey, FeatureStatus>;
  }
}

/**
 * Feature-Limits basierend auf Plan (Fallback wenn DB nicht verfügbar)
 */
export function getPlanFeatureLimits(planKey: PlanKey): Record<FeatureKey, number | null> {
  switch (planKey) {
    case 'free':
      return {
        tokens_per_month: 0,
        max_industries: 0,
        max_active_jobs: 0,
        max_seats: 1,
        max_locations: 1,
        crm_export: null, // disabled
        team_access: null, // disabled
        api_sso: null, // disabled
      };
    case 'basic':
      return {
        tokens_per_month: 30,
        max_industries: 3,
        max_active_jobs: 5,
        max_seats: 1,
        max_locations: 1,
        crm_export: null, // enabled
        team_access: null, // disabled
        api_sso: null, // disabled
      };
    case 'growth':
      return {
        tokens_per_month: 150,
        max_industries: null, // unlimited
        max_active_jobs: 20,
        max_seats: null, // unlimited
        max_locations: null, // unlimited
        crm_export: null, // enabled
        team_access: null, // enabled
        api_sso: null, // disabled
      };
    case 'enterprise':
      return {
        tokens_per_month: null, // unlimited
        max_industries: null, // unlimited
        max_active_jobs: null, // unlimited
        max_seats: null, // unlimited
        max_locations: null, // unlimited
        crm_export: null, // enabled
        team_access: null, // enabled
        api_sso: null, // enabled
      };
    default:
      // Fallback to free plan limits
      return {
        tokens_per_month: 0,
        max_industries: 0,
        max_active_jobs: 0,
        max_seats: 1,
        max_locations: 1,
        crm_export: null, // disabled
        team_access: null, // disabled
        api_sso: null, // disabled
      };
  }
}

