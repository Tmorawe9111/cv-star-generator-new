import React from 'react';
import { CVData, CVLayoutProps, formatDate, formatMonthYear } from './CVLayoutBase';

const DuesseldorfLayout: React.FC<CVLayoutProps> = ({ data, className = '' }) => {
  const fullName = `${data.vorname || ''} ${data.nachname || ''}`.trim();
  
  return (
    <div className={`cv-a4-page ${className}`} style={{ fontFamily: "'Times New Roman', 'Georgia', serif" }}>
      <div className="p-10 bg-white">
        {/* Header - NO PROFILE IMAGE (Harvard Style) */}
        <div className="mb-6 pb-4 border-b" style={{ borderColor: 'hsl(0, 0%, 20%)' }}>
          <h1 className="text-5xl font-bold mb-2 uppercase tracking-wider text-center" style={{ color: 'hsl(0, 0%, 15%)', letterSpacing: '0.1em' }}>
            {fullName}
          </h1>
          
          {/* Contact Info in One Line */}
          <div className="mt-3 text-center text-xs flex justify-center items-center gap-3 flex-wrap" style={{ color: 'hsl(0, 0%, 40%)' }}>
            {data.email && <span>{data.email}</span>}
            {data.email && data.telefon && <span>|</span>}
            {data.telefon && <span>{data.telefon}</span>}
            {data.telefon && (data.strasse || data.ort) && <span>|</span>}
            {(data.strasse || data.ort) && (
              <span>
                {data.strasse && data.hausnummer && `${data.strasse} ${data.hausnummer}, `}
                {data.plz && data.ort && `${data.plz} ${data.ort}`}
              </span>
            )}
          </div>
        </div>

        {/* Professional Overview */}
        {data.ueberMich && (
          <div className="mb-6">
            <h2 className="text-base font-bold mb-3 uppercase tracking-wider pb-1 border-b" style={{ 
              color: 'hsl(0, 0%, 20%)', 
              borderColor: 'hsl(0, 0%, 70%)',
              letterSpacing: '0.08em'
            }}>
              Berufliches Profil
            </h2>
            <p className="text-xs leading-relaxed text-justify" style={{ color: 'hsl(0, 0%, 30%)' }}>
              {data.ueberMich}
            </p>
          </div>
        )}

        {/* Work Experience */}
        {data.berufserfahrung && data.berufserfahrung.length > 0 && (
          <div className="mb-6">
            <h2 className="text-base font-bold mb-4 uppercase tracking-wider pb-1 border-b" style={{ 
              color: 'hsl(0, 0%, 20%)', 
              borderColor: 'hsl(0, 0%, 70%)',
              letterSpacing: '0.08em'
            }}>
              Berufserfahrung
            </h2>
            <div className="space-y-4">
              {data.berufserfahrung.map((arbeit, idx) => (
                <div key={idx} className="avoid-break">
                  <div className="flex justify-between items-baseline mb-1">
                    <div>
                      <h3 className="font-bold text-sm inline" style={{ color: 'hsl(0, 0%, 20%)' }}>
                        {arbeit.unternehmen}
                      </h3>
                      {arbeit.ort && (
                        <span className="text-xs ml-2" style={{ color: 'hsl(0, 0%, 45%)' }}>
                          | {arbeit.ort}
                        </span>
                      )}
                    </div>
                    <span className="text-xs whitespace-nowrap ml-4" style={{ color: 'hsl(0, 0%, 45%)' }}>
                      {formatMonthYear(arbeit.zeitraum_von)} - {arbeit.zeitraum_bis ? formatMonthYear(arbeit.zeitraum_bis) : 'heute'}
                    </span>
                  </div>
                  <p className="text-xs italic mb-2" style={{ color: 'hsl(0, 0%, 35%)' }}>
                    {arbeit.titel}
                  </p>
                  {arbeit.beschreibung && (
                    <div className="text-xs leading-relaxed whitespace-pre-line" style={{ color: 'hsl(0, 0%, 35%)' }}>
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

        {/* Education */}
        {data.schulbildung && data.schulbildung.length > 0 && (
          <div className="mb-6">
            <h2 className="text-base font-bold mb-4 uppercase tracking-wider pb-1 border-b" style={{ 
              color: 'hsl(0, 0%, 20%)', 
              borderColor: 'hsl(0, 0%, 70%)',
              letterSpacing: '0.08em'
            }}>
              Ausbildung
            </h2>
            <div className="space-y-3">
              {data.schulbildung.map((schule, idx) => (
                <div key={idx} className="avoid-break">
                  <div className="flex justify-between items-baseline mb-1">
                    <div>
                      <h3 className="font-bold text-sm inline" style={{ color: 'hsl(0, 0%, 20%)' }}>
                        {schule.name}
                      </h3>
                      {schule.ort && (
                        <span className="text-xs ml-2" style={{ color: 'hsl(0, 0%, 45%)' }}>
                          | {schule.ort}
                        </span>
                      )}
                    </div>
                    <span className="text-xs whitespace-nowrap ml-4" style={{ color: 'hsl(0, 0%, 45%)' }}>
                      {formatMonthYear(schule.zeitraum_von)} - {formatMonthYear(schule.zeitraum_bis)}
                    </span>
                  </div>
                  <p className="text-xs italic" style={{ color: 'hsl(0, 0%, 35%)' }}>
                    {schule.schulform}
                  </p>
                  {schule.beschreibung && (
                    <p className="text-xs mt-1 leading-relaxed" style={{ color: 'hsl(0, 0%, 40%)' }}>
                      {schule.beschreibung}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications & Further Education */}
        {((data.zertifikate && data.zertifikate.length > 0) || (data.weiterbildung && data.weiterbildung.length > 0)) && (
          <div className="mb-6">
            <h2 className="text-base font-bold mb-3 uppercase tracking-wider pb-1 border-b" style={{ 
              color: 'hsl(0, 0%, 20%)', 
              borderColor: 'hsl(0, 0%, 70%)',
              letterSpacing: '0.08em'
            }}>
              Zertifikate & Weiterbildung
            </h2>
            <div className="space-y-2">
              {data.weiterbildung && data.weiterbildung.map((wb, idx) => (
                <div key={`wb-${idx}`} className="text-xs">
                  <span className="font-semibold" style={{ color: 'hsl(0, 0%, 25%)' }}>
                    {wb.titel}
                  </span>
                  {' • '}
                  <span style={{ color: 'hsl(0, 0%, 40%)' }}>
                    {wb.anbieter}
                    {wb.zeitraum_von && ` (${formatMonthYear(wb.zeitraum_von)})`}
                  </span>
                </div>
              ))}
              {data.zertifikate && data.zertifikate.map((zert, idx) => (
                <div key={`zert-${idx}`} className="text-xs">
                  <span className="font-semibold" style={{ color: 'hsl(0, 0%, 25%)' }}>
                    {zert.name}
                  </span>
                  {(zert.anbieter || zert.datum) && (
                    <>
                      {' • '}
                      <span style={{ color: 'hsl(0, 0%, 40%)' }}>
                        {zert.anbieter}
                        {zert.datum && ` (${zert.datum})`}
                      </span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills - 4 Column Grid */}
        <div className="grid grid-cols-2 gap-6">
          {/* Communication Skills / Qualifications */}
          {data.qualifikationen && data.qualifikationen.length > 0 && (
            <div>
              <h3 className="text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: 'hsl(0, 0%, 25%)' }}>
                Qualifikationen
              </h3>
              <div className="space-y-1 text-xs" style={{ color: 'hsl(0, 0%, 35%)' }}>
                {data.qualifikationen.slice(0, 5).map((qual, idx) => (
                  <div key={idx}>• {qual.name}</div>
                ))}
              </div>
            </div>
          )}

          {/* Technical Skills */}
          {data.faehigkeiten && data.faehigkeiten.length > 0 && (
            <div>
              <h3 className="text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: 'hsl(0, 0%, 25%)' }}>
                Fachkenntnisse
              </h3>
              <div className="space-y-1 text-xs" style={{ color: 'hsl(0, 0%, 35%)' }}>
                {data.faehigkeiten.slice(0, 5).map((skill, idx) => (
                  <div key={idx}>• {skill}</div>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {data.sprachen && data.sprachen.length > 0 && (
            <div>
              <h3 className="text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: 'hsl(0, 0%, 25%)' }}>
                Sprachen
              </h3>
              <div className="space-y-1 text-xs" style={{ color: 'hsl(0, 0%, 35%)' }}>
                {data.sprachen.map((sprache, idx) => (
                  <div key={idx}>
                    {sprache.sprache} ({sprache.niveau})
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interests */}
          {data.interessen && data.interessen.length > 0 && (
            <div>
              <h3 className="text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: 'hsl(0, 0%, 25%)' }}>
                Interessen
              </h3>
              <div className="space-y-1 text-xs" style={{ color: 'hsl(0, 0%, 35%)' }}>
                {data.interessen.slice(0, 5).map((interesse, idx) => (
                  <div key={idx}>• {interesse}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DuesseldorfLayout;
