/**
 * Dark Lebenslauf Page – Marketing-Landing für CV Generator
 * /lebenslauf-erstellen oder /cv-generator Landing
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { DarkLandingLayout } from '@/components/landing/DarkLandingLayout';
import { ProfileAvatar } from '@/components/landing/ProfileAvatar';

const R = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', ...style }}>{children}</div>
);

const Badge = ({ children, color = '#5170ff' }: { children: React.ReactNode; color?: string }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, borderRadius: 99, border: `1px solid ${color}40`, background: `${color}12`, padding: '5px 14px', fontSize: 12, fontWeight: 600, color }}>{children}</span>
);

const CVMockup = ({ accent = '#5170ff', name = 'Lisa Maier', role = 'Pflegefachkraft' }: { accent?: string; name?: string; role?: string }) => (
  <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,.15)', border: '1px solid rgba(15,23,42,.08)' }}>
    <div style={{ background: accent, padding: '24px 24px 20px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,.08)' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,.2)', border: '3px solid rgba(255,255,255,.4)', overflow: 'hidden', flexShrink: 0 }}>
          <ProfileAvatar name={name} size={56} />
        </div>
        <div>
          <p style={{ fontSize: 18, fontWeight: 800, color: 'white', margin: '0 0 2px' }}>{name}</p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,.75)', margin: 0 }}>{role}</p>
        </div>
      </div>
    </div>
    <div style={{ padding: '18px 24px', background: '#fafafa' }}>
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid #e5e7eb' }}>
        {['📍 Hamburg', '📞 01XX XXXXXX', '✉ lisa@mail.de'].map((c) => (
          <span key={c} style={{ fontSize: 10, color: '#6b7280' }}>{c}</span>
        ))}
      </div>
      <p style={{ fontSize: 10, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 8px' }}>Berufserfahrung</p>
      {[{ title: 'Pflegefachkraft', company: 'Asklepios Klinik', years: '2021–heute' }].map((e, i) => (
        <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
          <div style={{ width: 3, borderRadius: 99, background: accent, alignSelf: 'stretch', flexShrink: 0, marginTop: 3 }} />
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#111', margin: 0 }}>{e.title} · <span style={{ color: '#6b7280', fontWeight: 400 }}>{e.company}</span></p>
            <p style={{ fontSize: 10, color: '#9ca3af', margin: '1px 0 0' }}>{e.years}</p>
          </div>
        </div>
      ))}
      <p style={{ fontSize: 10, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: 1, margin: '14px 0 8px' }}>Skills</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {['Intensivpflege', 'Teamarbeit', 'Dokumentation'].map((s) => (
          <span key={s} style={{ fontSize: 10, fontWeight: 600, background: `${accent}15`, color: accent, borderRadius: 99, padding: '3px 10px' }}>{s}</span>
        ))}
      </div>
    </div>
  </div>
);

const templates = [
  { accent: '#5170ff', name: 'Professionell', desc: 'Klar & überzeugend' },
  { accent: '#7c3aed', name: 'Modern', desc: 'Frisch & zeitgemäß' },
  { accent: '#059669', name: 'Klassisch', desc: 'Bewährt & seriös' },
  { accent: '#dc2626', name: 'Bold', desc: 'Auffällig & stark' },
];

export default function DarkLebenslaufPage() {
  const [activeTpl, setActiveTpl] = useState(0);

  return (
    <DarkLandingLayout ctaText="Lebenslauf erstellen">
      {/* HERO */}
      <section
        style={{
          padding: '150px 0 90px',
          position: 'relative',
          overflow: 'hidden',
          background: 'transparent',
        }}
      >
        <R>
          <div className="hero-cv" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 72, alignItems: 'center' }}>
            <div>
              <div className="fu" style={{ marginBottom: 20 }}>
                <Badge>✦ Kostenlos & in 5 Minuten</Badge>
              </div>
              <h1 className="fu1" style={{ fontSize: 'clamp(32px,5vw,62px)', fontWeight: 900, color: 'white', letterSpacing: '-2.5px', lineHeight: 1.08, marginBottom: 22 }}>
                Lebenslauf erstellen –<br />
                <span className="grad-text">
                  kostenlos & online.
                </span>
              </h1>
              <p className="fu2" style={{ fontSize: 18, color: 'rgba(255,255,255,.6)', lineHeight: 1.75, marginBottom: 36 }}>
                Kein Word, keine Vorlage, kein Stress. Beantworte ein paar Fragen – wir erstellen deinen professionellen Lebenslauf automatisch. Für Pflegekräfte, Handwerker & alle Non-Akademiker.
              </p>
              <div className="fu2" style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 40 }}>
                {['✓  Kostenlos & ohne Anmeldung starten', '✓  Professionelle Vorlagen für jede Branche', '✓  Als PDF herunterladen oder Profil live stellen', '✓  Direkt von Recruitern gefunden werden'].map((c, i) => (
                  <p key={i} style={{ fontSize: 14, color: 'rgba(255,255,255,.6)', margin: 0, display: 'flex', gap: 8 }}>
                    <span style={{ color: '#059669', fontWeight: 700 }}>{c.split('  ')[0]}</span>
                    <span>{c.split('  ')[1]}</span>
                  </p>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link to="/cv-generator" className="glow" style={{ background: '#5170ff', color: 'white', borderRadius: 99, padding: '15px 32px', fontSize: 15, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 9 }}>
                  Jetzt Lebenslauf erstellen
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                </Link>
                <a href="#vorlagen" style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', color: 'rgba(255,255,255,.6)', borderRadius: 99, padding: '15px 24px', fontSize: 15, textDecoration: 'none', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
                  Vorlagen ansehen
                </a>
              </div>
            </div>
            <div className="fu2 float">
              <CVMockup accent={templates[activeTpl].accent} />
            </div>
          </div>
        </R>
      </section>

      {/* SOCIAL PROOF */}
      <div
        style={{
          borderTop: '1px solid rgba(255,255,255,.06)',
          borderBottom: '1px solid rgba(255,255,255,.06)',
          padding: '20px 0',
          background: 'transparent',
        }}
      >
        <R>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40, flexWrap: 'wrap' }}>
            {[
              { n: '5.000+', label: 'erstellte Lebensläufe' },
              { n: '4.8 ★', label: 'Durchschnittsbewertung' },
              { n: '< 5 Min', label: 'bis zum fertigen CV' },
              { n: '0 €', label: 'Kostenlos für immer' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '0 20px', borderRight: i < 3 ? '1px solid rgba(255,255,255,.06)' : 'none' }}>
                <p style={{ fontSize: 20, fontWeight: 900, color: 'white', letterSpacing: '-0.5px', margin: '0 0 2px' }}>{s.n}</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', margin: 0 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </R>
      </div>

      {/* TEMPLATES */}
      <section
        id="vorlagen"
        style={{
          padding: '90px 0',
          background: 'transparent',
        }}
      >
        <R>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontSize: 'clamp(26px,4vw,46px)', fontWeight: 900, color: 'white', letterSpacing: '-2px', marginBottom: 14 }}>
              Professionelle Vorlagen –<br />
              <span style={{ color: 'rgba(255,255,255,.4)' }}>für jeden Beruf.</span>
            </h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,.5)', maxWidth: 440, margin: '0 auto' }}>
              Alle Vorlagen sind ATS-optimiert – das heißt sie werden von HR-Software korrekt gelesen.
            </p>
          </div>
          <div className="tpl-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
            {templates.map((tpl, i) => (
              <div
                key={i}
                onClick={() => setActiveTpl(i)}
                style={{
                  borderRadius: 18,
                  overflow: 'hidden',
                  border: `2px solid ${activeTpl === i ? tpl.accent : 'rgba(255,255,255,.1)'}`,
                  cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(0,0,0,.2)',
                  transition: 'transform .3s, box-shadow .3s',
                  background: '#0d0d10',
                }}
              >
                <div
                  style={{
                    background: 'transparent',
                    padding: '14px 10px 10px',
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      width: 180,
                      transform: 'scale(0.8)',
                      transformOrigin: 'top center',
                    }}
                  >
                    <CVMockup accent={tpl.accent} />
                  </div>
                </div>
                <div
                  style={{
                    padding: '10px 14px 12px',
                    background: '#0d0d10',
                    borderTop: '1px solid rgba(255,255,255,.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                  }}
                >
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'white', margin: 0 }}>{tpl.name}</p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', margin: 0 }}>{tpl.desc}</p>
                  </div>
                  {activeTpl === i && (
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: tpl.accent,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <Link to="/cv-generator" className="glow" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, background: '#5170ff', color: 'white', borderRadius: 99, padding: '15px 36px', fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
              Diese Vorlage verwenden
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
            </Link>
          </div>
        </R>
      </section>

      {/* CTA */}
      <section
        style={{
          padding: '0 0 80px',
          background: 'transparent',
        }}
      >
        <R>
          <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 28, padding: '64px 48px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,.3)' }}>
            <h2 style={{ fontSize: 'clamp(26px,4vw,50px)', fontWeight: 900, color: 'white', letterSpacing: '-2px', marginBottom: 16, lineHeight: 1.1 }}>
              Lebenslauf erstellen –<br />kostenlos & in 5 Minuten.
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,.6)', marginBottom: 36, maxWidth: 440, margin: '0 auto 36px' }}>
              Kein Account nötig um zu starten. Einfach loslegen.
            </p>
            <Link to="/cv-generator" className="glow" style={{ background: '#5170ff', color: 'white', borderRadius: 99, padding: '16px 40px', fontSize: 16, fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}>
              Jetzt kostenlos starten →
            </Link>
          </div>
        </R>
      </section>
    </DarkLandingLayout>
  );
}
