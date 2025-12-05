import { CVData } from './CVLayoutBase';
import { CVFormData } from '@/contexts/CVFormContext';

/**
 * Sortiert Berufserfahrung chronologisch:
 * 1. Jobs mit "bis heute" kommen zuerst (neueste zuerst basierend auf Startdatum)
 * 2. Dann die anderen Jobs nach Enddatum sortiert (neueste zuerst)
 * 3. Falls kein Enddatum, nach Startdatum (neueste zuerst)
 */
function sortBerufserfahrung(berufserfahrung: Array<{
  titel: string;
  unternehmen: string;
  ort: string;
  zeitraum_von: string;
  zeitraum_bis: string;
  beschreibung?: string;
  abschluss?: string;
}>): Array<{
  titel: string;
  unternehmen: string;
  ort: string;
  zeitraum_von: string;
  zeitraum_bis: string;
  beschreibung?: string;
  abschluss?: string;
}> {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12

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

  // Get sort value for a job
  // For current jobs: lower value = earlier start (will be sorted ascending)
  // For past jobs: higher value = more recent end (will be sorted descending)
  const getSortValue = (job: {
    zeitraum_von: string;
    zeitraum_bis: string;
  }): { isCurrent: boolean; value: number } => {
    const isCurrent = job.zeitraum_bis === 'heute' || !job.zeitraum_bis || job.zeitraum_bis === '' || isFutureOrCurrent(job.zeitraum_bis);
    const vonDate = parseDate(job.zeitraum_von);
    const bisDate = parseDate(job.zeitraum_bis);

    if (isCurrent) {
      // Current jobs: sort by start date (earlier start = lower value, will be sorted ascending)
      // Add large offset to ensure they come first
      if (vonDate) {
        return { 
          isCurrent: true, 
          value: vonDate.year * 10000 + vonDate.month * 100 // Direct value for ascending sort
        };
      }
      return { isCurrent: true, value: 0 }; // If no start date, still prioritize but at end
    }

    // Past jobs: sort by end date (most recent first)
    if (bisDate) {
      return { 
        isCurrent: false, 
        value: bisDate.year * 10000 + bisDate.month * 100 
      };
    }

    // If no end date, sort by start date
    if (vonDate) {
      return { 
        isCurrent: false, 
        value: vonDate.year * 10000 + vonDate.month * 100 
      };
    }

    return { isCurrent: false, value: 0 }; // No date info
  };

  return [...berufserfahrung].sort((a, b) => {
    const aSort = getSortValue(a);
    const bSort = getSortValue(b);
    
    // Current jobs always come first
    if (aSort.isCurrent && !bSort.isCurrent) return -1;
    if (!aSort.isCurrent && bSort.isCurrent) return 1;
    
    // Both current: sort descending (most recent start first)
    if (aSort.isCurrent && bSort.isCurrent) {
      // Higher value = more recent start, so descending sort puts most recent first
      return bSort.value - aSort.value; // Descending: 01.2026 (20260100) comes before 02.2025 (20250200)
    }
    
    // Both past: sort descending (most recent first)
    // If same end date, sort by start date (earlier start first)
    if (aSort.value === bSort.value) {
      const aVon = parseDate(a.zeitraum_von);
      const bVon = parseDate(b.zeitraum_von);
      if (aVon && bVon) {
        const aStartValue = aVon.year * 10000 + aVon.month * 100;
        const bStartValue = bVon.year * 10000 + bVon.month * 100;
        return bStartValue - aStartValue; // Descending (more recent start first)
      }
    }
    
    return bSort.value - aSort.value; // Descending
  });
}

export function mapFormDataToCVData(formData: CVFormData): CVData {
  const berufserfahrungUnsorted = (formData.berufserfahrung || []).map(b => ({
    titel: b.titel,
    unternehmen: b.unternehmen,
    ort: b.ort,
    zeitraum_von: b.zeitraum_von,
    zeitraum_bis: b.zeitraum_bis,
    beschreibung: b.beschreibung,
    abschluss: b.abschluss,
  }));

  return {
    vorname: formData.vorname,
    nachname: formData.nachname,
    telefon: formData.telefon,
    email: formData.email,
    strasse: formData.strasse,
    hausnummer: formData.hausnummer,
    plz: formData.plz,
    ort: formData.ort,
    geburtsdatum: formData.geburtsdatum,
    profilbild: formData.profilbild,
    avatar_url: formData.avatar_url,
    has_drivers_license: formData.has_drivers_license,
    driver_license_class: formData.driver_license_class,
    status: formData.status,
    branche: formData.branche,
    ueberMich: formData.ueberMich || formData.bio,
    schulbildung: (formData.schulbildung || []).map(s => ({
      schulform: s.schulform,
      name: s.name,
      ort: s.ort,
      zeitraum_von: s.zeitraum_von,
      zeitraum_bis: s.zeitraum_bis,
      beschreibung: s.beschreibung,
    })),
    berufserfahrung: sortBerufserfahrung(berufserfahrungUnsorted),
    sprachen: (formData.sprachen || []).map(l => ({ sprache: l.sprache, niveau: l.niveau })),
    faehigkeiten: formData.faehigkeiten || [],
    qualifikationen: (formData.qualifikationen || []).map(q => ({ name: q, beschreibung: '' })),
    zertifikate: (formData.zertifikate || []).map(z => ({ name: z, anbieter: '', datum: '' })),
    weiterbildung: (formData.weiterbildung || []).map(w => ({
      titel: w.titel,
      anbieter: w.anbieter,
      ort: w.ort,
      zeitraum_von: w.zeitraum_von,
      zeitraum_bis: w.zeitraum_bis,
      beschreibung: w.beschreibung,
    })),
    interessen: formData.interessen || [],
  };
}
