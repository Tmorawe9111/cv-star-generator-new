// ============================================
// React Hook für Feature-Checks
// ============================================

import { useQuery } from "@tanstack/react-query";
import { useCompanyId } from "./useCompanyId";
import { getAllFeatures, type FeatureKey, type FeatureStatus } from "@/lib/features";

export function useCompanyFeatures() {
  const companyId = useCompanyId();

  const { data: features, isLoading, error } = useQuery({
    queryKey: ['company-features', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      return await getAllFeatures(companyId);
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const hasFeature = (featureKey: FeatureKey): boolean => {
    if (!features) return false;
    return features[featureKey]?.enabled ?? false;
  };

  const getFeatureLimit = (featureKey: FeatureKey): number | null => {
    if (!features) return null;
    return features[featureKey]?.limitValue ?? null;
  };

  const getFeatureUsage = (featureKey: FeatureKey): number => {
    if (!features) return 0;
    return features[featureKey]?.currentUsage ?? 0;
  };

  const isLimitReached = (featureKey: FeatureKey): boolean => {
    if (!features) return false;
    const feature = features[featureKey];
    if (!feature) return false;
    
    // Unlimited
    if (feature.limitValue === null || feature.limitValue === -1) {
      return false;
    }

    return feature.currentUsage >= feature.limitValue;
  };

  return {
    features,
    isLoading,
    error,
    hasFeature,
    getFeatureLimit,
    getFeatureUsage,
    isLimitReached,
  };
}

