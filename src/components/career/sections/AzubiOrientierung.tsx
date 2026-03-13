import { Link } from 'react-router-dom';
import { ArrowRight, Shield } from 'lucide-react';
import type { OrientierungItem } from '@/config/careerBranchContent';

interface AzubiOrientierungProps {
  orientierung: OrientierungItem[];
  elternBox?: { title: string; text: string; points: string[] };
  accent: string;
  cardRadius: number;
}

export default function AzubiOrientierung({ orientierung, elternBox, accent, cardRadius }: AzubiOrientierungProps) {
  return (
    <section id="orientierung" style={{ padding: '80px 0', background: '#fff' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          borderRadius: 99, border: `1px solid ${accent}25`, background: `${accent}06`,
          padding: '5px 14px', fontSize: 12, fontWeight: 600, color: accent, marginBottom: 16,
        }}>Orientierung</span>
        <h2 style={{
          fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 900,
          color: '#0f172a', letterSpacing: '-1.5px', marginBottom: 12,
        }}>Was interessiert dich?</h2>
        <p style={{ fontSize: 15, color: '#64748b', maxWidth: 480, marginBottom: 40 }}>
          Du musst dich noch nicht entscheiden. Schau dir die Bereiche an.
        </p>

        {orientierung.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 48 }} className="cl-orient-grid">
            {orientierung.map((o) => (
              <div
                key={o.branche}
                style={{
                  background: '#fff', border: '1px solid #f1f3f5',
                  borderRadius: cardRadius, padding: '24px 20px',
                  boxShadow: '0 2px 12px rgba(0,0,0,.04)',
                  transition: 'box-shadow .3s, transform .3s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = `0 12px 40px ${accent}12`;
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,.04)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: 14, background: `${accent}08`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 16, fontSize: 24,
                }}>{o.icon}</div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>{o.branche}</h3>
                <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, marginBottom: 12 }}>{o.description}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {o.beispielBerufe.map((b) => (
                    <span key={b} style={{
                      fontSize: 11, fontWeight: 500, padding: '3px 10px',
                      background: '#f8f9fa', color: '#64748b', borderRadius: 99,
                    }}>{b}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {elternBox && (
          <div style={{
            display: 'flex', gap: 20, alignItems: 'flex-start',
            padding: '28px 32px', borderRadius: cardRadius,
            background: `${accent}04`, border: `1px solid ${accent}15`,
            maxWidth: 600,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, background: `${accent}12`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Shield size={20} style={{ color: accent }} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>{elternBox.title}</h3>
              <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, marginBottom: 12 }}>{elternBox.text}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                {elternBox.points.map((p) => (
                  <span key={p} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#374151', fontWeight: 500 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: accent }} />
                    {p}
                  </span>
                ))}
              </div>
              <Link
                to="/cv-generator?returnTo=/karriere/ausbildung"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: 13, fontWeight: 700, color: accent, textDecoration: 'none',
                }}
              >
                Jetzt Profil erstellen
                <ArrowRight size={14} strokeWidth={2.5} />
              </Link>
            </div>
          </div>
        )}
      </div>
      <style>{`
        @media(max-width:900px) { .cl-orient-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media(max-width:500px) { .cl-orient-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}
