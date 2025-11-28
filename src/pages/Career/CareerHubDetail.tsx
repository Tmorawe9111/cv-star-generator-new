import { useParams } from 'react-router-dom';
import { useSEO } from '@/hooks/useSEO';
import { SEOHead } from '@/components/seo/SEOHead';
import CareerHubHeader from '@/components/career/CareerHubHeader';
import { useContentHub } from '@/hooks/useContentHub';
import { useBlogPosts } from '@/hooks/useBlogPosts';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, BookOpen, TrendingUp } from 'lucide-react';

interface CareerHubDetailProps {
  industry: 'pflege' | 'handwerk' | 'industrie';
}

export default function CareerHubDetail({ industry }: CareerHubDetailProps) {
  const { audience } = useParams<{ audience: string }>();
  const targetAudience = audience as 'schueler' | 'azubi' | 'profi' | 'unternehmen' | undefined;

  // Get content hub data
  const hubSlug = targetAudience ? `${industry}-${targetAudience}` : industry;
  const { data: hub, isLoading: hubLoading } = useContentHub(hubSlug);

  // Get blog posts for this industry and audience
  const { data: blogPosts, isLoading: postsLoading } = useBlogPosts({
    industry,
    targetAudience,
    limit: 6
  });

  // SEO based on industry and audience
  const getSEO = () => {
    const industryLabels = {
      pflege: 'Pflege',
      handwerk: 'Handwerk',
      industrie: 'Industrie'
    };

    const audienceLabels = {
      schueler: 'Schüler',
      azubi: 'Azubi',
      profi: 'Fachkraft',
      unternehmen: 'Unternehmen'
    };

    const industryLabel = industryLabels[industry];
    const audienceLabel = targetAudience ? audienceLabels[targetAudience] : '';

    return {
      title: audienceLabel 
        ? `${audienceLabel} in der ${industryLabel} - BeVisiblle`
        : `${industryLabel} Karriere - BeVisiblle`,
      description: audienceLabel
        ? `Alles für ${audienceLabel.toLowerCase()} in der ${industryLabel.toLowerCase()}. Tipps, Guides und Karrieremöglichkeiten.`
        : `Deine Karriere in der ${industryLabel.toLowerCase()}. Ausbildung, Jobs und Weiterbildungen.`,
      keywords: [industryLabel, audienceLabel, 'Karriere', 'Ausbildung'].filter(Boolean)
    };
  };

  const seo = getSEO();
  const seoData = useSEO({
    ...seo,
    industry,
    targetAudience
  });

  if (hubLoading) {
    return (
      <>
        <SEOHead {...seoData} />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEOHead {...seoData} />
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <CareerHubHeader />
        
        {/* Content */}
        <div className="container mx-auto px-4 pt-32 pb-8">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <Button asChild variant="ghost" size="sm" className="mb-6">
              <Link to={`/karriere/${industry}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zurück
              </Link>
            </Button>
            
            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              {hub?.title || seo.title}
            </h1>

            {/* Content */}
            {hub?.content && (
              <div 
                className="prose prose-lg max-w-none mb-12"
                dangerouslySetInnerHTML={{ __html: hub.content }}
              />
            )}

            {/* Blog Posts */}
            {blogPosts && blogPosts.length > 0 && (
              <section className="mt-12">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <BookOpen className="h-6 w-6" />
                  Artikel & Guides
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {blogPosts.map((post) => (
                    <Card key={post.id} className="p-6 hover:shadow-lg transition-shadow">
                      <h3 className="text-xl font-semibold mb-2">
                        <Link to={`/blog/${post.slug}`} className="hover:text-primary">
                          {post.title}
                        </Link>
                      </h3>
                      {post.excerpt && (
                        <p className="text-gray-600 mb-4">{post.excerpt}</p>
                      )}
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/blog/${post.slug}`}>Weiterlesen</Link>
                      </Button>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* CTA */}
            <Card className="p-8 mt-12 bg-gradient-to-r from-primary/10 to-primary/5 text-center">
              <h2 className="text-2xl font-bold mb-4">Bereit durchzustarten?</h2>
              <p className="text-gray-600 mb-6">
                Erstelle dein Profil und werde von Arbeitgebern gefunden
              </p>
              <Button asChild size="lg">
                <Link to="/registrieren">Jetzt kostenlos registrieren</Link>
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

