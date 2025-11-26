import { useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Action weights for reference
export const ACTION_WEIGHTS = {
  apply: 1.0,
  save: 0.8,
  share: 0.8,
  follow: 0.7,
  connect: 0.7,
  join_group: 0.7,
  comment: 0.6,
  like: 0.5,
  search: 0.4,
  click: 0.3,
  view: 0.2,
} as const;

export type TrackAction = 
  | 'view' | 'like' | 'unlike' | 'comment' | 'share' | 'save' | 'unsave'
  | 'follow' | 'unfollow' | 'connect' | 'disconnect'
  | 'apply' | 'search' | 'click' | 'join_group' | 'leave_group';

export type TargetType = 'post' | 'job' | 'company' | 'profile' | 'group';

export interface TrackMetadata {
  branche?: string;
  berufsfeld?: string;
  region?: string;
  thema?: string;
  company?: string;
  skill?: string;
  [key: string]: string | undefined;
}

interface TrackOptions {
  durationSeconds?: number;
  source?: 'feed' | 'search' | 'profile' | 'notification' | 'direct';
}

/**
 * Hook for tracking user interactions (Instagram/TikTok style)
 * Automatically learns user interests from behavior
 */
export function useTrackInteraction() {
  const { user } = useAuth();

  const track = useCallback(async (
    action: TrackAction,
    targetType: TargetType,
    targetId: string,
    metadata: TrackMetadata = {},
    options: TrackOptions = {}
  ) => {
    if (!user?.id) return null;

    try {
      const { data, error } = await supabase.rpc('track_interaction', {
        p_action: action,
        p_target_type: targetType,
        p_target_id: targetId,
        p_metadata: metadata,
        p_duration_seconds: options.durationSeconds || null,
        p_source: options.source || 'feed'
      });

      if (error) {
        console.log('Tracking not available:', error.message);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Error tracking interaction:', err);
      return null;
    }
  }, [user?.id]);

  return { track };
}

/**
 * Hook for tracking view duration (time spent on content)
 */
export function useTrackViewDuration(
  targetType: TargetType,
  targetId: string | undefined,
  metadata: TrackMetadata = {},
  minDurationSeconds = 3 // Only track if viewed for at least 3 seconds
) {
  const { track } = useTrackInteraction();
  const startTimeRef = useRef<number | null>(null);
  const trackedRef = useRef(false);

  useEffect(() => {
    if (!targetId) return;
    
    // Start timing
    startTimeRef.current = Date.now();
    trackedRef.current = false;

    return () => {
      // Track on unmount if viewed long enough
      if (startTimeRef.current && !trackedRef.current) {
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (duration >= minDurationSeconds) {
          track('view', targetType, targetId, metadata, { durationSeconds: duration });
          trackedRef.current = true;
        }
      }
    };
  }, [targetId, targetType, track, metadata, minDurationSeconds]);

  // Manual tracking function
  const trackNow = useCallback(() => {
    if (!targetId || trackedRef.current) return;
    
    const duration = startTimeRef.current 
      ? Math.floor((Date.now() - startTimeRef.current) / 1000)
      : 0;
    
    if (duration >= minDurationSeconds) {
      track('view', targetType, targetId, metadata, { durationSeconds: duration });
      trackedRef.current = true;
    }
  }, [targetId, targetType, track, metadata, minDurationSeconds]);

  return { trackNow };
}

/**
 * Helper to extract metadata from a job
 */
export function extractJobMetadata(job: {
  branche?: string;
  employment_type?: string;
  location?: string;
  company_name?: string;
}): TrackMetadata {
  return {
    branche: job.branche || undefined,
    berufsfeld: job.employment_type || undefined,
    region: job.location || undefined,
    company: job.company_name || undefined,
  };
}

/**
 * Helper to extract metadata from a company
 */
export function extractCompanyMetadata(company: {
  branche?: string;
  city?: string;
  name?: string;
}): TrackMetadata {
  return {
    branche: company.branche || undefined,
    region: company.city || undefined,
    company: company.name || undefined,
  };
}

/**
 * Helper to extract metadata from a profile
 */
export function extractProfileMetadata(profile: {
  branche?: string;
  stadt?: string;
  wunschberuf?: string;
}): TrackMetadata {
  return {
    branche: profile.branche || undefined,
    region: profile.stadt || undefined,
    berufsfeld: profile.wunschberuf || undefined,
  };
}

/**
 * Helper to extract metadata from a post
 */
export function extractPostMetadata(post: {
  branche?: string;
  tags?: string[];
}): TrackMetadata {
  const metadata: TrackMetadata = {};
  
  if (post.branche) {
    metadata.branche = post.branche;
  }
  
  if (post.tags && post.tags.length > 0) {
    metadata.thema = post.tags[0]; // Use first tag as main topic
  }
  
  return metadata;
}

