import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface CareerField {
  id: number;
  title: string;
  subline: string;
  description: string;
  buttonText: string;
  link: string;
  image: string;
}

const careerFields: CareerField[] = [
  {
    id: 1,
    title: 'Pflegekräfte',
    subline: 'Finde den besten Arbeitgeber',
    description: 'Du suchst Wertschätzung und faire Dienstpläne? Wir verbinden dich mit Einrichtungen, die zu deinen Wünschen passen.',
    buttonText: 'Team kennenlernen',
    link: '/karriere/pflege',
    image: '/assets/pflege-ambulant.png'
  },
  {
    id: 2,
    title: 'Funktionsdienste',
    subline: 'OTA / ATA / MTR',
    description: 'Arbeite mit modernster Technik. Finde Kliniken und Zentren, die deine Expertise im OP oder der Diagnostik wirklich fördern.',
    buttonText: 'Profil zeigen',
    link: '/karriere/pflege/funktionsdienste',
    image: '/assets/pflege-klinik.png'
  },
  {
    id: 3,
    title: 'Handwerker',
    subline: 'Gutes Handwerk, guter Lohn',
    description: 'Dein Können ist gefragt. Egal ob Schreiner, KFZ oder Dachdecker – wir connecten dich mit Betrieben, bei denen Arbeitsklima und Bezahlung stimmen.',
    buttonText: 'Können zeigen',
    link: '/karriere/handwerk',
    image: '/assets/Handwerker.png'
  },
  {
    id: 4,
    title: 'Industriemechaniker',
    subline: 'Technik, die begeistert',
    description: 'Spannende Anlagen und komplexe Maschinen. Finde Industrie-Jobs in der Instandhaltung mit Verantwortung und Perspektive.',
    buttonText: 'Jetzt profilieren',
    link: '/karriere/industriemechaniker',
    image: '/assets/Industriemechaniker.png'
  },
  {
    id: 5,
    title: 'Büromanagement',
    subline: 'Organisationstalente gesucht',
    description: 'Du liebst Struktur? Wir verbinden dich mit Unternehmen, die deine Skills in Assistenz und Verwaltung suchen und schätzen.',
    buttonText: 'Talent zeigen',
    link: '/karriere/buromanagement',
    image: '/assets/Buero-management.png'
  },
  {
    id: 6,
    title: 'Auszubildende',
    subline: 'Starte deine Karriere',
    description: 'Finde den Ausbildungsplatz, der Spaß macht. Echte Einblicke in coole Teams statt langweiliger Stellenanzeigen.',
    buttonText: 'Sichtbar starten',
    link: '/karriere/ausbildung',
    image: '/assets/Ausbildung.png'
  }
];

export default function CareerFieldsSection() {
  return (
        <section className="bg-gradient-to-br from-blue-50 via-white to-purple-50 py-16 md:py-24">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          {/* Badge */}
          <div className="inline-block mb-5">
            <span className="bg-[#eef4ff] text-[#2563eb] px-4 py-2 rounded-full text-sm font-semibold">
              Deine Karriere bei BeVisible
            </span>
          </div>

          {/* Headline */}
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-5 leading-tight">
            <span className="text-[#2563eb]">Dein Talent.</span> Dein Match.<br />
            Deine Zukunft.
          </h2>

          {/* Subtext */}
          <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Vernetze dich mit anderen aus deiner Branche und teile dein Wissen. Wenn du auf der Suche nach einem neuen Job bist, schalte dein Profil einfach sichtbar.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 lg:gap-16 max-w-7xl mx-auto pt-12 md:pt-20">
          {careerFields.map((field) => (
            <div
              key={field.id}
              className="bg-[#fcfcfc] rounded-[24px] px-6 pb-8 text-center shadow-[0_10px_30px_rgba(0,0,0,0.05)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.1)] transition-all duration-300 hover:-translate-y-2 flex flex-col items-center relative group"
            >
              {/* Image with pop-out effect - Bilder ragen etwas über die Überschriften */}
              <div 
                className="w-full relative flex justify-center items-end h-[320px] -mt-[60px] mb-0"
              >
                <img
                  src={field.image}
                  alt={field.title}
                  className={`max-h-full w-auto object-contain ${
                    field.id === 4 ? 'scale-125' : 'scale-110'
                  }`}
                  style={{
                    WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
                    maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
                    filter: 'drop-shadow(0 10px 10px rgba(0,0,0,0.1))',
                  }}
                  onError={(e) => {
                    // Fallback to placeholder if image doesn't exist
                    (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-${1500000000000 + field.id}?w=800&h=1000&fit=crop&q=80`;
                  }}
                />
              </div>

              {/* Content - Überschriften bündig mit Bildern */}
              <div className="flex-1 flex flex-col items-center w-full mt-[40px]">
                <h3 className="text-xl md:text-2xl font-bold mb-2 text-gray-900">
                  {field.title}
                </h3>
                <div className="font-semibold text-base text-[#2563eb] mb-4">
                  {field.subline}
                </div>
                <p className="text-sm md:text-base text-gray-600 mb-6 flex-1 leading-relaxed">
                  {field.description}
                </p>
                <Link
                  to={field.link}
                  className="inline-flex items-center text-[#2563eb] font-semibold text-sm md:text-base group mt-auto hover:text-[#1d4ed8] transition-colors"
                >
                  {field.buttonText}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

