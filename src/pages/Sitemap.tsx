/**
 * Sitemap Page - Generates sitemap.xml on-demand
 * This page can be accessed at /sitemap.xml
 */

import { useEffect, useState } from 'react';
import { generateSitemap } from '@/utils/generateSitemap';

export default function Sitemap() {
  const [sitemapXML, setSitemapXML] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSitemap = async () => {
      try {
        setLoading(true);
        const xml = await generateSitemap();
        setSitemapXML(xml);
      } catch (err: any) {
        console.error('Error generating sitemap:', err);
        setError(err.message || 'Failed to generate sitemap');
      } finally {
        setLoading(false);
      }
    };

    loadSitemap();
  }, []);

  // Set content type to XML
  useEffect(() => {
    if (sitemapXML) {
      // This will be handled by the server/Vercel
      // For client-side, we just render the XML
    }
  }, [sitemapXML]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-gray-500">Generating sitemap...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-gray-900">Error</h1>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  // Return XML content
  return (
    <pre className="whitespace-pre-wrap text-xs font-mono p-4">
      {sitemapXML}
    </pre>
  );
}

