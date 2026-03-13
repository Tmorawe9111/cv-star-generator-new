import { CAREER_BRANCHES } from '@/config/careerBranches';

export type FinderAudience = 'ausbildung' | 'job';

export interface FinderRecommendation {
  id: string;
  audience: FinderAudience;
  title: string;
  branchId?: string;
  summary: string;
  whyMatch: string;
  link: string;
  tags: string[];
  needsTraining?: boolean;
  recommendedTraining?: {
    type: 'sprachkurs' | 'pflegebasics' | 'handwerkbasics';
    hint: string;
  };
}

export interface FinderJob {
  id: string;
  title: string;
  branchId?: string;
  exampleRoles: string[];
  description: string;
  scoreTags: string[];
}

export interface RecommendationWithJobs {
  recommendation: FinderRecommendation;
  jobs: { job: FinderJob; score: number }[];
}

const BASE_RECOMMENDATIONS: FinderRecommendation[] = [
  {
    id: 'ausbildung-pflege',
    audience: 'ausbildung',
    branchId: 'pflege',
    title: 'Ausbildung in der Pflege',
    summary: 'Du arbeitest nah mit Menschen, bist Teil eines Teams auf Station oder im Heim und lernst Schritt für Schritt alles, was du für deinen Beruf brauchst.',
    whyMatch: 'Du hast angegeben, gern mit Menschen zu arbeiten und suchst eine sichere Branche mit guten Übernahmechancen.',
    link: '/karriere/ausbildung', // kann später spezifischer werden
    tags: ['pflege', 'menschen', 'sicherheit', 'team'],
    recommendedTraining: {
      type: 'pflegebasics',
      hint: 'Ein Pflege-Basis- oder FSJ-Jahr kann dir beim Einstieg helfen und zeigt dir, ob der Alltag zu dir passt.',
    },
  },
  {
    id: 'ausbildung-handwerk',
    audience: 'ausbildung',
    branchId: 'handwerk',
    title: 'Ausbildung im Handwerk',
    summary: 'Ob Elektro, KFZ oder Bau – im Handwerk siehst du abends, was du tagsüber geschafft hast. Du arbeitest mit Werkzeug, Maschinen und im Team.',
    whyMatch: 'Du willst mit den Händen arbeiten und magst es, wenn jeden Tag etwas anderes ansteht.',
    link: '/karriere/ausbildung',
    tags: ['handwerk', 'technik', 'aktiv', 'praxisnah'],
    recommendedTraining: {
      type: 'handwerkbasics',
      hint: 'Ein Praktikum auf dem Bau oder in einer Werkstatt hilft dir, das richtige Gewerk zu finden.',
    },
  },
  {
    id: 'ausbildung-buero',
    audience: 'ausbildung',
    branchId: 'buromanagement',
    title: 'Kaufmännische Ausbildung / Büromanagement',
    summary: 'Du organisierst, telefonierst, schreibst E-Mails und hältst Teams den Rücken frei – oft mit guten Chancen auf Übernahme und Weiterbildungen.',
    whyMatch: 'Du hast angegeben, gern am Computer zu arbeiten und Struktur zu mögen.',
    link: '/karriere/ausbildung',
    tags: ['buero', 'organisation', 'ruhig', 'zeiten'],
  },
  {
    id: 'job-pflege',
    audience: 'job',
    branchId: 'pflege',
    title: 'Job in der Pflege / Betreuung',
    summary: 'Direkter Kontakt mit Menschen, sinnvolle Aufgaben und sichere Jobs in Kliniken, Heimen oder ambulanten Diensten.',
    whyMatch: 'Du interessierst dich für Pflege oder Betreuung und bist bereit, im Team anzupacken – teilweise auch im Schichtdienst.',
    link: '/karriere/pflege',
    tags: ['pflege', 'menschen', 'schicht', 'sicherheit'],
    recommendedTraining: {
      type: 'sprachkurs',
      hint: 'Mit einem B1/B2-Sprachkurs fällt dir der Umgang mit Bewohner:innen, Kolleg:innen und Dokumentation deutlich leichter.',
    },
  },
  {
    id: 'job-handwerk',
    audience: 'job',
    branchId: 'handwerk',
    title: 'Job im Handwerk / Technik',
    summary: 'Ob Industrie, Werkstatt oder Baustelle – im Handwerk werden Fachkräfte und motivierte Quereinsteiger:innen gesucht.',
    whyMatch: 'Du möchtest mit den Händen arbeiten und magst körperliche Aktivität.',
    link: '/karriere/handwerk',
    tags: ['handwerk', 'technik', 'aktiv'],
  },
  {
    id: 'job-service-logistik',
    audience: 'job',
    title: 'Service, Logistik & einfache Einstiegsjobs',
    summary: 'Von Lager & Logistik über Gastro bis Verkauf – hier findest du Jobs mit niedrigschwelligem Einstieg, oft auch ohne Ausbildung.',
    whyMatch: 'Dir ist ein schneller Einstieg wichtig und du hast angegeben, offen für Service oder Logistik zu sein.',
    link: '/jobs',
    tags: ['service', 'gastro', 'logistik', 'einfacher-einstieg'],
  },
  {
    id: 'job-office',
    audience: 'job',
    branchId: 'buromanagement',
    title: 'Büro- & Organisationsjobs',
    summary: 'Im Office sorgst du dafür, dass Abläufe funktionieren – von Assistenz bis Sachbearbeitung, oft mit geregelten Arbeitszeiten.',
    whyMatch: 'Du hast Büro & Organisation gewählt und legst Wert auf planbare Zeiten.',
    link: '/karriere/buromanagement',
    tags: ['buero', 'organisation', 'zeiten'],
  },
];

