interface ArbeitsmodellFilterProps {
  arbeitsmodelle: string[];
  softwareSkills?: string[];
  accent: string;
  cardRadius: number;
}

export default function ArbeitsmodellFilter({ arbeitsmodelle, softwareSkills, accent, cardRadius }: ArbeitsmodellFilterProps) {
  if (!arbeitsmodelle.length) return null;

  return (
    <section id="arbeitsmodelle" style={{ padding: '80px 0', background: '#fff' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          borderRadius: 99, border: `1px solid ${accent}25`, background: `${accent}06`,
          padding: '5px 14px', fontSize: 12, fontWeight: 600, color: accent, marginBottom: 16,
        }}>Arbeitsmodelle</span>
        <h2 style={{
          fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 900,
          color: '#0f172a', letterSpacing: '-1.5px', marginBottom: 12,
        }}>So willst du arbeiten</h2>
        <p style={{ fontSize: 15, color: '#64748b', maxWidth: 480, marginBottom: 32 }}>
          Gib in deinem Profil an, welche Arbeitsmodelle du suchst – Arbeitgeber filtern danach.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 40 }}>
          {arbeitsmodelle.map((m) => (
            <span
              key={m}
              style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '10px 22px', fontSize: 14, fontWeight: 600,
                borderRadius: 99, border: `2px solid ${accent}40`,
                color: accent, background: `${accent}06`,
                transition: 'all .2s', cursor: 'default',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = accent;
                e.currentTarget.style.color = '#fff';
                e.currentTarget.style.borderColor = accent;
                e.currentTarget.style.boxShadow = `0 4px 16px ${accent}30`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = `${accent}06`;
                e.currentTarget.style.color = accent;
                e.currentTarget.style.borderColor = `${accent}40`;
                e.currentTarget.style.boxShadow = 'none';
              }}
            >{m}</span>
          ))}
        </div>

        {softwareSkills && softwareSkills.length > 0 && (
          <div style={{
            background: '#f8f9fa', borderRadius: cardRadius,
            padding: '28px 32px',
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Software-Kenntnisse</h3>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>
              Zeig, welche Tools du beherrschst – Arbeitgeber sehen das in deinem Profil.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {softwareSkills.map((s) => (
                <span key={s} style={{
                  fontSize: 13, fontWeight: 500, padding: '6px 16px',
                  background: '#fff', color: '#374151', borderRadius: 99,
                  border: '1px solid #e5e7eb',
                }}>{s}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
