import type { WunschItem } from '@/config/careerBranchContent';

interface PflegeWuenscheProps {
  wuensche: WunschItem[];
  accent: string;
  cardRadius: number;
}

export default function PflegeWuensche({ wuensche, accent, cardRadius }: PflegeWuenscheProps) {
  if (!wuensche.length) return null;

  return (
    <section id="wuensche" style={{ padding: '80px 0', background: '#fff' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            borderRadius: 99, border: `1px solid ${accent}25`, background: `${accent}06`,
            padding: '5px 14px', fontSize: 12, fontWeight: 600, color: accent, marginBottom: 16,
          }}>Deine Wünsche</span>
          <h2 style={{
            fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 900,
            color: '#0f172a', letterSpacing: '-1.5px',
          }}>Sag uns, was dir wichtig ist</h2>
          <p style={{ fontSize: 15, color: '#64748b', maxWidth: 480, margin: '12px auto 0' }}>
            Dein Profil zeigt Arbeitgebern, was du suchst – damit nur passende Einrichtungen dich kontaktieren.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }} className="cl-wuensche-grid">
          {wuensche.map((w) => (
            <div
              key={w.title}
              style={{
                background: '#fff', border: '1px solid #f1f3f5',
                borderRadius: cardRadius, padding: '24px 20px',
                boxShadow: '0 2px 12px rgba(0,0,0,.04)',
                transition: 'box-shadow .3s, transform .3s',
                cursor: 'default',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = `0 12px 40px ${accent}15`;
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,.04)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: `${accent}08`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 16, fontSize: 22,
              }}>{w.icon}</div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>{w.title}</h3>
              <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, margin: 0 }}>{w.description}</p>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @media(max-width:900px) { .cl-wuensche-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media(max-width:560px) { .cl-wuensche-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}
