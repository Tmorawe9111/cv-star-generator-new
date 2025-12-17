import React from 'react';
import { Link } from 'react-router-dom';

// 9 Avatare für das Layout
const avatars = [
  { id: 1, url: 'https://i.pravatar.cc/300?img=1' },
  { id: 2, url: 'https://i.pravatar.cc/300?img=2' },
  { id: 3, url: 'https://i.pravatar.cc/300?img=3' },
  { id: 4, url: 'https://i.pravatar.cc/300?img=4' },
  { id: 5, url: 'https://i.pravatar.cc/300?img=5' },
  { id: 6, url: 'https://i.pravatar.cc/300?img=6' },
  { id: 7, url: 'https://i.pravatar.cc/300?img=7' },
  { id: 8, url: 'https://i.pravatar.cc/300?img=8' },
  { id: 9, url: 'https://i.pravatar.cc/300?img=9' },
];

export default function SocialProofMarquee() {
  return (
    <section className="py-16 md:py-24 bg-white relative overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Bilder Container */}
        <div className="relative w-full mb-12 md:mb-16 min-h-[300px] md:min-h-[400px] flex items-center justify-center">
          {/* Links außen - 2 Bilder versetzt */}
          <div className="absolute left-0 md:left-4 lg:left-8 flex flex-col gap-4 md:gap-6">
            <div style={{ transform: 'translateY(-15px)' }}>
              <img
                src={avatars[0].url}
                alt={`Macher ${avatars[0].id}`}
                className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-2xl object-cover border-2 border-white shadow-lg"
              />
            </div>
            <div style={{ transform: 'translateY(15px)' }}>
              <img
                src={avatars[1].url}
                alt={`Macher ${avatars[1].id}`}
                className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-2xl object-cover border-2 border-white shadow-lg"
              />
            </div>
          </div>

          {/* Links daneben - 2 Bilder versetzt */}
          <div className="absolute left-[15%] md:left-[20%] lg:left-[25%] flex flex-col gap-4 md:gap-6">
            <div style={{ transform: 'translateY(-20px)' }}>
              <img
                src={avatars[2].url}
                alt={`Macher ${avatars[2].id}`}
                className="w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-2xl object-cover border-2 border-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              />
            </div>
            <div style={{ transform: 'translateY(20px)' }}>
              <img
                src={avatars[3].url}
                alt={`Macher ${avatars[3].id}`}
                className="w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-2xl object-cover border-2 border-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              />
            </div>
          </div>

          {/* Links neben Mitte - 1 Bild (auf gleicher Höhe wie Mitte) */}
          <div className="absolute left-[35%] md:left-[38%] lg:left-[40%]">
            <img
              src={avatars[4].url}
              alt={`Macher ${avatars[4].id}`}
              className="w-20 h-20 md:w-28 md:h-28 lg:w-36 lg:h-36 rounded-2xl object-cover border-2 border-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            />
          </div>

          {/* Mitte - 1 Bild zentriert */}
          <div className="relative z-10">
            <img
              src={avatars[5].url}
              alt={`Macher ${avatars[5].id}`}
              className="w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 rounded-2xl object-cover border-2 border-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110"
            />
          </div>

          {/* Rechts neben Mitte - 1 Bild (auf gleicher Höhe wie Mitte) */}
          <div className="absolute right-[35%] md:right-[38%] lg:right-[40%]">
            <img
              src={avatars[6].url}
              alt={`Macher ${avatars[6].id}`}
              className="w-20 h-20 md:w-28 md:h-28 lg:w-36 lg:h-36 rounded-2xl object-cover border-2 border-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            />
          </div>

          {/* Rechts daneben - 2 Bilder versetzt */}
          <div className="absolute right-[15%] md:right-[20%] lg:right-[25%] flex flex-col gap-4 md:gap-6">
            <div style={{ transform: 'translateY(-20px)' }}>
              <img
                src={avatars[7].url}
                alt={`Macher ${avatars[7].id}`}
                className="w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-2xl object-cover border-2 border-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              />
            </div>
            <div style={{ transform: 'translateY(20px)' }}>
              <img
                src={avatars[8].url}
                alt={`Macher ${avatars[8].id}`}
                className="w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-2xl object-cover border-2 border-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              />
            </div>
          </div>

          {/* Rechts außen - 2 Bilder versetzt */}
          <div className="absolute right-0 md:right-4 lg:right-8 flex flex-col gap-4 md:gap-6">
            <div style={{ transform: 'translateY(-15px)' }}>
              <img
                src={avatars[1].url}
                alt={`Macher ${avatars[1].id}`}
                className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-2xl object-cover border-2 border-white shadow-lg"
              />
            </div>
            <div style={{ transform: 'translateY(15px)' }}>
              <img
                src={avatars[0].url}
                alt={`Macher ${avatars[0].id}`}
                className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-2xl object-cover border-2 border-white shadow-lg"
              />
            </div>
          </div>
        </div>

        {/* Text-Bereich unterhalb der zentrierten Bilder */}
        <div className="text-center max-w-3xl mx-auto">
          {/* Badge */}
          <div className="mb-4">
            <span className="inline-block bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-sm font-semibold">
              Deine Community
            </span>
          </div>

          {/* Headline */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Werde Teil von über 500 aus Pflege und Handwerk
          </h2>

          {/* Subheadline */}
          <p className="text-base md:text-lg text-gray-600 mb-8 leading-relaxed">
            Über 500 vertrauen uns bereits und haben sich auf der Plattform verbunden und bereits neue Möglichkeiten entdeckt
          </p>

          {/* CTA Button */}
          <Link
            to="/registrieren"
            className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg text-base md:text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
          >
            Jetzt kostenlos anmelden
          </Link>
        </div>
      </div>
    </section>
  );
}
