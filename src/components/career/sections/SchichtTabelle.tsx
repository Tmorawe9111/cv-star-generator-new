import { Clock, Info } from 'lucide-react';

interface SchichtTabelleProps {
  schichtmodelle: string[];
  tarifInfo?: string;
  accent: string;
}

const SCHICHT_DETAILS: Record<string, string> = {
  'Tagschicht': 'Mo–Fr, ca. 6:00–14:30',
  'Frühschicht': 'ca. 5:30–14:00',
  'Spätschicht': 'ca. 13:30–22:00',
  'Nachtschicht': 'ca. 21:30–6:00',
  'Wechselschicht': 'Früh/Spät/Nacht im Wechsel',
  'Vollkonti': 'Durchgehend inkl. Wochenende',
};

export default function SchichtTabelle({ schichtmodelle, tarifInfo, accent }: SchichtTabelleProps) {
  if (!schichtmodelle.length) return null;

  return (
    <section id="schichttabelle" style={{ padding: '80px 0', background: '#fff' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          borderRadius: 99, border: `1px solid ${accent}25`, background: `${accent}06`,
          padding: '5px 14px', fontSize: 12, fontWeight: 600, color: accent, marginBottom: 16,
        }}>Rahmenbedingungen</span>
        <h2 style={{
          fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 900,
          color: '#0f172a', letterSpacing: '-1.5px', marginBottom: 12,
        }}>Schichtmodelle &amp; Tarif</h2>
        <p style={{ fontSize: 15, color: '#64748b', maxWidth: 520, marginBottom: 32 }}>
          Gib in deinem Profil an, welche Schichtmodelle du bevorzugst.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }} className="cl-schicht-grid">
          {schichtmodelle.map((s) => (
            <div
              key={s}
              style={{
                padding: '18px 20px', borderRadius: 14,
                background: '#fff', border: '1px solid #f1f3f5',
                boxShadow: '0 2px 8px rgba(0,0,0,.03)',
                transition: 'box-shadow .3s, transform .3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = `0 8px 24px ${accent}12`;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,.03)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Clock size={14} style={{ color: accent }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{s}</span>
              </div>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 8px' }}>{SCHICHT_DETAILS[s] || 'Nach Vereinbarung'}</p>
              <span style={{
                fontSize: 11, fontWeight: 600, padding: '3px 10px',
                background: `${accent}08`, color: accent, borderRadius: 99,
              }}>Im Profil wählbar</span>
            </div>
          ))}
        </div>

        {tarifInfo && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 12,
            padding: '18px 22px', borderRadius: 14,
            background: `${accent}04`, border: `1px solid ${accent}15`,
            maxWidth: 600,
          }}>
            <Info size={18} style={{ color: accent, flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>Tarif-Information</p>
              <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, margin: 0 }}>{tarifInfo}</p>
            </div>
          </div>
        )}
      </div>
      <style>{`
        @media(max-width:900px) { .cl-schicht-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media(max-width:500px) { .cl-schicht-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}
