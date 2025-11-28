import { useSEO } from '@/hooks/useSEO';
import { SEOHead } from '@/components/seo/SEOHead';
import { OrganizationStructuredData } from '@/components/seo/StructuredData';
import CareerHubHeader from '@/components/career/CareerHubHeader';
import CareerHubHero from '@/components/career/CareerHubHero';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GraduationCap, Briefcase, TrendingUp, Factory } from 'lucide-react';

export default function IndustrieHub() {
  const seoData = useSEO({
    title: 'Industrie: Duales Studium & Karriere bei BeVisiblle',
    description: 'Karriere in der Industrie: Duales Studium, Ausbildung oder Fachkraft. Finde deinen Weg in der Metall- und Elektroindustrie.',
    keywords: ['Industrie Ausbildung', 'Duales Studium', 'M+E Industrie', 'Industriemeister', 'Mechatroniker', 'Industriekaufmann'],
    industry: 'industrie'
  });

  return (
    <>
      <SEOHead {...seoData} />
      <OrganizationStructuredData />
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <CareerHubHeader />
        
        <CareerHubHero
          headline="Finde deinen Traumjob in der Industrie mit"
          subtitle="Vernetze dich mit Unternehmen, die zu dir passen"
          description="Erstelle deinen Lebenslauf, präsentiere deine Fähigkeiten und werde sichtbar für Unternehmen, die genau nach dir suchen."
          heroImage="/assets/hero-business-cropped.png"
          ctaText="Jetzt registrieren"
          ctaLink="/cv-generator"
        />

        {/* Zielgruppen-Sektion */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-12">Dein Weg in der Industrie</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Schüler */}
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <GraduationCap className="h-6 w-6 text-gray-600" />
                </div>
                <h3 className="text-xl font-semibold">Schüler</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Du interessierst dich für eine Ausbildung oder ein duales Studium? 
                Erfahre alles über M+E Industrie, Gehälter und Karrieremöglichkeiten.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/karriere/industrie/schueler">Mehr erfahren</Link>
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
                Du bist bereits in der Ausbildung? Erhalte Tipps für Prüfungen, 
                IG Metall Tarife und deine Rechte als Azubi.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/karriere/industrie/azubi">Mehr erfahren</Link>
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
                Du bist bereits Facharbeiter? Entdecke den Weg zum Industriemeister, 
                Schichtzulagen oder neue Karrieremöglichkeiten.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/karriere/industrie/profi">Mehr erfahren</Link>
              </Button>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-16">
          <Card className="p-8 md:p-12 bg-gradient-to-r from-gray-800 to-gray-900 text-white text-center">
            <h2 className="text-3xl font-bold mb-4">Bereit für deine Karriere in der Industrie?</h2>
            <p className="text-xl mb-8 text-gray-200">
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

