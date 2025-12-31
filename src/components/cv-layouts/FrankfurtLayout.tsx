import React from 'react';
import { CVData, CVLayoutProps, formatDate, formatMonthYear, ProfileImage } from './CVLayoutBase';

const FrankfurtLayout: React.FC<CVLayoutProps> = ({ data, className = '' }) => {
  const fullName = `${data.vorname || ''} ${data.nachname || ''}`.trim();
  
  return (
    <div className={`cv-a4-page ${className}`} style={{ fontFamily: "'Montserrat', 'Helvetica', sans-serif" }}>
      <div className="flex h-full">
        {/* Left Sidebar - Light Beige/Cream */}
        <div className="w-[35%] p-8 flex flex-col" style={{ backgroundColor: 'hsl(40, 25%, 92%)', color: 'hsl(0, 0%, 30%)' }}>
          {/* Profile Image - Round */}
          {(data.profilbild || data.avatar_url) && (
            <div className="mb-6 flex justify-center">
              <div className="w-36 h-36 rounded-full overflow-hidden border-4" style={{ borderColor: 'hsl(40, 25%, 80%)' }}>
                <ProfileImage
                  profilbild={data.profilbild}
                  avatar_url={data.avatar_url}
                  size="full"
                  className="rounded-full"
                />
              </div>
            </div>
          )}

          {/* Name */}
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold mb-1" style={{ color: 'hsl(0, 0%, 20%)' }}>
              {fullName}
            </h1>
          </div>

          {/* Contact */}
          <div className="mb-6">
            <h3 className="text-xs font-bold mb-3 uppercase tracking-wider" style={{ color: 'hsl(0, 0%, 25%)' }}>
              Kontakt
            </h3>
            <div className="space-y-2 text-xs">
              {data.telefon && (
                <div className="flex items-start gap-2">
                  <span>📞</span>
                  <span>{data.telefon}</span>
                </div>
              )}
              {data.email && (
                <div className="flex items-start gap-2">
                  <span>✉️</span>
                  <span className="break-all">{data.email}</span>
                </div>
              )}
              {(data.strasse || data.ort) && (
                <div className="flex items-start gap-2">
                  <span>📍</span>
                  <div>
                    {data.strasse && data.hausnummer && `${data.strasse} ${data.hausnummer}`}
                    {data.strasse && data.hausnummer && <br />}
                    {data.plz && data.ort && `${data.plz} ${data.ort}`}
                  </div>
                </div>
              )}
              {data.geburtsdatum && (
                <div className="flex items-start gap-2">
                  <span>🎂</span>
                  <span>{formatDate(data.geburtsdatum)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Education */}
          {data.schulbildung && data.schulbildung.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-bold mb-3 uppercase tracking-wider" style={{ color: 'hsl(0, 0%, 25%)' }}>
                Ausbildung
              </h3>
              <div className="space-y-3 text-xs">
                {data.schulbildung.map((schule, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-start mb-1">
                      <div className="font-semibold" style={{ color: 'hsl(0, 0%, 20%)' }}>
                        {schule.schulform}
                      </div>
                      <span className="text-[10px] font-medium whitespace-nowrap ml-4" style={{ color: 'hsl(0, 0%, 50%)' }}>
                        {formatMonthYear(schule.zeitraum_von)} - {schule.zeitraum_bis === 'heute' || !schule.zeitraum_bis ? 'heute' : formatMonthYear(schule.zeitraum_bis)}
                      </span>
                    </div>
                    <div className="text-[10px]" style={{ color: 'hsl(0, 0%, 40%)' }}>
                      {schule.name}
                      {schule.ort && ` • ${schule.ort}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expertise */}
          {data.qualifikationen && data.qualifikationen.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-bold mb-3 uppercase tracking-wider" style={{ color: 'hsl(0, 0%, 25%)' }}>
                Qualifikationen
              </h3>
              <div className="space-y-1.5 text-xs">
                {data.qualifikationen.map((qual, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="mt-1">•</span>
                    <span>{qual.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Technical Skills */}
          {data.faehigkeiten && data.faehigkeiten.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-bold mb-3 uppercase tracking-wider" style={{ color: 'hsl(0, 0%, 25%)' }}>
                Fähigkeiten
              </h3>
              <div className="space-y-1.5 text-xs">
                {data.faehigkeiten.map((skill, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="mt-1">•</span>
                    <span>{skill}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {data.sprachen && data.sprachen.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-bold mb-3 uppercase tracking-wider" style={{ color: 'hsl(0, 0%, 25%)' }}>
                Sprachen
              </h3>
              <div className="space-y-2 text-xs">
                {data.sprachen.map((sprache, idx) => (
                  <div key={idx}>
                    <div className="font-semibold">{sprache.sprache}</div>
                    <div className="text-[10px]" style={{ color: 'hsl(0, 0%, 45%)' }}>{sprache.niveau}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interests */}
          {data.interessen && data.interessen.length > 0 && (
            <div className="mt-auto">
              <h3 className="text-xs font-bold mb-3 uppercase tracking-wider" style={{ color: 'hsl(0, 0%, 25%)' }}>
                Interessen
              </h3>
              <div className="text-xs space-y-1">
                {data.interessen.map((interesse, idx) => (
                  <div key={idx}>• {interesse}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Content */}
        <div className="flex-1 p-8 bg-white">
          {/* Career Summary */}
          {data.ueberMich && (
            <div className="mb-6">
              <h2 className="text-base font-bold mb-3 uppercase tracking-wide" style={{ color: 'hsl(0, 0%, 20%)' }}>
                Profil
              </h2>
              <p className="text-xs leading-relaxed" style={{ color: 'hsl(0, 0%, 35%)' }}>
                {data.ueberMich}
              </p>
            </div>
          )}

          {/* Professional Experience */}
          {data.berufserfahrung && data.berufserfahrung.length > 0 && (
            <div className="mb-6">
              <h2 className="text-base font-bold mb-4 uppercase tracking-wide" style={{ color: 'hsl(0, 0%, 20%)' }}>
                Berufserfahrung
              </h2>
              <div className="space-y-5">
                {data.berufserfahrung.map((arbeit, idx) => (
                  <div key={idx} className="avoid-break">
                    <div className="mb-1">
                      <h3 className="font-bold text-sm" style={{ color: 'hsl(0, 0%, 20%)' }}>
                        {arbeit.titel}
                      </h3>
                      <div className="flex justify-between items-center">
                        <p className="text-xs font-medium" style={{ color: 'hsl(0, 0%, 40%)' }}>
                          {arbeit.unternehmen}
                          {arbeit.ort && ` • ${arbeit.ort}`}
                        </p>
                        <span className="text-xs font-semibold whitespace-nowrap" style={{ color: 'hsl(0, 0%, 50%)' }}>
                          {formatMonthYear(arbeit.zeitraum_von)} - {arbeit.zeitraum_bis ? formatMonthYear(arbeit.zeitraum_bis) : 'heute'}
                        </span>
                      </div>
                    </div>
                    {arbeit.beschreibung && (
                      <div className="text-xs leading-relaxed whitespace-pre-line" style={{ color: 'hsl(0, 0%, 40%)' }}>
                        {arbeit.beschreibung.split('\n').map((line, i) => (
                          line.trim() && (
                            <div key={i} className="flex gap-2 mb-1">
                              <span>•</span>
                              <span>{line.trim()}</span>
                            </div>
                          )
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications & Further Education */}
          {((data.zertifikate && data.zertifikate.length > 0) || (data.weiterbildung && data.weiterbildung.length > 0)) && (
            <div>
              <h2 className="text-base font-bold mb-3 uppercase tracking-wide" style={{ color: 'hsl(0, 0%, 20%)' }}>
                Zertifikate & Weiterbildung
              </h2>
              <div className="space-y-2.5">
                {data.weiterbildung && data.weiterbildung.map((wb, idx) => (
                  <div key={`wb-${idx}`} className="text-xs">
                    <div className="font-semibold" style={{ color: 'hsl(0, 0%, 25%)' }}>
                      {wb.titel}
                    </div>
                    <div style={{ color: 'hsl(0, 0%, 45%)' }}>
                      {wb.anbieter}
                      {wb.zeitraum_von && ` • ${formatMonthYear(wb.zeitraum_von)}`}
                      {wb.zeitraum_bis && ` - ${formatMonthYear(wb.zeitraum_bis)}`}
                    </div>
                  </div>
                ))}
                {data.zertifikate && data.zertifikate.map((zert, idx) => (
                  <div key={`zert-${idx}`} className="text-xs">
                    <div className="font-semibold" style={{ color: 'hsl(0, 0%, 25%)' }}>
                      {zert.name}
                    </div>
                    {(zert.anbieter || zert.datum) && (
                      <div style={{ color: 'hsl(0, 0%, 45%)' }}>
                        {zert.anbieter}
                        {zert.datum && ` • ${zert.datum}`}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FrankfurtLayout;
