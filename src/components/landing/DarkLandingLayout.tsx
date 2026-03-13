/**
 * Shared layout for dark marketing pages (About, Unternehmen, Community, Lebenslauf)
 * Matches DarkLandingPage design
 */
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const R = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px', ...style }}>{children}</div>
);

const navLinks = [
  { label: 'Lebenslauf', to: '/lebenslauf-erstellen' },
  { label: 'Community', to: '/community' },
  { label: 'Unternehmen', to: '/unternehmen' },
  { label: 'Über uns', to: '/about' },
];

interface DarkLandingLayoutProps {
  children: React.ReactNode;
  ctaText?: string;
  ctaLink?: string;
  ctaStyle?: 'primary' | 'green';
}

export function DarkLandingLayout({ children, ctaText = 'Kostenlos starten', ctaLink = '/cv-generator', ctaStyle = 'primary' }: DarkLandingLayoutProps) {
  const location = useLocation();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterDone, setNewsletterDone] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterDone(true);
  };

  const ctaBg = ctaStyle === 'green' ? '#4ade80' : '#5170ff';
  const ctaColor = ctaStyle === 'green' ? '#08080a' : 'white';
  const ctaGlow = ctaStyle === 'green' ? 'glow-green' : 'glow';

  return (
    <div className="dark-landing" style={{ background: '#08080a', color: '#ffffff', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* NAV */}
      <header style={{ position: 'fixed', top: 14, left: 0, right: 0, zIndex: 100, padding: '0 16px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div style={{ background: 'rgba(8,8,10,.95)', backdropFilter: 'blur(20px) saturate(1.8)', border: '1px solid rgba(255,255,255,.08)', boxShadow: '0 4px 24px rgba(0,0,0,.5)', borderRadius: 99, padding: '9px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, textDecoration: 'none' }}>
              <img src="/assets/Logo_visiblle_transparent.png" alt="BeVisiblle" style={{ height: 32, width: 32, objectFit: 'contain' }} />
              <span style={{ fontSize: 15, fontWeight: 800, color: 'white' }}>BeVisib<span style={{ color: '#5170ff' }}>ll</span>e</span>
            </Link>
            <div className="dark-nav-links" style={{ display: 'flex', gap: 26, alignItems: 'center' }}>
              {navLinks.map((l) => (
                <Link key={l.to} to={l.to} className={`nav-a${location.pathname === l.to ? ' active' : ''}`}>{l.label}</Link>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
              <Link to="/auth" className="dark-login-link" style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,.5)', textDecoration: 'none', padding: '7px 12px' }}>Login</Link>
              <Link to={ctaLink} className={ctaGlow} style={{ background: ctaBg, color: ctaColor, borderRadius: 99, padding: '9px 20px', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>{ctaText}</Link>
              <button
                type="button"
                className="dark-hamburger"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.7)', padding: 6, cursor: 'pointer', display: 'none', alignItems: 'center', justifyContent: 'center' }}
              >
                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
          {mobileMenuOpen && (
            <div className="dark-mobile-menu" style={{ marginTop: 8, background: 'rgba(8,8,10,.98)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 20, padding: '12px 8px', boxShadow: '0 12px 40px rgba(0,0,0,.6)' }}>
              {navLinks.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ display: 'block', padding: '12px 16px', borderRadius: 12, fontSize: 14, fontWeight: 500, color: location.pathname === l.to ? '#5170ff' : 'rgba(255,255,255,.6)', textDecoration: 'none' }}
                >{l.label}</Link>
              ))}
              <Link
                to="/auth"
                onClick={() => setMobileMenuOpen(false)}
                style={{ display: 'block', padding: '12px 16px', borderRadius: 12, fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,.5)', textDecoration: 'none' }}
              >Login</Link>
            </div>
          )}
        </div>
      </header>

      {children}

      {/* NEWSLETTER */}
      <section style={{ padding: '0 0 64px', background: '#08080a' }}>
        <R>
          <div style={{ maxWidth: 960, margin: '0 auto' }}>
            <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 28, background: 'linear-gradient(135deg,#5170ff,#7c3aed)', padding: '32px 32px', boxShadow: '0 20px 60px rgba(81,112,255,.35)' }}>
              <div style={{ pointerEvents: 'none', position: 'absolute', top: -64, right: -64, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,.06)' }} />
              <div style={{ pointerEvents: 'none', position: 'absolute', bottom: -90, left: -50, width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,255,255,.06)' }} />
              <div style={{ position: 'relative', zIndex: 1, display: 'grid', gap: 18, gridTemplateColumns: '1.2fr 1fr', alignItems: 'center' }} className="newsletter-grid">
                <div>
                  <h3 style={{ fontSize: 28, fontWeight: 900, color: 'white', lineHeight: 1.15, margin: 0 }}>
                    Jobs & Updates,<br />direkt zu dir.
                  </h3>
                  <p style={{ margin: '10px 0 0', fontSize: 14, color: 'rgba(255,255,255,.8)', lineHeight: 1.6 }}>
                    Neue Features, passende Jobs und Community-Highlights – kein Spam, nur das Beste.
                  </p>
                </div>
                <div>
                  {newsletterDone ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderRadius: 18, border: '1px solid rgba(255,255,255,.25)', background: 'rgba(255,255,255,.15)', padding: '14px 16px' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 999, background: '#4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      </div>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'white' }}>Du bist dabei – wir melden uns bald!</p>
                    </div>
                  ) : (
                    <form onSubmit={handleNewsletterSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                      <input type="email" value={newsletterEmail} onChange={(e) => setNewsletterEmail(e.target.value)} placeholder="deine@email.de" required style={{ flex: 1, minWidth: 180, borderRadius: 999, border: '1px solid rgba(255,255,255,.25)', background: 'rgba(255,255,255,.15)', padding: '12px 18px', fontSize: 14, color: 'white', outline: 'none' }} />
                      <button type="submit" style={{ borderRadius: 999, border: 'none', background: 'white', padding: '12px 18px', fontSize: 14, fontWeight: 800, color: '#5170ff', cursor: 'pointer', boxShadow: '0 6px 16px rgba(0,0,0,.25)' }}>Abonnieren</button>
                    </form>
                  )}
                  <p style={{ margin: '10px 0 0', fontSize: 11, color: 'rgba(255,255,255,.6)' }}>Jederzeit abmeldbar. Infos in unserer Datenschutzerklärung.</p>
                </div>
              </div>
            </div>
          </div>
        </R>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,.06)', padding: '52px 0 32px', background: '#08080a' }}>
        <R>
          <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr', gap: 40, marginBottom: 52 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <img src="/assets/Logo_visiblle_transparent.png" alt="BeVisiblle" style={{ height: 32, width: 32, objectFit: 'contain' }} />
                <span style={{ fontSize: 15, fontWeight: 800, color: 'white' }}>BeVisib<span style={{ color: '#5170ff' }}>ll</span>e</span>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', lineHeight: 1.75, maxWidth: 230 }}>Das Karrierenetzwerk für Pfleger:innen, Handwerker, Servicekräfte und alle, die wirklich anpacken.</p>
            </div>
            {[
              { head: 'App', links: [{ label: 'Feed', to: '/community' }, { label: 'Jobs entdecken', to: '/jobs' }, { label: 'Mein Profil', to: '/cv-generator' }, { label: 'Nachrichten', to: '/community' }, { label: 'Netzwerk', to: '/community' }] },
              { head: 'Company', links: [{ label: 'Über uns', to: '/about' }, { label: 'Für Unternehmen', to: '/company' }, { label: 'Blog', to: '/blog' }, { label: 'Presse', to: '/blog' }, { label: 'Karriere', to: '/company' }] },
              { head: 'Legal', links: [{ label: 'Datenschutz', to: '/datenschutz' }, { label: 'Impressum', to: '/impressum' }, { label: 'AGB', to: '/agb' }, { label: 'Cookie-Einstellungen', to: '/datenschutz' }] },
            ].map((col) => (
              <div key={col.head}>
                <h4 style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 18px' }}>{col.head}</h4>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12, padding: 0, margin: 0 }}>
                  {col.links.map((l) => (
                    <li key={l.label}><Link to={l.to} style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', textDecoration: 'none' }}>{l.label}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,.06)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', margin: 0 }}>© 2025 BeVisiblle GmbH. Alle Rechte vorbehalten.</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ position: 'relative', width: 8, height: 8 }}>
                <div className="ping" style={{ position: 'absolute', width: 8, height: 8, borderRadius: '50%', background: 'rgba(74,222,128,.4)' }} />
                <div style={{ position: 'absolute', width: 8, height: 8, borderRadius: '50%', background: '#4ade80' }} />
              </div>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,.5)' }}>Alle Systeme betriebsbereit</span>
            </div>
          </div>
        </R>
      </footer>
    </div>
  );
}
