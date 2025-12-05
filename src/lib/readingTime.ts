/**
 * Reading Time Calculator
 * Calculates reading time based on word count
 * Average reading speed: 200 words per minute
 */

export function calculateReadingTime(content: string): number {
  if (!content) return 0;

  // Remove HTML tags
  const textContent = content.replace(/<[^>]*>/g, '');
  
  // Count words (split by whitespace and filter empty strings)
  const words = textContent.trim().split(/\s+/).filter(word => word.length > 0);
  const wordCount = words.length;

  // Calculate reading time (200 words per minute)
  const readingTimeMinutes = Math.ceil(wordCount / 200);

  return readingTimeMinutes;
}

export function formatReadingTime(minutes: number): string {
  if (minutes === 0) return 'Weniger als 1 Min.';
  if (minutes === 1) return '1 Min.';
  return `${minutes} Min.`;
}

