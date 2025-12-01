// Telemetry functions for tracking user interactions and performance
import { supabase } from '@/integrations/supabase/client';

// Generate a session ID for this browsing session
const SESSION_ID = crypto.randomUUID();

interface AnalyticsEvent {
  event_type: 'button_click' | 'page_view' | 'cv_step' | 'cv_error' | 'cv_completion' | 'cv_abandonment' | 'user_action';
  event_name: string;
  page_url?: string;
  page_path?: string;
  button_label?: string;
  button_type?: string;
  session_id?: string;
  user_agent?: string;
  referrer?: string;
  metadata?: Record<string, any>;
  user_id?: string; // For user-specific tracking
}

async function saveEvent(event: AnalyticsEvent) {
  try {
    // Don't track admin pages
    const currentPath = window.location.pathname;
    if (currentPath.startsWith('/admin')) {
      console.log('[Analytics] Skipping admin page tracking:', currentPath);
      return;
    }

    const eventData = {
      ...event,
      session_id: SESSION_ID,
      user_agent: navigator.userAgent,
      referrer: document.referrer || undefined,
      page_url: window.location.href,
      page_path: window.location.pathname,
    };

    // Save to Supabase
    const { error } = await supabase
      .from('analytics_events')
      .insert([eventData]);

    if (error) {
      console.error('[Analytics] Failed to save event:', error);
    } else {
      console.log(`[Analytics] Event tracked:`, event);
    }
  } catch (error) {
    console.error('[Analytics] Failed to save event:', error);
  }
}

// Track page views
export function trackPageView(page: string) {
  saveEvent({
    event_type: 'page_view',
    event_name: page,
  });
}

// Track button clicks
export function trackButtonClick(buttonLabel: string, buttonType?: string) {
  saveEvent({
    event_type: 'button_click',
    event_name: buttonLabel,
    button_label: buttonLabel,
    button_type: buttonType,
  });
}

// Track Calendly button clicks specifically
export function trackCalendlyClick(buttonLabel: string, page: string) {
  trackButtonClick(buttonLabel, 'calendly');
  console.log(`[Calendly] Button "${buttonLabel}" clicked on ${page}`);
}

export function trackJobSearchEvent(event: string, data: Record<string, any> = {}) {
  console.log(`[Telemetry] Job Search - ${event}:`, data);
}

export function trackForYouEvent(event: string, data: Record<string, any> = {}) {
  console.log(`[Telemetry] ForYou - ${event}:`, data);
}

export function trackCompanyMatchingEvent(event: string, data: Record<string, any> = {}) {
  console.log(`[Telemetry] Company Matching - ${event}:`, data);
}

export function trackJobCardEvent(event: string, data: Record<string, any> = {}) {
  console.log(`[Telemetry] Job Card - ${event}:`, data);
}

// Track CV Generator Steps
export function trackCVStep(step: number, stepName: string, flowType: 'classic' | 'voice' | 'chat' = 'classic', metadata?: Record<string, any>) {
  saveEvent({
    event_type: 'cv_step',
    event_name: `CV Step ${step}: ${stepName}`,
    metadata: {
      step,
      stepName,
      flowType,
      ...metadata,
    },
  });
}

// Track CV Generator Errors
export function trackCVError(errorType: string, errorMessage: string, step?: number, metadata?: Record<string, any>) {
  saveEvent({
    event_type: 'cv_error',
    event_name: `CV Error: ${errorType}`,
    metadata: {
      errorType,
      errorMessage,
      step,
      ...metadata,
    },
  });
}

// Track CV Generator Completion
export function trackCVCompletion(flowType: 'classic' | 'voice' | 'chat', totalSteps: number, timeToComplete?: number, metadata?: Record<string, any>) {
  saveEvent({
    event_type: 'cv_completion',
    event_name: 'CV Generator Completed',
    metadata: {
      flowType,
      totalSteps,
      timeToComplete,
      ...metadata,
    },
  });
}

// Track CV Generator Abandonment
export function trackCVAbandonment(step: number, stepName: string, flowType: 'classic' | 'voice' | 'chat' = 'classic', metadata?: Record<string, any>) {
  saveEvent({
    event_type: 'cv_abandonment',
    event_name: `CV Generator Abandoned at Step ${step}`,
    metadata: {
      step,
      stepName,
      flowType,
      ...metadata,
    },
  });
}

// Track CV Download Error
export function trackCVDownloadError(errorMessage: string, metadata?: Record<string, any>) {
  trackCVError('download_error', errorMessage, undefined, {
    ...metadata,
    context: 'download',
  });
}

// Track User Actions (for detailed user analytics)
export function trackUserAction(
  actionType: 'job_application' | 'job_view' | 'company_follow' | 'company_unfollow' | 'follow_request' | 'post_create' | 'post_like' | 'post_comment' | 'profile_view' | 'company_view',
  targetId: string,
  userId?: string,
  metadata?: Record<string, any>
) {
  saveEvent({
    event_type: 'user_action',
    event_name: `User Action: ${actionType}`,
    user_id: userId,
    metadata: {
      actionType,
      targetId,
      ...metadata,
    },
  });
}

// Convenience functions for specific actions
export function trackJobApplication(jobId: string, companyId: string, userId?: string, metadata?: Record<string, any>) {
  trackUserAction('job_application', jobId, userId, { companyId, ...metadata });
}

export function trackJobView(jobId: string, userId?: string, metadata?: Record<string, any>) {
  trackUserAction('job_view', jobId, userId, metadata);
}

export function trackCompanyFollow(companyId: string, userId?: string, metadata?: Record<string, any>) {
  trackUserAction('company_follow', companyId, userId, metadata);
}

export function trackCompanyUnfollow(companyId: string, userId?: string, metadata?: Record<string, any>) {
  trackUserAction('company_unfollow', companyId, userId, metadata);
}

export function trackFollowRequest(companyId: string, userId?: string, metadata?: Record<string, any>) {
  trackUserAction('follow_request', companyId, userId, metadata);
}

export function trackPostCreate(postId: string, userId?: string, metadata?: Record<string, any>) {
  trackUserAction('post_create', postId, userId, metadata);
}

export function trackPostLike(postId: string, userId?: string, metadata?: Record<string, any>) {
  trackUserAction('post_like', postId, userId, metadata);
}

export function trackPostComment(postId: string, userId?: string, metadata?: Record<string, any>) {
  trackUserAction('post_comment', postId, userId, metadata);
}

export function trackProfileView(profileId: string, userId?: string, metadata?: Record<string, any>) {
  trackUserAction('profile_view', profileId, userId, metadata);
}

export function trackCompanyView(companyId: string, userId?: string, metadata?: Record<string, any>) {
  trackUserAction('company_view', companyId, userId, metadata);
}
