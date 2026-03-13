/**
 * Branchen-Konfiguration für Karriere-Unterseiten
 * Wird von CareerFieldsSection und CareerBranchLandingPage genutzt
 */

export type LayoutStyle = 'warm' | 'clinical' | 'compact' | 'data' | 'elegant' | 'playful';
export type HeroHeight = 'full' | 'compact' | 'minimal';
export type FontFamily = 'playfair' | 'sans';
export type SectionId =
  | 'hero' | 'trust' | 'schritte' | 'wuensche' | 'fachbereiche'
  | 'gewerke' | 'schichttabelle' | 'arbeitsmodelle' | 'orientierung'
  | 'stellen' | 'faq' | 'kontakt' | 'testimonials' | 'profilmockup'
  | 'seo' | 'ressourcen' | 'berufsbild' | 'karrierepfad' | 'persona' | 'warum';

export interface CareerBranchConfig {
  id: string;
  slug: string;
  title: string;
  subline: string;
  description: string;
  buttonText: string;
  link: string;
  image: string;
  heroImage?: string;
  bg: string;
  accent: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  heroHeadline: string;
  heroSubline: string;
  ctaText: string;
  trustText: string;
  features: { title: string; description: string }[];
  layoutStyle: LayoutStyle;
  heroHeight: HeroHeight;
  fontFamily: FontFamily;
  cardRadius: number;
  sectionOrder: SectionId[];
  trustSignals: string[];
}

