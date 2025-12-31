/**
 * Utility functions for generating profile URLs
 * Uses profile_slug (vorname + 3-digit number) instead of ID
 */

/**
 * Get the profile URL for a user profile
 * Uses profile_slug if available, falls back to ID for backwards compatibility
 * 
 * @param profile - Profile object with id and optionally profile_slug
 * @returns URL path to the profile (e.g., "/profil/max123" or "/u/{id}" as fallback)
 */
export function getProfileUrl(profile: { id: string; profile_slug?: string | null } | null | undefined): string {
  if (!profile) return '/';
  
  // Prefer profile_slug if available
  if (profile.profile_slug) {
    return `/profil/${profile.profile_slug}`;
  }
  
  // Fallback to ID for backwards compatibility
  return `/u/${profile.id}`;
}

/**
 * Get the profile URL from just an ID (for cases where we only have the ID)
 * This will need to fetch the profile_slug from the database
 * 
 * @param profileId - User profile ID
 * @returns URL path to the profile
 */
export function getProfileUrlById(profileId: string): string {
  // For now, use ID as fallback
  // In the future, this could fetch the profile_slug from cache or database
  return `/u/${profileId}`;
}

/**
 * Get the profile URL from a profile_slug
 * 
 * @param profileSlug - Profile slug (e.g., "max123")
 * @returns URL path to the profile
 */
export function getProfileUrlBySlug(profileSlug: string): string {
  return `/profil/${profileSlug}`;
}