export const FINDER_JOBS: FinderJob[] = [
  {
    id: 'job-ausbildung-pflegefachkraft',
    branchId: 'pflege',
    title: 'Ausbildung zur Pflegefachkraft',
    exampleRoles: ['Klinik (Station / Intensiv)', 'Altenpflegeheim', 'Ambulanter Pflegedienst'],
    description:
      'Du lernst in drei Jahren alles rund um Pflegeprozesse, Dokumentation und Zusammenarbeit im multiprofessionellen Team.',
    scoreTags: ['pflege', 'menschen', 'sicherheit', 'schicht'],
  },
  {
    id: 'job-ausbildung-pflegehelfer',
    branchId: 'pflege',
    title: 'Pflegehelfer:in / Pflegeassistenz',
    exampleRoles: ['Unterstützung im Pflegeheim', 'Betreuung im ambulanten Dienst'],
    description:
      'Einstieg mit kürzerer Ausbildung oder Qualifizierung – ideal, wenn du schnell Erfahrung sammeln möchtest.',
    scoreTags: ['pflege', 'menschen', 'einfacher-einstieg'],
  },
  {
    id: 'job-ausbildung-handwerk-azubi',
    branchId: 'handwerk',
    title: 'Ausbildung im Handwerk (z.B. Elektroniker:in, KFZ-Mechatroniker:in)',
    exampleRoles: ['KFZ-Werkstatt', 'Bauunternehmen', 'Industriebetrieb'],
    description:
      'Du arbeitest mit Werkzeug und Maschinen und lernst Schritt für Schritt, Störungen zu finden und zu beheben.',
    scoreTags: ['handwerk', 'technik', 'aktiv'],
  },
  {
    id: 'job-ausbildung-buero',
    branchId: 'buromanagement',
    title: 'Ausbildung Kaufleute für Büromanagement',
    exampleRoles: ['Assistenz im Büro', 'Einkauf / Verwaltung', 'Projektassistenz'],
    description:
      'Du organisierst Abläufe, bearbeitest Dokumente und bist Schnittstelle zwischen Kolleg:innen, Kunden und Partnern.',
    scoreTags: ['buero', 'organisation', 'zeiten'],
  },
  {
    id: 'job-pflege-quer',
    branchId: 'pflege',
    title: 'Quereinstieg Pflege & Betreuung',
    exampleRoles: ['Betreuungskraft im Heim', 'Alltagsbegleitung', 'Pflegehelfer:in'],
    description:
      'Mit einem Quereinstieg kannst du erste Erfahrung sammeln und später eine vollwertige Ausbildung oder Weiterbildung anschließen.',
    scoreTags: ['pflege', 'menschen', 'einfacher-einstieg'],
  },
  {
    id: 'job-handwerk-helfer',
    branchId: 'handwerk',
    title: 'Handwerkshelfer:in / Montage',
    exampleRoles: ['Helfer:in auf dem Bau', 'Montage im Industrieunternehmen'],
    description:
      'Du packst mit an, unterstützt Fachkräfte und lernst Werkzeuge, Materialien und Abläufe kennen – ein guter Start ins Handwerk.',
    scoreTags: ['handwerk', 'aktiv', 'einfacher-einstieg'],
  },
  {
    id: 'job-service',
    title: 'Service & Gastro',
    exampleRoles: ['Servicekraft im Restaurant', 'Café / Barista', 'Verkauf im Einzelhandel'],
    description:
      'Ideal, wenn du gern mit Menschen sprichst und Bewegung im Alltag magst – oft mit flexiblem Einstieg und vielen Teilzeitoptionen.',
    scoreTags: ['service', 'gastro', 'einfacher-einstieg'],
  },
  {
    id: 'job-logistik',
    title: 'Lager & Logistik',
    exampleRoles: ['Kommissionierer:in', 'Versandmitarbeiter:in', 'Fahrer:in / Auslieferung'],
    description:
      'Du sorgst dafür, dass Waren ankommen: Pakete packen, Waren bewegen, Touren fahren – häufig mit Schichtmodellen.',
    scoreTags: ['logistik', 'aktiv', 'einfacher-einstieg'],
  },
  {
    id: 'job-office-quer',
    branchId: 'buromanagement',
    title: 'Einstieg im Büro / Backoffice',
    exampleRoles: ['Teamassistenz', 'Kundenservice im Innendienst'],
    description:
      'Du telefonierst, beantwortest E-Mails und unterstützt dein Team im Hintergrund. Gut, wenn du strukturiert und zuverlässig bist.',
    scoreTags: ['buero', 'organisation', 'zeiten'],
  },
];

