import { useSEO } from '@/hooks/useSEO';
import { SEOHead } from '@/components/seo/SEOHead';
import { OrganizationStructuredData } from '@/components/seo/StructuredData';
import { CareerHubHeader } from '@/components/career/CareerHubHeader';
import CareerHubHero from '@/components/career/CareerHubHero';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GraduationCap, Briefcase, TrendingUp, Wrench } from 'lucide-react';

export default function HandwerkHub() {
  const seoData = useSEO({
    title: 'Handwerk: Ausbildung & Karriere bei BeVisiblle',
    description: 'Entdecke Handwerksausbildungen und Karrieremöglichkeiten im Handwerk. Vom Azubi zum Meister - dein Weg im Handwerk.',
    keywords: ['Handwerk Ausbildung', 'Handwerksmeister', 'Handwerk Jobs', 'Lehre', 'Elektriker', 'SHK', 'Tischler'],
    industry: 'handwerk'
  });

  return (
    <>
      <SEOHead {...seoData} />
      <OrganizationStructuredData />
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <CareerHubHeader />
        
        <CareerHubHero
          headline="Handwerk hat goldenen Boden"
          headlineExtra="– und"
          subtitle="Dein Netzwerk für Azubis und Fachkräfte im Handwerk"
          description="Zeige deine praktischen Fähigkeiten, finde Ausbildungsplätze oder Jobs im Handwerk und vernetze dich mit Gleichgesinnten."
          heroImage="/assets/hero-construction-cropped.png"
          ctaText="Jetzt registrieren"
          ctaLink="/cv-generator"
        />

        {/* Zielgruppen-Sektion */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-12">Dein Weg im Handwerk</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Schüler */}
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <GraduationCap className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold">Schüler</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Du interessierst dich für eine Handwerksausbildung? Erfahre alles über 
                verschiedene Gewerke, Gehälter und deine Karrieremöglichkeiten.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/karriere/handwerk/schueler">Mehr erfahren</Link>
              </Button>
            </Card>

            {/* Azubi */}
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Briefcase className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold">Azubi</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Du bist bereits in der Ausbildung? Erhalte Tipps für Berichtsheft, 
                Prüfungen und deine Rechte als Azubi.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/karriere/handwerk/azubi">Mehr erfahren</Link>
              </Button>
            </Card>

            {/* Profi */}
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold">Fachkraft</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Du bist bereits Geselle? Entdecke den Weg zum Meister, 
                Selbstständigkeit oder neue Karrieremöglichkeiten.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/karriere/handwerk/profi">Mehr erfahren</Link>
              </Button>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-16">
          <Card className="p-8 md:p-12 bg-gradient-to-r from-orange-600 to-orange-700 text-white text-center">
            <h2 className="text-3xl font-bold mb-4">Bereit für deine Karriere im Handwerk?</h2>
            <p className="text-xl mb-8 text-orange-100">
              Erstelle dein Profil und werde von Arbeitgebern gefunden
            </p>
            <Button asChild size="lg" variant="secondary">
              <Link to="/registrieren">Jetzt kostenlos registrieren</Link>
            </Button>
          </Card>
        </section>
      </div>
    </>
  );
}

