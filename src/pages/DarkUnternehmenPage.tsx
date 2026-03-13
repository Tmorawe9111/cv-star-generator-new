/**
 * Dark Unternehmen Page – Für Arbeitgeber
 * Mit Employer-Logos und COMPANY_PRICING_TIERS
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { DarkLandingLayout } from '@/components/landing/DarkLandingLayout';
import { COMPANY_PRICING_TIERS } from '@/config/companyPricing';
import { ProfileAvatar } from '@/components/landing/ProfileAvatar';

const R = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', ...style }}>{children}</div>
);

const Badge = ({ children, color = '#4ade80' }: { children: React.ReactNode; color?: string }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, borderRadius: 99, border: `1px solid ${color}40`, background: `${color}12`, padding: '5px 14px', fontSize: 12, fontWeight: 600, color }}>{children}</span>
);

const DashboardMockup = () => (
  <div style={{ background: '#0d0d10', border: '1px solid rgba(255,255,255,.09)', borderRadius: 22, overflow: 'hidden', boxShadow: '0 48px 100px rgba(0,0,0,.8)' }}>
    <div style={{ background: 'linear-gradient(135deg,rgba(81,112,255,.1),rgba(124,58,237,.06))', borderBottom: '1px solid rgba(81,112,255,.15)', padding: '13px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 30, height: 30, borderRadius: 9, background: 'linear-gradient(135deg,#5170ff,#3b56e8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 900, color: 'white' }}>K</span>
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'white', margin: 0 }}>Klinikum Mitte <span style={{ color: '#5170ff', fontSize: 11 }}>✓ Verifiziert</span></p>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', margin: 0 }}>Arbeitgeber-Dashboard</p>
      </div>
      <div style={{ background: 'rgba(74,222,128,.12)', border: '1px solid rgba(74,222,128,.25)', borderRadius: 99, padding: '4px 12px' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#4ade80' }}>● Aktiv</span>
      </div>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
      {[{ n: '247', l: 'Profil-Ansichten', c: '#5170ff' }, { n: '38', l: 'Kandidaten', c: '#4ade80' }, { n: '3', l: 'Offene Stellen', c: '#fbbf24' }].map((s, i) => (
        <div key={i} style={{ padding: '14px 18px', borderRight: i < 2 ? '1px solid rgba(255,255,255,.06)' : 'none', textAlign: 'center' }}>
          <p style={{ fontSize: 22, fontWeight: 900, color: s.c, margin: '0 0 2px', letterSpacing: '-1px' }}>{s.n}</p>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', margin: 0 }}>{s.l}</p>
        </div>
      ))}
    </div>
    <div style={{ padding: '14px 18px' }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 12px' }}>Neue Kandidaten</p>
      {[
        { name: 'Lisa M.', role: 'Pflegefachkraft', match: 97, tag: 'Top Match' },
        { name: 'Tobias R.', role: 'OTA', match: 89, tag: '' },
        { name: 'Sara N.', role: 'Krankenschwester', match: 84, tag: '' },
      ].map((c, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,.04)' : 'none' }}>
          <div style={{ padding: 2, background: 'linear-gradient(135deg,#5170ff,#a78bfa)', borderRadius: '50%', display: 'inline-flex', flexShrink: 0 }}><div style={{ borderRadius: '50%', overflow: 'hidden' }}><ProfileAvatar name={c.name} size={34} /></div></div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'white', margin: 0 }}>{c.name}</p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', margin: 0 }}>{c.role}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {c.tag && <span style={{ fontSize: 10, fontWeight: 600, background: 'rgba(74,222,128,.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,.2)', borderRadius: 99, padding: '2px 8px' }}>{c.tag}</span>}
            <div style={{ background: 'rgba(81,112,255,.15)', borderRadius: 99, padding: '4px 10px' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#5170ff' }}>{c.match}%</span>
            </div>
            <Link to="/unternehmensregistrierung" style={{ background: '#5170ff', border: 'none', borderRadius: 99, padding: '5px 12px', fontSize: 10, fontWeight: 600, color: 'white', cursor: 'pointer', textDecoration: 'none' }}>Schreiben</Link>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const EMPLOYER_LOGOS = [
  { src: '/assets/employers/rothenberger.png', alt: 'Rothenberger' },
  { src: '/assets/employers/fraport.png', alt: 'Fraport' },
  { src: '/assets/employers/thyssenkrupp.png', alt: 'Thyssenkrupp' },
  { src: '/assets/employers/curmundo.png', alt: 'Curmundo' },
  { src: '/assets/employers/asklepios.png', alt: 'Asklepios' },
  { src: '/assets/employers/merck.jpg', alt: 'Merck' },
  { src: '/assets/employers/helios.png', alt: 'Helios Kliniken' },
  { src: '/assets/employers/klinikum-mitte.png', alt: 'Klinikum Mitte' },
  { src: '/assets/employers/awo.png', alt: 'AWO Berlin' },
];

export default function DarkUnternehmenPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <DarkLandingLayout ctaText="Demo buchen" ctaLink="/unternehmensregistrierung" ctaStyle="green">
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
          <div className="hero-unt" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
            <div>
              <div className="fu" style={{ marginBottom: 20 }}>
                <Badge color="#059669">Für Arbeitgeber</Badge>
              </div>
              <h1 className="fu1" style={{ fontSize: 'clamp(32px,5vw,60px)', fontWeight: 900, color: 'white', letterSpacing: '-2.5px', lineHeight: 1.08, marginBottom: 22 }}>
                Fachkräfte finden –{' '}
                <span style={{ background: 'linear-gradient(135deg,#4ade80,#059669)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  die wirklich passen.
                </span>
              </h1>
              <p className="fu2" style={{ fontSize: 18, color: 'rgba(255,255,255,.6)', lineHeight: 1.75, marginBottom: 36 }}>
                Kein Blindflug mehr. Auf BeVisiblle findest du qualifizierte Non-Akademiker die aktiv suchen – und Mitarbeiter die als echte Markenbotschafter für dich werben.
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link to="/unternehmensregistrierung" className="glow-green" style={{ background: '#4ade80', color: '#08080a', borderRadius: 99, padding: '15px 32px', fontSize: 15, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 9 }}>
                  Kostenlos starten
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#08080a" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                </Link>
                <a href="#preise" style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', color: 'rgba(255,255,255,.8)', borderRadius: 99, padding: '15px 24px', fontSize: 15, textDecoration: 'none' }}>
                  Preise ansehen
                </a>
              </div>
            </div>
            <div className="float">
              <DashboardMockup />
            </div>
          </div>
        </R>
      </section>

      {/* EMPLOYER LOGOS */}
      <section style={{ padding: '0 0 48px', background: 'transparent' }}>
        <R>
          <p style={{ textAlign: 'center', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 24 }}>Arbeitgeber die uns vertrauen</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 40 }}>
            {EMPLOYER_LOGOS.map((logo) => (
              <img
                key={logo.alt}
                src={logo.src}
                alt={logo.alt}
                style={{
                  height: 36,
                  maxWidth: 140,
                  objectFit: 'contain',
                  opacity: 0.95,
                  mixBlendMode: logo.alt === 'Merck' ? 'multiply' : 'normal',
                }}
              />
            ))}
          </div>
        </R>
      </section>

      {/* STATS */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,.06)', borderBottom: '1px solid rgba(255,255,255,.06)', padding: '28px 0', background: 'transparent' }}>
        <R>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0 }}>
            {[
              { n: '5.000+', l: 'Kandidaten in der Datenbank' },
              { n: '3×', l: 'Schnellere Besetzung' },
              { n: '< 48h', l: 'Ø Zeit bis zur Antwort' },
              { n: '89%', l: 'Weiterempfehlungsrate' },
            ].map((s, i) => (
              <div key={i} style={{ padding: '16px 24px', borderRight: i < 3 ? '1px solid rgba(255,255,255,.06)' : 'none', textAlign: 'center' }}>
                <p style={{ fontSize: 22, fontWeight: 900, color: 'white', letterSpacing: '-1px', margin: '0 0 3px' }}>{s.n}</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', margin: 0 }}>{s.l}</p>
              </div>
            ))}
          </div>
        </R>
      </div>

      {/* HOW IT WORKS */}
      <section style={{ padding: '90px 0', background: 'transparent' }}>
        <R>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontSize: 'clamp(26px,4vw,46px)', fontWeight: 900, color: 'white', letterSpacing: '-2px', marginBottom: 12 }}>
              In 3 Schritten zur Fachkraft.
            </h2>
          </div>
          <div className="how-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
            {[
              { n: '01', color: '#4ade80', title: 'Profil anlegen', body: 'Erstellt euer kostenloses Unternehmensprofil mit offenen Stellen und echten Einblicken in euer Unternehmen. In 10 Minuten live.' },
              { n: '02', color: '#5170ff', title: 'Kandidaten entdecken', body: 'Durchsucht unsere Datenbank nach qualifizierten Fachkräften. Filtert nach Beruf, Region und Verfügbarkeit. Nur Aktive, die wirklich wechseln wollen.' },
              { n: '03', color: '#fbbf24', title: 'Direkt Kontakt aufnehmen', body: 'Schreibt passende Kandidaten direkt im Chat an. Kein Anschreiben, keine Zwischenhändler. Schnell, persönlich und effizient.' },
            ].map((s, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 22, padding: '32px 28px', boxShadow: '0 1px 3px rgba(0,0,0,.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 13, background: `linear-gradient(135deg,${s.color},${s.color}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 18, fontWeight: 900, color: 'white' }}>{i + 1}</span>
                  </div>
                  <span style={{ fontSize: 52, fontWeight: 900, color: 'rgba(255,255,255,.06)', letterSpacing: '-2px', lineHeight: 1 }}>{s.n}</span>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: 'white', margin: '0 0 10px' }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', lineHeight: 1.7, margin: 0 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </R>
      </section>

      {/* PRICING */}
      <section
        id="preise"
        style={{
          padding: '0 0 90px',
          background: 'transparent',
        }}
      >
        <R>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontSize: 'clamp(26px,4vw,46px)', fontWeight: 900, color: 'white', letterSpacing: '-2px', marginBottom: 14 }}>
              Faire Preise. Klare Leistung.
            </h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,.5)', maxWidth: 380, margin: '0 auto 24px' }}>
              Starte kostenlos. Upgrade wenn du mehr brauchst.
            </p>
            <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,.06)', borderRadius: 99, padding: 4 }}>
              <button type="button" onClick={() => setBillingCycle('monthly')} style={{ padding: '8px 20px', borderRadius: 99, border: 'none', background: billingCycle === 'monthly' ? 'rgba(81,112,255,.18)' : 'transparent', color: billingCycle === 'monthly' ? '#5170ff' : 'rgba(255,255,255,.5)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Monatlich</button>
              <button type="button" onClick={() => setBillingCycle('yearly')} style={{ padding: '8px 20px', borderRadius: 99, border: 'none', background: billingCycle === 'yearly' ? 'rgba(81,112,255,.18)' : 'transparent', color: billingCycle === 'yearly' ? '#5170ff' : 'rgba(255,255,255,.5)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Jährlich (2 Monate gratis)</button>
            </div>
          </div>

          <div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {COMPANY_PRICING_TIERS.map((p, i) => {
              const isPro = p.id === 'pro';
              const price = p.price.monthly !== null && p.price.yearly !== null
                ? (billingCycle === 'monthly' ? `${p.price.monthly}€` : `${Math.round(p.price.yearly / 12)}€`)
                : 'Individuell';
              const period = p.price.monthly !== null ? (billingCycle === 'monthly' ? '/Monat' : '/Monat (jährl.') : '';
              return (
                <div key={p.id} className="pricing-card" style={{ background: isPro ? 'rgba(81,112,255,.1)' : 'rgba(255,255,255,.03)', border: isPro ? '1px solid rgba(81,112,255,.4)' : '1px solid rgba(255,255,255,.08)', borderRadius: 22, padding: '32px 28px', position: 'relative', overflow: 'hidden', transition: 'transform .3s cubic-bezier(.34,1.56,.64,1)', boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
                  {isPro && (
                    <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', background: '#5170ff', borderRadius: '0 0 12px 12px', padding: '5px 20px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'white' }}>Beliebteste Wahl</span>
                    </div>
                  )}
                  <div style={{ marginTop: isPro ? 20 : 0, marginBottom: 28 }}>
                    <p style={{ fontSize: 16, fontWeight: 700, color: 'white', margin: '0 0 12px' }}>{p.title}</p>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <span style={{ fontSize: 'clamp(32px,4vw,48px)', fontWeight: 900, color: 'white', letterSpacing: '-2px' }}>{price}</span>
                      {period && <span style={{ fontSize: 14, color: 'rgba(255,255,255,.5)' }}>{period}</span>}
                    </div>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', marginTop: 8 }}>{p.description}</p>
                  </div>
                  <div style={{ marginBottom: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {p.features.map((f, j) => (
                      <div key={j} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: isPro ? 'rgba(81,112,255,.2)' : 'rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={isPro ? '#5170ff' : '#059669'} strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <span style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', lineHeight: 1.5 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <Link to={p.ctaHref} style={{ display: 'block', textAlign: 'center', background: isPro ? '#5170ff' : 'rgba(255,255,255,.08)', border: isPro ? 'none' : '1px solid rgba(255,255,255,.12)', color: isPro ? 'white' : 'white', borderRadius: 99, padding: '13px 24px', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
                    {p.ctaLabel}
                  </Link>
                </div>
              );
            })}
          </div>
        </R>
      </section>

      {/* CTA */}
      <section style={{ padding: '0 0 80px', background: 'transparent' }}>
        <R>
          <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 28, padding: '64px 48px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,.3)' }}>
            <h2 style={{ fontSize: 'clamp(24px,4vw,50px)', fontWeight: 900, color: 'white', letterSpacing: '-2px', marginBottom: 16, lineHeight: 1.1 }}>
              Bereit die richtigen<br />Fachkräfte zu finden?
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,.6)', marginBottom: 36, maxWidth: 420, margin: '0 auto 36px' }}>
              Kostenlos starten. Keine Kreditkarte nötig.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/unternehmensregistrierung" className="glow-green" style={{ background: '#4ade80', color: '#08080a', borderRadius: 99, padding: '16px 40px', fontSize: 16, fontWeight: 700, textDecoration: 'none' }}>
                Kostenlos starten →
              </Link>
              <a href="https://calendly.com/todd-bevisiblle/gettoknowbeviviblle" target="_blank" rel="noopener noreferrer" style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)', color: 'rgba(255,255,255,.9)', borderRadius: 99, padding: '16px 28px', fontSize: 15, textDecoration: 'none' }}>
                Demo buchen
              </a>
            </div>
          </div>
        </R>
      </section>
    </DarkLandingLayout>
  );
}
