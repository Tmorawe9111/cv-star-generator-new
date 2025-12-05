import { useEffect } from 'react';

interface StructuredDataProps {
  type: 'Organization' | 'JobPosting' | 'Article' | 'Course' | 'BreadcrumbList' | 'LocalBusiness' | 'FAQPage' | 'WebSite';
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
        logo: {
          '@type': 'ImageObject',
          url: 'https://bevisiblle.de/lovable-uploads/logo-32x32.png',
          width: 512,
          height: 512
        },
        description: 'Vernetze dich mit Kollegen, tausche dich aus und werde von passenden Unternehmen kontaktiert. Dein Lebenslauf bildet die Grundlage für dein Profil – immer up-to-date.',
        foundingDate: '2024',
        address: {
          '@type': 'PostalAddress',
          addressCountry: 'DE',
          addressLocality: 'Deutschland'
        },
        areaServed: {
          '@type': 'Country',
          name: 'Deutschland'
        },
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'Customer Service',
          availableLanguage: ['German', 'Deutsch']
        },
        sameAs: [
          // Social Media Links hier einfügen, wenn verfügbar
          // 'https://www.linkedin.com/company/bevisiblle',
          // 'https://www.facebook.com/bevisiblle',
          // 'https://www.instagram.com/bevisiblle',
          // 'https://twitter.com/bevisiblle'
        ],
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: 'https://bevisiblle.de/stellenangebote?q={search_term_string}'
          },
          'query-input': 'required name=search_term_string'
        }
      }}
    />
  );
}

export function LocalBusinessStructuredData(address?: {
  streetAddress?: string;
  addressLocality?: string;
  postalCode?: string;
  addressRegion?: string;
  addressCountry?: string;
}) {
  const addressData: any = {
    '@type': 'PostalAddress',
    addressCountry: address?.addressCountry || 'DE',
    addressLocality: address?.addressLocality || 'Deutschland'
  };

  if (address?.streetAddress) addressData.streetAddress = address.streetAddress;
  if (address?.postalCode) addressData.postalCode = address.postalCode;
  if (address?.addressRegion) addressData.addressRegion = address.addressRegion;

  return (
    <StructuredData
      type="LocalBusiness"
      data={{
        '@type': 'LocalBusiness',
        name: 'BeVisiblle',
        url: 'https://bevisiblle.de',
        logo: 'https://bevisiblle.de/logo.png',
        description: 'Netzwerk für Fachkräfte, Azubis und Unternehmen in Deutschland',
        address: addressData,
        areaServed: [
          {
            '@type': 'Country',
            name: 'Deutschland'
          },
          // Bundesländer
          { '@type': 'State', name: 'Baden-Württemberg' },
          { '@type': 'State', name: 'Bayern' },
          { '@type': 'State', name: 'Berlin' },
          { '@type': 'State', name: 'Brandenburg' },
          { '@type': 'State', name: 'Bremen' },
          { '@type': 'State', name: 'Hamburg' },
          { '@type': 'State', name: 'Hessen' },
          { '@type': 'State', name: 'Mecklenburg-Vorpommern' },
          { '@type': 'State', name: 'Niedersachsen' },
          { '@type': 'State', name: 'Nordrhein-Westfalen' },
          { '@type': 'State', name: 'Rheinland-Pfalz' },
          { '@type': 'State', name: 'Saarland' },
          { '@type': 'State', name: 'Sachsen' },
          { '@type': 'State', name: 'Sachsen-Anhalt' },
          { '@type': 'State', name: 'Schleswig-Holstein' },
          { '@type': 'State', name: 'Thüringen' }
        ],
        serviceArea: {
          '@type': 'Country',
          name: 'Deutschland'
        }
      }}
    />
  );
}

