/**
 * Branchenspezifischer Content für Karriere-Unterseiten
 * Arbeitgeber, Jobs, FAQs, Testimonials pro Branche
 */

export interface EmployerItem {
  name: string;
  logo?: string;
  jobsCount?: number;
  location?: string;
}

export interface JobItem {
  title: string;
  employer: string;
  location: string;
  type?: string;
  /** Kurze Beschreibung wie bei baypw.de */
  description?: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface TestimonialItem {
  name: string;
  role: string;
  quote: string;
  employer?: string;
}

export type BranchId = 'pflege' | 'funktionsdienste' | 'handwerk' | 'industriemechaniker' | 'buromanagement' | 'ausbildung';

export interface BacklinkItem {
  label: string;
  url: string;
  description?: string;
}

export interface GeoRegionItem {
  region: string;
  cities?: string[];
  description: string;
}

/** Wie baypw.de "Drei Säulen" – informativ, Bullet-Points */
export interface BerufsbildItem {
  title: string;
  items: string[];
}

export interface BranchContent {
  employers: EmployerItem[];
  jobs: JobItem[];
  faqs: FAQItem[];
  testimonials: TestimonialItem[];
  backlinks: BacklinkItem[];
  geoRegions?: GeoRegionItem[];
  /** Über die Branche – sachlicher Intro-Text */
  introText?: string;
  /** Berufsbild / Drei Säulen – informativ wie baypw.de */
  berufsbild?: BerufsbildItem[];
  /** Ausbildung: Dauer, Form (dual/schulisch) */
  ausbildung?: { duration: string; form: string };
  /** Arbeitsorte – wo arbeitet man? */
  arbeitsorte?: string[];
  /** Wie baypw „Unsere Leistungen“ – 4 Karten */
  leistungen?: { title: string; description: string }[];
  /** Wie baypw „Unsere Werte“ – 4 Punkte */
  werte?: { title: string; description: string }[];
  /** Wie baypw „Verständlich erklärt“ – 3–4 Blöcke */
  verstaendlich?: { question: string; answer: string }[];
  seoLongText?: string;
  persona?: { title: string; text: string; points: string[] };
  seoCities?: string[];
  seoSearchTerms?: string[];
  wuensche?: WunschItem[];
  fachbereiche?: FachbereichItem[];
  deviceExpertise?: string[];
  gewerke?: string[];
  schichtmodelle?: string[];
  tarifInfo?: string;
  arbeitsmodelle?: string[];
  softwareSkills?: string[];
  orientierung?: OrientierungItem[];
  elternBox?: { title: string; text: string; points: string[] };
  kontakt?: { name: string; role: string; email: string };
}

export interface WunschItem {
  icon: string;
  title: string;
  description: string;
}

export interface FachbereichItem {
  id: string;
  label: string;
  description: string;
  stellen: string[];
}

export interface OrientierungItem {
  branche: string;
  icon: string;
  description: string;
  beispielBerufe: string[];
}

const EMPLOYER_LOGOS: Record<string, string> = {
  'Klinikum Mitte': '/assets/employers/klinikum-mitte.png',
  'Helios Kliniken': '/assets/employers/helios.png',
  'AWO Berlin': '/assets/employers/awo.png',
  'Asklepios': '/assets/employers/asklepios.png',
  'Rothenberger': '/assets/employers/rothenberger.png',
  'Fraport': '/assets/employers/fraport.png',
  'Thyssenkrupp': '/assets/employers/thyssenkrupp.png',
  'Curmundo': '/assets/employers/curmundo.png',
  'Merck': '/assets/employers/merck.jpg',
};

export const BRANCH_CONTENT: Record<BranchId, BranchContent> = {
  pflege: {
    introText: 'Sag uns, was dir wichtig ist. Einrichtungen, die zu deinem Leben passen, melden sich bei dir.',
    ausbildung: { duration: '3 Jahre', form: 'Dual (Schule + Praxis)' },
    arbeitsorte: ['Krankenhäuser', 'Pflegeheime', 'Ambulante Pflege', 'Reha'],
    geoRegions: [
      { region: 'Hamburg & Norddeutschland', cities: ['Hamburg', 'Bremen', 'Kiel', 'Lübeck'], description: 'Kliniken und Pflegeeinrichtungen in Hamburg und Umgebung suchen kontinuierlich nach Pflegefachkräften.' },
      { region: 'Berlin & Brandenburg', cities: ['Berlin', 'Potsdam'], description: 'Große Träger wie AWO, Caritas und DRK sind in der Hauptstadtregion stark vertreten.' },
      { region: 'Bayern & Süddeutschland', cities: ['München', 'Nürnberg', 'Augsburg'], description: 'Klinikverbünde und Altenpflegeeinrichtungen bieten attraktive Arbeitsbedingungen.' },
    ],
    backlinks: [
      { label: 'Deutscher Berufsverband für Pflegeberufe (DBfK)', url: 'https://www.dbfk.de', description: 'Fachverband für Pflegeberufe' },
      { label: 'Bundesagentur für Arbeit – Pflege', url: 'https://www.arbeitsagentur.de', description: 'Offizielle Stellenbörse' },
      { label: 'Pflegekammer Hamburg', url: 'https://www.pflegekammer-hamburg.de', description: 'Berufsvertretung Pflege' },
      { label: 'Bundesministerium für Gesundheit – Pflegeberuf', url: 'https://www.bundesgesundheitsministerium.de', description: 'Informationen zur Pflegeausbildung' },
      { label: 'Deutsches Rotes Kreuz – Karriere', url: 'https://www.drk.de', description: 'Jobs im Gesundheitswesen' },
    ],
    employers: [
      { name: 'Klinikum Mitte', logo: EMPLOYER_LOGOS['Klinikum Mitte'], jobsCount: 12, location: 'Hamburg' },
      { name: 'Helios Kliniken', logo: EMPLOYER_LOGOS['Helios Kliniken'], jobsCount: 28, location: 'Bundesweit' },
      { name: 'AWO Berlin', logo: EMPLOYER_LOGOS['AWO Berlin'], jobsCount: 15, location: 'Berlin' },
      { name: 'Asklepios', logo: EMPLOYER_LOGOS['Asklepios'], jobsCount: 34, location: 'Bundesweit' },
    ],
    jobs: [
      { title: 'Pflegefachkraft (m/w/d) Intensiv', employer: 'Klinikum Mitte', location: 'Hamburg', type: 'Vollzeit', description: 'Bezugspflege auf der Intensivstation – mit festem Team und fairen Rahmenbedingungen.' },
      { title: 'Altenpfleger:in (m/w/d)', employer: 'AWO Berlin', location: 'Berlin', type: 'Teilzeit', description: 'Pflege und Betreuung im stationären Bereich – mit Zeit für Menschen.' },
      { title: 'Gesundheits- und Krankenpfleger:in', employer: 'Helios Kliniken', location: 'Erfurt', type: 'Vollzeit', description: 'Vollversorgung in der Akutpflege – moderne Klinik, feste Bezugsteams.' },
      { title: 'Pflegefachkraft ambulant', employer: 'Asklepios', location: 'Hamburg', type: 'Vollzeit', description: 'Pflege zuhause – verlässliche Bezugspflege in der Region.' },
      { title: 'Stationsleitung Pflege', employer: 'Klinikum Mitte', location: 'Hamburg', type: 'Vollzeit', description: 'Fachliche und personelle Leitung einer Station – mit Erfahrung.' },
    ],
    faqs: [
      { question: 'Ist BeVisiblle wirklich kostenlos?', answer: 'Ja, komplett. Für Pflegekräfte entstehen keine Kosten – weder für die Registrierung noch für den Kontakt mit Arbeitgebern. Deine Daten gehören dir und du kannst dein Profil jederzeit löschen.' },
      { question: 'Welche Qualifikationen brauche ich?', answer: 'Du kannst dich anmelden, ob mit Ausbildung (z.B. Pflegefachfrau/-mann), Umschulung oder als Quereinsteiger. Viele Arbeitgeber suchen auch Hilfskräfte und bieten Weiterbildung an.' },
      { question: 'Wie schnell werde ich von Arbeitgebern kontaktiert?', answer: 'Viele unserer Mitglieder erhalten bereits in der ersten Woche Nachrichten von Recruitern. Je vollständiger dein Profil und je sichtbarer du bist, desto höher die Chance auf passende Anfragen.' },
      { question: 'Kann ich auch Teilzeit oder in bestimmten Schichten arbeiten?', answer: 'Ja. In deinem Profil gibst du deine Wünsche an – Vollzeit, Teilzeit, Schichtmodelle. Arbeitgeber sehen das und kontaktieren dich nur, wenn es zu dir passt.' },
      { question: 'Was passiert mit meinen Daten?', answer: 'Deine Daten werden nur für die Jobvermittlung genutzt. Du bestimmst, wer dein Profil sehen darf. Mehr dazu in unserer Datenschutzerklärung.' },
    ],
    testimonials: [
      { name: 'Maria K.', role: 'Pflegefachkraft', quote: 'Ich habe mein Profil an einem Sonntagabend erstellt. Am Dienstag hatte ich die erste Nachricht von einer Intensivstation in meiner Nähe. Kein Anschreiben, kein Lebenslauf – einfach so.', employer: 'Klinikum Mitte' },
      { name: 'Tom R.', role: 'Altenpfleger', quote: 'Nach 12 Jahren in der Altenpflege wollte ich wechseln, aber keine Bewerbungen mehr schreiben. Bei BeVisiblle konnte ich einfach sagen, was mir wichtig ist. Die AWO hat sich bei mir gemeldet.', employer: 'AWO Berlin' },
      { name: 'Lisa M.', role: 'Pflegefachkraft', quote: 'Endlich muss ich nicht mehr Stellenanzeigen durchforsten. Ich habe angegeben, dass ich nur Tagdienst will – und genau solche Angebote kamen.', employer: 'Helios Kliniken' },
    ],
    persona: {
      title: 'Für wen ist BeVisiblle?',
      text: 'Pflegekräfte aller Fachbereiche – Intensiv, OP, Allgemein, Altenpflege – die einen Arbeitgeber suchen, der wirklich zu ihrem Leben passt.',
      points: ['Kostenlos für dich', 'DSGVO-konform', 'Profil jederzeit löschbar'],
    },
    seoCities: ['Hamburg', 'Berlin', 'München', 'Köln', 'Frankfurt'],
    seoSearchTerms: ['Pflege Jobs Hamburg', 'Pflege Jobs Berlin', 'Pflege Jobs München', 'Pflege Jobs Köln', 'Pflege Jobs Frankfurt'],
    wuensche: [
      { icon: '🕐', title: 'Wunschschichten', description: 'Früh, Spät, Nacht oder nur Tagdienst – du gibst an, was zu deinem Leben passt.' },
      { icon: '👥', title: 'Teamgröße & Bezugspflege', description: 'Kleines Team oder große Station? Feste Bezugspflege oder Rotation? Du entscheidest.' },
      { icon: '💰', title: 'Gehalt & Tarif', description: 'Sag, was du dir vorstellst. Arbeitgeber sehen das und kontaktieren dich nur passend.' },
      { icon: '📍', title: 'Ort & Pendelstrecke', description: 'Gib an, wie weit du fahren willst. Nur Einrichtungen in deiner Nähe sehen dein Profil.' },
    ],
    kontakt: { name: 'Dein BeVisiblle-Team', role: 'Ansprechpartner für Pflegekräfte', email: 'pflege@bevisiblle.de' },
  },
  funktionsdienste: {
    introText: 'OTA, ATA und MTR – zeig dein Spezialwissen. Kliniken, die deine Expertise verstehen, finden dich diskret über BeVisiblle.',
    berufsbild: [
      { title: 'OTA', items: ['Vor- und Nachbereitung von Operationen', 'Assistenz im OP', 'Steriles Arbeiten', 'Instrumentenpflege'] },
      { title: 'ATA', items: ['Vorbereitung der Narkose', 'Überwachung während der Narkose', 'Pflege der Geräte', 'Teamarbeit mit Anästhesisten'] },
      { title: 'MTR', items: ['Röntgen, CT, MRT', 'Strahlenschutz', 'Patientenbetreuung', 'Bilddokumentation'] },
    ],
    ausbildung: { duration: '3 Jahre', form: 'Schulisch mit Praktika' },
    arbeitsorte: ['Krankenhäuser', 'MVZ', 'Radiologische Praxen'],
    geoRegions: [
      { region: 'Hamburg & Nord', cities: ['Hamburg', 'Bremen'], description: 'Universitätskliniken und Maximalversorger suchen OTA, ATA und MTR.' },
      { region: 'Berlin & Ost', cities: ['Berlin', 'Leipzig'], description: 'Große Klinikverbünde mit Zentral-OP und Radiologie.' },
    ],
    backlinks: [
      { label: 'Verband der Operationstechnischen Assistenten', url: 'https://www.vota.de', description: 'Berufsverband OTA' },
      { label: 'Bundesagentur für Arbeit – Gesundheitsberufe', url: 'https://www.arbeitsagentur.de', description: 'Stellenangebote' },
      { label: 'Deutsche Gesellschaft für Anästhesiologie', url: 'https://www.dgai.de', description: 'Fachgesellschaft' },
      { label: 'Deutsche Röntgengesellschaft', url: 'https://www.drg.de', description: 'Radiologie & MTR' },
      { label: 'Helios Kliniken – Karriere', url: 'https://www.helios-gesundheit.de', description: 'Arbeitgeber im Gesundheitswesen' },
    ],
    employers: [
      { name: 'Klinikum Mitte', logo: EMPLOYER_LOGOS['Klinikum Mitte'], jobsCount: 5, location: 'Hamburg' },
      { name: 'Helios Kliniken', logo: EMPLOYER_LOGOS['Helios Kliniken'], jobsCount: 18, location: 'Bundesweit' },
      { name: 'Asklepios', logo: EMPLOYER_LOGOS['Asklepios'], jobsCount: 22, location: 'Bundesweit' },
    ],
    jobs: [
      { title: 'OTA (m/w/d)', employer: 'Helios Kliniken', location: 'Erfurt', type: 'Vollzeit', description: 'Assistenz im Zentral-OP – mit moderner Technik und festem Team.' },
      { title: 'ATA (m/w/d)', employer: 'Klinikum Mitte', location: 'Hamburg', type: 'Vollzeit', description: 'Anästhesie-Assistenz – verlässliche Abläufe, erfahrenes Team.' },
      { title: 'MTR (m/w/d)', employer: 'Asklepios', location: 'Hamburg', type: 'Vollzeit', description: 'Radiologie und Bildgebung – CT, MRT, Röntgen.' },
      { title: 'OTA für Zentral-OP', employer: 'Helios Kliniken', location: 'Berlin', type: 'Vollzeit', description: 'OP-Assistenz in verschiedenen Fachbereichen.' },
    ],
    faqs: [
      { question: 'Kostet BeVisiblle etwas?', answer: 'Nein. Für Fachkräfte ist BeVisiblle komplett kostenlos. Deine Daten sind DSGVO-konform geschützt und du kannst dein Profil jederzeit löschen.' },
      { question: 'Gibt es Jobs in Teilzeit?', answer: 'Ja. Viele Kliniken bieten flexible Modelle. In deinem Profil kannst du deine Wünsche angeben – Arbeitgeber sehen das und kontaktieren dich passend.' },
      { question: 'Wie läuft der Kontakt mit Kliniken ab?', answer: 'Du erstellst dein Profil, wirst sichtbar. Recruiter von Kliniken schreiben dich direkt im Chat an. Du antwortest, wann du möchtest – unkompliziert und persönlich.' },
    ],
    testimonials: [
      { name: 'Sandra M.', role: 'OTA', quote: 'Im Zentral-OP kennt jeder die Stellenanzeigen – immer dieselben Floskeln. Bei BeVisiblle konnte ich angeben, welche Geräte ich kenne und was mir wichtig ist. Helios hat sich gemeldet und es hat sofort gepasst.', employer: 'Helios Kliniken' },
      { name: 'Klaus B.', role: 'MTR', quote: 'Als MTR will ich wissen, mit welchen Geräten ich arbeite, bevor ich irgendwo anfange. Bei BeVisiblle konnte ich genau das angeben. Asklepios hat mich kontaktiert – auf Augenhöhe.', employer: 'Asklepios' },
    ],
    persona: {
      title: 'Für wen ist BeVisiblle?',
      text: 'OTA, ATA und MTR, die ihr Spezialwissen nicht mehr verstecken wollen – und Kliniken suchen, die ihre Expertise wirklich verstehen.',
      points: ['Kostenlos', 'Diskret – dein Arbeitgeber erfährt nichts', 'Profil jederzeit löschbar'],
    },
    seoCities: ['Hamburg', 'Berlin', 'München', 'Köln', 'Frankfurt'],
    seoSearchTerms: ['OTA Jobs Hamburg', 'ATA Jobs Berlin', 'MTR Jobs München', 'Funktionsdienste Jobs Köln'],
    fachbereiche: [
      { id: 'ota', label: 'OTA', description: 'Operationstechnische Assistenz – Vorbereitung, Assistenz und Nachbereitung im OP.', stellen: ['OTA Zentral-OP', 'OTA Kardiochirurgie', 'OTA Orthopädie'] },
      { id: 'ata', label: 'ATA', description: 'Anästhesietechnische Assistenz – Narkosevorbereitung, Überwachung und Gerätemanagement.', stellen: ['ATA Anästhesie', 'ATA Aufwachraum', 'ATA Ambulante OP'] },
      { id: 'mtr', label: 'MTR', description: 'Medizinisch-Technische Radiologie – CT, MRT, Röntgen und Strahlenschutz.', stellen: ['MTR Radiologie', 'MTR Nuklearmedizin', 'MTR MRT-Diagnostik'] },
    ],
    deviceExpertise: ['Siemens Healthineers', 'Dräger', 'Stryker', 'Olympus', 'GE Healthcare', 'Philips', 'Maquet'],
    kontakt: { name: 'Dein BeVisiblle-Team', role: 'Ansprechpartner für Funktionsdienste', email: 'funktionsdienste@bevisiblle.de' },
  },
  handwerk: {
    introText: 'Zeig, was du kannst. Betriebe, die fair bezahlen und gutes Werkzeug stellen, finden dich über BeVisiblle.',
    geoRegions: [
      { region: 'Hessen & Rhein-Main', cities: ['Frankfurt', 'Wiesbaden', 'Darmstadt'], description: 'Starke Industrie- und Handwerksregion mit vielen Betrieben.' },
      { region: 'NRW & Ruhrgebiet', cities: ['Essen', 'Dortmund', 'Duisburg', 'Köln'], description: 'Traditionelle Handwerkshochburg mit großer Nachfrage.' },
      { region: 'Bayern & Süddeutschland', cities: ['München', 'Nürnberg', 'Stuttgart'], description: 'Wachstumsstarke Region mit vielen Ausbildungsbetrieben.' },
    ],
    backlinks: [
      { label: 'Zentralverband des Deutschen Handwerks (ZDH)', url: 'https://www.zdh.de', description: 'Dachverband Handwerk' },
      { label: 'Handwerkskammer – Handwerksberufe', url: 'https://www.handwerk.de', description: 'Übersicht aller Berufe' },
      { label: 'Bundesagentur für Arbeit – Handwerk', url: 'https://www.arbeitsagentur.de', description: 'Stellenangebote' },
      { label: 'Würth – Karriere Handwerk', url: 'https://www.wuerth.de', description: 'Großer Arbeitgeber im Handwerk' },
      { label: 'Initiative Handwerk', url: 'https://www.handwerk.de', description: 'Nachwuchs & Karriere' },
    ],
    employers: [
      { name: 'Rothenberger', logo: EMPLOYER_LOGOS['Rothenberger'], jobsCount: 8, location: 'Hessen' },
      { name: 'Thyssenkrupp', logo: EMPLOYER_LOGOS['Thyssenkrupp'], jobsCount: 24, location: 'Bundesweit' },
      { name: 'Fraport', logo: EMPLOYER_LOGOS['Fraport'], jobsCount: 12, location: 'Frankfurt' },
    ],
    jobs: [
      { title: 'Elektriker (m/w/d) Anlagenbau', employer: 'Rothenberger', location: 'Hessen', type: 'Vollzeit', description: 'Anlagenbau und Montage – mit festem Team und fairen Rahmenbedingungen.' },
      { title: 'KFZ-Mechatroniker:in', employer: 'Thyssenkrupp', location: 'Essen', type: 'Vollzeit', description: 'Wartung und Reparatur – moderne Werkstatt, gute Ausstattung.' },
      { title: 'Schreiner:in / Tischler:in', employer: 'Fraport', location: 'Frankfurt', type: 'Vollzeit', description: 'Innenausbau und Möbel – vielfältige Projekte.' },
      { title: 'Dachdecker:in (m/w/d)', employer: 'Thyssenkrupp', location: 'Bundesweit', type: 'Vollzeit', description: 'Dach- und Fassadenarbeiten – sicheres Team.' },
      { title: 'Mechatroniker:in Instandhaltung', employer: 'Fraport', location: 'Frankfurt', type: 'Vollzeit', description: 'Instandhaltung von Anlagen – spannende Technik.' },
    ],
    faqs: [
      { question: 'Kostet das was?', answer: 'Nein. Für Handwerker ist BeVisiblle komplett kostenlos. Deine Daten sind geschützt und du kannst dein Profil jederzeit löschen.' },
      { question: 'Sind die Arbeitgeber seriös?', answer: 'Wir prüfen Unternehmen, bevor sie auf BeVisiblle aktiv werden. Du siehst echte Betriebe mit echten Stellen – keine unseriösen Angebote.' },
      { question: 'Kann ich mich in einer bestimmten Region suchen lassen?', answer: 'Ja. Du gibst deinen Standort und deine Wunschregion an. Arbeitgeber filtern danach und kontaktieren dich nur, wenn es zu dir passt.' },
    ],
    testimonials: [
      { name: 'Klaus B.', role: 'Elektriker', quote: 'Ich hab mein Profil in 5 Minuten ausgefüllt. Zwei Tage später hat der Chef von Rothenberger persönlich geschrieben. So muss das laufen.', employer: 'Rothenberger' },
      { name: 'David M.', role: 'KFZ-Mechatroniker', quote: 'Kein Anschreiben, kein Lebenslauf. Einfach gesagt was ich kann und wo ich arbeiten will. Thyssenkrupp hat sich gemeldet. Fertig.', employer: 'Thyssenkrupp' },
      { name: 'Julia K.', role: 'Tischlerin', quote: 'Als Tischlerin wirst du auf normalen Portalen nicht ernst genommen. Hier hat Fraport mich direkt angeschrieben – weil mein Profil gepasst hat, nicht weil ich Vitamin B hatte.', employer: 'Fraport' },
    ],
    persona: {
      title: 'Für wen ist BeVisiblle?',
      text: 'Handwerker – Gesellen, Meister, Facharbeiter – die Betriebe suchen, bei denen Lohn, Team und Werkzeug stimmen.',
      points: ['Kostenlos', 'Kein Anschreiben nötig', 'Profil jederzeit löschbar'],
    },
    seoCities: ['Frankfurt', 'Essen', 'Hamburg', 'München', 'Köln'],
    seoSearchTerms: ['Handwerker Jobs Frankfurt', 'Handwerker Jobs Essen', 'Handwerker Jobs Hamburg', 'Schreiner Jobs München', 'KFZ Jobs Köln'],
    gewerke: ['Elektro', 'KFZ', 'Bau', 'Holz', 'Metall', 'Sanitär', 'Maler', 'Dachdecker'],
    kontakt: { name: 'Dein BeVisiblle-Team', role: 'Ansprechpartner für Handwerker', email: 'handwerk@bevisiblle.de' },
  },
  industriemechaniker: {
    introText: 'Zeig deine Qualifikationen. Betriebe mit passender Technik und fairem Tarif melden sich bei dir.',
    berufsbild: [
      { title: 'Tätigkeiten', items: ['Instandhaltung von Maschinen und Anlagen', 'Montage und Demontage', 'Fehlerdiagnose', 'Dokumentation'] },
      { title: 'Schwerpunkte', items: ['Instandhaltung', 'Produktionstechnik', 'Maschinen- und Anlagenbau', 'Feinmechanik'] },
      { title: 'Ausbildung', items: ['3,5 Jahre duale Ausbildung', 'Industrie- und Handelskammer', 'Techniker/Meister möglich'] },
    ],
    geoRegions: [
      { region: 'Ruhrgebiet & NRW', cities: ['Essen', 'Duisburg', 'Dortmund'], description: 'Starke Industrieregion mit vielen Großbetrieben.' },
      { region: 'Rhein-Main', cities: ['Frankfurt', 'Darmstadt', 'Mainz'], description: 'Chemie, Pharma und Logistik.' },
    ],
    backlinks: [
      { label: 'Gesamtmetall – Metall- und Elektroindustrie', url: 'https://www.gesamtmetall.de', description: 'Arbeitgeberverband' },
      { label: 'Bundesagentur für Arbeit – Industrie', url: 'https://www.arbeitsagentur.de', description: 'Stellenangebote' },
      { label: 'Thyssenkrupp Karriere', url: 'https://www.thyssenkrupp.com', description: 'Großer Industrie-Arbeitgeber' },
      { label: 'VDMA – Maschinenbau', url: 'https://www.vdma.org', description: 'Verband Maschinenbau' },
      { label: 'Merck Karriere', url: 'https://www.merckgroup.com', description: 'Pharma & Chemie' },
    ],
    employers: [
      { name: 'Thyssenkrupp', logo: EMPLOYER_LOGOS['Thyssenkrupp'], jobsCount: 18, location: 'Bundesweit' },
      { name: 'Merck', logo: EMPLOYER_LOGOS['Merck'], jobsCount: 9, location: 'Darmstadt' },
      { name: 'Fraport', logo: EMPLOYER_LOGOS['Fraport'], jobsCount: 7, location: 'Frankfurt' },
    ],
    jobs: [
      { title: 'Industriemechaniker:in Instandhaltung', employer: 'Thyssenkrupp', location: 'Essen', type: 'Vollzeit', description: 'Wartung und Instandhaltung – moderne Anlagen, erfahrenes Team.' },
      { title: 'Techniker:in Anlagenwartung', employer: 'Merck', location: 'Darmstadt', type: 'Vollzeit', description: 'Anlagenwartung in der Pharma – präzise Arbeit.' },
      { title: 'Mechatroniker:in Produktion', employer: 'Fraport', location: 'Frankfurt', type: 'Vollzeit', description: 'Produktion und Instandhaltung – vielfältige Technik.' },
      { title: 'Industriemechaniker:in Maschinenbau', employer: 'Thyssenkrupp', location: 'Duisburg', type: 'Vollzeit', description: 'Montage und Instandhaltung – große Anlagen.' },
    ],
    faqs: [
      { question: 'Ist BeVisiblle kostenlos?', answer: 'Ja, komplett. Für Fachkräfte entstehen keine Kosten. Deine Daten sind DSGVO-konform geschützt.' },
      { question: 'Gibt es Schichtarbeit?', answer: 'Das hängt vom Betrieb ab. In deinem Profil kannst du deine Präferenzen angeben. Viele Unternehmen bieten auch Tagschicht oder flexible Modelle.' },
      { question: 'Wie schnell geht die Vermittlung?', answer: 'Viele unserer Mitglieder erhalten innerhalb von 1–2 Wochen erste Kontakte. Je vollständiger dein Profil, desto besser die Chancen.' },
    ],
    testimonials: [],
    persona: {
      title: 'Für wen ist BeVisiblle?',
      text: 'Industriemechaniker, Mechatroniker und Instandhalter, die einen Betrieb suchen, der zu ihren Anlagen und Qualifikationen passt.',
      points: ['Kostenlos', 'DSGVO-konform', 'Keine Vermittlungsgebühren'],
    },
    seoCities: ['Essen', 'Duisburg', 'Darmstadt', 'Frankfurt'],
    seoSearchTerms: ['Industriemechaniker Jobs Essen', 'Instandhaltung Jobs Duisburg', 'Industriemechaniker Jobs Darmstadt', 'Industriemechaniker Jobs Frankfurt'],
    schichtmodelle: ['Tagschicht', 'Frühschicht', 'Spätschicht', 'Nachtschicht', 'Wechselschicht', 'Vollkonti'],
    tarifInfo: 'Viele Industrie-Arbeitgeber auf BeVisiblle zahlen nach IG-Metall-Tarif oder vergleichbaren Rahmenverträgen.',
    kontakt: { name: 'Dein BeVisiblle-Team', role: 'Ansprechpartner für Industriemechaniker', email: 'industrie@bevisiblle.de' },
  },
  buromanagement: {
    introText: 'Finde das Unternehmen, das deine Struktur schätzt. Arbeitgeber, die Organisationstalent wirklich brauchen, melden sich bei dir.',
    geoRegions: [
      { region: 'Hamburg & Nord', cities: ['Hamburg', 'Bremen'], description: 'Handel, Logistik und Dienstleistungen.' },
      { region: 'Rhein-Main', cities: ['Frankfurt', 'Darmstadt'], description: 'Finanzbranche, Pharma, Industrie.' },
    ],
    backlinks: [
      { label: 'Industrie- und Handelskammer (IHK)', url: 'https://www.ihk.de', description: 'Ausbildung & Weiterbildung' },
      { label: 'Bundesagentur für Arbeit – Büro', url: 'https://www.arbeitsagentur.de', description: 'Stellenangebote' },
      { label: 'Bundesverband der Sekretärinnen', url: 'https://www.bds.de', description: 'Berufsverband' },
      { label: 'XING – Büro & Verwaltung', url: 'https://www.xing.com', description: 'Karrierenetzwerk' },
      { label: 'StepStone – Bürojobs', url: 'https://www.stepstone.de', description: 'Stellenportal' },
    ],
    employers: [
      { name: 'Curmundo', logo: EMPLOYER_LOGOS['Curmundo'], jobsCount: 6, location: 'Hamburg' },
      { name: 'Merck', logo: EMPLOYER_LOGOS['Merck'], jobsCount: 14, location: 'Darmstadt' },
      { name: 'Fraport', logo: EMPLOYER_LOGOS['Fraport'], jobsCount: 8, location: 'Frankfurt' },
    ],
    jobs: [
      { title: 'Bürokauffrau/-mann (m/w/d)', employer: 'Curmundo', location: 'Hamburg', type: 'Vollzeit', description: 'Sachbearbeitung und Verwaltung – mit festem Team.' },
      { title: 'Assistent:in der Geschäftsleitung', employer: 'Merck', location: 'Darmstadt', type: 'Vollzeit', description: 'Organisation und Koordination – direkte Zusammenarbeit mit der GL.' },
      { title: 'Sachbearbeiter:in Verwaltung', employer: 'Fraport', location: 'Frankfurt', type: 'Vollzeit', description: 'Verwaltung und Verwaltungsaufgaben – strukturierte Abläufe.' },
      { title: 'Office Manager:in', employer: 'Curmundo', location: 'Hamburg', type: 'Teilzeit', description: 'Büroorganisation und Assistenz – flexible Arbeitszeiten.' },
    ],
    faqs: [
      { question: 'Ist BeVisiblle kostenlos?', answer: 'Ja, komplett kostenlos. Für Arbeitnehmer entstehen keine Kosten. Deine Daten sind DSGVO-konform geschützt und du kannst dein Profil jederzeit löschen.' },
      { question: 'Kann ich mich auf Teilzeit konzentrieren?', answer: 'Ja. Du gibst in deinem Profil an, ob du Vollzeit, Teilzeit oder flexible Modelle suchst. Arbeitgeber sehen das und kontaktieren dich passend.' },
      { question: 'Wie unterscheidet sich BeVisiblle von anderen Jobportalen?', answer: 'Bei BeVisiblle kommen die Arbeitgeber zu dir – nicht umgekehrt. Du erstellst ein Profil, wirst sichtbar, und Recruiter schreiben dich direkt an. Kein Bewerbungsstress.' },
    ],
    testimonials: [
      { name: 'Sara N.', role: 'Bürokauffrau', quote: 'Auf StepStone habe ich 30 Bewerbungen geschrieben und 2 Absagen bekommen. Bei BeVisiblle habe ich ein Profil erstellt und Curmundo hat mich innerhalb einer Woche angeschrieben. Der Unterschied ist enorm.', employer: 'Curmundo' },
      { name: 'David M.', role: 'Assistent der GL', quote: 'Ich wollte unbedingt Hybrid arbeiten und das auch klar kommunizieren können. Bei BeVisiblle steht das direkt im Profil. Merck hat genau deshalb Kontakt aufgenommen.', employer: 'Merck' },
    ],
    persona: {
      title: 'Für wen ist BeVisiblle?',
      text: 'Menschen in Büro, Verwaltung und Assistenz – Kaufleute, Office-Manager, Sachbearbeiter – die einen Arbeitgeber suchen, der ihr Talent wirklich schätzt.',
      points: ['Kostenlos', 'DSGVO-konform', 'Profil jederzeit löschbar'],
    },
    seoCities: ['Hamburg', 'Frankfurt', 'Darmstadt', 'Berlin'],
    seoSearchTerms: ['Büromanagement Jobs Hamburg', 'Assistenz Jobs Frankfurt', 'Büro Jobs Darmstadt', 'Sachbearbeiter Jobs Berlin'],
    arbeitsmodelle: ['Homeoffice', 'Teilzeit', 'Hybrid', 'Gleitzeit', 'Vollzeit', '4-Tage-Woche'],
    softwareSkills: ['Microsoft Office', 'SAP', 'DATEV', 'Salesforce', 'Personio', 'Asana', 'Slack', 'Google Workspace'],
    kontakt: { name: 'Dein BeVisiblle-Team', role: 'Ansprechpartner für Büromanagement', email: 'buero@bevisiblle.de' },
  },
  ausbildung: {
    introText: 'Du weißt noch nicht genau, was du machen willst? Kein Problem. Entdecke Berufe und Betriebe, die zu dir passen.',
    geoRegions: [
      { region: 'Hamburg & Nord', cities: ['Hamburg', 'Bremen', 'Kiel'], description: 'Vielfältige Ausbildungsmöglichkeiten in allen Branchen.' },
      { region: 'NRW & Ruhrgebiet', cities: ['Essen', 'Dortmund', 'Köln'], description: 'Starke Industrie- und Handwerksregion.' },
      { region: 'Bayern & Süd', cities: ['München', 'Nürnberg', 'Stuttgart'], description: 'Große Unternehmen mit Ausbildungsprogrammen.' },
    ],
    backlinks: [
      { label: 'Bundesagentur für Arbeit – Ausbildung', url: 'https://www.arbeitsagentur.de', description: 'Offizielle Ausbildungsbörse' },
      { label: 'Bundesinstitut für Berufsbildung (BIBB)', url: 'https://www.bibb.de', description: 'Informationen zu allen Berufen' },
      { label: 'Azubi.de – Ausbildungsplätze', url: 'https://www.azubi.de', description: 'Stellen für Azubis' },
      { label: 'Handwerkskammer – Ausbildung', url: 'https://www.handwerk.de', description: 'Handwerkliche Ausbildungen' },
      { label: 'IHK – Lehrstellenbörse', url: 'https://www.ihk.de', description: 'Kaufmännische & technische Ausbildungen' },
    ],
    employers: [
      { name: 'Klinikum Mitte', logo: EMPLOYER_LOGOS['Klinikum Mitte'], jobsCount: 4, location: 'Hamburg' },
      { name: 'Thyssenkrupp', logo: EMPLOYER_LOGOS['Thyssenkrupp'], jobsCount: 12, location: 'Bundesweit' },
      { name: 'Rothenberger', logo: EMPLOYER_LOGOS['Rothenberger'], jobsCount: 3, location: 'Hessen' },
      { name: 'Curmundo', logo: EMPLOYER_LOGOS['Curmundo'], jobsCount: 2, location: 'Hamburg' },
    ],
    jobs: [
      { title: 'Ausbildung Pflegefachfrau/-mann', employer: 'Klinikum Mitte', location: 'Hamburg', type: 'Ausbildung', description: 'Generalistische Pflegeausbildung – mit festem Bezugsteam und fairen Rahmenbedingungen.' },
      { title: 'Ausbildung Industriemechaniker:in', employer: 'Thyssenkrupp', location: 'Essen', type: 'Ausbildung', description: 'Duale Ausbildung in der Industrie – moderne Technik.' },
      { title: 'Ausbildung KFZ-Mechatroniker:in', employer: 'Rothenberger', location: 'Hessen', type: 'Ausbildung', description: 'Handwerkliche Ausbildung – mit erfahrenen Ausbildern.' },
      { title: 'Ausbildung Bürokauffrau/-mann', employer: 'Curmundo', location: 'Hamburg', type: 'Ausbildung', description: 'Kaufmännische Ausbildung – vielfältige Einblicke.' },
      { title: 'Ausbildung Elektroniker:in', employer: 'Thyssenkrupp', location: 'Duisburg', type: 'Ausbildung', description: 'Technische Ausbildung – Industrie und Anlagen.' },
    ],
    faqs: [
      { question: 'Kostet BeVisiblle etwas?', answer: 'Nein, für Azubis ist BeVisiblle komplett kostenlos. Du zahlst nichts – weder für die Registrierung noch für den Kontakt mit Betrieben.' },
      { question: 'Welche Schulabschlüsse werden akzeptiert?', answer: 'Hauptschulabschluss, Realschulabschluss, Abitur – alle sind willkommen. Je nach Ausbildung haben Betriebe unterschiedliche Anforderungen, die du im Profil siehst.' },
      { question: 'Wie läuft der Kontakt mit Ausbildungsbetrieben ab?', answer: 'Du erstellst dein Profil, wirst sichtbar. Ausbilder und Personaler von Betrieben schreiben dich direkt an. Du antwortest, wann du möchtest – persönlich und unkompliziert.' },
      { question: 'Was, wenn ich noch nicht weiß, was ich machen will?', answer: 'Kein Problem. BeVisiblle hilft dir, Berufe zu entdecken. Erstell ein Profil mit deinen Interessen – Betriebe aus verschiedenen Branchen melden sich dann bei dir.' },
    ],
    testimonials: [
      { name: 'Jana K.', role: 'Azubi Pflege', quote: 'Ich wusste nicht, wo ich anfangen soll. Bei BeVisiblle hat mich Klinikum Mitte angeschrieben – jetzt bin ich im 2. Lehrjahr und super happy.', employer: 'Klinikum Mitte' },
      { name: 'Tom R.', role: 'Azubi Industriemechaniker', quote: 'Thyssenkrupp hat mich über BeVisiblle gefunden. Kein Vitamin B, keine Beziehungen – nur mein Profil. Der Start war perfekt.', employer: 'Thyssenkrupp' },
      { name: 'Lena M.', role: 'Azubi Bürokauffrau', quote: 'Curmundo hat mich direkt angeschrieben. Das Kennenlernen war entspannt, und jetzt bin ich im 1. Lehrjahr. BeVisiblle hat alles einfacher gemacht.', employer: 'Curmundo' },
    ],
    persona: {
      title: 'Für wen ist BeVisiblle?',
      text: 'Schulabgänger und junge Menschen, die ihren Ausbildungsplatz finden wollen – ohne Vitamin B, ohne Stress, mit echten Einblicken.',
      points: ['Kostenlos', 'Alle Schulabschlüsse willkommen', 'Profil jederzeit löschbar'],
    },
    seoCities: ['Hamburg', 'Essen', 'Frankfurt', 'München'],
    seoSearchTerms: ['Ausbildungsplätze Hamburg', 'Ausbildung Essen', 'Lehrstellen Frankfurt', 'Azubi Jobs München'],
    orientierung: [
      { branche: 'Pflege & Gesundheit', icon: '🏥', description: 'Menschen helfen und versorgen – in Kliniken, Heimen oder ambulant.', beispielBerufe: ['Pflegefachfrau/-mann', 'MFA', 'OTA'] },
      { branche: 'Handwerk & Technik', icon: '🔧', description: 'Mit den Händen arbeiten, Dinge bauen und reparieren.', beispielBerufe: ['Elektriker', 'KFZ-Mechatroniker', 'Schreiner'] },
      { branche: 'Industrie & Produktion', icon: '⚙️', description: 'Maschinen bedienen, Anlagen warten, Technik verstehen.', beispielBerufe: ['Industriemechaniker', 'Mechatroniker', 'Elektroniker'] },
      { branche: 'Büro & Verwaltung', icon: '💼', description: 'Organisieren, planen, kommunizieren – im Büro oder remote.', beispielBerufe: ['Bürokauffrau/-mann', 'Verwaltungsfachangestellte/r', 'Industriekauffrau/-mann'] },
    ],
    elternBox: {
      title: 'Für Eltern',
      text: 'BeVisiblle ist eine sichere Plattform, auf der Ihr Kind von geprüften Ausbildungsbetrieben gefunden wird. Keine versteckten Kosten, voller Datenschutz.',
      points: ['DSGVO-konform', 'Kostenlos', 'Transparente Betriebsprofile', 'Profil jederzeit löschbar'],
    },
    kontakt: { name: 'Dein BeVisiblle-Team', role: 'Ansprechpartner für Azubis', email: 'ausbildung@bevisiblle.de' },
  },
};

export function getBranchContent(branchId: BranchId): BranchContent {
  return BRANCH_CONTENT[branchId] ?? BRANCH_CONTENT.pflege;
}
