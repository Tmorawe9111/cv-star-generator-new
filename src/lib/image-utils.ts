/**
 * Utility functions for handling image URLs from Supabase Storage
 */

/**
 * Ensures an image URL is complete with full domain
 * Handles both relative paths and full URLs
 */
export function normalizeImageUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  
  // If already a full URL, return as is
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://koymmvuhcxlvcuoyjnvv.supabase.co";
  
  // If it's a storage path starting with /storage/, construct full URL
  if (url.startsWith('/storage/')) {
    const path = url.startsWith('/') ? url.slice(1) : url;
    return `${supabaseUrl}/${path}`;
  }
  
  // If it contains storage/v1/object, it's likely a Supabase storage URL
  if (url.includes('storage/v1/object')) {
    // Already has the path, just prepend domain if missing
    if (!url.startsWith('http')) {
      return `${supabaseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    }
    return url;
  }
  
  // If it's just a path (like "post-media/user-id/file.jpg"), construct full storage URL
  if (url.includes('/') && !url.startsWith('http') && !url.startsWith('/')) {
    // Check if it looks like a bucket/path structure (e.g., "bucket-name/path/to/file")
    const parts = url.split('/');
    if (parts.length >= 2) {
      // Assume it's a storage path: bucket-name/path/to/file
      return `${supabaseUrl}/storage/v1/object/public/${url}`;
    }
  }
  
  // If it starts with a single slash, might be a relative path
  if (url.startsWith('/') && url.length > 1) {
    return `${supabaseUrl}${url}`;
  }
  
  // Return as is if we can't determine (might be a data URL or something else)
  return url;
}

/**
 * Checks if an image URL is valid and accessible
 */
export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:');
}

