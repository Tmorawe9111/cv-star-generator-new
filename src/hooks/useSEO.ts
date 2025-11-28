import { useLocation } from 'react-router-dom';

interface UseSEOOptions {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  type?: 'website' | 'article' | 'profile';
  industry?: 'pflege' | 'handwerk' | 'industrie';
  targetAudience?: 'schueler' | 'azubi' | 'profi' | 'unternehmen';
}

export interface SEOData {
  title: string;
  description: string;
  keywords: string[];
  image?: string;
  type: 'website' | 'article' | 'profile';
  industry?: 'pflege' | 'handwerk' | 'industrie';
  targetAudience?: 'schueler' | 'azubi' | 'profi' | 'unternehmen';
}

export function useSEO(options: UseSEOOptions = {}): SEOData {
  const location = useLocation();

  // Automatische SEO basierend auf Route
  const getRouteSEO = (): Partial<SEOData> => {
    const path = location.pathname;

    // Karriere-Hubs
    if (path.startsWith('/karriere/pflege')) {
      return {
        title: 'Pflegeausbildung & Karriere bei BeVisiblle',
        description: 'Finde deine Pflegeausbildung oder deine Traumstelle als Pflegefachkraft. BeVisiblle verbindet Pflegekräfte mit Arbeitgebern.',
        keywords: ['Pflegeausbildung', 'Pflegefachkraft', 'Pflege Jobs', 'Generalistik'],
        industry: 'pflege' as const
      };
    }

    if (path.startsWith('/karriere/handwerk')) {
      return {
        title: 'Handwerk: Ausbildung & Karriere bei BeVisiblle',
        description: 'Entdecke Handwerksausbildungen und Karrieremöglichkeiten im Handwerk. Vom Azubi zum Meister - dein Weg im Handwerk.',
        keywords: ['Handwerk Ausbildung', 'Handwerksmeister', 'Handwerk Jobs', 'Lehre'],
        industry: 'handwerk' as const
      };
    }

    if (path.startsWith('/karriere/industrie')) {
      return {
        title: 'Industrie: Duales Studium & Karriere bei BeVisiblle',
        description: 'Karriere in der Industrie: Duales Studium, Ausbildung oder Fachkraft. Finde deinen Weg in der Metall- und Elektroindustrie.',
        keywords: ['Industrie Ausbildung', 'Duales Studium', 'M+E Industrie', 'Industriemeister'],
        industry: 'industrie' as const
      };
    }

    // Default
    return {
      title: 'BeVisiblle - Netzwerk für Fachkräfte',
      description: 'Vernetze dich mit anderen Fachkräften, finde deinen Traumjob oder deine Traumausbildung.',
      keywords: ['Fachkräfte', 'Ausbildung', 'Karriere']
    };
  };

  const routeSEO = getRouteSEO();

  // Merge mit übergebenen Options
  const finalSEO: SEOData = {
    title: options.title || routeSEO.title || 'BeVisiblle - Netzwerk für Fachkräfte',
    description: options.description || routeSEO.description || 'Vernetze dich mit anderen Fachkräften',
    keywords: options.keywords || routeSEO.keywords || ['Fachkräfte', 'Ausbildung', 'Karriere'],
    image: options.image || routeSEO.image,
    type: options.type || routeSEO.type || 'website',
    industry: options.industry || routeSEO.industry,
    targetAudience: options.targetAudience || routeSEO.targetAudience
  };

  return finalSEO;
}

