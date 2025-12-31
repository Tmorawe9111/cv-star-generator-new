import React from 'react';
import { CVData, CVLayoutProps, formatDate, formatMonthYear, ProfileImage } from './CVLayoutBase';

const HamburgLayout: React.FC<CVLayoutProps> = ({ data, className = '' }) => {
  const fullName = `${data.vorname || ''} ${data.nachname || ''}`.trim();
  
  return (
    <div className={`cv-a4-page ${className}`} style={{ fontFamily: "'Lato', 'Open Sans', sans-serif" }}>
      <div className="p-8 bg-white">
        {/* Header with Photo */}
        <div className="flex justify-between items-start mb-6 pb-4 border-b-2" style={{ borderColor: 'hsl(0, 0%, 85%)' }}>
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2" style={{ color: 'hsl(0, 0%, 20%)' }}>
              {fullName}
            </h1>
            
            {/* Contact Info in Header */}
            <div className="mt-4 space-y-1 text-xs" style={{ color: 'hsl(0, 0%, 40%)' }}>
              {data.email && <div>✉️ {data.email}</div>}
              {data.telefon && <div>📞 {data.telefon}</div>}
              {(data.strasse || data.ort) && (
                <div>
                  📍 {data.strasse && data.hausnummer && `${data.strasse} ${data.hausnummer}, `}
                  {data.plz && data.ort && `${data.plz} ${data.ort}`}
                </div>
              )}
            </div>
          </div>
          
          {/* Profile Image */}
          {(data.profilbild || data.avatar_url) && (
            <div className="ml-6">
              <div className="w-28 h-28 rounded overflow-hidden border-2" style={{ borderColor: 'hsl(0, 0%, 80%)' }}>
            <ProfileImage
              profilbild={data.profilbild}
              avatar_url={data.avatar_url}
              size="full"
              className="rounded"
            />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-6">
          {/* Left Column - 35% */}
          <div className="w-[35%] space-y-6">
            {/* Personal Data */}
            <div>
              <h3 className="text-sm font-bold mb-3 uppercase tracking-wide pb-1 border-b" style={{ 
                color: 'hsl(0, 0%, 25%)', 
                borderColor: 'hsl(0, 0%, 70%)' 
              }}>
                Persönliche Daten
              </h3>
              <div className="space-y-2 text-xs" style={{ color: 'hsl(0, 0%, 30%)' }}>
                {data.geburtsdatum && (
                  <div>
                    <div className="font-semibold">Geburtsdatum</div>
                    <div>{formatDate(data.geburtsdatum)}</div>
                  </div>
                )}
                {data.has_drivers_license && (
                  <div>
                    <div className="font-semibold">Führerschein</div>
                    <div>{data.driver_license_class || 'Ja'}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Languages */}
            {data.sprachen && data.sprachen.length > 0 && (
              <div>
                <h3 className="text-sm font-bold mb-3 uppercase tracking-wide pb-1 border-b" style={{ 
                  color: 'hsl(0, 0%, 25%)', 
                  borderColor: 'hsl(0, 0%, 70%)' 
                }}>
                  Sprachen
                </h3>
                <div className="space-y-2 text-xs" style={{ color: 'hsl(0, 0%, 30%)' }}>
                  {data.sprachen.map((sprache, idx) => (
                    <div key={idx}>
                      <div className="font-semibold">{sprache.sprache}</div>
                      <div>{sprache.niveau}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Qualifications */}
            {data.qualifikationen && data.qualifikationen.length > 0 && (
              <div>
                <h3 className="text-sm font-bold mb-3 uppercase tracking-wide pb-1 border-b" style={{ 
                  color: 'hsl(0, 0%, 25%)', 
                  borderColor: 'hsl(0, 0%, 70%)' 
                }}>
                  Qualifikationen
                </h3>
                <div className="space-y-2 text-xs" style={{ color: 'hsl(0, 0%, 30%)' }}>
                  {data.qualifikationen.map((qual, idx) => (
                    <div key={idx}>
                      <div className="font-semibold">{qual.name}</div>
                      {qual.beschreibung && <div className="text-[10px] mt-0.5">{qual.beschreibung}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certificates */}
            {data.zertifikate && data.zertifikate.length > 0 && (
              <div>
                <h3 className="text-sm font-bold mb-3 uppercase tracking-wide pb-1 border-b" style={{ 
                  color: 'hsl(0, 0%, 25%)', 
                  borderColor: 'hsl(0, 0%, 70%)' 
                }}>
                  Zertifikate
                </h3>
                <div className="space-y-2 text-xs" style={{ color: 'hsl(0, 0%, 30%)' }}>
                  {data.zertifikate.map((zert, idx) => (
                    <div key={idx}>
                      <div className="font-semibold">{zert.name}</div>
                      {zert.anbieter && <div className="text-[10px]">{zert.anbieter}</div>}
                      {zert.datum && <div className="text-[10px]">({zert.datum})</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Further Education */}
            {data.weiterbildung && data.weiterbildung.length > 0 && (
              <div>
                <h3 className="text-sm font-bold mb-3 uppercase tracking-wide pb-1 border-b" style={{ 
                  color: 'hsl(0, 0%, 25%)', 
                  borderColor: 'hsl(0, 0%, 70%)' 
                }}>
                  Weiterbildung
                </h3>
                <div className="space-y-3 text-xs" style={{ color: 'hsl(0, 0%, 30%)' }}>
                  {data.weiterbildung.map((wb, idx) => (
                    <div key={idx}>
                      <div className="font-semibold">{wb.titel}</div>
                      <div className="text-[10px]">{wb.anbieter}</div>
                      {wb.zeitraum_von && (
                        <div className="text-[10px] font-medium" style={{ color: 'hsl(0, 0%, 45%)' }}>
                          {formatMonthYear(wb.zeitraum_von)}{wb.zeitraum_bis && ` - ${formatMonthYear(wb.zeitraum_bis)}`}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            {data.faehigkeiten && data.faehigkeiten.length > 0 && (
              <div>
                <h3 className="text-sm font-bold mb-3 uppercase tracking-wide pb-1 border-b" style={{ 
                  color: 'hsl(0, 0%, 25%)', 
                  borderColor: 'hsl(0, 0%, 70%)' 
                }}>
                  Fähigkeiten
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {data.faehigkeiten.map((skill, idx) => (
                    <span 
                      key={idx} 
                      className="text-[10px] px-2 py-1 rounded"
                      style={{ backgroundColor: 'hsl(0, 0%, 90%)', color: 'hsl(0, 0%, 30%)' }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Interests */}
            {data.interessen && data.interessen.length > 0 && (
              <div>
                <h3 className="text-sm font-bold mb-3 uppercase tracking-wide pb-1 border-b" style={{ 
                  color: 'hsl(0, 0%, 25%)', 
                  borderColor: 'hsl(0, 0%, 70%)' 
                }}>
                  Interessen
                </h3>
                <div className="text-xs space-y-1" style={{ color: 'hsl(0, 0%, 30%)' }}>
                  {data.interessen.map((interesse, idx) => (
                    <div key={idx}>• {interesse}</div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - 65% */}
          <div className="flex-1 space-y-6">
            {/* About Me */}
            {data.ueberMich && (
              <div>
                <h2 className="text-base font-bold mb-3 uppercase tracking-wide pb-1 border-b-2" style={{ 
                  color: 'hsl(0, 0%, 25%)', 
                  borderColor: 'hsl(0, 0%, 60%)' 
                }}>
                  Über mich
                </h2>
                <p className="text-xs leading-relaxed" style={{ color: 'hsl(0, 0%, 30%)' }}>
                  {data.ueberMich}
                </p>
              </div>
            )}

            {/* Work Experience - Timeline Style */}
            {data.berufserfahrung && data.berufserfahrung.length > 0 && (
              <div>
                <h2 className="text-base font-bold mb-4 uppercase tracking-wide pb-1 border-b-2" style={{ 
                  color: 'hsl(0, 0%, 25%)', 
                  borderColor: 'hsl(0, 0%, 60%)' 
                }}>
                  Beruflicher Werdegang
                </h2>
                <div className="space-y-4">
                  {data.berufserfahrung.map((arbeit, idx) => (
                    <div key={idx} className="avoid-break relative pl-4 border-l-2" style={{ borderColor: 'hsl(0, 0%, 75%)' }}>
                      <div 
                        className="absolute -left-[5px] top-1 w-2 h-2 rounded-full"
                        style={{ backgroundColor: 'hsl(0, 0%, 50%)' }}
                      />
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-sm" style={{ color: 'hsl(0, 0%, 20%)' }}>
                          {arbeit.titel}
                        </h3>
                        <span className="text-xs font-semibold whitespace-nowrap ml-4" style={{ color: 'hsl(0, 0%, 45%)' }}>
                          {formatMonthYear(arbeit.zeitraum_von)} - {arbeit.zeitraum_bis ? formatMonthYear(arbeit.zeitraum_bis) : 'heute'}
                        </span>
                      </div>
                      <p className="text-xs font-medium mb-1" style={{ color: 'hsl(0, 0%, 40%)' }}>
                        {arbeit.unternehmen}
                        {arbeit.ort && ` • ${arbeit.ort}`}
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

            {/* Education - Timeline Style */}
            {data.schulbildung && data.schulbildung.length > 0 && (
              <div>
                <h2 className="text-base font-bold mb-4 uppercase tracking-wide pb-1 border-b-2" style={{ 
                  color: 'hsl(0, 0%, 25%)', 
                  borderColor: 'hsl(0, 0%, 60%)' 
                }}>
                  Bildungsweg
                </h2>
                <div className="space-y-4">
                  {data.schulbildung.map((schule, idx) => (
                    <div key={idx} className="avoid-break relative pl-4 border-l-2" style={{ borderColor: 'hsl(0, 0%, 75%)' }}>
                      <div 
                        className="absolute -left-[5px] top-1 w-2 h-2 rounded-full"
                        style={{ backgroundColor: 'hsl(0, 0%, 50%)' }}
                      />
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-sm" style={{ color: 'hsl(0, 0%, 20%)' }}>
                          {schule.schulform}
                        </h3>
                        <span className="text-xs font-semibold whitespace-nowrap ml-4" style={{ color: 'hsl(0, 0%, 45%)' }}>
                          {formatMonthYear(schule.zeitraum_von)} - {schule.zeitraum_bis === 'heute' || !schule.zeitraum_bis ? 'heute' : formatMonthYear(schule.zeitraum_bis)}
                        </span>
                      </div>
                      <p className="text-xs font-medium mb-1" style={{ color: 'hsl(0, 0%, 40%)' }}>
                        {schule.name}
                        {schule.ort && ` • ${schule.ort}`}
                      </p>
                      {schule.beschreibung && (
                        <p className="text-xs leading-relaxed whitespace-pre-line" style={{ color: 'hsl(0, 0%, 35%)' }}>
                          {schule.beschreibung}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HamburgLayout;