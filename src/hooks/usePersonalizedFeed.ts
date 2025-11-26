import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UserInterest {
  interest_type: string;
  interest_value: string;
  score: number;
}

/**
 * Hook to get user's top interests for personalization
 */
export function useUserInterests() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-interests', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('user_interests')
        .select('interest_type, interest_value, score')
        .eq('user_id', user.id)
        .order('score', { ascending: false })
        .limit(20);

      if (error) {
        console.log('user_interests not available:', error.message);
        return [];
      }

      return data as UserInterest[];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get personalized content score based on user interests
 */
export function calculateContentScore(
  content: { branche?: string; berufsfeld?: string; region?: string; thema?: string; company?: string },
  userInterests: UserInterest[]
): number {
  let score = 0;

  for (const interest of userInterests) {
    const contentValue = content[interest.interest_type as keyof typeof content];
    if (contentValue && contentValue.toLowerCase() === interest.interest_value.toLowerCase()) {
      score += interest.score;
    }
  }

  return score;
}

/**
 * Sort content array by personalization score
 */
export function sortByPersonalization<T extends { branche?: string; berufsfeld?: string; region?: string; thema?: string; company?: string }>(
  items: T[],
  userInterests: UserInterest[],
  options: {
    mixRatio?: number; // 0-1, how much to mix with random (0 = fully personalized, 1 = fully random)
    recencyBoost?: boolean;
    recencyField?: keyof T;
  } = {}
): T[] {
  const { mixRatio = 0.2, recencyBoost = false, recencyField = 'created_at' as keyof T } = options;

  // Calculate scores
  const scored = items.map(item => ({
    item,
    score: calculateContentScore(item, userInterests),
    random: Math.random(),
  }));

  // Sort by combined score (personalization + randomness)
  scored.sort((a, b) => {
    const scoreA = a.score * (1 - mixRatio) + a.random * mixRatio;
    const scoreB = b.score * (1 - mixRatio) + b.random * mixRatio;
    
    // Recency boost: newer items get a slight boost
    if (recencyBoost && recencyField) {
      const dateA = new Date((a.item as any)[recencyField] || 0).getTime();
      const dateB = new Date((b.item as any)[recencyField] || 0).getTime();
      const now = Date.now();
      const dayInMs = 24 * 60 * 60 * 1000;
      
      // Items from last 24h get +0.3 boost
      const recencyBoostA = (now - dateA) < dayInMs ? 0.3 : 0;
      const recencyBoostB = (now - dateB) < dayInMs ? 0.3 : 0;
      
      return (scoreB + recencyBoostB) - (scoreA + recencyBoostA);
    }
    
    return scoreB - scoreA;
  });

  return scored.map(s => s.item);
}

/**
 * Hook for personalized job recommendations
 */
export function usePersonalizedJobs(allJobs: any[]) {
  const { data: interests = [] } = useUserInterests();

  if (!interests.length || !allJobs.length) {
    return allJobs;
  }

  return sortByPersonalization(
    allJobs.map(job => ({
      ...job,
      branche: job.branche || job.industry,
      berufsfeld: job.employment_type,
      region: job.city || job.location,
      company: job.company_name,
    })),
    interests,
    { recencyBoost: true, recencyField: 'created_at' }
  );
}

/**
 * Hook for personalized company recommendations
 */
export function usePersonalizedCompanies(allCompanies: any[]) {
  const { data: interests = [] } = useUserInterests();

  if (!interests.length || !allCompanies.length) {
    return allCompanies;
  }

  return sortByPersonalization(
    allCompanies.map(company => ({
      ...company,
      branche: company.branche || company.industry,
      region: company.city || company.main_location,
      company: company.name,
    })),
    interests,
    { mixRatio: 0.3 } // 30% random for discovery
  );
}

/**
 * Hook for personalized profile recommendations
 */
export function usePersonalizedProfiles(allProfiles: any[]) {
  const { data: interests = [] } = useUserInterests();

  if (!interests.length || !allProfiles.length) {
    return allProfiles;
  }

  return sortByPersonalization(
    allProfiles.map(profile => ({
      ...profile,
      branche: profile.branche,
      berufsfeld: profile.wunschberuf,
      region: profile.stadt,
    })),
    interests,
    { mixRatio: 0.3 }
  );
}

/**
 * Hook for personalized post recommendations
 */
export function usePersonalizedPosts(allPosts: any[]) {
  const { data: interests = [] } = useUserInterests();

  if (!interests.length || !allPosts.length) {
    return allPosts;
  }

  return sortByPersonalization(
    allPosts.map(post => ({
      ...post,
      branche: post.company?.industry || post.author?.branche,
      thema: post.tags?.[0],
      region: post.company?.main_location || post.author?.stadt,
    })),
    interests,
    { recencyBoost: true, recencyField: 'created_at', mixRatio: 0.2 }
  );
}

