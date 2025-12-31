import React from 'react';
import { CVData, CVLayoutProps, formatDate, formatMonthYear, SignatureBlock, ProfileImage } from './CVLayoutBase';

const MuenchenLayout: React.FC<CVLayoutProps> = ({ data, className = '' }) => {
  const fullName = `${data.vorname || ''} ${data.nachname || ''}`.trim();
  
  return (
    <div className={`cv-a4-page ${className}`} style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex h-full">
        {/* Left Sidebar - Blue */}
        <div className="w-[32%] p-6 flex flex-col text-white" style={{ backgroundColor: 'hsl(205, 70%, 60%)' }}>
          {/* Profile Image */}
          {(data.profilbild || data.avatar_url) && (
            <div className="mb-6 flex justify-center">
              <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-white shadow-lg">
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
            <h1 className="text-2xl font-bold mb-1">{fullName}</h1>
          </div>

          {/* Contact */}
          <div className="mb-6">
            <h3 className="text-xs font-bold mb-3 uppercase tracking-wider border-b border-white/30 pb-2">
              Kontakt
            </h3>
            <div className="space-y-2 text-xs">
              {data.telefon && (
                <div className="flex items-start gap-2">
                  <span className="opacity-80">📞</span>
                  <span>{data.telefon}</span>
                </div>
              )}
              {data.email && (
                <div className="flex items-start gap-2">
                  <span className="opacity-80">✉️</span>
                  <span className="break-all">{data.email}</span>
                </div>
              )}
              {(data.strasse || data.ort) && (
                <div className="flex items-start gap-2">
                  <span className="opacity-80">📍</span>
                  <div>
                    {data.strasse && data.hausnummer && `${data.strasse} ${data.hausnummer}`}
                    {data.strasse && data.hausnummer && <br />}
                    {data.plz && data.ort && `${data.plz} ${data.ort}`}
                  </div>
                </div>
              )}
              {data.geburtsdatum && (
                <div className="flex items-start gap-2">
                  <span className="opacity-80">🎂</span>
                  <span>{formatDate(data.geburtsdatum)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Languages */}
          {data.sprachen && data.sprachen.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-bold mb-3 uppercase tracking-wider border-b border-white/30 pb-2">
                Sprachen
              </h3>
              <div className="space-y-2 text-xs">
                {data.sprachen.map((sprache, idx) => (
                  <div key={idx}>
                    <div className="font-semibold">{sprache.sprache}</div>
                    <div className="text-xs opacity-90">{sprache.niveau}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* EDV Skills */}
          {data.faehigkeiten && data.faehigkeiten.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-bold mb-3 uppercase tracking-wider border-b border-white/30 pb-2">
                EDV-Kenntnisse
              </h3>
              <div className="space-y-1 text-xs">
                {data.faehigkeiten.map((skill, idx) => (
                  <div key={idx}>• {skill}</div>
                ))}
              </div>
            </div>
          )}

          {/* Qualifications */}
          {data.qualifikationen && data.qualifikationen.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-bold mb-3 uppercase tracking-wider border-b border-white/30 pb-2">
                Qualifikationen
              </h3>
              <div className="space-y-2 text-xs">
                {data.qualifikationen.map((qual, idx) => (
                  <div key={idx}>
                    <div className="font-semibold">{qual.name}</div>
                    {qual.beschreibung && <div className="text-[10px] opacity-90">{qual.beschreibung}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certificates */}
          {data.zertifikate && data.zertifikate.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-bold mb-3 uppercase tracking-wider border-b border-white/30 pb-2">
                Zertifikate
              </h3>
              <div className="space-y-2 text-xs">
                {data.zertifikate.map((zert, idx) => (
                  <div key={idx}>
                    <div className="font-semibold">{zert.name}</div>
                    {zert.anbieter && <div className="text-[10px] opacity-90">{zert.anbieter}</div>}
                    {zert.datum && <div className="text-[10px] opacity-80">({zert.datum})</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interests */}
          {data.interessen && data.interessen.length > 0 && (
            <div className="mt-auto">
              <h3 className="text-xs font-bold mb-3 uppercase tracking-wider border-b border-white/30 pb-2">
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
          {/* About Me */}
          {data.ueberMich && (
            <div className="mb-6">
              <h2 className="text-lg font-bold mb-3 uppercase tracking-wide" style={{ color: 'hsl(205, 70%, 60%)' }}>
                Über mich
              </h2>
              <p className="text-xs leading-relaxed text-gray-700">
                {data.ueberMich}
              </p>
            </div>
          )}

          {/* Work Experience */}
          {data.berufserfahrung && data.berufserfahrung.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-bold mb-3 uppercase tracking-wide" style={{ color: 'hsl(205, 70%, 60%)' }}>
                Beruflicher Werdegang
              </h2>
              <div className="space-y-4">
                {data.berufserfahrung.map((arbeit, idx) => (
                  <div key={idx} className="avoid-break">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-sm text-gray-800">
                        {arbeit.titel}
                      </h3>
                      <span className="text-xs font-semibold whitespace-nowrap ml-4" style={{ color: 'hsl(205, 70%, 60%)' }}>
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

          {/* Further Education */}
          {data.weiterbildung && data.weiterbildung.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-bold mb-3 uppercase tracking-wide" style={{ color: 'hsl(205, 70%, 60%)' }}>
                Weiterbildung
              </h2>
              <div className="space-y-3">
                {data.weiterbildung.map((wb, idx) => (
                  <div key={idx} className="avoid-break">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-sm text-gray-800">
                        {wb.titel}
                      </h3>
                      {wb.zeitraum_von && (
                        <span className="text-xs font-semibold whitespace-nowrap ml-4" style={{ color: 'hsl(205, 70%, 60%)' }}>
                          {formatMonthYear(wb.zeitraum_von)}{wb.zeitraum_bis && ` - ${formatMonthYear(wb.zeitraum_bis)}`}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-gray-600">
                      {wb.anbieter}
                      {wb.ort && ` • ${wb.ort}`}
                    </p>
                    {wb.beschreibung && (
                      <p className="text-xs mt-1 text-gray-700 whitespace-pre-line">
                        {wb.beschreibung}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {data.schulbildung && data.schulbildung.length > 0 && (
            <div>
              <h2 className="text-lg font-bold mb-3 uppercase tracking-wide" style={{ color: 'hsl(205, 70%, 60%)' }}>
                Schulbildung
              </h2>
              <div className="space-y-3">
                {data.schulbildung.map((schule, idx) => (
                  <div key={idx} className="avoid-break">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-sm text-gray-800">
                        {schule.schulform}
                      </h3>
                      <span className="text-xs font-semibold whitespace-nowrap ml-4" style={{ color: 'hsl(205, 70%, 60%)' }}>
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

          {/* Signature Block */}
          <div className="mt-8 flex justify-end">
            <SignatureBlock
              vorname={data.vorname}
              nachname={data.nachname}
              ort={data.ort}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MuenchenLayout;