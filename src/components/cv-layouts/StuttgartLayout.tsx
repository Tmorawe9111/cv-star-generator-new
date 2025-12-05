import React from 'react';
import { CVData, CVLayoutProps, formatDate, formatMonthYear, ProfileImage } from './CVLayoutBase';

const StuttgartLayout: React.FC<CVLayoutProps> = ({ data, className = '' }) => {
  const fullName = `${data.vorname || ''} ${data.nachname || ''}`.trim();
  
  return (
    <div className={`cv-a4-page ${className}`} style={{ fontFamily: "'Lato', sans-serif" }}>
      <div className="flex h-full">
        {/* Left Sidebar - Orange/Beige */}
        <div className="w-[35%] p-6 flex flex-col" style={{ backgroundColor: 'hsl(30, 60%, 90%)' }}>
          {/* Profile Image */}
          {(data.profilbild || data.avatar_url) && (
            <div className="mb-6 flex justify-center">
              <div className="w-40 h-40 rounded-lg overflow-hidden border-4" style={{ borderColor: 'hsl(30, 60%, 75%)' }}>
                <ProfileImage
                  profilbild={data.profilbild}
                  avatar_url={data.avatar_url}
                  size="full"
                  className="rounded-lg"
                />
              </div>
            </div>
          )}

          {/* Kenntnisse Section */}
          <div className="mb-6">
            <h3 className="text-sm font-bold mb-3 pb-2 border-b" style={{ 
              color: 'hsl(25, 80%, 45%)',
              borderColor: 'hsl(25, 80%, 45%)'
            }}>
              KENNTNISSE
            </h3>

            {/* Languages */}
            {data.sprachen && data.sprachen.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-semibold mb-2" style={{ color: 'hsl(0, 0%, 30%)' }}>
                  Sprachen
                </h4>
                <div className="space-y-1.5 text-xs" style={{ color: 'hsl(0, 0%, 35%)' }}>
                  {data.sprachen.map((sprache, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{sprache.sprache}</span>
                      <span className="font-medium">{sprache.niveau}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Computer Skills */}
            {data.faehigkeiten && data.faehigkeiten.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold mb-2" style={{ color: 'hsl(0, 0%, 30%)' }}>
                  Computerkenntnisse
                </h4>
                <div className="space-y-1 text-xs" style={{ color: 'hsl(0, 0%, 35%)' }}>
                  {data.faehigkeiten.map((skill, idx) => (
                    <div key={idx}>• {skill}</div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Qualifications */}
          {data.qualifikationen && data.qualifikationen.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold mb-3 pb-2 border-b" style={{ 
                color: 'hsl(25, 80%, 45%)',
                borderColor: 'hsl(25, 80%, 45%)'
              }}>
                QUALIFIKATIONEN
              </h3>
              <div className="space-y-2 text-xs" style={{ color: 'hsl(0, 0%, 35%)' }}>
                {data.qualifikationen.map((qual, idx) => (
                  <div key={idx}>
                    <div className="font-semibold">{qual.name}</div>
                    {qual.beschreibung && <div className="text-[10px]">{qual.beschreibung}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interests */}
          {data.interessen && data.interessen.length > 0 && (
            <div className="mt-auto">
              <h3 className="text-sm font-bold mb-3 pb-2 border-b" style={{ 
                color: 'hsl(25, 80%, 45%)',
                borderColor: 'hsl(25, 80%, 45%)'
              }}>
                HOBBYS
              </h3>
              <div className="text-xs space-y-1" style={{ color: 'hsl(0, 0%, 35%)' }}>
                {data.interessen.map((interesse, idx) => (
                  <div key={idx}>• {interesse}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Content */}
        <div className="flex-1 p-8 bg-white">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-1" style={{ color: 'hsl(25, 80%, 45%)' }}>
              {fullName}
            </h1>
            
            {/* Contact Info */}
            <div className="mt-3 space-y-1 text-xs" style={{ color: 'hsl(0, 0%, 40%)' }}>
              {data.email && <div>📧 {data.email}</div>}
              {data.telefon && <div>📞 {data.telefon}</div>}
              {(data.strasse || data.ort) && (
                <div>
                  📍 {data.strasse && data.hausnummer && `${data.strasse} ${data.hausnummer}, `}
                  {data.plz && data.ort && `${data.plz} ${data.ort}`}
                </div>
              )}
              {data.geburtsdatum && <div>🎂 {formatDate(data.geburtsdatum)}</div>}
            </div>
          </div>

          {/* About Me */}
          {data.ueberMich && (
            <div className="mb-6">
              <h2 className="text-base font-bold mb-3 pb-1 border-b" style={{ 
                color: 'hsl(25, 80%, 45%)',
                borderColor: 'hsl(25, 80%, 70%)'
              }}>
                ÜBER MICH
              </h2>
              <p className="text-xs leading-relaxed" style={{ color: 'hsl(0, 0%, 30%)' }}>
                {data.ueberMich}
              </p>
            </div>
          )}

          {/* Work Experience */}
          {data.berufserfahrung && data.berufserfahrung.length > 0 && (
            <div className="mb-6">
              <h2 className="text-base font-bold mb-3 pb-1 border-b" style={{ 
                color: 'hsl(25, 80%, 45%)',
                borderColor: 'hsl(25, 80%, 70%)'
              }}>
                PRAXISERFAHRUNG
              </h2>
              <div className="space-y-4">
                {data.berufserfahrung.map((arbeit, idx) => (
                  <div key={idx} className="avoid-break">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-sm" style={{ color: 'hsl(0, 0%, 20%)' }}>
                        {arbeit.titel}
                      </h3>
                      <span className="text-xs font-medium whitespace-nowrap ml-4" style={{ color: 'hsl(0, 0%, 45%)' }}>
                        {formatMonthYear(arbeit.zeitraum_von)} - {arbeit.zeitraum_bis ? formatMonthYear(arbeit.zeitraum_bis) : 'heute'}
                      </span>
                    </div>
                    <p className="text-xs mb-1" style={{ color: 'hsl(0, 0%, 40%)' }}>
                      {arbeit.unternehmen}
                      {arbeit.ort && ` • ${arbeit.ort}`}
                      {arbeit.abschluss && ` • Abschluss: ${arbeit.abschluss}`}
                    </p>
                    {arbeit.beschreibung && (
                      <p className="text-xs leading-relaxed whitespace-pre-line" style={{ color: 'hsl(0, 0%, 35%)' }}>
                        {arbeit.beschreibung}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {data.schulbildung && data.schulbildung.length > 0 && (
            <div className="mb-6">
              <h2 className="text-base font-bold mb-3 pb-1 border-b" style={{ 
                color: 'hsl(25, 80%, 45%)',
                borderColor: 'hsl(25, 80%, 70%)'
              }}>
                SCHULBILDUNG
              </h2>
              <div className="space-y-3">
                {data.schulbildung.map((schule, idx) => (
                  <div key={idx} className="avoid-break">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-sm" style={{ color: 'hsl(0, 0%, 20%)' }}>
                        {schule.schulform}
                      </h3>
                      <span className="text-xs font-medium whitespace-nowrap ml-4" style={{ color: 'hsl(0, 0%, 45%)' }}>
                        {formatMonthYear(schule.zeitraum_von)} - {formatMonthYear(schule.zeitraum_bis)}
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: 'hsl(0, 0%, 40%)' }}>
                      {schule.name}
                      {schule.ort && ` • ${schule.ort}`}
                    </p>
                    {schule.beschreibung && (
                      <p className="text-xs mt-1 whitespace-pre-line" style={{ color: 'hsl(0, 0%, 35%)' }}>
                        {schule.beschreibung}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Signature & Date */}
          <div className="mt-8 pt-4 border-t" style={{ borderColor: 'hsl(0, 0%, 85%)' }}>
            <div className="flex justify-between items-end text-xs" style={{ color: 'hsl(0, 0%, 40%)' }}>
              <div>
                <div className="mb-1">Datum</div>
                <div className="border-b w-32" style={{ borderColor: 'hsl(0, 0%, 60%)' }}>&nbsp;</div>
              </div>
              <div>
                <div className="mb-1">Unterschrift</div>
                <div className="border-b w-32" style={{ borderColor: 'hsl(0, 0%, 60%)' }}>&nbsp;</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StuttgartLayout;
