/**
 * Calendar Integration Utilities
 * 
 * This module provides utilities for integrating with various calendar services:
 * - Google Calendar
 * - Microsoft Outlook
 * - Microsoft Teams
 * 
 * Future enhancements:
 * - Store user calendar preferences
 * - API integration for automatic calendar sync
 * - Webhook support for real-time updates
 */

export type CalendarProvider = 'google' | 'outlook' | 'teams';

export interface CalendarEvent {
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  attendees?: string[];
}

/**
 * Format date for calendar URLs (YYYYMMDDTHHmmssZ)
 */
export function formatCalendarDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Generate Google Calendar URL
 */
export function generateGoogleCalendarUrl(event: CalendarEvent): string {
  const start = formatCalendarDate(event.startDate);
  const end = formatCalendarDate(event.endDate);
  const title = encodeURIComponent(event.title);
  const details = encodeURIComponent(event.description || '');
  const location = encodeURIComponent(event.location || '');
  
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
}

/**
 * Generate Outlook Calendar URL
 */
export function generateOutlookCalendarUrl(event: CalendarEvent): string {
  const title = encodeURIComponent(event.title);
  const details = encodeURIComponent(event.description || '');
  const location = encodeURIComponent(event.location || '');
  const startdt = event.startDate.toISOString();
  const enddt = event.endDate.toISOString();
  
  return `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&startdt=${startdt}&enddt=${enddt}&body=${details}&location=${location}`;
}

/**
 * Generate Teams Meeting URL
 * 
 * TODO: Replace with actual Teams API integration
 * This is a placeholder that can be enhanced with:
 * - Microsoft Graph API integration
 * - Automatic meeting creation
 * - Meeting link generation
 */
export function generateTeamsMeetingUrl(event: CalendarEvent): string {
  const title = encodeURIComponent(event.title);
  // Placeholder - will be replaced with actual Teams API integration
  return `https://teams.microsoft.com/l/meeting/new?subject=${title}`;
}

/**
 * Open calendar event in the specified provider
 */
export function openCalendarEvent(event: CalendarEvent, provider: CalendarProvider = 'google'): void {
  let url: string;
  
  switch (provider) {
    case 'google':
      url = generateGoogleCalendarUrl(event);
      break;
    case 'outlook':
      url = generateOutlookCalendarUrl(event);
      break;
    case 'teams':
      url = generateTeamsMeetingUrl(event);
      break;
    default:
      url = generateGoogleCalendarUrl(event);
  }
  
  window.open(url, '_blank');
}

/**
 * Create calendar event for interview
 */
export function createInterviewEvent(
  candidateName: string,
  plannedAt: string | Date,
  durationMinutes: number = 60,
  location?: string
): CalendarEvent {
  const startDate = typeof plannedAt === 'string' ? new Date(plannedAt) : plannedAt;
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
  
  return {
    title: `Interview mit ${candidateName}`,
    description: `Interview-Termin mit ${candidateName}`,
    startDate,
    endDate,
    location: location || '',
  };
}

/**
 * Future: Get user's preferred calendar provider from settings
 * TODO: Implement user preference storage
 */
export function getUserCalendarPreference(): CalendarProvider {
  // TODO: Load from user settings/company settings
  // For now, default to Google Calendar
  return 'google';
}

/**
 * Future: Create calendar event via API (for automatic sync)
 * TODO: Implement API integration
 */
export async function createCalendarEventViaAPI(
  event: CalendarEvent,
  provider: CalendarProvider
): Promise<string | null> {
  // TODO: Implement API calls for:
  // - Google Calendar API
  // - Microsoft Graph API (Outlook/Teams)
  // - Return event ID or meeting link
  
  console.log('API integration not yet implemented', { event, provider });
  return null;
}

