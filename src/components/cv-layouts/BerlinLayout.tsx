import React from 'react';
import { CVData, CVLayoutProps, formatDate, formatMonthYear, SignatureBlock, ProfileImage } from './CVLayoutBase';

const BerlinLayout: React.FC<CVLayoutProps> = ({ data, className = '' }) => {
  const fullName = `${data.vorname || ''} ${data.nachname || ''}`.trim();
  
  return (
    <div className={`cv-a4-page ${className}`} style={{ fontFamily: "'Playfair Display', serif" }}>
      <div className="flex h-full">
        {/* Left Sidebar - Beige/Taupe */}
        <div className="w-[35%] p-8 flex flex-col" style={{ backgroundColor: 'hsl(30, 20%, 85%)' }}>
          {/* Profile Image */}
          {(data.profilbild || data.avatar_url) && (
            <div className="mb-6 flex justify-center">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4" style={{ borderColor: 'hsl(30, 20%, 70%)' }}>
            <ProfileImage
              profilbild={data.profilbild}
              avatar_url={data.avatar_url}
              size="full"
              className="rounded-full"
            />
              </div>
            </div>
          )}

          {/* Personal Data */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3 uppercase tracking-wide" style={{ color: 'hsl(30, 20%, 30%)' }}>
              Persönliche Daten
            </h3>
            <div className="space-y-2 text-xs" style={{ color: 'hsl(30, 20%, 25%)' }}>
              {data.geburtsdatum && (
                <div>
                  <div className="font-semibold">Geburtsdatum</div>
                  <div>{formatDate(data.geburtsdatum)}</div>
                </div>
              )}
              {data.telefon && (
                <div>
                  <div className="font-semibold">Telefon</div>
                  <div>{data.telefon}</div>
                </div>
              )}
              {data.email && (
                <div>
                  <div className="font-semibold">E-Mail</div>
                  <div className="break-all">{data.email}</div>
                </div>
              )}
              {(data.strasse || data.ort) && (
                <div>
                  <div className="font-semibold">Adresse</div>
                  <div>
                    {data.strasse && data.hausnummer && `${data.strasse} ${data.hausnummer}`}
                    {data.strasse && data.hausnummer && <br />}
                    {data.plz && data.ort && `${data.plz} ${data.ort}`}
                  </div>
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
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-3 uppercase tracking-wide" style={{ color: 'hsl(30, 20%, 30%)' }}>
                Sprachen
              </h3>
              <div className="space-y-1 text-xs" style={{ color: 'hsl(30, 20%, 25%)' }}>
                {data.sprachen.map((sprache, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="font-semibold">{sprache.sprache}</span>
                    <span>{sprache.niveau}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Qualifications */}
          {data.qualifikationen && data.qualifikationen.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-3 uppercase tracking-wide" style={{ color: 'hsl(30, 20%, 30%)' }}>
                Qualifikationen
              </h3>
              <div className="space-y-2 text-xs" style={{ color: 'hsl(30, 20%, 25%)' }}>
                {data.qualifikationen.map((qual, idx) => (
                  <div key={idx}>
                    <div className="font-semibold">{qual.name}</div>
                    {qual.beschreibung && <div className="text-[10px] mt-0.5">{qual.beschreibung}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {data.faehigkeiten && data.faehigkeiten.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-3 uppercase tracking-wide" style={{ color: 'hsl(30, 20%, 30%)' }}>
                Fähigkeiten
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {data.faehigkeiten.map((skill, idx) => (
                  <span 
                    key={idx} 
                    className="text-[10px] px-2 py-1 rounded"
                    style={{ backgroundColor: 'hsl(30, 20%, 75%)', color: 'hsl(30, 20%, 25%)' }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Interests */}
          {data.interessen && data.interessen.length > 0 && (
            <div className="mt-auto">
              <h3 className="text-sm font-semibold mb-3 uppercase tracking-wide" style={{ color: 'hsl(30, 20%, 30%)' }}>
                Interessen
              </h3>
              <div className="text-xs space-y-1" style={{ color: 'hsl(30, 20%, 25%)' }}>
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
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2" style={{ color: 'hsl(30, 20%, 20%)' }}>
              {fullName}
            </h1>
          </div>

          {/* About Me */}
          {data.ueberMich && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3 border-b-2 pb-1" style={{ 
                color: 'hsl(30, 20%, 25%)', 
                borderColor: 'hsl(30, 20%, 75%)' 
              }}>
                Über mich
              </h2>
              <p className="text-xs leading-relaxed" style={{ color: 'hsl(30, 20%, 30%)' }}>
                {data.ueberMich}
              </p>
            </div>
          )}

          {/* Work Experience */}
          {data.berufserfahrung && data.berufserfahrung.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3 border-b-2 pb-1" style={{ 
                color: 'hsl(30, 20%, 25%)', 
                borderColor: 'hsl(30, 20%, 75%)' 
              }}>
                Beruflicher Werdegang
              </h2>
              <div className="space-y-4">
                {data.berufserfahrung.map((arbeit, idx) => (
                  <div key={idx} className="avoid-break">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-semibold text-sm" style={{ color: 'hsl(30, 20%, 25%)' }}>
                        {arbeit.titel}
                      </h3>
                      <span className="text-xs font-medium" style={{ color: 'hsl(30, 20%, 45%)' }}>
                        {formatMonthYear(arbeit.zeitraum_von)} - {arbeit.zeitraum_bis ? formatMonthYear(arbeit.zeitraum_bis) : 'heute'}
                      </span>
                    </div>
                    <p className="text-xs mb-1" style={{ color: 'hsl(30, 20%, 40%)' }}>
                      {arbeit.unternehmen}
                      {arbeit.ort && ` • ${arbeit.ort}`}
                    </p>
                    {arbeit.beschreibung && (
                      <p className="text-xs leading-relaxed whitespace-pre-line" style={{ color: 'hsl(30, 20%, 35%)' }}>
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
              <h2 className="text-lg font-semibold mb-3 border-b-2 pb-1" style={{ 
                color: 'hsl(30, 20%, 25%)', 
                borderColor: 'hsl(30, 20%, 75%)' 
              }}>
                Weiterbildung
              </h2>
              <div className="space-y-3">
                {data.weiterbildung.map((wb, idx) => (
                  <div key={idx} className="avoid-break">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-semibold text-sm" style={{ color: 'hsl(30, 20%, 25%)' }}>
                        {wb.titel}
                      </h3>
                      {wb.zeitraum_von && (
                        <span className="text-xs font-medium" style={{ color: 'hsl(30, 20%, 45%)' }}>
                          {formatMonthYear(wb.zeitraum_von)}{wb.zeitraum_bis && ` - ${formatMonthYear(wb.zeitraum_bis)}`}
                        </span>
                      )}
                    </div>
                    <p className="text-xs" style={{ color: 'hsl(30, 20%, 40%)' }}>
                      {wb.anbieter}
                      {wb.ort && ` • ${wb.ort}`}
                    </p>
                    {wb.beschreibung && (
                      <p className="text-xs mt-1 whitespace-pre-line" style={{ color: 'hsl(30, 20%, 35%)' }}>
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
              <h2 className="text-lg font-semibold mb-3 border-b-2 pb-1" style={{ 
                color: 'hsl(30, 20%, 25%)', 
                borderColor: 'hsl(30, 20%, 75%)' 
              }}>
                Ausbildung
              </h2>
              <div className="space-y-3">
                {data.schulbildung.map((schule, idx) => (
                  <div key={idx} className="avoid-break">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-semibold text-sm" style={{ color: 'hsl(30, 20%, 25%)' }}>
                        {schule.schulform}
                      </h3>
                      <span className="text-xs font-medium whitespace-nowrap ml-4" style={{ color: 'hsl(30, 20%, 45%)' }}>
                        {schule.zeitraum_von && schule.zeitraum_bis 
                          ? `${formatMonthYear(schule.zeitraum_von)} - ${schule.zeitraum_bis === 'heute' || !schule.zeitraum_bis ? 'heute' : formatMonthYear(schule.zeitraum_bis)}`
                          : schule.zeitraum_von 
                            ? formatMonthYear(schule.zeitraum_von)
                            : schule.zeitraum_bis
                              ? (schule.zeitraum_bis === 'heute' ? 'heute' : formatMonthYear(schule.zeitraum_bis))
                              : ''}
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: 'hsl(30, 20%, 40%)' }}>
                      {schule.name}
                      {schule.ort && ` • ${schule.ort}`}
                    </p>
                    {schule.beschreibung && (
                      <p className="text-xs mt-1 whitespace-pre-line" style={{ color: 'hsl(30, 20%, 35%)' }}>
                        {schule.beschreibung}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certificates */}
          {data.zertifikate && data.zertifikate.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-3 border-b-2 pb-1" style={{ 
                color: 'hsl(30, 20%, 25%)', 
                borderColor: 'hsl(30, 20%, 75%)' 
              }}>
                Zertifikate
              </h2>
              <div className="space-y-2">
                {data.zertifikate.map((zert, idx) => (
                  <div key={idx} className="text-xs">
                    <span className="font-semibold" style={{ color: 'hsl(30, 20%, 25%)' }}>
                      {zert.name}
                    </span>
                    {zert.anbieter && (
                      <span style={{ color: 'hsl(30, 20%, 40%)' }}> • {zert.anbieter}</span>
                    )}
                    {zert.datum && (
                      <span style={{ color: 'hsl(30, 20%, 45%)' }}> ({formatMonthYear(zert.datum)})</span>
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

export default BerlinLayout;