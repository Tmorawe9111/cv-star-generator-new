import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
  industry?: 'pflege' | 'handwerk' | 'industrie';
  targetAudience?: 'schueler' | 'azubi' | 'profi' | 'unternehmen';
  geoRegion?: string; // z.B. "DE-BE" für Berlin, "DE" für Deutschland
  geoPlacename?: string; // z.B. "Berlin" oder "Deutschland"
  geoPosition?: string; // z.B. "52.52;13.40" (latitude;longitude)
  address?: {
    streetAddress?: string;
    addressLocality?: string;
    postalCode?: string;
    addressRegion?: string;
    addressCountry?: string;
  };
}

export function SEOHead({
  title = 'BeVisiblle – Vernetze dich mit Kollegen & finde deinen passenden Arbeitgeber',
  description = 'Vernetze dich mit Kollegen, tausche dich aus und werde von passenden Unternehmen kontaktiert. Dein Lebenslauf bildet die Grundlage für dein Profil – immer up-to-date. Nie mehr Gedanken machen, wo du deine Kollegen und deinen neuen Arbeitgeber findest.',
  keywords = ['Fachkräfte Netzwerk', 'Kollegen finden', 'Berufsnetzwerk', 'Lebenslauf Profil', 'Fachkräfte Community'],
  image = 'https://bevisiblle.de/og-image.jpg',
  url,
  type = 'website',
  industry,
  targetAudience,
  geoRegion = 'DE',
  geoPlacename = 'Deutschland',
  geoPosition = '51.1657;10.4515',
  address
}: SEOHeadProps) {
  const location = useLocation();
  const currentUrl = url || `https://bevisiblle.de${location.pathname}`;
  
  // Erweitere Keywords basierend auf Branche und Zielgruppe
  const enhancedKeywords = [...keywords];
  if (industry) {
    enhancedKeywords.push(industry === 'pflege' ? 'Pflege' : industry === 'handwerk' ? 'Handwerk' : 'Industrie');
  }
  if (targetAudience) {
    enhancedKeywords.push(
      targetAudience === 'schueler' ? 'Schüler' :
      targetAudience === 'azubi' ? 'Azubi' :
      targetAudience === 'profi' ? 'Fachkraft' : 'Unternehmen'
    );
  }

  useEffect(() => {
    // Update document title
    document.title = title;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, attribute: string = 'name') => {
      let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      element.content = content;
    };

    // Standard meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', enhancedKeywords.join(', '));

    // Open Graph
    updateMetaTag('og:title', title, 'property');
    updateMetaTag('og:description', description, 'property');
    updateMetaTag('og:type', type, 'property');
    updateMetaTag('og:image', image, 'property');
    updateMetaTag('og:url', currentUrl, 'property');

    // Twitter Card
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', image);

    // Geo-Meta-Tags für lokale Suche
    updateMetaTag('geo.region', geoRegion);
    updateMetaTag('geo.placename', geoPlacename);
    updateMetaTag('geo.position', geoPosition);
    updateMetaTag('ICBM', geoPosition.replace(';', ', '));
    updateMetaTag('language', 'de');
    updateMetaTag('country', 'Deutschland');

    // Open Graph Locale
    updateMetaTag('og:locale', 'de_DE', 'property');
    updateMetaTag('og:site_name', 'BeVisiblle', 'property');

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = currentUrl;
  }, [title, description, enhancedKeywords, image, currentUrl, type, geoRegion, geoPlacename, geoPosition]);

  return null; // This component doesn't render anything
}