export function JobPostingStructuredData(job: {
  title: string;
  description: string;
  company: string;
  companyLogo?: string;
  location: string;
  city?: string;
  postalCode?: string;
  employmentType: string;
  industry?: string;
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
    unit?: string;
  };
  datePosted?: string;
  validThrough?: string;
  url?: string;
  identifier?: {
    name: string;
    value: string;
  };
}) {
  const jobData: any = {
    title: job.title,
    description: job.description,
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company,
      ...(job.companyLogo && {
        logo: {
          '@type': 'ImageObject',
          url: job.companyLogo
        }
      })
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.city || job.location,
        ...(job.postalCode && { postalCode: job.postalCode }),
        addressCountry: 'DE'
      }
    },
    employmentType: job.employmentType,
    ...(job.industry && {
      occupationalCategory: job.industry
    }),
    ...(job.datePosted && { datePosted: job.datePosted }),
    ...(job.validThrough && { validThrough: job.validThrough }),
    ...(job.url && {
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': job.url
      }
    }),
    ...(job.identifier && {
      identifier: {
        '@type': 'PropertyValue',
        name: job.identifier.name,
        value: job.identifier.value
      }
    })
  };

  // Salary information
  if (job.salary) {
    jobData.baseSalary = {
      '@type': 'MonetaryAmount',
      currency: job.salary.currency || 'EUR',
      value: {
        '@type': 'QuantitativeValue',
        minValue: job.salary.min,
        maxValue: job.salary.max,
        unitText: job.salary.unit || 'MONTH'
      }
    };
  }

  return (
    <StructuredData
      type="JobPosting"
      data={jobData}
    />
  );
}

export function ArticleStructuredData(article: {
  title: string;
  description: string;
  author: string;
  publishedAt: string;
  updatedAt?: string;
  image?: string;
  url?: string;
  industry?: 'pflege' | 'handwerk' | 'industrie';
  slug?: string;
}) {
  const articleData: any = {
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.description,
    author: {
      '@type': 'Person',
      name: article.author || 'BeVisiblle Redaktion'
    },
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    publisher: {
      '@type': 'Organization',
      name: 'BeVisiblle',
      logo: {
        '@type': 'ImageObject',
        url: 'https://bevisiblle.de/lovable-uploads/logo-32x32.png',
        width: 512,
        height: 512
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': article.url || `https://bevisiblle.de/blog/${article.slug || ''}`
    }
  };

  if (article.image) {
    articleData.image = {
      '@type': 'ImageObject',
      url: article.image,
      width: 1200,
      height: 630
    };
  }

  // Branchen-spezifische Schema-Erweiterungen
  if (article.industry === 'pflege') {
    articleData.about = {
      '@type': 'MedicalSpecialty',
      name: 'Pflege'
    };
    articleData.keywords = 'Pflege, Gesundheitswesen, Karriere Pflege, Ausbildung Pflege';
  } else if (article.industry === 'handwerk') {
    articleData.about = {
      '@type': 'Thing',
      name: 'Handwerk'
    };
    articleData.keywords = 'Handwerk, Ausbildung Handwerk, Karriere Handwerk';
  } else if (article.industry === 'industrie') {
    articleData.about = {
      '@type': 'Thing',
      name: 'Industrie'
    };
    articleData.keywords = 'Industrie, Produktion, Karriere Industrie';
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

export function BreadcrumbStructuredData(items: Array<{name: string; url: string}>) {
  // Ensure items is always an array
  if (!items || !Array.isArray(items) || items.length === 0) {
    return null;
  }

  return (
    <StructuredData
      type="BreadcrumbList"
      data={{
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: item.url
        }))
      }}
    />
  );
}

export function FAQStructuredData(faqs: Array<{question: string; answer: string}>) {
  return (
    <StructuredData
      type="FAQPage"
      data={{
        '@type': 'FAQPage',
        mainEntity: faqs.map(faq => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer
          }
        }))
      }}
    />
  );
}

export function WebSiteStructuredData() {
  return (
    <StructuredData
      type="WebSite"
      data={{
        '@type': 'WebSite',
        name: 'BeVisiblle',
        url: 'https://bevisiblle.de',
        description: 'Vernetze dich mit Kollegen, tausche dich aus und werde von passenden Unternehmen kontaktiert. Dein Lebenslauf bildet die Grundlage für dein Profil – immer up-to-date.',
        inLanguage: 'de-DE',
        publisher: {
          '@type': 'Organization',
          name: 'BeVisiblle',
          logo: {
            '@type': 'ImageObject',
            url: 'https://bevisiblle.de/lovable-uploads/logo-32x32.png',
            width: 512,
            height: 512
          }
        },
        potentialAction: [
          {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: 'https://bevisiblle.de/stellenangebote?q={search_term_string}'
            },
            'query-input': 'required name=search_term_string'
          },
          {
            '@type': 'ReadAction',
            target: 'https://bevisiblle.de/blog'
          }
        ],
        sameAs: [
          // Add social media links here when available
          // 'https://www.linkedin.com/company/bevisiblle',
          // 'https://www.facebook.com/bevisiblle',
          // 'https://www.instagram.com/bevisiblle',
          // 'https://twitter.com/bevisiblle'
        ]
      }}
    />
  );
}

