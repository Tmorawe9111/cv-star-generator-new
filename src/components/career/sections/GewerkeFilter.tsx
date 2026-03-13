import { Wrench, Zap, Car, HardHat, TreePine, Cog, Droplets, Paintbrush, Home } from 'lucide-react';

interface GewerkeFilterProps {
  gewerke: string[];
  accent: string;
}

const GEWERK_ICONS: Record<string, React.ReactNode> = {
  'Elektro': <Zap size={18} />,
  'KFZ': <Car size={18} />,
  'Bau': <HardHat size={18} />,
  'Holz': <TreePine size={18} />,
  'Metall': <Cog size={18} />,
  'Sanitär': <Droplets size={18} />,
  'Maler': <Paintbrush size={18} />,
  'Dachdecker': <Home size={18} />,
};

export default function GewerkeFilter({ gewerke, accent }: GewerkeFilterProps) {
  if (!gewerke.length) return null;

  return (
    <section id="gewerke" style={{ padding: '80px 0', background: '#fff' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          borderRadius: 99, border: `1px solid ${accent}25`, background: `${accent}06`,
          padding: '5px 14px', fontSize: 12, fontWeight: 600, color: accent, marginBottom: 16,
        }}>Gewerke</span>
        <h2 style={{
          fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 900,
          color: '#0f172a', letterSpacing: '-1.5px', marginBottom: 12,
        }}>Dein Gewerk. Dein Profil.</h2>
        <p style={{ fontSize: 15, color: '#64748b', maxWidth: 480, marginBottom: 32 }}>
          Betriebe, die genau deine Fähigkeiten suchen, sehen dein Profil.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }} className="cl-gewerke-grid">
          {gewerke.map((g) => (
            <div
              key={g}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '16px 18px', borderRadius: 14,
                background: '#fff', border: '1px solid #f1f3f5',
                boxShadow: '0 2px 8px rgba(0,0,0,.03)',
                transition: 'box-shadow .3s, transform .3s, border-color .3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = `0 8px 24px ${accent}12`;
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.borderColor = `${accent}30`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,.03)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = '#f1f3f5';
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 10, background: `${accent}10`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: accent, flexShrink: 0,
              }}>
                {GEWERK_ICONS[g] || <Wrench size={18} />}
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{g}</span>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @media(max-width:900px) { .cl-gewerke-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media(max-width:500px) { .cl-gewerke-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}
