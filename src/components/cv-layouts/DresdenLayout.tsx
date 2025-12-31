import React from 'react';
import { CVData, CVLayoutProps, formatDate, formatMonthYear, ProfileImage } from './CVLayoutBase';

const DresdenLayout: React.FC<CVLayoutProps> = ({ data, className = '' }) => {
  const fullName = `${data.vorname || ''} ${data.nachname || ''}`.trim();
  
  return (
    <div className={`cv-a4-page ${className}`} style={{ fontFamily: "'Raleway', sans-serif" }}>
      <div className="flex h-full">
        {/* Left Sidebar - Dark Blue */}
        <div className="w-[38%] p-8 flex flex-col text-white" style={{ backgroundColor: 'hsl(210, 50%, 25%)' }}>
          {/* Profile Image - Square with border */}
          {(data.profilbild || data.avatar_url) && (
            <div className="mb-6 flex justify-center">
              <div className="w-36 h-36 overflow-hidden border-4" style={{ borderColor: 'hsl(210, 50%, 45%)' }}>
                <ProfileImage
                  profilbild={data.profilbild}
                  avatar_url={data.avatar_url}
                  size="full"
                />
              </div>
            </div>
          )}

          {/* Name */}
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold mb-2">{fullName}</h1>
          </div>

          {/* Persönliches Section */}
          <div className="mb-6">
            <h3 className="text-sm font-bold mb-4 uppercase tracking-wider pb-2" style={{ 
              borderBottom: '2px solid hsl(210, 50%, 45%)'
            }}>
              PERSÖNLICHES
            </h3>
            <div className="space-y-3 text-xs">
              {data.geburtsdatum && (
                <div className="flex items-start gap-3">
                  <span className="text-base">📅</span>
                  <div>
                    <div className="font-semibold opacity-90">Geburtsdatum</div>
                    <div>{formatDate(data.geburtsdatum)}</div>
                  </div>
                </div>
              )}
              {data.telefon && (
                <div className="flex items-start gap-3">
                  <span className="text-base">📞</span>
                  <div>
                    <div className="font-semibold opacity-90">Telefon</div>
                    <div>{data.telefon}</div>
                  </div>
                </div>
              )}
              {data.email && (
                <div className="flex items-start gap-3">
                  <span className="text-base">✉️</span>
                  <div>
                    <div className="font-semibold opacity-90">E-Mail</div>
                    <div className="break-all">{data.email}</div>
                  </div>
                </div>
              )}
              {(data.strasse || data.ort) && (
                <div className="flex items-start gap-3">
                  <span className="text-base">📍</span>
                  <div>
                    <div className="font-semibold opacity-90">Adresse</div>
                    <div>
                      {data.strasse && data.hausnummer && `${data.strasse} ${data.hausnummer}`}
                      {data.strasse && data.hausnummer && <br />}
                      {data.plz && data.ort && `${data.plz} ${data.ort}`}
                    </div>
                  </div>
                </div>
              )}
              {data.has_drivers_license && (
                <div className="flex items-start gap-3">
                  <span className="text-base">🚗</span>
                  <div>
                    <div className="font-semibold opacity-90">Führerschein</div>
                    <div>{data.driver_license_class || 'Ja'}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Qualifications Section */}
          {data.qualifikationen && data.qualifikationen.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold mb-4 uppercase tracking-wider pb-2" style={{ 
                borderBottom: '2px solid hsl(210, 50%, 45%)'
              }}>
                QUALIFIKATIONEN
              </h3>
              <div className="space-y-2 text-xs">
                {data.qualifikationen.map((qual, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full mt-1.5" style={{ backgroundColor: 'hsl(50, 100%, 65%)' }} />
                    <div>
                      <div className="font-semibold">{qual.name}</div>
                      {qual.beschreibung && <div className="text-[10px] opacity-90 mt-0.5">{qual.beschreibung}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Languages Section */}
          {data.sprachen && data.sprachen.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold mb-4 uppercase tracking-wider pb-2" style={{ 
                borderBottom: '2px solid hsl(210, 50%, 45%)'
              }}>
                SPRACHEN
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

          {/* Skills */}
          {data.faehigkeiten && data.faehigkeiten.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold mb-4 uppercase tracking-wider pb-2" style={{ 
                borderBottom: '2px solid hsl(210, 50%, 45%)'
              }}>
                FÄHIGKEITEN
              </h3>
              <div className="space-y-1.5 text-xs">
                {data.faehigkeiten.map((skill, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'hsl(50, 100%, 65%)' }} />
                    <span>{skill}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interests */}
          {data.interessen && data.interessen.length > 0 && (
            <div className="mt-auto">
              <h3 className="text-sm font-bold mb-4 uppercase tracking-wider pb-2" style={{ 
                borderBottom: '2px solid hsl(210, 50%, 45%)'
              }}>
                INTERESSEN
              </h3>
              <div className="text-xs space-y-1">
                {data.interessen.map((interesse, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'hsl(50, 100%, 65%)' }} />
                    <span>{interesse}</span>
                  </div>
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
              <h2 className="text-lg font-bold mb-3 uppercase tracking-wide" style={{ color: 'hsl(210, 50%, 25%)' }}>
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
              <h2 className="text-lg font-bold mb-4 uppercase tracking-wide" style={{ color: 'hsl(210, 50%, 25%)' }}>
                Berufserfahrung
              </h2>
              <div className="space-y-4">
                {data.berufserfahrung.map((arbeit, idx) => (
                  <div key={idx} className="avoid-break">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-sm" style={{ color: 'hsl(210, 50%, 25%)' }}>
                        {arbeit.titel}
                      </h3>
                      <span className="text-xs font-semibold whitespace-nowrap ml-4" style={{ color: 'hsl(210, 50%, 45%)' }}>
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
              <h2 className="text-lg font-bold mb-4 uppercase tracking-wide" style={{ color: 'hsl(210, 50%, 25%)' }}>
                Ausbildung
              </h2>
              <div className="space-y-3">
                {data.schulbildung.map((schule, idx) => (
                  <div key={idx} className="avoid-break">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-sm" style={{ color: 'hsl(210, 50%, 25%)' }}>
                        {schule.schulform}
                      </h3>
                      <span className="text-xs font-semibold whitespace-nowrap ml-4" style={{ color: 'hsl(210, 50%, 45%)' }}>
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

          {/* Further Education */}
          {data.weiterbildung && data.weiterbildung.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-bold mb-4 uppercase tracking-wide" style={{ color: 'hsl(210, 50%, 25%)' }}>
                Weiterbildung
              </h2>
              <div className="space-y-3">
                {data.weiterbildung.map((wb, idx) => (
                  <div key={idx} className="avoid-break">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-sm" style={{ color: 'hsl(210, 50%, 25%)' }}>
                        {wb.titel}
                      </h3>
                      {wb.zeitraum_von && (
                        <span className="text-xs font-semibold whitespace-nowrap ml-4" style={{ color: 'hsl(210, 50%, 45%)' }}>
                          {formatMonthYear(wb.zeitraum_von)}{wb.zeitraum_bis && ` - ${formatMonthYear(wb.zeitraum_bis)}`}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-gray-600">
                      {wb.anbieter}
                      {wb.ort && ` • ${wb.ort}`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certificates */}
          {data.zertifikate && data.zertifikate.length > 0 && (
            <div>
              <h2 className="text-lg font-bold mb-4 uppercase tracking-wide" style={{ color: 'hsl(210, 50%, 25%)' }}>
                Zertifikate
              </h2>
              <div className="space-y-2">
                {data.zertifikate.map((zert, idx) => (
                  <div key={idx} className="text-xs">
                    <span className="font-semibold" style={{ color: 'hsl(210, 50%, 25%)' }}>
                      {zert.name}
                    </span>
                    {zert.anbieter && (
                      <span className="text-gray-600"> • {zert.anbieter}</span>
                    )}
                    {zert.datum && (
                      <span className="text-gray-500"> ({zert.datum})</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Signature & Date */}
          <div className="mt-8 pt-4">
            <div className="flex justify-between items-end text-xs" style={{ color: 'hsl(0, 0%, 40%)' }}>
              <div>
                <div className="mb-1">Ort, Datum</div>
                <div className="border-b w-40" style={{ borderColor: 'hsl(210, 50%, 45%)' }}>&nbsp;</div>
              </div>
              <div>
                <div className="mb-1">Unterschrift</div>
                <div className="border-b w-40" style={{ borderColor: 'hsl(210, 50%, 45%)' }}>&nbsp;</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DresdenLayout;
