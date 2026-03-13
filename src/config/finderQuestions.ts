import type { FinderAudience } from '@/config/finderRecommendations';

export type QuestionType = 'single' | 'multi';

export interface FinderOption {
  id: string;
  label: string;
  tags: string[];
}

export interface FinderQuestion {
  id: string;
  audience: FinderAudience;
  text: string;
  subtext?: string;
  type: QuestionType;
  options: FinderOption[];
  /**
   * ID der nächsten Frage oder die Konstante 'RESULT'.
   * Kann optional abhängig von der Auswahl berechnet werden,
   * aktuell verwenden wir eine einfache lineare Verkettung.
   */
  next?: string;
}

export const AUSBILDUNG_QUESTIONS: FinderQuestion[] = [
  {
    id: 'start-ausbildung',
    audience: 'ausbildung',
    text: 'Wo stehst du gerade?',
    subtext: 'Keine Sorge – hier gibt es keine falschen Antworten.',
    type: 'single',
    options: [
      { id: 'abschluss-vorher', label: 'Ich mache bald meinen Abschluss', tags: ['schueler', 'einsteiger'] },
      { id: 'abschluss-fertig', label: 'Ich habe die Schule schon beendet', tags: ['absolvent', 'einsteiger'] },
      { id: 'abgebrochen', label: 'Ich habe abgebrochen und will neu starten', tags: ['neustart'] },
    ],
    next: 'interessen-ausbildung',
  },
  {
    id: 'interessen-ausbildung',
    audience: 'ausbildung',
    text: 'Was macht dir eher Spaß?',
    subtext: 'Stell dir vor, du hast einen guten Tag in der Ausbildung – was hast du gemacht?',
    type: 'multi',
    options: [
      { id: 'menschen', label: 'Mit Menschen arbeiten (Pflege, Erziehung, Service)', tags: ['pflege', 'sozial', 'menschen'] },
      { id: 'handwerk', label: 'Mit den Händen arbeiten (Handwerk, Technik)', tags: ['handwerk', 'technik'] },
      { id: 'buero', label: 'Am Computer / im Büro & Organisation', tags: ['buero', 'organisation'] },
    ],
    next: 'aktivitaet-ausbildung',
  },
  {
    id: 'aktivitaet-ausbildung',
    audience: 'ausbildung',
    text: 'Wie aktiv willst du im Alltag sein?',
    type: 'single',
    options: [
      { id: 'viel-bewegung', label: 'Viel Bewegung, körperlich aktiv', tags: ['aktiv', 'koerperlich'] },
      { id: 'mix', label: 'Mischung aus sitzen und bewegen', tags: ['mix'] },
      { id: 'ruhig', label: 'Eher ruhig, viel sitzen', tags: ['ruhig', 'buero'] },
    ],
    next: 'wichtig-ausbildung',
  },
  {
    id: 'wichtig-ausbildung',
    audience: 'ausbildung',
    text: 'Was ist dir gerade am wichtigsten?',
    type: 'multi',
    options: [
      { id: 'geld', label: 'Schnell eigenes Geld verdienen', tags: ['geld', 'praxisnah'] },
      { id: 'uebernahme', label: 'Gute Übernahmechancen', tags: ['sicherheit'] },
      { id: 'team', label: 'Starkes Team & gutes Klima', tags: ['team', 'community'] },
      { id: 'zeiten', label: 'Planbare Arbeitszeiten', tags: ['struktur', 'zeiten'] },
    ],
    next: 'rahmen-ausbildung',
  },
  {
    id: 'rahmen-ausbildung',
    audience: 'ausbildung',
    text: 'Wie soll dein Alltag ungefähr aussehen?',
    subtext: 'Denke an Weg zur Arbeit, Umfeld und Arbeitszeiten.',
    type: 'multi',
    options: [
      { id: 'nah-zu-hause', label: 'Am liebsten in der Nähe von zu Hause', tags: ['nah', 'regional'] },
      { id: 'wechselnde-orte', label: 'Wechselnde Orte sind für mich okay', tags: ['flexibel', 'unterwegs'] },
      { id: 'tagsueber', label: 'Vor allem tagsüber arbeiten', tags: ['tageinsatz'] },
      { id: 'auch-abends', label: 'Auch abends / am Wochenende ist okay', tags: ['schicht', 'flexibel'] },
    ],
    next: 'RESULT',
  },
];

