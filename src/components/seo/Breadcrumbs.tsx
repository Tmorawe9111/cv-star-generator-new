/**
 * Breadcrumbs Component with Structured Data
 * Provides navigation breadcrumbs and Schema.org BreadcrumbList
 */

import { Link, useLocation } from 'react-router-dom';
import { BreadcrumbStructuredData } from './StructuredData';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  const location = useLocation();
  
  // Auto-generate breadcrumbs from path if not provided
  const breadcrumbItems: BreadcrumbItem[] = items && Array.isArray(items) && items.length > 0
    ? items
    : generateBreadcrumbsFromPath(location.pathname);
  
  // Ensure we have valid items
  if (!breadcrumbItems || !Array.isArray(breadcrumbItems) || breadcrumbItems.length === 0) {
    return null;
  }
  
  // Add structured data
  const structuredDataItems = breadcrumbItems.map(item => ({
    name: item.name,
    url: `https://bevisiblle.de${item.url}`
  }));

  return (
    <>
      <BreadcrumbStructuredData items={structuredDataItems} />
      <nav aria-label="Breadcrumb" className={`flex items-center space-x-2 text-sm ${className}`}>
        <ol className="flex items-center space-x-2">
          {breadcrumbItems.map((item, index) => (
            <li key={item.url} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-gray-400 mx-2" aria-hidden="true" />
              )}
              {index === breadcrumbItems.length - 1 ? (
                <span className="text-gray-600 font-medium" aria-current="page">
                  {item.name}
                </span>
              ) : (
                <Link
                  to={item.url}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {index === 0 ? (
                    <Home className="h-4 w-4" aria-label="Home" />
                  ) : (
                    item.name
                  )}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}

/**
 * Generate breadcrumbs from pathname
 */
function generateBreadcrumbsFromPath(pathname: string): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [
    { name: 'Home', url: '/' }
  ];

  // Ensure pathname is valid
  if (!pathname || pathname === '/') {
    return items;
  }

  // Remove leading slash and split
  const segments = pathname.split('/').filter(Boolean);
  
  // Map common paths to German names
  const pathMap: Record<string, string> = {
    'blog': 'Blog',
    'stellenangebote': 'Stellenangebote',
    'jobs': 'Jobs',
    'firmen': 'Firmen',
    'companies': 'Unternehmen',
    'karriere': 'Karriere',
    'pflege': 'Pflege',
    'handwerk': 'Handwerk',
    'industrie': 'Industrie',
    'cv-generator': 'Lebenslauf Generator',
    'registrieren': 'Registrieren',
    'unternehmen': 'Für Unternehmen',
    'profil': 'Profil',
    'feed': 'Feed',
    'marketplace': 'Marketplace',
    'community': 'Community',
    'benachrichtigungen': 'Benachrichtigungen',
    'einstellungen': 'Einstellungen',
    'datenschutz': 'Datenschutz',
    'impressum': 'Impressum',
    'agb': 'AGB',
    'ueber-uns': 'Über uns',
    'archive': 'Archiv',
    'hilfe': 'Hilfe',
    'faq': 'FAQ',
    'support': 'Support'
  };

  let currentPath = '';
  segments.forEach((segment) => {
    if (segment) {
      currentPath += `/${segment}`;
      const name = pathMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
      items.push({
        name: name,
        url: currentPath
      });
    }
  });

  return items;
}

