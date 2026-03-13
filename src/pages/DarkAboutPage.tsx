/**
 * Dark About Page – Über uns
 * Todd Morawe, Tom Morawe, AI Master – Info von BeVisiblle.de
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { DarkLandingLayout } from '@/components/landing/DarkLandingLayout';
import toddMoraweImage from '@/assets/todd-morawe.jpeg';
import tomMoraweImage from '@/assets/tom-morawe.jpeg';
import aiMasterImage from '@/assets/ai-master.png';
import emmaMoraweImage from '@/assets/emma-morawe.jpg';

const R = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', ...style }}>{children}</div>
);

const Badge = ({ children, color = '#5170ff' }: { children: React.ReactNode; color?: string }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, borderRadius: 99, border: `1px solid ${color}40`, background: `${color}12`, padding: '5px 14px', fontSize: 12, fontWeight: 600, color }}>{children}</span>
);

const teamMembers = [
  { name: 'Todd Morawe', role: 'Co-Founder & CEO', description: 'Strategy, Operations und Produkt', image: toddMoraweImage, accent: '#5170ff' },
  { name: 'AI Master', role: 'Co-Founder & Tech', description: 'Verantwortung Plattform & Matching-Algorithmen', image: aiMasterImage, accent: '#7c3aed' },
  { name: 'Tom Morawe', role: 'Co-Founder & CRO', description: 'Chief Revenue Officer', image: tomMoraweImage, accent: '#059669' },
  { name: 'Emma Morawe', role: 'Marketing', description: 'Gute Laune & Marketing', image: emmaMoraweImage, accent: '#dc2626' },
];

export default function DarkAboutPage() {
  return (
    <DarkLandingLayout>
      {/* HERO – Text links, Bild rechts */}
      <section
        style={{
          padding: '150px 0 90px',
          position: 'relative',
          overflow: 'hidden',
          background: 'transparent',
        }}
      >
        <R>
          <div className="hero-about-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center', maxWidth: 1100, margin: '0 auto' }}>
            <div>
              <div className="fu" style={{ marginBottom: 20 }}>
                <Badge>Über uns</Badge>
              </div>
              <h1 className="fu1" style={{ fontSize: 'clamp(34px,5vw,56px)', fontWeight: 900, color: 'white', letterSpacing: '-3px', lineHeight: 1.08, marginBottom: 24 }}>
                Wir verbinden Menschen mit{' '}
                <span style={{ background: 'linear-gradient(135deg,#5170ff,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Perspektive und Herz.
                </span>
              </h1>
              <p className="fu2" style={{ fontSize: 18, color: 'rgba(255,255,255,.6)', lineHeight: 1.8, marginBottom: 0 }}>
                BeVisiblle ist aus der Überzeugung entstanden, dass Talente und Unternehmen echte Einblicke brauchen, um zueinander zu finden. Was als Idee zweier Brüder begann, ist heute eine Community aus Azubis, Fachkräften und Teams, die gemeinsam sichtbar werden.
              </p>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  maxWidth: 520,
                  width: '100%',
                  borderRadius: 32,
                  padding: 4,
                  background:
                    'radial-gradient(circle at top, rgba(148,163,184,.6), rgba(15,23,42,1) 55%, rgba(15,23,42,0) 100%)',
                  boxShadow: '0 24px 80px rgba(15,23,42,.9)',
                }}
              >
                <div
                  style={{
                    borderRadius: 28,
                    overflow: 'hidden',
                    background: '#020617',
                  }}
                >
                  <img
                    src="/assets/aboutus-hero.png"
                    alt="Todd und Tom Morawe – BeVisiblle Gründer"
                    style={{
                      width: '100%',
                      height: '100%',
                      maxHeight: 420,
                      objectFit: 'cover',
                      objectPosition: 'center',
                      display: 'block',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </R>
      </section>

      {/* MISSION */}
      <section
        style={{
          padding: '0 0 90px',
          background: 'transparent',
        }}
      >
        <R>
          <div className="mission-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
            <div>
              <Badge>Unsere Mission</Badge>
              <h2 style={{ fontSize: 'clamp(26px,4vw,48px)', fontWeight: 900, color: 'white', letterSpacing: '-2px', lineHeight: 1.1, margin: '20px 0 20px' }}>
                Vom Familienbetrieb zur Talent-Community.
              </h2>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,.6)', lineHeight: 1.75, marginBottom: 20 }}>
                Aufgewachsen in einem handwerklich geprägten Umfeld haben wir früh verstanden, wie schwierig es ist, passende Talente zu finden und langfristig zu halten. 2023 beschlossen wir, eine Plattform zu schaffen, die Menschen zeigt – mit ihrer Geschichte, ihrem Können und ihrer Motivation.
              </p>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,.6)', lineHeight: 1.75, marginBottom: 32 }}>
                Heute begleitet BeVisiblle Unternehmen dabei, ihre Teams sichtbar zu machen und Talente authentisch anzusprechen.
              </p>
              <div style={{ display: 'flex', gap: 20 }}>
                {[{ n: '5.000+', l: 'Aktive Mitglieder' }, { n: '2023', l: 'Gegründet' }, { n: '4', l: 'Gesichter, die BeVisiblle prägen' }].map((s, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 22, fontWeight: 900, color: 'white', letterSpacing: '-1px', margin: '0 0 2px' }}>{s.n}</p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', margin: 0 }}>{s.l}</p>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ position: 'relative' }}>
              <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 24, padding: '36px 32px', display: 'flex', flexDirection: 'column', gap: 20, boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
                <div style={{ fontSize: 48, color: 'rgba(81,112,255,.4)', lineHeight: 1, fontFamily: 'Georgia,serif', marginBottom: -8 }}>&quot;</div>
                <p style={{ fontSize: 17, color: 'rgba(255,255,255,.6)', lineHeight: 1.75, fontStyle: 'italic' }}>
                  Wir verbinden Menschen mit Perspektive und Herz. BeVisiblle zeigt Talente – mit ihrer Geschichte, ihrem Können und ihrer Motivation.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,.06)' }}>
                  <div style={{ padding: 2, background: 'linear-gradient(135deg,#5170ff,#a78bfa)', borderRadius: '50%', display: 'inline-flex' }}><img src={toddMoraweImage} alt="Todd Morawe" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover' }} /></div>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 800, color: 'white', margin: 0 }}>Todd Morawe</p>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', margin: '2px 0 0' }}>Co-Founder & CEO</p>
                    <p style={{ fontSize: 11, color: '#5170ff', margin: '2px 0 0' }}>Strategy, Operations und Produkt</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </R>
      </section>

      {/* STORYLINE / TIMELINE */}
      <section
        style={{
          padding: '0 0 90px',
          background: 'transparent',
        }}
      >
        <R>
          <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 24, padding: '52px 48px', boxShadow: '0 1px 3px rgba(0,0,0,.3)' }}>
            <h2 style={{ fontSize: 'clamp(24px,3.5vw,42px)', fontWeight: 900, color: 'white', letterSpacing: '-2px', textAlign: 'center', marginBottom: 52 }}>
              Unsere Geschichte.
            </h2>
            <div style={{ position: 'relative', maxWidth: 640, margin: '0 auto' }}>
              <div style={{ position: 'absolute', left: 24, top: 0, bottom: 0, width: 2, background: 'linear-gradient(180deg,#5170ff,rgba(81,112,255,.1))' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                {[
                  { year: '2022', title: 'Die Idee', body: 'Aufgewachsen in einem handwerklich geprägten Umfeld verstehen wir früh, wie schwierig es ist, passende Talente zu finden. Die Idee für BeVisiblle entsteht.' },
                  { year: '2023', title: 'Das Team', body: 'Todd und Tom starten durch. Erste Wireframes, erste Prototypen, erste echte Gespräche mit Pflegern und Handwerkern. Die Vision nimmt Form an.' },
                  { year: 'Jan 2024', title: 'Beta Launch', body: '500 erste Mitglieder. Echtes Feedback. Viel lernen, viel umbauen. Die Community wächst organisch.' },
                  { year: 'Jun 2024', title: '5.000 Mitglieder', body: 'Wachstum durch Mundpropaganda. Erste Unternehmen registrieren sich. Erster erfolgreicher Job-Match auf der Plattform.' },
                  { year: '2025', title: 'Was kommt', body: 'Mobile App, mehr Berufsgruppen, Expansion in Österreich und die Schweiz. Wir sind gerade erst am Anfang.' },
                ].map((e, i) => (
                  <div key={i} style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'linear-gradient(135deg,#5170ff,#a78bfa)', border: '2px solid rgba(255,255,255,.25)', boxShadow: '0 0 8px rgba(81,112,255,.4)', marginLeft: 19, marginTop: 4 }} />
                    </div>
                    <div style={{ paddingBottom: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#5170ff', letterSpacing: 1, textTransform: 'uppercase' }}>{e.year}</span>
                      <h3 style={{ fontSize: 16, fontWeight: 800, color: 'white', margin: '4px 0 6px' }}>{e.title}</h3>
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', lineHeight: 1.7, margin: 0 }}>{e.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </R>
      </section>

      {/* TEAM */}
      <section
        style={{
          padding: '0 0 90px',
          background: 'transparent',
        }}
      >
        <R>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontSize: 'clamp(26px,4vw,46px)', fontWeight: 900, color: 'white', letterSpacing: '-2px', marginBottom: 14 }}>
              Das Team.
            </h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,.5)', maxWidth: 400, margin: '0 auto' }}>
              Gesichter, die BeVisiblle prägen – unser Kernteam vereint Recruiting, Community und Produktentwicklung.
            </p>
          </div>
          <div className="team-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
            {teamMembers.map((t, i) => (
              <div key={i} className="team-card" style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 20, padding: '28px 24px', textAlign: 'center', transition: 'transform .3s cubic-bezier(.34,1.56,.64,1)', boxShadow: '0 1px 3px rgba(0,0,0,.3)' }}>
                <div style={{ margin: '0 auto 16px', width: 72, height: 72, borderRadius: '50%', padding: 3, background: 'linear-gradient(135deg,#5170ff,#a78bfa)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(81,112,255,.2)' }}><div style={{ borderRadius: '50%', overflow: 'hidden', width: '100%', height: '100%' }}><img src={t.image} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div></div>
                <p style={{ fontSize: 16, fontWeight: 800, color: 'white', margin: '0 0 4px' }}>{t.name}</p>
                <p style={{ fontSize: 12, fontWeight: 600, color: t.accent, margin: '0 0 12px' }}>{t.role}</p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', lineHeight: 1.65, margin: 0 }}>{t.description}</p>
              </div>
            ))}
          </div>
        </R>
      </section>

      {/* CTA */}
      <section
        style={{
          padding: '0 0 90px',
          background: 'transparent',
        }}
      >
        <R>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 24, padding: '44px 36px', boxShadow: '0 1px 3px rgba(0,0,0,.3)' }}>
              <h2 style={{ fontSize: 'clamp(22px,3vw,36px)', fontWeight: 900, color: 'white', letterSpacing: '-1.5px', marginBottom: 12, lineHeight: 1.15 }}>
                Gespräch buchen.
              </h2>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,.6)', lineHeight: 1.7, marginBottom: 28 }}>
                Lerne BeVisiblle kennen – wir freuen uns auf einen Austausch.
              </p>
              <a href="https://calendly.com/todd-bevisiblle/gettoknowbeviviblle" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#5170ff', color: 'white', borderRadius: 99, padding: '12px 24px', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
                Termin buchen →
              </a>
            </div>
            <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 24, padding: '44px 36px', boxShadow: '0 1px 3px rgba(0,0,0,.3)' }}>
              <h2 style={{ fontSize: 'clamp(22px,3vw,36px)', fontWeight: 900, color: 'white', letterSpacing: '-1.5px', marginBottom: 12, lineHeight: 1.15 }}>
                Kontakt aufnehmen.
              </h2>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,.6)', lineHeight: 1.7, marginBottom: 28 }}>
                Presse, Partnerships, Feedback – wir freuen uns zu hören von dir.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[['✉', 'hallo@bevisiblle.de'], ['📍', 'Hamburg, Deutschland']].map(([i, v]) => (
                  <div key={v} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ fontSize: 14 }}>{i}</span>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,.5)' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </R>
      </section>
    </DarkLandingLayout>
  );
}
