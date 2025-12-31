import React from 'react';
import { CVData, CVLayoutProps, formatDate, formatMonthYear, ProfileImage } from './CVLayoutBase';

const KoelnLayout: React.FC<CVLayoutProps> = ({ data, className = '' }) => {
  const fullName = `${data.vorname || ''} ${data.nachname || ''}`.trim();
  
  return (
    <div className={`cv-a4-page ${className}`} style={{ fontFamily: "'Roboto', sans-serif" }}>
      <div className="flex h-full">
        {/* Left Sidebar - Dark Gray/Anthracite */}
        <div className="w-[38%] p-8 flex flex-col text-white" style={{ backgroundColor: 'hsl(210, 15%, 30%)' }}>
          {/* Profile Image - SQUARE */}
          {(data.profilbild || data.avatar_url) && (
            <div className="mb-6 flex justify-center">
              <div className="w-40 h-40 rounded-lg overflow-hidden border-4" style={{ borderColor: 'hsl(210, 15%, 45%)' }}>
                <ProfileImage
                  profilbild={data.profilbild}
                  avatar_url={data.avatar_url}
                  size="full"
                  className="rounded-lg"
                />
              </div>
            </div>
          )}

          {/* Contact */}
          <div className="mb-6">
            <h3 className="text-sm font-bold mb-3 uppercase tracking-wider pb-2" style={{ borderBottom: '2px solid hsl(210, 15%, 45%)' }}>
              Kontakt
            </h3>
            <div className="space-y-2.5 text-xs">
              {data.telefon && (
                <div className="flex items-center gap-2">
                  <span className="text-base">📞</span>
                  <span>{data.telefon}</span>
                </div>
              )}
              {data.email && (
                <div className="flex items-center gap-2">
                  <span className="text-base">✉️</span>
                  <span className="break-all">{data.email}</span>
                </div>
              )}
              {(data.strasse || data.ort) && (
                <div className="flex items-start gap-2">
                  <span className="text-base">📍</span>
                  <div>
                    {data.strasse && data.hausnummer && `${data.strasse} ${data.hausnummer}`}
                    {data.strasse && data.hausnummer && <br />}
                    {data.plz && data.ort && `${data.plz} ${data.ort}`}
                  </div>
                </div>
              )}
              {data.geburtsdatum && (
                <div className="flex items-center gap-2">
                  <span className="text-base">🎂</span>
                  <span>{formatDate(data.geburtsdatum)}</span>
                </div>
              )}
              {data.has_drivers_license && (
                <div className="flex items-center gap-2">
                  <span className="text-base">🚗</span>
                  <span>{data.driver_license_class || 'Ja'}</span>
                </div>
              )}
            </div>
          </div>

          {/* EDV Skills */}
          {data.faehigkeiten && data.faehigkeiten.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold mb-3 uppercase tracking-wider pb-2" style={{ borderBottom: '2px solid hsl(210, 15%, 45%)' }}>
                EDV-Kenntnisse
              </h3>
              <div className="space-y-1.5 text-xs">
                {data.faehigkeiten.map((skill, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'hsl(40, 100%, 70%)' }} />
                    <span>{skill}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {data.sprachen && data.sprachen.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold mb-3 uppercase tracking-wider pb-2" style={{ borderBottom: '2px solid hsl(210, 15%, 45%)' }}>
                Sprachen
              </h3>
              <div className="space-y-2.5 text-xs">
                {data.sprachen.map((sprache, idx) => (
                  <div key={idx}>
                    <div className="font-semibold">{sprache.sprache}</div>
                    <div className="text-xs opacity-90">{sprache.niveau}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Qualifications */}
          {data.qualifikationen && data.qualifikationen.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold mb-3 uppercase tracking-wider pb-2" style={{ borderBottom: '2px solid hsl(210, 15%, 45%)' }}>
                Qualifikationen
              </h3>
              <div className="space-y-2.5 text-xs">
                {data.qualifikationen.map((qual, idx) => (
                  <div key={idx}>
                    <div className="font-semibold">{qual.name}</div>
                    {qual.beschreibung && <div className="text-[10px] opacity-90 mt-0.5">{qual.beschreibung}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interests */}
          {data.interessen && data.interessen.length > 0 && (
            <div className="mt-auto">
              <h3 className="text-sm font-bold mb-3 uppercase tracking-wider pb-2" style={{ borderBottom: '2px solid hsl(210, 15%, 45%)' }}>
                Interessen
              </h3>
              <div className="text-xs space-y-1">
                {data.interessen.map((interesse, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'hsl(40, 100%, 70%)' }} />
                    <span>{interesse}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Content */}
        <div className="flex-1 p-8 bg-white">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2" style={{ color: 'hsl(210, 15%, 25%)' }}>
              {fullName}
            </h1>
          </div>

          {/* About Me */}
          {data.ueberMich && (
            <div className="mb-6">
              <h2 className="text-lg font-bold mb-3 uppercase tracking-wide" style={{ color: 'hsl(210, 15%, 30%)' }}>
                Profil
              </h2>
              <p className="text-xs leading-relaxed text-gray-700">
                {data.ueberMich}
              </p>
            </div>
          )}

          {/* Work Experience */}
          {data.berufserfahrung && data.berufserfahrung.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-bold mb-3 uppercase tracking-wide" style={{ color: 'hsl(210, 15%, 30%)' }}>
                Berufserfahrung
              </h2>
              <div className="space-y-4">
                {data.berufserfahrung.map((arbeit, idx) => (
                  <div key={idx} className="avoid-break">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-sm" style={{ color: 'hsl(210, 15%, 25%)' }}>
                        {arbeit.titel}
                      </h3>
                      <span className="text-xs font-semibold whitespace-nowrap ml-4" style={{ color: 'hsl(210, 15%, 50%)' }}>
                        {formatMonthYear(arbeit.zeitraum_von)} - {arbeit.zeitraum_bis ? formatMonthYear(arbeit.zeitraum_bis) : 'heute'}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-gray-600 mb-1">
                      {arbeit.unternehmen}
                      {arbeit.ort && ` • ${arbeit.ort}`}
                    </p>
                    {arbeit.beschreibung && (
                      <p className="text-xs leading-relaxed text-gray-700 whitespace-pre-line">
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
              <h2 className="text-lg font-bold mb-3 uppercase tracking-wide" style={{ color: 'hsl(210, 15%, 30%)' }}>
                Ausbildung
              </h2>
              <div className="space-y-3">
                {data.schulbildung.map((schule, idx) => (
                  <div key={idx} className="avoid-break">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-sm" style={{ color: 'hsl(210, 15%, 25%)' }}>
                        {schule.schulform}
                      </h3>
                      <span className="text-xs font-semibold whitespace-nowrap ml-4" style={{ color: 'hsl(210, 15%, 50%)' }}>
                        {formatMonthYear(schule.zeitraum_von)} - {schule.zeitraum_bis === 'heute' || !schule.zeitraum_bis ? 'heute' : formatMonthYear(schule.zeitraum_bis)}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-gray-600">
                      {schule.name}
                      {schule.ort && ` • ${schule.ort}`}
                    </p>
                    {schule.beschreibung && (
                      <p className="text-xs mt-1 text-gray-700 whitespace-pre-line">
                        {schule.beschreibung}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certificates & Further Education */}
          {((data.zertifikate && data.zertifikate.length > 0) || (data.weiterbildung && data.weiterbildung.length > 0)) && (
            <div>
              <h2 className="text-lg font-bold mb-3 uppercase tracking-wide" style={{ color: 'hsl(210, 15%, 30%)' }}>
                Zertifikate & Weiterbildung
              </h2>
              <div className="space-y-3">
                {data.weiterbildung && data.weiterbildung.map((wb, idx) => (
                  <div key={`wb-${idx}`} className="text-xs">
                    <div className="font-semibold" style={{ color: 'hsl(210, 15%, 25%)' }}>
                      {wb.titel}
                    </div>
                    <div className="text-gray-600">
                      {wb.anbieter}
                      {wb.zeitraum_von && ` • ${wb.zeitraum_von}`}
                    </div>
                  </div>
                ))}
                {data.zertifikate && data.zertifikate.map((zert, idx) => (
                  <div key={`zert-${idx}`} className="text-xs">
                    <div className="font-semibold" style={{ color: 'hsl(210, 15%, 25%)' }}>
                      {zert.name}
                    </div>
                    {zert.anbieter && (
                      <div className="text-gray-600">
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

export default KoelnLayout;
