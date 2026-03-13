/**
 * Dark Community Page – Marketing-Landing
 * Vernetze dich mit Non-Akademikern
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { DarkLandingLayout } from '@/components/landing/DarkLandingLayout';
import { ProfileAvatar } from '@/components/landing/ProfileAvatar';

const R = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', ...style }}>{children}</div>
);

const Badge = ({ children, color = '#5170ff' }: { children: React.ReactNode; color?: string }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, borderRadius: 99, border: `1px solid ${color}40`, background: `${color}12`, padding: '5px 14px', fontSize: 12, fontWeight: 600, color }}>{children}</span>
);

const CommunityFeedMockup = () => (
  <div style={{ background: '#0d0d10', border: '1px solid rgba(255,255,255,.09)', borderRadius: 22, overflow: 'hidden', boxShadow: '0 48px 100px rgba(0,0,0,.8)' }}>
    <div style={{ background: 'linear-gradient(135deg,rgba(81,112,255,.1),rgba(124,58,237,.06))', borderBottom: '1px solid rgba(81,112,255,.15)', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 14, fontWeight: 800, color: 'white' }}>Community</span>
      <div style={{ background: 'rgba(81,112,255,.15)', border: '1px solid rgba(81,112,255,.3)', borderRadius: 99, padding: '4px 12px' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#5170ff' }}>5.000+ Mitglieder</span>
      </div>
    </div>
    <div style={{ padding: '10px 16px', display: 'flex', gap: 8, borderBottom: '1px solid rgba(255,255,255,.05)', overflowX: 'auto' }}>
      {[{ l: 'Alle', active: true }, { l: 'Pflege' }, { l: 'Handwerk' }, { l: 'Gastronomie' }, { l: 'Logistik' }].map((c, i) => (
        <span key={i} style={{ fontSize: 11, fontWeight: 600, borderRadius: 99, padding: '5px 12px', background: c.active ? 'rgba(81,112,255,.18)' : 'rgba(255,255,255,.06)', color: c.active ? '#5170ff' : 'rgba(255,255,255,.4)', border: c.active ? '1px solid rgba(81,112,255,.3)' : 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
          {c.l}
        </span>
      ))}
    </div>
    <div>
      {[
        { name: 'Klaus B.', role: 'Elektriker · Hamburg', time: 'vor 1h', post: 'Hab gerade meinen Meister gemacht 🎉 Wer aus dem Handwerk Fragen zum Meisterkurs hat – einfach fragen!', likes: 47, comments: 12, tag: 'Handwerk' },
        { name: 'Sara N.', role: 'Erzieherin · Berlin', time: 'vor 3h', post: 'Tipp für alle in der Pflege: Fragt immer nach dem Wunschdienstplan-Modell beim Vorstellungsgespräch. Hat mir viel Stress erspart.', likes: 124, comments: 31, tag: 'Pflege' },
      ].map((p, i) => (
        <div key={i} style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,.04)', background: 'transparent' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ padding: 2, background: 'linear-gradient(135deg,#5170ff,#a78bfa)', borderRadius: '50%', display: 'inline-flex', flexShrink: 0 }}><div style={{ borderRadius: '50%', overflow: 'hidden' }}><ProfileAvatar name={p.name} size={36} /></div></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'white' }}>{p.name}</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,.3)' }}>{p.role}</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,.2)' }}>{p.time}</span>
                <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 600, background: 'rgba(81,112,255,.12)', color: '#5170ff', borderRadius: 99, padding: '2px 8px' }}>{p.tag}</span>
              </div>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', lineHeight: 1.6, marginBottom: 10 }}>{p.post}</p>
              <div style={{ display: 'flex', gap: 18 }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,.3)' }}>👍 {p.likes}</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,.3)' }}>💬 {p.comments}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const groups = [
  { emoji: '🏥', title: 'Pflege & Gesundheit', members: '1.847', sub: 'OTA, Pflegefachkraft, Krankenschwester', accent: '#5170ff', hot: true },
  { emoji: '🔧', title: 'Handwerk & Technik', members: '1.204', sub: 'Elektriker, Schreiner, KFZ & mehr', accent: '#f59e0b', hot: true },
  { emoji: '🌱', title: 'Erziehung & Soziales', members: '892', sub: 'Erzieher:in, Sozialarbeiter:in', accent: '#10b981' },
  { emoji: '🍽️', title: 'Gastronomie & Service', members: '643', sub: 'Servicekraft, Köch:in, Barista', accent: '#f43661' },
  { emoji: '🚛', title: 'Logistik & Transport', members: '571', sub: 'LKW-Fahrer, Lagerist:in', accent: '#8b5cf6' },
  { emoji: '💼', title: 'Büro & Verwaltung', members: '438', sub: 'Bürokaufleute, Assistenz', accent: '#06b6d4' },
];

export default function DarkCommunityPage() {
  return (
    <DarkLandingLayout>
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
          <div className="hero-cm" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
            <div>
              <div className="fu" style={{ marginBottom: 20 }}>
                <Badge>
                  <div style={{ position: 'relative', width: 7, height: 7 }}>
                    <div className="ping" style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#4ade80' }} />
                    <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#4ade80' }} />
                  </div>
                  5.000+ aktive Mitglieder
                </Badge>
              </div>
              <h1 className="fu1" style={{ fontSize: 'clamp(32px,5vw,60px)', fontWeight: 900, color: 'white', letterSpacing: '-2.5px', lineHeight: 1.08, marginBottom: 22 }}>
                Die Community für die,{' '}
                <span className="grad-text">
                  die wirklich anpacken.
                </span>
              </h1>
              <p className="fu2" style={{ fontSize: 18, color: 'rgba(255,255,255,.6)', lineHeight: 1.75, marginBottom: 36 }}>
                Kein Bullshit, keine Theorie. Tausch dich mit echten Pflegern, Handwerkern und Servicekräften aus. Lern von denen die es wissen. Vernetz dich mit Gleichgesinnten.
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 40 }}>
                <Link to="/cv-generator" className="glow" style={{ background: '#5170ff', color: 'white', borderRadius: 99, padding: '14px 30px', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
                  Community beitreten →
                </Link>
                <a href="#gruppen" style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', color: 'rgba(255,255,255,.8)', borderRadius: 99, padding: '14px 24px', fontSize: 14, textDecoration: 'none' }}>
                  Gruppen ansehen
                </a>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex' }}>
                  {['David', 'Maria', 'Klaus', 'Julia', 'Tom', 'Sara'].map((n, i) => (
                    <div key={n} style={{ padding: 2, background: 'linear-gradient(135deg,#5170ff,#a78bfa)', borderRadius: '50%', display: 'inline-flex', marginLeft: i ? -10 : 0, boxShadow: '0 2px 12px rgba(81,112,255,.25)' }}><div style={{ borderRadius: '50%', overflow: 'hidden' }}><ProfileAvatar name={n} size={36} /></div></div>
                  ))}
                </div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', margin: 0 }}>
                  <strong style={{ color: 'white' }}>+138</strong> neue Mitglieder diese Woche
                </p>
              </div>
            </div>
            <div className="float">
              <CommunityFeedMockup />
            </div>
          </div>
        </R>
      </section>

      {/* VALUES ROW */}
      <div
        style={{
          borderTop: '1px solid rgba(255,255,255,.06)',
          borderBottom: '1px solid rgba(255,255,255,.06)',
          padding: '32px 0',
          background: 'transparent',
        }}
      >
        <R>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0 }}>
            {[
              { icon: '💬', title: 'Echte Gespräche', sub: 'Keine Theorie. Praktische Tipps von Leuten die es täglich leben.' },
              { icon: '🤝', title: 'Netzwerken', sub: 'Verbinde dich mit Kolleg:innen aus deiner Branche und Region.' },
              { icon: '🧠', title: 'Voneinander lernen', sub: 'Frag, tausch aus, wachse. Wissen ist zum Teilen da.' },
              { icon: '🔒', title: 'Sicher & respektvoll', sub: 'Moderierte Community. Null Toleranz für Respektlosigkeit.' },
            ].map((v, i) => (
              <div key={i} style={{ padding: '24px 28px', borderRight: i < 3 ? '1px solid rgba(255,255,255,.06)' : 'none', textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{v.icon}</div>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'white', margin: '0 0 6px' }}>{v.title}</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', lineHeight: 1.6, margin: 0 }}>{v.sub}</p>
              </div>
            ))}
          </div>
        </R>
      </div>

      {/* GROUPS */}
      <section
        id="gruppen"
        style={{
          padding: '80px 0',
          background: 'transparent',
        }}
      >
        <R>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontSize: 'clamp(26px,4vw,48px)', fontWeight: 900, color: 'white', letterSpacing: '-2px', marginBottom: 14 }}>
              Deine Gruppe wartet.
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,.5)', maxWidth: 400, margin: '0 auto' }}>
              Jede Branche hat ihre eigene Gruppe. Stell Fragen, teile Erfahrungen, vernetz dich.
            </p>
          </div>

          <div className="groups-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {groups.map((g, i) => (
              <Link key={i} to="/cv-generator" className="group-card" style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 20, padding: '26px', cursor: 'pointer', position: 'relative', overflow: 'hidden', textDecoration: 'none', transition: 'transform .3s cubic-bezier(.34,1.56,.64,1)', boxShadow: '0 1px 3px rgba(0,0,0,.3)' }}>
                {g.hot && (
                  <div style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(251,191,36,.15)', border: '1px solid rgba(251,191,36,.3)', borderRadius: 99, padding: '3px 10px' }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#f59e0b' }}>🔥 Aktiv</span>
                  </div>
                )}
                <div style={{ fontSize: 36, marginBottom: 14, lineHeight: 1 }}>{g.emoji}</div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: 'white', margin: '0 0 4px', letterSpacing: '-0.5px' }}>{g.title}</h3>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', margin: '0 0 16px' }}>{g.sub}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ display: 'flex' }}>
                      {[['Klaus', 'Sara', 'David'], ['Tom', 'Maria', 'Julia'], ['David', 'Klaus', 'Tom'], ['Maria', 'Sara', 'Julia'], ['Klaus', 'Tom', 'David'], ['Sara', 'Maria', 'Julia']][i].map((n, j) => (
                        <div key={`${i}-${j}`} style={{ padding: 2, background: 'linear-gradient(135deg,#5170ff,#a78bfa)', borderRadius: '50%', display: 'inline-flex', marginLeft: j ? -8 : 0, boxShadow: '0 1px 8px rgba(81,112,255,.2)' }}><div style={{ borderRadius: '50%', overflow: 'hidden' }}><ProfileAvatar name={n} size={24} /></div></div>
                      ))}
                    </div>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,.4)' }}>{g.members} Mitglieder</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: g.accent }}>Beitreten →</span>
                </div>
              </Link>
            ))}
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
            <h2 style={{ fontSize: 'clamp(24px,4vw,48px)', fontWeight: 900, color: 'white', letterSpacing: '-2px', marginBottom: 16, lineHeight: 1.1 }}>
              Werde Teil der Community.
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,.7)', marginBottom: 36, maxWidth: 420, margin: '0 auto 36px' }}>
              Kostenlos. Für alle die anpacken.
            </p>
            <Link to="/cv-generator" className="glow" style={{ background: '#5170ff', color: 'white', borderRadius: 99, padding: '16px 40px', fontSize: 16, fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}>
              Jetzt beitreten →
            </Link>
          </div>
        </R>
      </section>
    </DarkLandingLayout>
  );
}
