import { useState } from 'react';
import type { FachbereichItem } from '@/config/careerBranchContent';

interface FachbereichTabsProps {
  fachbereiche: FachbereichItem[];
  deviceExpertise?: string[];
  accent: string;
  cardRadius: number;
}

export default function FachbereichTabs({ fachbereiche, deviceExpertise, accent, cardRadius }: FachbereichTabsProps) {
  const [activeTab, setActiveTab] = useState(fachbereiche[0]?.id ?? '');
  const active = fachbereiche.find((f) => f.id === activeTab) ?? fachbereiche[0];
  if (!fachbereiche.length) return null;

  return (
    <section id="fachbereiche" style={{ padding: '80px 0', background: '#fff' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          borderRadius: 99, border: `1px solid ${accent}25`, background: `${accent}06`,
          padding: '5px 14px', fontSize: 12, fontWeight: 600, color: accent, marginBottom: 16,
        }}>Fachbereiche</span>
        <h2 style={{
          fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 900,
          color: '#0f172a', letterSpacing: '-1.5px', marginBottom: 32,
        }}>Dein Bereich. Dein Profil.</h2>

        <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
          {fachbereiche.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveTab(f.id)}
              style={{
                padding: '10px 22px', borderRadius: 99, fontSize: 14, fontWeight: 600,
                border: 'none', cursor: 'pointer', transition: 'all .2s',
                background: activeTab === f.id ? accent : 'rgba(0,0,0,.04)',
                color: activeTab === f.id ? '#fff' : '#64748b',
                boxShadow: activeTab === f.id ? `0 4px 16px ${accent}30` : 'none',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {active && (
          <div style={{
            background: '#fff', border: '1px solid #f1f3f5', borderRadius: cardRadius,
            padding: '32px', boxShadow: '0 2px 16px rgba(0,0,0,.04)',
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }} className="cl-fach-grid">
              <div>
                <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.7, marginBottom: 20 }}>{active.description}</p>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>Typische Stellen</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {active.stellen.map((s) => (
                    <span key={s} style={{
                      fontSize: 12, fontWeight: 600, padding: '5px 14px',
                      background: `${accent}10`, color: accent, borderRadius: 99,
                    }}>{s}</span>
                  ))}
                </div>
              </div>
              {deviceExpertise && deviceExpertise.length > 0 && (
                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>Geräte-Know-how</h4>
                  <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12 }}>
                    Diese Hersteller kannst du in deinem Profil angeben:
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {deviceExpertise.map((d) => (
                      <span key={d} style={{
                        fontSize: 12, fontWeight: 500, padding: '5px 14px',
                        background: '#f8f9fa', color: '#374151', borderRadius: 99,
                        border: '1px solid #e5e7eb',
                      }}>{d}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <style>{`
        @media(max-width:700px) { .cl-fach-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}
