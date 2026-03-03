/**
 * Utility functions for generating profile status lines and subtitles
 * Based on LinkedInProfileHeader logic
 */
import type { ProfileRow } from "@/types/profile";

// Parse date string (format: "YYYY-MM" or "YYYY" or empty)
const parseDate = (dateStr: string): { year: number; month: number } | null => {
  if (!dateStr || dateStr === 'heute' || dateStr === '0000') return null;
  
  const parts = dateStr.split('-');
  const year = parseInt(parts[0] || '0');
  const month = parts[1] ? parseInt(parts[1]) : 1;
  
  if (isNaN(year) || year === 0) return null;
  return { year, month: isNaN(month) ? 1 : month };
};

// Check if a date is in the future (current/ongoing)
const isFutureOrCurrent = (dateStr: string): boolean => {
  if (!dateStr || dateStr === 'heute' || dateStr === '') return true;
  const date = parseDate(dateStr);
  if (!date) return false;
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  // If year is in the future, it's current
  if (date.year > currentYear) return true;
  // If same year and month is in the future or current, it's current
  if (date.year === currentYear && date.month >= currentMonth) return true;
  
  return false;
};

// Get sort value for a job/education
const getSortValue = (item: {
  zeitraum_von: string;
  zeitraum_bis: string;
}): { isCurrent: boolean; value: number } => {
  const isCurrent = !item.zeitraum_bis || item.zeitraum_bis === 'heute' || item.zeitraum_bis === '' || isFutureOrCurrent(item.zeitraum_bis);
  const vonDate = parseDate(item.zeitraum_von);
  const bisDate = parseDate(item.zeitraum_bis);

  if (isCurrent) {
    if (vonDate) {
      return { 
        isCurrent: true, 
        value: vonDate.year * 10000 + vonDate.month * 100
      };
    }
    return { isCurrent: true, value: 0 };
  }

  if (bisDate) {
    return { 
      isCurrent: false, 
      value: bisDate.year * 10000 + bisDate.month * 100 
    };
  }

  if (vonDate) {
    return { 
      isCurrent: false, 
      value: vonDate.year * 10000 + vonDate.month * 100 
    };
  }

  return { isCurrent: false, value: 0 };
};

interface ExperienceItem {
  zeitraum_von?: string;
  zeitraum_bis?: string;
  position?: string;
  titel?: string;
  unternehmen?: string;
  name?: string;
  schule?: string;
  [key: string]: unknown;
}

// Get the latest experience
const getLatestExperience = (experiences: ExperienceItem[]): ExperienceItem | null => {
  if (!experiences || experiences.length === 0) return null;
  
  const sorted = [...experiences]
    .map((item) => ({ item, sort: getSortValue(item) }))
    .sort((a, b) => {
      if (a.sort.isCurrent && !b.sort.isCurrent) return -1;
      if (!a.sort.isCurrent && b.sort.isCurrent) return 1;
      
      if (a.sort.isCurrent && b.sort.isCurrent) {
        return b.sort.value - a.sort.value;
      }
      
      return b.sort.value - a.sort.value;
    });
  
  return sorted.length > 0 ? sorted[0].item : null;
};

// Get the latest education
const getLatestEducation = (education: ExperienceItem[]): ExperienceItem | null => {
  if (!education || education.length === 0) return null;
  
  const sorted = [...education]
    .map((item) => ({ item, sort: getSortValue(item) }))
    .sort((a, b) => {
      if (a.sort.isCurrent && !b.sort.isCurrent) return -1;
      if (!a.sort.isCurrent && b.sort.isCurrent) return 1;
      
      if (a.sort.isCurrent && b.sort.isCurrent) {
        return b.sort.value - a.sort.value;
      }
      
      return b.sort.value - a.sort.value;
    });
  
  return sorted.length > 0 ? sorted[0].item : null;
};

// Format branche name
const formatBranche = (branche: string): string => {
  if (!branche) return '';
  const brancheMap: Record<string, string> = {
    'handwerk': 'Handwerk',
    'it': 'IT',
    'gesundheit': 'Gesundheit',
    'buero': 'Büro',
    'verkauf': 'Verkauf',
    'gastronomie': 'Gastronomie',
    'bau': 'Bau'
  };
  return brancheMap[branche.toLowerCase()] || branche;
};

/**
 * Generate status line (subheadline) for a profile
 * Based on LinkedInProfileHeader logic
 * Always includes branche if available
 */
export const getProfileStatusLine = (profile: ProfileRow | null | undefined): string => {
  if (!profile) return '';
  
  const branche = profile.branche || '';
  const formattedBranche = formatBranche(branche);
  const latestExperience = getLatestExperience((profile.berufserfahrung as ExperienceItem[]) || []);
  const latestEducation = getLatestEducation((profile.schulbildung as ExperienceItem[]) || []);
  const berufserfahrung = profile.berufserfahrung as ExperienceItem[] | null | undefined;
  const currentJob = latestExperience || berufserfahrung?.[0];
  
  switch (profile.status) {
    case 'schueler':
      // Schüler: Show current school and always include branche
      const parts: string[] = [];
      
      if (latestEducation) {
        const schoolName = latestEducation.name || latestEducation.schule || '';
        if (schoolName) {
          parts.push(`Schüler (an ${schoolName})`);
        } else {
          parts.push('Schüler');
        }
      } else {
        parts.push('Schüler');
      }
      
      // Always add branche if available
      if (formattedBranche) {
        parts.push(formattedBranche);
      }
      
      return parts.join(' • ');
      
    case 'azubi':
      // Azubi: Show current training/education and always include branche
      const azubiParts: string[] = [];
      
      if (latestEducation) {
        const schoolName = (latestEducation.name as string) || (latestEducation.schule as string) || '';
        if (schoolName) {
          azubiParts.push(`Azubi (an ${schoolName})`);
        } else {
          azubiParts.push('Azubi');
        }
      } else {
        // Fallback to job/company
        const azubiFirma = currentJob?.unternehmen || profile.ausbildungsbetrieb || '';
        if (azubiFirma) {
          azubiParts.push(`Ausbildung bei ${azubiFirma}`);
        } else {
          azubiParts.push('In Ausbildung');
        }
      }
      
      // Always add branche if available
      if (formattedBranche) {
        azubiParts.push(formattedBranche);
      }
      
      return azubiParts.join(' • ');
      
    case 'ausgelernt':
    case 'fachkraft':
      // Fachkraft: Show current job and always include branche
      const fachkraftParts: string[] = [];
      const position = currentJob?.position || currentJob?.titel || profile.aktueller_beruf || '';
      const firma = currentJob?.unternehmen || '';
      
      if (position && firma) {
        fachkraftParts.push(`${position} bei ${firma}`);
      } else if (position) {
        fachkraftParts.push(position);
      } else if (firma) {
        fachkraftParts.push(firma);
      }
      
      // Always add branche if available
      if (formattedBranche) {
        fachkraftParts.push(formattedBranche);
      }
      
      return fachkraftParts.join(' • ');
      
    default:
      // Default: Just show branche if available
      return formattedBranche || '';
  }
};

/**
 * Generate subtitle for feed posts
 * Combines status line with linked company if available
 */
export const getFeedSubtitle = (profile: ProfileRow | null | undefined, linkedCompanyName?: string | null): string => {
  const statusLine = getProfileStatusLine(profile);
  
  // If company is linked, append "@ Company"
  if (linkedCompanyName) {
    return statusLine ? `${statusLine} @ ${linkedCompanyName}` : `@ ${linkedCompanyName}`;
  }
  
  return statusLine;
};

