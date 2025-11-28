import { useEffect } from 'react';

interface StructuredDataProps {
  type: 'Organization' | 'JobPosting' | 'Article' | 'Course' | 'BreadcrumbList';
  data: Record<string, any>;
}

export function StructuredData({ type, data }: StructuredDataProps) {
  useEffect(() => {
    const scriptId = `structured-data-${type.toLowerCase()}`;
    
    // Remove existing script if present
    const existing = document.getElementById(scriptId);
    if (existing) {
      existing.remove();
    }

    // Create structured data
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': type,
      ...data
    };

    // Add script to head
    const script = document.createElement('script');
    script.id = scriptId;
    script.type = 'application/ld+json';
    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById(scriptId);
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [type, data]);

  return null;
}

// Helper functions for common structured data types

export function OrganizationStructuredData() {
  return (
    <StructuredData
      type="Organization"
      data={{
        name: 'BeVisiblle',
        url: 'https://bevisiblle.de',
        logo: 'https://bevisiblle.de/logo.png',
        description: 'Netzwerk für Fachkräfte, Azubis und Unternehmen',
        sameAs: [
          // Social Media Links hier einfügen
        ]
      }}
    />
  );
}

export function JobPostingStructuredData(job: {
  title: string;
  description: string;
  company: string;
  location: string;
  employmentType: string;
  industry?: string;
}) {
  return (
    <StructuredData
      type="JobPosting"
      data={{
        title: job.title,
        description: job.description,
        hiringOrganization: {
          '@type': 'Organization',
          name: job.company
        },
        jobLocation: {
          '@type': 'Place',
          address: {
            '@type': 'PostalAddress',
            addressLocality: job.location
          }
        },
        employmentType: job.employmentType,
        ...(job.industry && {
          occupationalCategory: job.industry
        })
      }}
    />
  );
}

export function ArticleStructuredData(article: {
  title: string;
  description: string;
  author: string;
  publishedAt: string;
  image?: string;
  industry?: 'pflege' | 'handwerk' | 'industrie';
}) {
  const articleData: any = {
    headline: article.title,
    description: article.description,
    author: {
      '@type': 'Person',
      name: article.author
    },
    datePublished: article.publishedAt,
    publisher: {
      '@type': 'Organization',
      name: 'BeVisiblle',
      logo: {
        '@type': 'ImageObject',
        url: 'https://bevisiblle.de/logo.png'
      }
    }
  };

  if (article.image) {
    articleData.image = article.image;
  }

  // Branchen-spezifische Schema-Erweiterungen
  if (article.industry === 'pflege') {
    articleData.about = {
      '@type': 'MedicalSpecialty',
      name: 'Pflege'
    };
  } else if (article.industry === 'handwerk') {
    articleData.about = {
      '@type': 'Thing',
      name: 'Handwerk'
    };
  }

  return <StructuredData type="Article" data={articleData} />;
}

export function CourseStructuredData(course: {
  name: string;
  description: string;
  provider: string;
  educationalLevel: string;
}) {
  return (
    <StructuredData
      type="Course"
      data={{
        name: course.name,
        description: course.description,
        provider: {
          '@type': 'Organization',
          name: course.provider
        },
        educationalLevel: course.educationalLevel
      }}
    />
  );
}