export const CAREER_BRANCHES: CareerBranchConfig[] = [
  {
    id: 'pflege',
    slug: 'pflege',
    title: 'Pflegekräfte',
    subline: 'Pflege & Gesundheit',
    description: 'Du suchst Wertschätzung und faire Dienstpläne? Wir verbinden dich mit Einrichtungen, die zu deinen Wünschen passen.',
    buttonText: 'Team kennenlernen',
    link: '/karriere/pflege',
    image: '/assets/pflege-ambulant.png',
    bg: 'linear-gradient(180deg,#e8edf5 0%,#ffffff 100%)',
    accent: '#5170ff',
    seoTitle: 'Pflegekräfte – Jobs & Karriere bei BeVisiblle',
    seoDescription: 'Finde passende Stellen in der Pflege. Vernetze dich mit Arbeitgebern, die Wertschätzung und faire Dienstpläne bieten.',
    seoKeywords: ['Pflegekräfte', 'Pflege Jobs', 'Krankenpflege', 'Altenpflege', 'BeVisiblle'],
    heroHeadline: 'Finde die Einrichtung, die zu deinem Leben passt.',
    heroSubline: 'Sag uns, was dir wichtig ist – Schichten, Ort, Fachbereich. Passende Arbeitgeber melden sich bei dir.',
    ctaText: 'Kostenlos Profil erstellen',
    trustText: 'Kostenlos und unverbindlich.',
    features: [
      { title: 'Was dir wichtig ist angeben', description: 'Wunschschichten, Fachbereich, Region, Gehaltswunsch – du bestimmst die Kriterien.' },
      { title: 'Sichtbar werden – wenn du willst', description: 'Du entscheidest, wann Arbeitgeber dich finden dürfen. Kein Druck, volle Kontrolle.' },
      { title: 'Einrichtungen melden sich', description: 'Passende Arbeitgeber sehen dein Profil und schreiben dich an. Du wählst aus.' },
    ],
    layoutStyle: 'warm',
    heroHeight: 'compact',
    fontFamily: 'playfair',
    cardRadius: 20,
    sectionOrder: ['hero', 'trust', 'persona', 'wuensche', 'schritte', 'warum', 'stellen', 'testimonials', 'faq', 'profilmockup', 'kontakt', 'seo', 'ressourcen'],
    trustSignals: ['DSGVO-konform', 'Kostenlos für Pflegekräfte', 'Profil jederzeit löschbar'],
  },
  {
    id: 'funktionsdienste',
    slug: 'funktionsdienste',
    title: 'Funktionsdienste',
    subline: 'Klinik & Diagnostik',
    description: 'Arbeite mit modernster Technik. Finde Kliniken und Zentren, die deine Expertise im OP oder der Diagnostik wirklich fördern.',
    buttonText: 'Profil zeigen',
    link: '/karriere/pflege/funktionsdienste',
    image: '/assets/pflege-klinik.png',
    bg: 'linear-gradient(180deg,#eef5f2 0%,#ffffff 100%)',
    accent: '#10b981',
    seoTitle: 'Funktionsdienste OTA ATA MTR – Karriere bei BeVisiblle',
    seoDescription: 'Jobs für Operationstechnische, Anästhesietechnische und Medizinisch-Technische Assistenten. Finde Kliniken, die deine Expertise fördern.',
    seoKeywords: ['OTA', 'ATA', 'MTR', 'Funktionsdienste', 'OP-Assistent', 'BeVisiblle'],
    heroHeadline: 'Dein OP kennt dich. Dein nächster Arbeitgeber sollte es auch.',
    heroSubline: 'OTA, ATA, MTR – zeig dein Spezialwissen. Kliniken, die deine Expertise verstehen, melden sich diskret bei dir.',
    ctaText: 'Fachprofil erstellen',
    trustText: 'Diskret und kostenlos.',
    features: [
      { title: 'Fachprofil anlegen', description: 'Funktionsbereich, Geräte-Know-how, Zertifikate – zeig, was du wirklich kannst.' },
      { title: 'Diskret sichtbar werden', description: 'Du bestimmst, wann und für wen du erreichbar bist. Dein aktueller Arbeitgeber erfährt nichts.' },
      { title: 'Passende Kliniken melden sich', description: 'Kliniken, die genau dein Profil brauchen, nehmen Kontakt auf. Du entscheidest.' },
    ],
    layoutStyle: 'clinical',
    heroHeight: 'compact',
    fontFamily: 'sans',
    cardRadius: 12,
    sectionOrder: ['hero', 'trust', 'persona', 'fachbereiche', 'schritte', 'warum', 'stellen', 'faq', 'profilmockup', 'kontakt', 'seo', 'ressourcen'],
    trustSignals: ['DSGVO-konform', 'Kostenlos', 'Dein Arbeitgeber erfährt nichts', 'Profil jederzeit löschbar'],
  },
  {
    id: 'handwerk',
    slug: 'handwerk',
    title: 'Handwerker',
    subline: 'Handwerk & Bau',
    description: 'Dein Können ist gefragt. Egal ob Schreiner, KFZ oder Dachdecker – wir connecten dich mit Betrieben, bei denen Arbeitsklima und Bezahlung stimmen.',
    buttonText: 'Können zeigen',
    link: '/karriere/handwerk',
    image: '/assets/Handwerker.png',
    bg: 'linear-gradient(180deg,#fef7ed 0%,#ffffff 100%)',
    accent: '#f59e0b',
    seoTitle: 'Handwerker – Jobs & Karriere bei BeVisiblle',
    seoDescription: 'Schreiner, KFZ, Dachdecker und mehr. Finde Betriebe, bei denen Arbeitsklima und Bezahlung stimmen.',
    seoKeywords: ['Handwerker', 'Handwerk Jobs', 'Schreiner', 'KFZ', 'Dachdecker', 'BeVisiblle'],
    heroHeadline: 'Guter Lohn. Gutes Team. Gutes Werkzeug.',
    heroSubline: 'Zeig, was du draufhast. Betriebe, die fair bezahlen und richtig ausstatten, melden sich bei dir.',
    ctaText: 'Können zeigen',
    trustText: 'Kostenlos. Ohne Bewerbungsschreiben.',
    features: [
      { title: 'Gewerk & Skills eintragen', description: 'Was du kannst, welche Maschinen du kennst, wo du arbeiten willst. Fertig in 5 Minuten.' },
      { title: 'Selbst bestimmen', description: 'Du sagst, wann Betriebe dich kontaktieren dürfen. Kein Spam, keine Anrufe.' },
      { title: 'Betriebe melden sich', description: 'Chefs, die zu dir passen, schreiben dir. Du pickst den Besten raus.' },
    ],
    layoutStyle: 'compact',
    heroHeight: 'minimal',
    fontFamily: 'sans',
    cardRadius: 8,
    sectionOrder: ['hero', 'trust', 'persona', 'gewerke', 'schritte', 'warum', 'stellen', 'testimonials', 'faq', 'profilmockup', 'kontakt', 'seo', 'ressourcen'],
    trustSignals: ['DSGVO-konform', 'Kostenlos', 'Kein Anschreiben nötig', 'Profil jederzeit löschbar'],
  },
  {
    id: 'industriemechaniker',
    slug: 'industriemechaniker',
    title: 'Industriemechaniker',
    subline: 'Industrie & Instandhaltung',
    description: 'Spannende Anlagen und komplexe Maschinen. Finde Industrie-Jobs in der Instandhaltung mit Verantwortung und Perspektive.',
    buttonText: 'Technikprofil anlegen',
    link: '/karriere/industriemechaniker',
    image: '/assets/Industriemechaniker.png',
    bg: 'linear-gradient(180deg,#eef1f8 0%,#ffffff 100%)',
    accent: '#60a5fa',
    seoTitle: 'Industriemechaniker – Jobs & Karriere bei BeVisiblle',
    seoDescription: 'Jobs in der Instandhaltung. Finde Industrie-Betriebe mit spannenden Anlagen und echten Perspektiven.',
    seoKeywords: ['Industriemechaniker', 'Instandhaltung', 'Industrie Jobs', 'BeVisiblle'],
    heroHeadline: 'Finde den Betrieb, der zu deinen Anlagen passt.',
    heroSubline: 'Industriemechaniker, Mechatroniker, Instandhalter – zeig deine Qualifikationen. Betriebe mit passender Technik melden sich.',
    ctaText: 'Technikprofil anlegen',
    trustText: 'Kostenlos und unverbindlich.',
    features: [
      { title: 'Qualifikationen eintragen', description: 'Anlagen, SPS-Kenntnisse, Zertifikate, Schichtbereitschaft – alles in einem Profil.' },
      { title: 'Zeitpunkt selbst bestimmen', description: 'Du legst fest, wann du für Anfragen offen bist. Diskret und ohne Druck.' },
      { title: 'Passende Betriebe finden dich', description: 'Unternehmen aus deiner Region mit passender Technik melden sich direkt.' },
    ],
    layoutStyle: 'data',
    heroHeight: 'compact',
    fontFamily: 'sans',
    cardRadius: 8,
    sectionOrder: ['hero', 'trust', 'persona', 'schichttabelle', 'schritte', 'warum', 'stellen', 'faq', 'profilmockup', 'kontakt', 'seo', 'ressourcen'],
    trustSignals: ['DSGVO-konform', 'Kostenlos', 'Kein Headhunter – direkter Kontakt', 'Profil jederzeit löschbar'],
  },
  {
    id: 'buromanagement',
    slug: 'buromanagement',
    title: 'Büromanagement',
    subline: 'Office & Verwaltung',
    description: 'Du liebst Struktur? Wir verbinden dich mit Unternehmen, die deine Skills in Assistenz und Verwaltung suchen und schätzen.',
    buttonText: 'Talent zeigen',
    link: '/karriere/buromanagement',
    image: '/assets/Buero-management.png',
    bg: 'linear-gradient(180deg,#eef6f8 0%,#ffffff 100%)',
    accent: '#06b6d4',
    seoTitle: 'Büromanagement – Jobs & Karriere bei BeVisiblle',
    seoDescription: 'Jobs in Assistenz und Verwaltung. Finde Unternehmen, die deine Organisationstalente suchen und schätzen.',
    seoKeywords: ['Büromanagement', 'Assistenz', 'Verwaltung', 'Office Jobs', 'BeVisiblle'],
    heroHeadline: 'Homeoffice, Teilzeit, Gleitzeit – du bestimmst.',
    heroSubline: 'Sag, wie du arbeiten willst. Unternehmen, die genau das bieten, melden sich bei dir.',
    ctaText: 'Talent zeigen',
    trustText: 'Kostenlos und unverbindlich.',
    features: [
      { title: 'Skills & Arbeitsmodell angeben', description: 'Software-Kenntnisse, Sprachen, Homeoffice-Wunsch – zeig, was du mitbringst und was dir wichtig ist.' },
      { title: 'Sichtbar werden – du bestimmst', description: 'Dein Profil wird erst freigeschaltet, wenn du bereit bist. Volle Kontrolle.' },
      { title: 'Passende Unternehmen melden sich', description: 'Arbeitgeber, die zu deinen Vorstellungen passen, schreiben dich an.' },
    ],
    layoutStyle: 'elegant',
    heroHeight: 'compact',
    fontFamily: 'playfair',
    cardRadius: 16,
    sectionOrder: ['hero', 'trust', 'persona', 'arbeitsmodelle', 'schritte', 'warum', 'stellen', 'testimonials', 'faq', 'profilmockup', 'kontakt', 'seo', 'ressourcen'],
    trustSignals: ['DSGVO-konform', 'Kostenlos', 'Profil jederzeit löschbar'],
  },
  {
    id: 'ausbildung',
    slug: 'ausbildung',
    title: 'Auszubildende',
    subline: 'Starte deine Karriere',
    description: 'Finde den Ausbildungsplatz, der Spaß macht. Echte Einblicke in coole Teams statt langweiliger Stellenanzeigen.',
    buttonText: 'Loslegen',
    link: '/karriere/ausbildung',
    image: '/assets/Ausbildung.png',
    bg: 'linear-gradient(180deg,#fefcf3 0%,#ffffff 100%)',
    accent: '#fbbf24',
    seoTitle: 'Auszubildende – Ausbildungsplätze bei BeVisiblle',
    seoDescription: 'Finde den Ausbildungsplatz, der zu dir passt. Echte Einblicke in Teams und Betriebe – kein Vitamin B nötig.',
    seoKeywords: ['Auszubildende', 'Ausbildung', 'Azubi', 'Lehrstelle', 'BeVisiblle'],
    heroHeadline: 'Du weißt noch nicht genau, wohin? Gut so.',
    heroSubline: 'Finde heraus, welche Ausbildung zu dir passt – mit echten Einblicken in Betriebe und Teams, die in dich investieren.',
    ctaText: 'Kostenlos loslegen',
    trustText: 'Kostenlos. Für alle Schulabschlüsse.',
    features: [
      { title: 'Erzähl, was dich interessiert', description: 'Kein Lebenslauf, kein Anschreiben. Sag einfach, was dir Spaß macht und was dir wichtig ist.' },
      { title: 'Berufe und Teams entdecken', description: 'Schau dir an, wie Betriebe wirklich ticken – echte Einblicke statt leerer Versprechen.' },
      { title: 'Betriebe kommen auf dich zu', description: 'Ausbildungsbetriebe, die zu dir passen, melden sich. Du entscheidest.' },
    ],
    layoutStyle: 'playful',
    heroHeight: 'full',
    fontFamily: 'sans',
    cardRadius: 24,
    sectionOrder: ['hero', 'trust', 'persona', 'orientierung', 'schritte', 'warum', 'stellen', 'testimonials', 'faq', 'kontakt', 'seo', 'ressourcen'],
    trustSignals: ['DSGVO-konform', 'Kostenlos für Azubis', 'Alle Schulabschlüsse willkommen', 'Profil jederzeit löschbar'],
  },
];

export function getBranchBySlug(slug: string): CareerBranchConfig | undefined {
  return CAREER_BRANCHES.find((b) => b.slug === slug || b.link === `/karriere/${slug}` || b.link.endsWith(`/${slug}`));
}

export function getBranchByPath(pathname: string): CareerBranchConfig | undefined {
  const path = pathname.replace(/^\/karriere\/?/, '').replace(/\/$/, '');
  return CAREER_BRANCHES.find((b) => {
    const branchPath = b.link.replace(/^\/karriere\/?/, '').replace(/\/$/, '');
    return path === branchPath;
  });
}
