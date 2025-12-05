/**
 * Supabase Edge Function: Generate Sitemap
 * 
 * This function generates a comprehensive sitemap.xml for BeVisiblle
 * including static pages, blog posts, job postings, and profiles.
 * 
 * Access via: https://[project].supabase.co/functions/v1/generate-sitemap
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const BASE_URL = Deno.env.get('BASE_URL') || 'https://bevisiblle.de';
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatDate(date: string | null | undefined): string | undefined {
  if (!date) return undefined;
  try {
    return new Date(date).toISOString().split('T')[0];
  } catch {
    return undefined;
  }
}

function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}

function generateSitemapXML(urls: SitemapUrl[]): string {
  const urlEntries = urls.map(url => {
    let entry = `  <url>\n    <loc>${escapeXML(url.loc)}</loc>`;
    if (url.lastmod) entry += `\n    <lastmod>${url.lastmod}</lastmod>`;
    if (url.changefreq) entry += `\n    <changefreq>${url.changefreq}</changefreq>`;
    if (url.priority !== undefined) entry += `\n    <priority>${url.priority.toFixed(1)}</priority>`;
    entry += `\n  </url>`;
    return entry;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urlEntries}
</urlset>`;
}

function getStaticPages(): SitemapUrl[] {
  const today = getCurrentDate();
  return [
    { loc: `${BASE_URL}/`, lastmod: today, changefreq: 'daily', priority: 1.0 },
    { loc: `${BASE_URL}/cv-generator`, lastmod: today, changefreq: 'weekly', priority: 0.9 },
    { loc: `${BASE_URL}/registrieren`, lastmod: today, changefreq: 'weekly', priority: 0.9 },
    { loc: `${BASE_URL}/lebenslauf-erstellen`, lastmod: today, changefreq: 'weekly', priority: 0.9 },
    { loc: `${BASE_URL}/unternehmen`, lastmod: today, changefreq: 'weekly', priority: 0.9 },
    { loc: `${BASE_URL}/unternehmensregistrierung`, lastmod: today, changefreq: 'weekly', priority: 0.9 },
    { loc: `${BASE_URL}/blog`, lastmod: today, changefreq: 'daily', priority: 0.8 },
    { loc: `${BASE_URL}/blog/archive`, lastmod: today, changefreq: 'weekly', priority: 0.7 },
    { loc: `${BASE_URL}/stellenangebote`, lastmod: today, changefreq: 'daily', priority: 0.8 },
    { loc: `${BASE_URL}/jobs`, lastmod: today, changefreq: 'daily', priority: 0.8 },
    { loc: `${BASE_URL}/firmen`, lastmod: today, changefreq: 'daily', priority: 0.8 },
    { loc: `${BASE_URL}/companies`, lastmod: today, changefreq: 'daily', priority: 0.8 },
    { loc: `${BASE_URL}/karriere/pflege`, lastmod: today, changefreq: 'weekly', priority: 0.8 },
    { loc: `${BASE_URL}/karriere/handwerk`, lastmod: today, changefreq: 'weekly', priority: 0.8 },
    { loc: `${BASE_URL}/karriere/industrie`, lastmod: today, changefreq: 'weekly', priority: 0.8 },
    { loc: `${BASE_URL}/datenschutz`, lastmod: today, changefreq: 'monthly', priority: 0.3 },
    { loc: `${BASE_URL}/impressum`, lastmod: today, changefreq: 'monthly', priority: 0.3 },
    { loc: `${BASE_URL}/agb`, lastmod: today, changefreq: 'monthly', priority: 0.3 },
    { loc: `${BASE_URL}/ueber-uns`, lastmod: today, changefreq: 'monthly', priority: 0.6 },
    { loc: `${BASE_URL}/about`, lastmod: today, changefreq: 'monthly', priority: 0.6 },
    { loc: `${BASE_URL}/produkt/azubis`, lastmod: today, changefreq: 'monthly', priority: 0.7 },
    { loc: `${BASE_URL}/produkt/unternehmen`, lastmod: today, changefreq: 'monthly', priority: 0.7 },
    { loc: `${BASE_URL}/talent`, lastmod: today, changefreq: 'monthly', priority: 0.7 }
  ];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get static pages
    const staticPages = getStaticPages();

    // Fetch dynamic content in parallel
    const [blogPostsResult, jobsResult, profilesResult, companiesResult] = await Promise.all([
      supabase
        .from('blog_posts')
        .select('slug, updated_at, published_at, created_at')
        .eq('status', 'published')
        .order('published_at', { ascending: false }),
      supabase
        .from('job_posts')
        .select('id, slug, updated_at, created_at')
        .eq('status', 'published')
        .eq('is_active', true)
        .eq('is_public', true)
        .order('created_at', { ascending: false }),
      supabase
        .from('profiles')
        .select('id, username, updated_at, created_at')
        .not('username', 'is', null)
        .limit(10000),
      supabase
        .from('companies')
        .select('id, slug, updated_at, created_at')
        .not('slug', 'is', null)
        .limit(10000)
    ]);

    // Process blog posts
    const blogPosts: SitemapUrl[] = (blogPostsResult.data || []).map(post => ({
      loc: `${BASE_URL}/blog/${post.slug}`,
      lastmod: formatDate(post.updated_at || post.published_at || post.created_at),
      changefreq: 'weekly' as const,
      priority: 0.7
    }));

    // Process job postings
    const jobPostings: SitemapUrl[] = (jobsResult.data || []).map(job => {
      const path = job.slug ? `/stelle/${job.slug}` : `/jobs/${job.id}`;
      return {
        loc: `${BASE_URL}${path}`,
        lastmod: formatDate(job.updated_at || job.created_at),
        changefreq: 'weekly' as const,
        priority: 0.8
      };
    });

    // Process user profiles
    const userProfiles: SitemapUrl[] = (profilesResult.data || []).map(profile => {
      const path = profile.username ? `/@${profile.username}` : `/u/${profile.id}`;
      return {
        loc: `${BASE_URL}${path}`,
        lastmod: formatDate(profile.updated_at || profile.created_at),
        changefreq: 'monthly' as const,
        priority: 0.6
      };
    });

    // Process company profiles
    const companyProfiles: SitemapUrl[] = (companiesResult.data || []).map(company => {
      const path = company.slug ? `/firma/${company.slug}` : `/companies/${company.id}`;
      return {
        loc: `${BASE_URL}${path}`,
        lastmod: formatDate(company.updated_at || company.created_at),
        changefreq: 'weekly' as const,
        priority: 0.7
      };
    });

    // Combine all URLs
    const allUrls = [
      ...staticPages,
      ...blogPosts,
      ...jobPostings,
      ...userProfiles,
      ...companyProfiles
    ];

    // Generate XML
    const sitemapXML = generateSitemapXML(allUrls);

    return new Response(sitemapXML, {
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      }
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate sitemap', details: error.message }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      }
    );
  }
});