export function getRecommendations(audience: FinderAudience, tags: string[]): FinderRecommendation[] {
  const audienceRecs = BASE_RECOMMENDATIONS.filter((r) => r.audience === audience);

  if (!tags.length) {
    return audienceRecs.slice(0, 3);
  }

  const scored = audienceRecs.map((rec) => {
    const matchCount = rec.tags.filter((t) => tags.includes(t)).length;
    return { rec, score: matchCount };
  });

  scored.sort((a, b) => b.score - a.score);

  const strong = scored.filter((s) => s.score >= 2).map((s) => s.rec);
  if (strong.length) {
    return strong.slice(0, 3);
  }

  const weak = scored.filter((s) => s.score === 1).map((s) => s.rec);
  if (weak.length) {
    return weak.slice(0, 3);
  }

  return audienceRecs.slice(0, 3);
}

export function findBranchById(branchId?: string) {
  if (!branchId) return undefined;
  return CAREER_BRANCHES.find((b) => b.id === branchId);
}

export function attachJobsToRecommendations(
  recs: FinderRecommendation[],
  selectedTags: string[],
): RecommendationWithJobs[] {
  return recs.map((rec) => {
    const candidates = FINDER_JOBS.filter((job) => !rec.branchId || job.branchId === rec.branchId);
    const scored = candidates.map((job) => {
      const overlap = job.scoreTags.filter((t) => selectedTags.includes(t)).length;
      const max = job.scoreTags.length || 1;
      const score = Math.round((overlap / max) * 100);
      return { job, score };
    });
    scored.sort((a, b) => b.score - a.score);
    return {
      recommendation: rec,
      jobs: scored.slice(0, 3),
    };
  });
}


