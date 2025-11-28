import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useBlogPosts } from '@/hooks/useBlogPosts';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import BaseLayout from '@/components/layout/BaseLayout';
import { SEOHead } from '@/components/seo/SEOHead';
import { useSEO } from '@/hooks/useSEO';

export default function Blog() {
  const navigate = useNavigate();
  const { data: posts, isLoading } = useBlogPosts({ status: 'published' });
  
  const seoData = useSEO({
    title: 'Blog & Ratgeber – BeVisiblle',
    description: 'Tipps und Tricks für deinen erfolgreichen Weg in die Ausbildung. Ratgeber für Schüler, Azubis und Fachkräfte.',
    keywords: ['Blog', 'Ratgeber', 'Ausbildung', 'Karriere', 'Tipps'],
  });

  const getIndustryLabel = (industry?: string) => {
    const labels: Record<string, string> = {
      pflege: 'Pflege',
      handwerk: 'Handwerk',
      industrie: 'Industrie',
      allgemein: 'Allgemein',
    };
    return labels[industry || ''] || null;
  };

  const getAudienceLabel = (audience?: string) => {
    const labels: Record<string, string> = {
      schueler: 'Schüler',
      azubi: 'Azubi',
      profi: 'Profi',
      unternehmen: 'Unternehmen',
    };
    return labels[audience || ''] || null;
  };

  return (
    <>
      <SEOHead {...seoData} />
      <BaseLayout>
        <div className="min-h-screen bg-background">
          <div className="max-w-6xl mx-auto px-6 py-12">
            <div className="mb-8">
              <Button 
                variant="outline" 
                onClick={() => navigate('/')}
                className="mb-4"
              >
                ← Zurück zur Startseite
              </Button>
              
              <h1 className="text-4xl font-bold mb-4 text-foreground">
                Blog & Ratgeber
              </h1>
              <p className="text-lg text-muted-foreground">
                Tipps und Tricks für deinen erfolgreichen Weg in die Ausbildung
              </p>
            </div>

            {isLoading ? (
              <div className="grid gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <div className="h-4 bg-muted rounded w-full mb-2" />
                      <div className="h-4 bg-muted rounded w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : posts && posts.length > 0 ? (
              <div className="grid gap-6">
                {posts.map((post) => (
                  <Card key={post.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <CardTitle className="text-xl flex-1">{post.title}</CardTitle>
                        {post.featured_image && (
                          <img 
                            src={post.featured_image} 
                            alt={post.title}
                            className="w-32 h-32 object-cover rounded-lg"
                          />
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        {post.published_at && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(post.published_at), 'dd.MM.yyyy', { locale: de })}
                          </div>
                        )}
                        {getIndustryLabel(post.industry_sector) && (
                          <Badge variant="outline">{getIndustryLabel(post.industry_sector)}</Badge>
                        )}
                        {getAudienceLabel(post.target_audience) && (
                          <Badge variant="secondary">{getAudienceLabel(post.target_audience)}</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {post.excerpt && (
                        <p className="mb-4 text-muted-foreground">{post.excerpt}</p>
                      )}
                      <Button variant="outline" asChild>
                        <Link to={`/blog/${post.slug}`}>Artikel lesen →</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground mb-4">Noch keine Blog-Artikel veröffentlicht</p>
                <p className="text-sm text-muted-foreground">
                  Die ersten Artikel werden hier erscheinen, sobald sie veröffentlicht wurden.
                </p>
              </Card>
            )}

            <div className="mt-12 text-center">
              <h2 className="text-2xl font-semibold mb-4 text-foreground">
                Bereit für deinen Traumjob?
              </h2>
              <Button 
                size="lg" 
                onClick={() => navigate('/cv-generator')}
                className="text-lg px-8 py-6"
              >
                Jetzt CV erstellen
              </Button>
            </div>
          </div>
        </div>
      </BaseLayout>
    </>
  );
}