export const JOB_QUESTIONS: FinderQuestion[] = [
  {
    id: 'start-job',
    audience: 'job',
    text: 'Was suchst du gerade?',
    subtext: 'Job, Nebenjob oder Einstieg – alles ist okay.',
    type: 'single',
    options: [
      { id: 'vollzeit', label: 'Vollzeit-Job', tags: ['vollzeit'] },
      { id: 'teilzeit', label: 'Teilzeit / Minijob', tags: ['teilzeit'] },
      { id: 'neuorientierung', label: 'Ich will mich erstmal orientieren', tags: ['orientierung'] },
    ],
    next: 'sprache-job',
  },
  {
    id: 'sprache-job',
    audience: 'job',
    text: 'Wie gut ist dein Deutsch aktuell?',
    type: 'single',
    options: [
      { id: 'a2', label: 'Grundlagen (A2)', tags: ['sprachkurs', 'einfacher-einstieg'] },
      { id: 'b1', label: 'Alltagssicher (B1)', tags: ['b1'] },
      { id: 'b2plus', label: 'Gut bis sehr gut (B2+)', tags: ['b2', 'kommunikativ'] },
    ],
    next: 'bereich-job',
  },
  {
    id: 'bereich-job',
    audience: 'job',
    text: 'Welche Art von Arbeit passt am besten zu dir?',
    type: 'multi',
    options: [
      { id: 'pflege', label: 'Pflege & Menschen unterstützen', tags: ['pflege', 'menschen'] },
      { id: 'bauen', label: 'Bauen, reparieren, anpacken', tags: ['handwerk', 'technik'] },
      { id: 'service', label: 'Service, Gastro, Verkauf', tags: ['service', 'gastro'] },
      { id: 'logistik', label: 'Lager, Logistik, Fahren', tags: ['logistik'] },
      { id: 'office', label: 'Büro & Organisation', tags: ['buero', 'organisation'] },
    ],
    next: 'bedingungen-job',
  },
  {
    id: 'bedingungen-job',
    audience: 'job',
    text: 'Was ist dir in deinem nächsten Job wichtig?',
    type: 'multi',
    options: [
      { id: 'einfacher-einstieg', label: 'Einfacher Einstieg – auch ohne Erfahrung', tags: ['einfacher-einstieg'] },
      { id: 'weiterbildung', label: 'Möglichkeit auf Weiterbildung', tags: ['weiterbildung', 'sprachkurs'] },
      { id: 'sicher', label: 'Stabile, sichere Branche', tags: ['sicherheit'] },
      { id: 'worklife', label: 'Gute Work-Life-Balance', tags: ['zeiten', 'struktur'] },
    ],
    next: 'schicht-job',
  },
  {
    id: 'schicht-job',
    audience: 'job',
    text: 'Kannst du im Schichtdienst arbeiten?',
    type: 'single',
    options: [
      { id: 'schicht-ja', label: 'Ja, Schicht ist okay', tags: ['schicht'] },
      { id: 'schicht-nein', label: 'Lieber keine Schichten', tags: ['tageinsatz'] },
      { id: 'schicht-egal', label: 'Kommt auf den Job an', tags: ['flexibel'] },
    ],
    next: 'RESULT',
  },
];

export function getQuestionsForAudience(audience: FinderAudience): FinderQuestion[] {
  return audience === 'ausbildung' ? AUSBILDUNG_QUESTIONS : JOB_QUESTIONS;
}

