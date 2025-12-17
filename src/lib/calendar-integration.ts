/**
 * Calendar Integration Utilities
 * Provides functions for generating calendar event URLs and video meeting links
 */

export type CalendarProvider = 'google' | 'outlook' | 'teams' | 'calendly' | 'zoom' | 'manual';

export interface CalendarEventParams {
  title: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
  videoLink?: string;
  attendees?: string[];
}

/**
 * Generate Google Calendar event URL
 */
export function generateGoogleCalendarUrl(params: CalendarEventParams): string {
  const formatDate = (date: Date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  const url = new URL('https://calendar.google.com/calendar/render');
  url.searchParams.set('action', 'TEMPLATE');
  url.searchParams.set('text', params.title);
  url.searchParams.set('dates', `${formatDate(params.start)}/${formatDate(params.end)}`);
  
  if (params.description) {
    url.searchParams.set('details', params.description);
  }
  
  if (params.location) {
    url.searchParams.set('location', params.location);
  }
  
  if (params.videoLink) {
    url.searchParams.set('add', params.videoLink);
  }
  
  if (params.attendees && params.attendees.length > 0) {
    url.searchParams.set('add', params.attendees.join(','));
  }
  
  return url.toString();
}

/**
 * Generate Outlook Calendar event URL
 */
export function generateOutlookCalendarUrl(params: CalendarEventParams): string {
  const formatDate = (date: Date) => date.toISOString();
  
  const url = new URL('https://outlook.live.com/calendar/0/deeplink/compose');
  url.searchParams.set('subject', params.title);
  url.searchParams.set('startdt', formatDate(params.start));
  url.searchParams.set('enddt', formatDate(params.end));
  
  if (params.description) {
    url.searchParams.set('body', params.description);
  }
  
  if (params.location) {
    url.searchParams.set('location', params.location);
  }
  
  if (params.videoLink) {
    url.searchParams.set('body', `${params.description || ''}\n\nVideo-Link: ${params.videoLink}`);
  }
  
  if (params.attendees && params.attendees.length > 0) {
    url.searchParams.set('to', params.attendees.join(';'));
  }
  
  return url.toString();
}

/**
 * Generate Teams meeting link
 */
export function generateTeamsMeetingLink(): string {
  // Teams meeting links are generated via Microsoft Graph API
  // For now, return a placeholder that can be replaced with actual API call
  return 'https://teams.microsoft.com/l/meetup-join/...';
}

/**
 * Generate Google Meet link
 */
export function generateGoogleMeetLink(): string {
  // Google Meet links are generated via Google Calendar API
  // For now, return a placeholder
  return 'https://meet.google.com/new';
}

/**
 * Generate Zoom meeting link
 */
export function generateZoomMeetingLink(meetingId?: string, password?: string): string {
  if (meetingId) {
    const url = new URL(`https://zoom.us/j/${meetingId}`);
    if (password) {
      url.searchParams.set('pwd', password);
    }
    return url.toString();
  }
  // Placeholder for new meeting
  return 'https://zoom.us/meeting/schedule';
}

/**
 * Create calendar event via API (for integrated calendars)
 */
export async function createCalendarEvent(
  provider: CalendarProvider,
  params: CalendarEventParams,
  accessToken?: string
): Promise<{ eventId: string; videoLink?: string } | null> {
  if (provider === 'manual' || !accessToken) {
    return null;
  }

  try {
    if (provider === 'google') {
      return await createGoogleCalendarEvent(params, accessToken);
    } else if (provider === 'outlook' || provider === 'teams') {
      return await createMicrosoftCalendarEvent(params, accessToken, provider);
    }
  } catch (error) {
    console.error(`Error creating ${provider} calendar event:`, error);
    return null;
  }

  return null;
}

/**
 * Create Google Calendar event via API
 */
async function createGoogleCalendarEvent(
  params: CalendarEventParams,
  accessToken: string
): Promise<{ eventId: string; videoLink?: string }> {
  const event = {
    summary: params.title,
    description: params.description || '',
    start: {
      dateTime: params.start.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: params.end.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    location: params.location,
    attendees: params.attendees?.map(email => ({ email })),
    conferenceData: {
      createRequest: {
        requestId: `meet-${Date.now()}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
  };

  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    throw new Error(`Google Calendar API error: ${response.statusText}`);
  }

  const data = await response.json();
  
  return {
    eventId: data.id,
    videoLink: data.conferenceData?.entryPoints?.[0]?.uri || generateGoogleMeetLink(),
  };
}

/**
 * Create Microsoft Calendar event via API (Outlook/Teams)
 */
async function createMicrosoftCalendarEvent(
  params: CalendarEventParams,
  accessToken: string,
  provider: 'outlook' | 'teams'
): Promise<{ eventId: string; videoLink?: string }> {
  const isOnline = provider === 'teams' || !!params.videoLink;
  
  const event = {
    subject: params.title,
    body: {
      contentType: 'HTML',
      content: params.description || '',
    },
    start: {
      dateTime: params.start.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: params.end.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    location: params.location ? {
      displayName: params.location,
    } : undefined,
    attendees: params.attendees?.map(email => ({
      emailAddress: { address: email },
      type: 'required',
    })),
    isOnlineMeeting: isOnline,
    onlineMeetingProvider: provider === 'teams' ? 'teamsForBusiness' : undefined,
  };

  const response = await fetch('https://graph.microsoft.com/v1.0/me/events', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    throw new Error(`Microsoft Graph API error: ${response.statusText}`);
  }

  const data = await response.json();
  
  return {
    eventId: data.id,
    videoLink: data.onlineMeeting?.joinUrl || (provider === 'teams' ? generateTeamsMeetingLink() : undefined),
  };
}

/**
 * Create a calendar event object for an interview
 */
export function createInterviewEvent(
  candidateName: string,
  plannedAt: string,
  durationMinutes: number = 60
): CalendarEventParams {
  const start = new Date(plannedAt);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  
  return {
    title: `Interview mit ${candidateName}`,
    description: `Interview-Termin mit ${candidateName}`,
    start,
    end,
  };
}

/**
 * Get user's preferred calendar provider from localStorage
 * Defaults to 'google' if not set
 */
export function getUserCalendarPreference(): CalendarProvider {
  if (typeof window === 'undefined') return 'google';
  
  const stored = localStorage.getItem('calendar_preference');
  if (stored && ['google', 'outlook', 'teams', 'calendly', 'zoom', 'manual'].includes(stored)) {
    return stored as CalendarProvider;
  }
  
  return 'google';
}

/**
 * Open calendar event in user's preferred calendar provider
 */
export function openCalendarEvent(event: CalendarEventParams, provider: CalendarProvider = 'google'): void {
  let url: string;
  
  switch (provider) {
    case 'google':
      url = generateGoogleCalendarUrl(event);
      break;
    case 'outlook':
      url = generateOutlookCalendarUrl(event);
      break;
    case 'teams':
      // Teams uses Outlook calendar URL format
      url = generateOutlookCalendarUrl(event);
      break;
    case 'calendly':
    case 'zoom':
    case 'manual':
    default:
      // Fallback to Google Calendar
      url = generateGoogleCalendarUrl(event);
      break;
  }
  
  window.open(url, '_blank', 'noopener,noreferrer');
}
