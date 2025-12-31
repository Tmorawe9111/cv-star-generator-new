import React from 'react';
import { CVData, CVLayoutProps, formatDate, formatMonthYear, SignatureBlock, ProfileImage } from './CVLayoutBase';

const LeipzigLayout: React.FC<CVLayoutProps> = ({ data, className = '' }) => {
  const fullName = `${data.vorname || ''} ${data.nachname || ''}`.trim();
  
  return (
    <div className={`cv-a4-page ${className}`} style={{ fontFamily: "'Inter', 'Helvetica', sans-serif" }}>
      <div className="flex h-full">
        {/* Left Sidebar - Black Background */}
        <div className="w-[38%] bg-black text-white p-8 flex flex-col">
          {/* Profile Image */}
          {(data.profilbild || data.avatar_url) && (
            <div className="mb-6">
              <ProfileImage
                profilbild={data.profilbild}
                avatar_url={data.avatar_url}
                size="full"
                className="w-full h-auto grayscale"
              />
            </div>
          )}

          {/* Name */}
          <h1 className="text-4xl font-black uppercase mb-8 leading-tight">
            {fullName || 'YOUR NAME'}
          </h1>

          {/* About Me */}
          <div className="mb-8">
            <h3 className="text-xl font-bold uppercase mb-3">Über mich</h3>
            <p className={`leading-relaxed text-white/90 line-clamp-12 ${
              (data.ueberMich?.length || 0) > 500 ? 'text-xs' : 'text-sm'
            }`}>
              {data.ueberMich || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit.'}
            </p>
          </div>

          {/* Contact */}
          <div className="mt-auto">
            <h3 className="text-xl font-bold uppercase mb-3">Kontakt</h3>
            <div className="space-y-3 text-sm">
              {(data.strasse || data.ort) && (
                <div>
                  <p className="font-bold mb-1">Adresse</p>
                  <p className="text-white/90 text-xs leading-relaxed">
                    {data.strasse && data.hausnummer && `${data.strasse} ${data.hausnummer}`}
                    {data.strasse && data.hausnummer && <br />}
                    {data.plz && data.ort && `${data.plz} ${data.ort}`}
                  </p>
                </div>
              )}
              {data.telefon && (
                <div className="flex items-center gap-2">
                  <span className="text-white/90">📞</span>
                  <span className="text-white/90 text-xs">{data.telefon}</span>
                </div>
              )}
              {data.email && (
                <div className="flex items-center gap-2">
                  <span className="text-white/90">✉</span>
                  <span className="text-white/90 text-xs break-all">{data.email}</span>
                </div>
              )}
              {data.geburtsdatum && (
                <div className="flex items-center gap-2">
                  <span className="text-white/90">🌐</span>
                  <span className="text-white/90 text-xs">Geboren am: {formatDate(data.geburtsdatum)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Content - Light Gray Background */}
        <div className="flex-1 p-8" style={{ backgroundColor: 'hsl(0, 0%, 92%)' }}>
          <div className="space-y-8">
            {/* Education Section */}
            {data.schulbildung && data.schulbildung.length > 0 && (
              <div>
                {/* Section Header with Line */}
                <div className="mb-6">
                  <div className="h-px bg-gradient-to-r from-gray-300 via-black to-black mb-4" />
                  <h2 className="text-2xl font-black uppercase">Ausbildung</h2>
                </div>

                {/* Timeline */}
                <div className="space-y-4">
                  {data.schulbildung.map((schule, idx) => (
                    <div key={idx} className="flex gap-4 items-start">
                      {/* Timeline Date */}
                      <div className="text-sm font-bold w-24 flex-shrink-0 pt-0.5">
                        {formatMonthYear(schule.zeitraum_von)} - {schule.zeitraum_bis === 'heute' || !schule.zeitraum_bis ? 'heute' : formatMonthYear(schule.zeitraum_bis)}
                      </div>
                      
                      {/* Timeline Dot & Line */}
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className="w-3 h-3 rounded-full border-2 border-black bg-white" />
                        {idx < data.schulbildung.length - 1 && (
                          <div className="w-0.5 h-full bg-black" style={{ minHeight: '60px' }} />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 pb-6">
                        <h3 className="font-bold text-base mb-1">{schule.schulform}</h3>
                        <p className="text-sm text-gray-600 italic mb-1">
                          {schule.name}
                          {schule.ort && ` • ${schule.ort}`}
                        </p>
                        {schule.beschreibung && (
                          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                            {schule.beschreibung}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Experience Section */}
            {data.berufserfahrung && data.berufserfahrung.length > 0 && (
              <div>
                {/* Section Header with Line */}
                <div className="mb-6">
                  <div className="h-px bg-gradient-to-r from-gray-300 via-black to-black mb-4" />
                  <h2 className="text-2xl font-black uppercase">Berufserfahrung</h2>
                </div>

                {/* Timeline */}
                <div className="space-y-4">
                  {data.berufserfahrung.map((arbeit, idx) => (
                    <div key={idx} className="flex gap-4 items-start">
                      {/* Timeline Date */}
                      <div className="text-sm font-bold w-24 flex-shrink-0 pt-0.5">
                        {formatMonthYear(arbeit.zeitraum_von)} - {arbeit.zeitraum_bis ? formatMonthYear(arbeit.zeitraum_bis) : 'heute'}
                      </div>
                      
                      {/* Timeline Dot & Line */}
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className="w-3 h-3 rounded-full border-2 border-black bg-white" />
                        {idx < data.berufserfahrung.length - 1 && (
                          <div className="w-0.5 h-full bg-black" style={{ minHeight: '60px' }} />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 pb-6">
                        <h3 className="font-bold text-base mb-1">{arbeit.titel}</h3>
                        <p className="text-sm text-gray-600 italic mb-1">
                          {arbeit.unternehmen}
                          {arbeit.ort && ` • ${arbeit.ort}`}
                        </p>
                        {arbeit.beschreibung && (
                          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                            {arbeit.beschreibung}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills Section */}
            {data.faehigkeiten && data.faehigkeiten.length > 0 && (
              <div>
                {/* Section Header with Line */}
                <div className="mb-6">
                  <div className="h-px bg-gradient-to-r from-gray-300 via-black to-black mb-4" />
                  <h2 className="text-2xl font-black uppercase">Fähigkeiten</h2>
                </div>

                {/* Circular Skill Icons */}
                <div className="flex gap-6 flex-wrap">
                  {data.faehigkeiten.slice(0, 6).map((skill, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-2">
                      <div 
                        className="w-20 h-20 rounded-full border-4 border-gray-400 flex items-center justify-center text-2xl font-black"
                        style={{ backgroundColor: 'hsl(0, 0%, 85%)' }}
                      >
                        <span className="text-center leading-none">
                          {skill.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-xs font-medium text-center w-20 truncate">{skill}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Languages */}
            {data.sprachen && data.sprachen.length > 0 && (
              <div>
                <h3 className="text-sm font-bold uppercase mb-3">Sprachen</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {data.sprachen.map((sprache, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="font-semibold">{sprache.sprache}</span>
                      <span className="text-gray-600">{sprache.niveau}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Signature Block - at the bottom */}
            <div className="mt-auto pt-8 flex justify-end">
              <SignatureBlock
                vorname={data.vorname}
                nachname={data.nachname}
                ort={data.ort}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeipzigLayout;
