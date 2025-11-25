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
}>): Array<{
  titel: string;
  unternehmen: string;
  ort: string;
  zeitraum_von: string;
  zeitraum_bis: string;
  beschreibung?: string;
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

  // Get sort value for a job (higher = more recent)
  const getSortValue = (job: {
    zeitraum_von: string;
    zeitraum_bis: string;
  }): number => {
    const isCurrent = job.zeitraum_bis === 'heute';
    const vonDate = parseDate(job.zeitraum_von);
    const bisDate = parseDate(job.zeitraum_bis);

    if (isCurrent) {
      // Current jobs: sort by start date (most recent first)
      // Add large offset to ensure they come first
      if (vonDate) {
        return 1000000 + (vonDate.year * 100 + vonDate.month);
      }
      return 1000000; // If no start date, still prioritize
    }

    // Past jobs: sort by end date (most recent first)
    if (bisDate) {
      return bisDate.year * 100 + bisDate.month;
    }

    // If no end date, sort by start date
    if (vonDate) {
      return vonDate.year * 100 + vonDate.month;
    }

    return 0; // No date info
  };

  return [...berufserfahrung].sort((a, b) => {
    const aValue = getSortValue(a);
    const bValue = getSortValue(b);
    return bValue - aValue; // Descending (most recent first)
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
