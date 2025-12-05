/**
 * Comprehensive Sitemap Generator for BeVisiblle
 * Generates dynamic sitemap including:
 * - Static pages
 * - Blog posts
 * - Job postings
 * - User profiles
 * - Company profiles
 * - Career hubs
 */

import { supabase } from '@/integrations/supabase/client';

const BASE_URL = 'https://bevisiblle.de';

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

/**
 * Generate XML sitemap from URLs
 */
function generateSitemapXML(urls: SitemapUrl[]): string {
  const urlEntries = urls.map(url => {
    let entry = `  <url>\n    <loc>${escapeXML(url.loc)}</loc>`;
    
    if (url.lastmod) {
      entry += `\n    <lastmod>${url.lastmod}</lastmod>`;
    }
    
    if (url.changefreq) {
      entry += `\n    <changefreq>${url.changefreq}</changefreq>`;
    }
    
    if (url.priority !== undefined) {
      entry += `\n    <priority>${url.priority.toFixed(1)}</priority>`;
    }
    
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

function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Get current date in ISO format (YYYY-MM-DD)
 */
function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get date from timestamp
 */
function formatDate(date: string | null | undefined): string | undefined {
  if (!date) return undefined;
  try {
    return new Date(date).toISOString().split('T')[0];
  } catch {
    return undefined;
  }
}

/**
 * Static pages with high priority
 */
function getStaticPages(): SitemapUrl[] {
  const today = getCurrentDate();
  
  return [
    // Homepage - highest priority
    {
      loc: `${BASE_URL}/`,
      lastmod: today,
      changefreq: 'daily',
      priority: 1.0
    },
    // CV Generator - high priority
    {
      loc: `${BASE_URL}/cv-generator`,
      lastmod: today,
      changefreq: 'weekly',
      priority: 0.9
    },
    {
      loc: `${BASE_URL}/registrieren`,
      lastmod: today,
      changefreq: 'weekly',
      priority: 0.9
    },
    {
      loc: `${BASE_URL}/lebenslauf-erstellen`,
      lastmod: today,
      changefreq: 'weekly',
      priority: 0.9
    },
    // Company Landing
    {
      loc: `${BASE_URL}/unternehmen`,
      lastmod: today,
      changefreq: 'weekly',
      priority: 0.9
    },
    {
      loc: `${BASE_URL}/unternehmensregistrierung`,
      lastmod: today,
      changefreq: 'weekly',
      priority: 0.9
    },
    // Blog
    {
      loc: `${BASE_URL}/blog`,
      lastmod: today,
      changefreq: 'daily',
      priority: 0.8
    },
    {
      loc: `${BASE_URL}/blog/archive`,
      lastmod: today,
      changefreq: 'weekly',
      priority: 0.7
    },
    // Jobs
    {
      loc: `${BASE_URL}/stellenangebote`,
      lastmod: today,
      changefreq: 'daily',
      priority: 0.8
    },
    {
      loc: `${BASE_URL}/jobs`,
      lastmod: today,
      changefreq: 'daily',
      priority: 0.8
    },
    // Companies
    {
      loc: `${BASE_URL}/firmen`,
      lastmod: today,
      changefreq: 'daily',
      priority: 0.8
    },
    {
      loc: `${BASE_URL}/companies`,
      lastmod: today,
      changefreq: 'daily',
      priority: 0.8
    },
    // Career Hubs - SEO Landing Pages
    {
      loc: `${BASE_URL}/karriere/pflege`,
      lastmod: today,
      changefreq: 'weekly',
      priority: 0.8
    },
    {
      loc: `${BASE_URL}/karriere/handwerk`,
      lastmod: today,
      changefreq: 'weekly',
      priority: 0.8
    },
    {
      loc: `${BASE_URL}/karriere/industrie`,
      lastmod: today,
      changefreq: 'weekly',
      priority: 0.8
    },
    // Legal Pages
    {
      loc: `${BASE_URL}/datenschutz`,
      lastmod: today,
      changefreq: 'monthly',
      priority: 0.3
    },
    {
      loc: `${BASE_URL}/impressum`,
      lastmod: today,
      changefreq: 'monthly',
      priority: 0.3
    },
    {
      loc: `${BASE_URL}/agb`,
      lastmod: today,
      changefreq: 'monthly',
      priority: 0.3
    },
    // About
    {
      loc: `${BASE_URL}/ueber-uns`,
      lastmod: today,
      changefreq: 'monthly',
      priority: 0.6
    },
    {
      loc: `${BASE_URL}/about`,
      lastmod: today,
      changefreq: 'monthly',
      priority: 0.6
    },
    // Product Pages
    {
      loc: `${BASE_URL}/produkt/azubis`,
      lastmod: today,
      changefreq: 'monthly',
      priority: 0.7
    },
    {
      loc: `${BASE_URL}/produkt/unternehmen`,
      lastmod: today,
      changefreq: 'monthly',
      priority: 0.7
    },
    {
      loc: `${BASE_URL}/talent`,
      lastmod: today,
      changefreq: 'monthly',
      priority: 0.7
    }
  ];
}

/**
 * Fetch all published blog posts
 */
async function getBlogPosts(): Promise<SitemapUrl[]> {
  try {
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('slug, updated_at, published_at, created_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (error) {
      console.error('Error fetching blog posts:', error);
      return [];
    }

    return (posts || []).map(post => ({
      loc: `${BASE_URL}/blog/${post.slug}`,
      lastmod: formatDate(post.updated_at || post.published_at || post.created_at),
      changefreq: 'weekly' as const,
      priority: 0.7
    }));
  } catch (error) {
    console.error('Error in getBlogPosts:', error);
    return [];
  }
}

/**
 * Fetch all published job postings
 */
async function getJobPostings(): Promise<SitemapUrl[]> {
  try {
    const { data: jobs, error } = await supabase
      .from('job_posts')
      .select('id, slug, updated_at, created_at')
      .eq('status', 'published')
      .eq('is_active', true)
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching job postings:', error);
      return [];
    }

    return (jobs || []).map(job => {
      // Use slug if available, otherwise fallback to ID
      const path = job.slug ? `/stelle/${job.slug}` : `/jobs/${job.id}`;
      return {
        loc: `${BASE_URL}${path}`,
        lastmod: formatDate(job.updated_at || job.created_at),
        changefreq: 'weekly' as const,
        priority: 0.8
      };
    });
  } catch (error) {
    console.error('Error in getJobPostings:', error);
    return [];
  }
}

/**
 * Fetch all public user profiles with usernames
 */
async function getUserProfiles(): Promise<SitemapUrl[]> {
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, username, updated_at, created_at')
      .not('username', 'is', null)
      .limit(10000); // Limit to prevent too many URLs

    if (error) {
      console.error('Error fetching user profiles:', error);
      return [];
    }

    return (profiles || []).map(profile => {
      // Use username if available, otherwise fallback to UUID
      const path = profile.username ? `/@${profile.username}` : `/u/${profile.id}`;
      return {
        loc: `${BASE_URL}${path}`,
        lastmod: formatDate(profile.updated_at || profile.created_at),
        changefreq: 'monthly' as const,
        priority: 0.6
      };
    });
  } catch (error) {
    console.error('Error in getUserProfiles:', error);
    return [];
  }
}

/**
 * Fetch all public company profiles with slugs
 */
async function getCompanyProfiles(): Promise<SitemapUrl[]> {
  try {
    const { data: companies, error } = await supabase
      .from('companies')
      .select('id, slug, updated_at, created_at')
      .not('slug', 'is', null)
      .limit(10000); // Limit to prevent too many URLs

    if (error) {
      console.error('Error fetching company profiles:', error);
      return [];
    }

    return (companies || []).map(company => {
      // Use slug if available, otherwise fallback to UUID
      const path = company.slug ? `/firma/${company.slug}` : `/companies/${company.id}`;
      return {
        loc: `${BASE_URL}${path}`,
        lastmod: formatDate(company.updated_at || company.created_at),
        changefreq: 'weekly' as const,
        priority: 0.7
      };
    });
  } catch (error) {
    console.error('Error in getCompanyProfiles:', error);
    return [];
  }
}

/**
 * Generate complete sitemap
 */
export async function generateSitemap(): Promise<string> {
  console.log('🚀 Generating sitemap...');
  
  // Get static pages
  const staticPages = getStaticPages();
  console.log(`✅ Static pages: ${staticPages.length}`);

  // Get dynamic content
  const [blogPosts, jobPostings, userProfiles, companyProfiles] = await Promise.all([
    getBlogPosts(),
    getJobPostings(),
    getUserProfiles(),
    getCompanyProfiles()
  ]);

  console.log(`✅ Blog posts: ${blogPosts.length}`);
  console.log(`✅ Job postings: ${jobPostings.length}`);
  console.log(`✅ User profiles: ${userProfiles.length}`);
  console.log(`✅ Company profiles: ${companyProfiles.length}`);

  // Combine all URLs
  const allUrls = [
    ...staticPages,
    ...blogPosts,
    ...jobPostings,
    ...userProfiles,
    ...companyProfiles
  ];

  console.log(`✅ Total URLs: ${allUrls.length}`);

  // Generate XML
  const sitemapXML = generateSitemapXML(allUrls);
  
  return sitemapXML;
}

/**
 * Generate sitemap index if we have multiple sitemaps
 * (Useful if we exceed 50,000 URLs)
 */
export function generateSitemapIndex(sitemaps: Array<{ loc: string; lastmod?: string }>): string {
  const sitemapEntries = sitemaps.map(sitemap => {
    let entry = `  <sitemap>\n    <loc>${escapeXML(sitemap.loc)}</loc>`;
    if (sitemap.lastmod) {
      entry += `\n    <lastmod>${sitemap.lastmod}</lastmod>`;
    }
    entry += `\n  </sitemap>`;
    return entry;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries}
</sitemapindex>`;
}

