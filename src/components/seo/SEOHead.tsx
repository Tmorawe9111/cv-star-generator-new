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
}

export function SEOHead({
  title = 'BeVisiblle - Netzwerk für Fachkräfte',
  description = 'Vernetze dich mit anderen Fachkräften, finde deinen Traumjob oder deine Traumausbildung. BeVisiblle verbindet Azubis, Fachkräfte und Unternehmen.',
  keywords = ['Fachkräfte', 'Ausbildung', 'Karriere', 'Recruiting'],
  image = 'https://bevisiblle.de/og-image.png',
  url,
  type = 'website',
  industry,
  targetAudience
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

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = currentUrl;
  }, [title, description, enhancedKeywords, image, currentUrl, type]);

  return null; // This component doesn't render anything
}

