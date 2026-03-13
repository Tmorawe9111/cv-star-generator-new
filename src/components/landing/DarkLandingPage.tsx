import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { COMPANY_PRICING_TIERS } from '@/config/companyPricing';
import { CAREER_BRANCHES } from '@/config/careerBranches';
import type { CareerBranchConfig } from '@/config/careerBranches';
import { ProfileAvatar } from '@/components/landing/ProfileAvatar';
import { DarkLandingLayout } from '@/components/landing/DarkLandingLayout';
import ConversationalFinder from '@/components/finder/ConversationalFinder';

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════════════════════ */
interface BadgeProps {
  children: React.ReactNode;
  color?: string;
}

interface GlassCardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  accent?: string;
}

interface TickerProps {
  items: string[];
  reverse?: boolean;
  speed?: number;
}

interface FeatureTab {
  id: string;
  label: string;
  headline: string;
  body: string;
  stat: string;
  statLabel: string;
  mockup: React.ReactNode;
}

/* ═══════════════════════════════════════════════════════════════════════════
   MINI COMPONENTS
═══════════════════════════════════════════════════════════════════════════ */
const R = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px', ...style }}>{children}</div>
);

const Badge = ({ children, color = '#5170ff' }: BadgeProps) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7,
      borderRadius: 99,
      border: `1px solid ${color}40`,
      background: `${color}12`,
      padding: '5px 14px',
      fontSize: 12,
      fontWeight: 600,
      color,
    }}
  >
    {children}
  </span>
);

const GlassCard = ({ children, style = {}, accent = 'rgba(255,255,255,.08)' }: GlassCardProps) => (
  <div
    style={{
      background: 'rgba(255,255,255,.03)',
      border: `1px solid ${accent}`,
      borderRadius: 20,
      boxShadow: '0 1px 3px rgba(0,0,0,.3)',
      ...style,
    }}
  >
    {children}
  </div>
);

/* ─── Scrolling Ticker ───────────────────────────────────────────────────── */
const Ticker = ({ items, reverse = false, speed = 32 }: TickerProps) => {
  const doubled = [...items, ...items];
  return (
    <div style={{ overflow: 'hidden', position: 'relative' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 100, background: 'linear-gradient(90deg,#08080a,transparent)', zIndex: 2, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 100, background: 'linear-gradient(-90deg,#08080a,transparent)', zIndex: 2, pointerEvents: 'none' }} />
      <div className={reverse ? 'tickerR' : 'ticker'} style={{ animationDuration: `${speed}s` }}>
        {doubled.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 24, paddingRight: 40 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,.4)', whiteSpace: 'nowrap' }}>{item}</span>
            <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,.2)', flexShrink: 0 }} />
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Feed / Home Screen Mockup ───────────────────────────────────────────── */
const FeedMockup = () => (
  <div style={{ background: '#08080a', border: '1px solid rgba(81,112,255,.12)', borderRadius: 22, overflow: 'hidden', boxShadow: '0 48px 100px rgba(0,0,0,.8), 0 0 0 1px rgba(81,112,255,.06)' }}>
    <div style={{ background: 'linear-gradient(180deg,rgba(81,112,255,.06) 0%,transparent 100%)', padding: '10px 20px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.5)' }}>09:41</span>
      <div style={{ width: 80, height: 4, background: 'rgba(255,255,255,.08)', borderRadius: 99 }} />
      <div style={{ display: 'flex', gap: 6 }}>
        {[1, 1, 0.7].map((o, j) => (
          <div key={j} style={{ width: 14, height: 8, background: `rgba(255,255,255,${o * 0.3})`, borderRadius: 2 }} />
        ))}
      </div>
    </div>
    <div style={{ background: 'linear-gradient(90deg,rgba(81,112,255,.04),transparent,rgba(124,58,237,.03))', borderBottom: '1px solid rgba(81,112,255,.1)', padding: '10px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 15, fontWeight: 800, color: 'white' }}>BeVisib<span style={{ color: '#5170ff' }}>ll</span>e</span>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <div style={{ position: 'relative' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
          <div style={{ position: 'absolute', top: -3, right: -3, width: 8, height: 8, background: 'linear-gradient(135deg,#5170ff,#a78bfa)', borderRadius: '50%', border: '1.5px solid rgba(255,255,255,.2)', boxShadow: '0 0 8px rgba(81,112,255,.4)' }} />
        </div>
        <div style={{ padding: 2, background: 'linear-gradient(135deg,#5170ff,#a78bfa)', borderRadius: '50%', display: 'inline-flex' }}><div style={{ borderRadius: '50%', overflow: 'hidden' }}><ProfileAvatar name="Lisa" size={28} /></div></div>
      </div>
    </div>
    <div style={{ padding: '14px 16px 10px', display: 'flex', gap: 12, borderBottom: '1px solid rgba(255,255,255,.05)', overflowX: 'auto' }}>
      {[{ name: 'Maria' }, { name: 'Klaus' }, { name: 'Julia' }, { name: 'Tom' }].map((st, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', padding: 2, background: 'linear-gradient(135deg,#5170ff,#a78bfa)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ borderRadius: '50%', overflow: 'hidden' }}><ProfileAvatar name={st.name} size={40} /></div>
          </div>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,.4)' }}>{st.name}</span>
        </div>
      ))}
    </div>
    <div style={{ padding: '0 0 8px' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ padding: 2, background: 'linear-gradient(135deg,#5170ff,#a78bfa)', borderRadius: '50%', display: 'inline-flex' }}><div style={{ borderRadius: '50%', overflow: 'hidden' }}><ProfileAvatar name="Maria K." size={34} /></div></div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'white', margin: 0 }}>Maria K.</p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', margin: 0 }}>Pflegefachkraft · Hamburg · vor 2h</p>
          </div>
          <div style={{ background: 'rgba(81,112,255,.12)', border: '1px solid rgba(81,112,255,.25)', borderRadius: 99, padding: '3px 10px' }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#5170ff' }}>Offen für Jobs</span>
          </div>
        </div>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', lineHeight: 1.6, marginBottom: 12 }}>
          Heute meinen ersten Tag im Klinikum Mitte gestartet 🎉 Danke an alle die mich durch BeVisiblle gefunden haben.
        </p>
        <div style={{ display: 'flex', gap: 18 }}>
          {[['👍', '124'], ['💬', '18'], ['↗', '7']].map(([e, c], j) => (
            <span key={j} style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', display: 'flex', alignItems: 'center', gap: 4 }}>{e} <span>{c}</span></span>
          ))}
        </div>
      </div>
      <div style={{ padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#5170ff,#a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 12px rgba(81,112,255,.3)' }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: 'white' }}>K</span>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'white', margin: 0 }}>Klinikum Mitte <span style={{ fontSize: 10, color: '#5170ff' }}>✓</span></p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', margin: 0 }}>Arbeitgeber · Hamburg · vor 4h</p>
          </div>
        </div>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', lineHeight: 1.6, marginBottom: 10 }}>
          📢 Wir suchen Pflegefachkräfte für die Intensivstation! Faire Gehälter, echter Teamspirit.
        </p>
        <div style={{ background: 'rgba(81,112,255,.08)', border: '1px solid rgba(81,112,255,.2)', borderRadius: 12, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,.5)' }}>3 offene Stellen</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#5170ff' }}>Jetzt bewerben →</span>
        </div>
      </div>
    </div>
    <div style={{ borderTop: '1px solid rgba(255,255,255,.06)', display: 'flex', justifyContent: 'space-around', padding: '10px 0 6px', background: 'transparent' }}>
      {[
        { icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', active: true },
        { icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
        { icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
        { icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
        { icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
      ].map((n, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={n.active ? '#5170ff' : 'rgba(255,255,255,.3)'} strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d={n.icon} />
          </svg>
          {n.active && <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#5170ff' }} />}
        </div>
      ))}
    </div>
  </div>
);

/* ── Recruiter Contact Mockup ────────────────────────────────────────────── */
const RecruiterMockup = () => (
  <div style={{ background: '#08080a', border: '1px solid rgba(255,255,255,.08)', borderRadius: 22, overflow: 'hidden', boxShadow: '0 48px 100px rgba(0,0,0,.8)' }}>
    <div style={{ background: 'linear-gradient(135deg,rgba(81,112,255,.12),rgba(124,58,237,.08))', borderBottom: '1px solid rgba(81,112,255,.15)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ position: 'relative' }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg,#5170ff,#a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(81,112,255,.25)' }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: 'white' }}>K</span>
        </div>
        <div style={{ position: 'absolute', bottom: -2, right: -2, width: 12, height: 12, background: '#4ade80', borderRadius: '50%', border: '2px solid rgba(255,255,255,.25)', boxShadow: '0 0 6px rgba(74,222,128,.4)' }} />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'white', margin: 0 }}>Sandra M. – Klinikum Mitte <span style={{ color: '#5170ff', fontSize: 11 }}>✓</span></p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', margin: '2px 0 0' }}>Recruiterin · schreibt dir gerade</p>
      </div>
    </div>
    <div style={{ margin: '16px 16px 8px', background: 'rgba(81,112,255,.08)', border: '1px solid rgba(81,112,255,.2)', borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 32, height: 32, background: 'rgba(81,112,255,.2)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5170ff" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
      </div>
      <div>
        <p style={{ fontSize: 11, fontWeight: 600, color: '#5170ff', margin: 0 }}>Dein Profil wurde angesehen</p>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', margin: '2px 0 0' }}>vor 3 Minuten von Klinikum Mitte</p>
      </div>
    </div>
    <div style={{ padding: '8px 16px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="msg1" style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 9, background: 'linear-gradient(135deg,#5170ff,#a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, fontWeight: 800, color: 'white' }}>K</div>
        <div style={{ background: 'rgba(255,255,255,.07)', borderRadius: '14px 14px 14px 4px', padding: '10px 14px', maxWidth: '78%' }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,.8)', lineHeight: 1.55, margin: 0 }}>Hallo Lisa! Ich bin Sandra von Klinikum Mitte. Wir haben dein Profil gesehen – top Qualifikation! 🙌</p>
        </div>
      </div>
      <div className="msg2" style={{ display: 'flex', alignItems: 'flex-end', gap: 8, justifyContent: 'flex-end' }}>
        <div style={{ background: 'linear-gradient(135deg,#5170ff,#3b56e8)', borderRadius: '14px 14px 4px 14px', padding: '10px 14px', maxWidth: '78%', boxShadow: '0 4px 16px rgba(81,112,255,.3)' }}>
          <p style={{ fontSize: 12, color: 'white', lineHeight: 1.55, margin: 0 }}>Ja sehr gerne! Was genau wäre die Stelle? 😊</p>
        </div>
        <div style={{ padding: 2, background: 'linear-gradient(135deg,#5170ff,#a78bfa)', borderRadius: '50%', display: 'inline-flex', flexShrink: 0 }}><div style={{ borderRadius: '50%', overflow: 'hidden' }}><ProfileAvatar name="Lisa" size={28} /></div></div>
      </div>
      <div className="msg3" style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 9, background: 'linear-gradient(135deg,#5170ff,#a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, fontWeight: 800, color: 'white' }}>K</div>
        <div style={{ background: 'rgba(255,255,255,.07)', borderRadius: '14px 14px 14px 4px', padding: '10px 14px', maxWidth: '78%' }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,.8)', lineHeight: 1.55, margin: 0 }}>Intensivpflege, Vollzeit. Faire Bezahlung + Wunschdienstplan. 📅</p>
        </div>
      </div>
      <div className="msg4" style={{ display: 'flex', alignItems: 'flex-end', gap: 8, justifyContent: 'flex-end' }}>
        <div style={{ background: 'linear-gradient(135deg,#5170ff,#3b56e8)', borderRadius: '14px 14px 4px 14px', padding: '10px 14px', maxWidth: '78%', boxShadow: '0 4px 16px rgba(81,112,255,.3)' }}>
          <p style={{ fontSize: 12, color: 'white', lineHeight: 1.55, margin: 0 }}>Donnerstag 15 Uhr wäre perfekt! 🎉</p>
        </div>
        <div style={{ padding: 2, background: 'linear-gradient(135deg,#5170ff,#a78bfa)', borderRadius: '50%', display: 'inline-flex', flexShrink: 0 }}><div style={{ borderRadius: '50%', overflow: 'hidden' }}><ProfileAvatar name="Lisa" size={28} /></div></div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 9, background: 'linear-gradient(135deg,#5170ff,#a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, fontWeight: 800, color: 'white' }}>K</div>
        <div style={{ background: 'rgba(255,255,255,.07)', borderRadius: '14px 14px 14px 4px', padding: '10px 16px', display: 'flex', gap: 5 }}>
          <span className="b1" style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,.5)', display: 'block' }} />
          <span className="b2" style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,.5)', display: 'block' }} />
          <span className="b3" style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,.5)', display: 'block' }} />
        </div>
      </div>
    </div>
    <div style={{ borderTop: '1px solid rgba(255,255,255,.06)', padding: '10px 16px', display: 'flex', gap: 10, background: '#08080a' }}>
      <div style={{ flex: 1, background: 'rgba(255,255,255,.06)', borderRadius: 99, padding: '8px 16px', fontSize: 11, color: 'rgba(255,255,255,.2)' }}>Antworten…</div>
      <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg,#5170ff,#a78bfa)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 16px rgba(81,112,255,.4)' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
      </div>
    </div>
  </div>
);

/* ── Employee Advocacy Mockup ────────────────────────────────────────────── */
const AdvocacyMockup = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
    <GlassCard style={{ padding: 20, borderRadius: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ position: 'relative' }}>
          <div style={{ padding: 2, background: 'linear-gradient(135deg,#5170ff,#a78bfa)', borderRadius: '50%', display: 'inline-flex' }}><div style={{ borderRadius: '50%', overflow: 'hidden' }}><ProfileAvatar name="Klaus B." size={40} /></div></div>
          <div style={{ position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, background: 'linear-gradient(135deg,#5170ff,#a78bfa)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255,255,255,.25)', boxShadow: '0 0 8px rgba(81,112,255,.35)' }}>
            <span style={{ fontSize: 8, fontWeight: 800, color: 'white' }}>K</span>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: 0 }}>Klaus B. <span style={{ color: '#94a3b8', fontWeight: 400 }}>bei</span> Klinikum Mitte</p>
          <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0' }}>Elektriker · empfiehlt seinen Arbeitgeber</p>
        </div>
        <div style={{ background: 'rgba(74,222,128,.1)', border: '1px solid rgba(74,222,128,.25)', borderRadius: 99, padding: '4px 10px' }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: '#059669' }}>Mitarbeiter ✓</span>
        </div>
      </div>
      <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.65, marginBottom: 14 }}>
        "Seit 3 Jahren hier und ich bereue keinen Tag. Faire Bezahlung, echter Teamzusammenhalt. Falls jemand sucht – DM mich gerne! 🔧⚡"
      </p>
      <div style={{ background: 'rgba(81,112,255,.08)', border: '1px solid rgba(81,112,255,.15)', borderRadius: 12, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg,#5170ff,#a78bfa)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'white' }}>K</span>
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#0f172a', margin: 0 }}>Klinikum Mitte</p>
            <p style={{ fontSize: 10, color: '#64748b', margin: 0 }}>2 offene Stellen</p>
          </div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#5170ff' }}>Mehr erfahren →</span>
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(15,23,42,.06)' }}>
        {[['👍', '234'], ['💬', '41'], ['↗', 'Teilen']].map(([e, c], j) => (
          <span key={j} style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>{e} {c}</span>
        ))}
      </div>
    </GlassCard>
    <div className="advo-inner-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      {[
        { name: 'Tom R.', role: 'Mechatroniker', text: 'Bestes Team das ich je hatte. Wer handwerklich fit ist – einfach melden! 🔩', likes: '89' },
        { name: 'Jana K.', role: 'Erzieherin', text: 'Faire Schichten, tolle Kinder, echter Sinn. Stellen frei! 🌱', likes: '156' },
      ].map((p, i) => (
        <GlassCard key={i} style={{ padding: '14px 16px', borderRadius: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ position: 'relative' }}>
              <div style={{ padding: 2, background: 'linear-gradient(135deg,#5170ff,#a78bfa)', borderRadius: '50%', display: 'inline-flex' }}><div style={{ borderRadius: '50%', overflow: 'hidden' }}><ProfileAvatar name={p.name} size={32} /></div></div>
              <div style={{ position: 'absolute', bottom: -1, right: -1, width: 14, height: 14, background: 'linear-gradient(135deg,#5170ff,#a78bfa)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid rgba(255,255,255,.25)', boxShadow: '0 0 6px rgba(81,112,255,.3)' }}>
                <span style={{ fontSize: 6, fontWeight: 800, color: 'white' }}>W</span>
              </div>
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#0f172a', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</p>
              <p style={{ fontSize: 10, color: '#64748b', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.role}</p>
            </div>
          </div>
          <p style={{ fontSize: 11, color: '#475569', lineHeight: 1.55, marginBottom: 10 }}>{p.text}</p>
          <span style={{ fontSize: 10, color: '#94a3b8' }}>👍 {p.likes}</span>
        </GlassCard>
      ))}
    </div>
  </div>
);

/* ── Profile + Network Mockup ────────────────────────────────────────────── */
const NetworkMockup = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
    <div style={{ background: '#08080a', border: '1px solid rgba(255,255,255,.08)', borderRadius: 22, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,.7)' }}>
      <div style={{ background: 'linear-gradient(135deg,rgba(81,112,255,.12),rgba(124,58,237,.08))', borderBottom: '1px solid rgba(81,112,255,.15)', padding: '24px 22px 30px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 14, right: 16, background: 'rgba(74,222,128,.15)', border: '1px solid rgba(74,222,128,.3)', borderRadius: 99, padding: '4px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ position: 'relative', width: 7, height: 7 }}>
              <div className="ping" style={{ position: 'absolute', width: 7, height: 7, borderRadius: '50%', background: '#4ade80' }} />
              <div style={{ position: 'absolute', width: 7, height: 7, borderRadius: '50%', background: '#4ade80' }} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#4ade80' }}>Offen für Jobs</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{ padding: 3, background: 'linear-gradient(135deg,#5170ff,#a78bfa)', borderRadius: '50%', display: 'inline-flex', flexShrink: 0, boxShadow: '0 0 20px rgba(81,112,255,.25)' }}><div style={{ borderRadius: '50%', overflow: 'hidden' }}><ProfileAvatar name="Lisa Maier" size={58} /></div></div>
          <div>
            <p style={{ fontSize: 17, fontWeight: 800, color: 'white', margin: '0 0 3px' }}>Lisa Maier</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,.8)', margin: '0 0 10px' }}>Pflegefachkraft · Hamburg</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {['Intensivpflege', '3 J. Erfahrung'].map((t) => (
                <span key={t} style={{ fontSize: 10, fontWeight: 600, background: 'rgba(255,255,255,.2)', border: '1px solid rgba(255,255,255,.25)', borderRadius: 99, padding: '3px 10px', color: 'rgba(255,255,255,.95)' }}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div style={{ padding: '16px 22px' }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.9)', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 10px' }}>Dein Netzwerk</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: -8 }}>
          {['Klaus', 'Sara', 'David', 'Tom', 'Maria', 'Julia'].map((n, i) => (
            <div key={n} style={{ padding: 2, background: 'linear-gradient(135deg,#5170ff,#a78bfa)', borderRadius: '50%', display: 'inline-flex', marginLeft: i ? -10 : 0, boxShadow: '0 2px 12px rgba(81,112,255,.2)' }}><div style={{ borderRadius: '50%', overflow: 'hidden' }}><ProfileAvatar name={n} size={36} /></div></div>
          ))}
          <div style={{ marginLeft: 4, background: 'rgba(81,112,255,.15)', border: '1px solid rgba(81,112,255,.25)', borderRadius: 99, padding: '4px 12px' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#5170ff' }}>+248</span>
          </div>
        </div>
      </div>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.5)', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>Kennt ihr euch?</p>
      {[{ name: 'Klaus B.', role: 'Elektriker', mutual: '12 gemeinsame' }, { name: 'Sara N.', role: 'Erzieherin', mutual: '8 gemeinsame' }].map((p, i) => (
        <GlassCard key={i} style={{ padding: '12px 16px', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ padding: 2, background: 'linear-gradient(135deg,#5170ff,#a78bfa)', borderRadius: '50%', display: 'inline-flex', flexShrink: 0 }}><div style={{ borderRadius: '50%', overflow: 'hidden' }}><ProfileAvatar name={p.name} size={38} /></div></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'white', margin: 0 }}>{p.name}</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', margin: '2px 0 0' }}>{p.role} · {p.mutual}</p>
          </div>
          <button type="button" style={{ background: 'rgba(81,112,255,.15)', border: '1px solid rgba(81,112,255,.3)', borderRadius: 99, padding: '6px 14px', fontSize: 11, fontWeight: 600, color: '#5170ff', cursor: 'pointer' }}>+ Verbinden</button>
        </GlassCard>
      ))}
    </div>
  </div>
);

/* ── Animated Counter ─────────────────────────────────────────────────── */
const BRANCH_ACTIVE_MEMBERS: Record<string, number> = {
  pflege: 1840,
  funktionsdienste: 620,
  handwerk: 2100,
  industriemechaniker: 980,
  buromanagement: 730,
  ausbildung: 1450,
};

function AnimatedCounter({ target, duration = 2000 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const start = performance.now();
          const step = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  const formatted = count.toLocaleString('de-DE');
  return <span ref={ref}>{formatted}</span>;
}

/* ═══════════════════════════════════════════════════════════════════════════
   FEATURE TABS & CONSTANTS
═══════════════════════════════════════════════════════════════════════════ */
const TABS: FeatureTab[] = [
  { id: 'netzwerk', label: 'Vernetzen', headline: 'Dein Netzwerk.\nKein Vitamin B nötig.', body: 'Vernetze dich mit Kolleg:innen aus deiner Branche. Tausch Tipps zu Schichten, Gehalt und Alltag. Hier zählt wer du bist – nicht wen du kennst.', stat: '5.000+', statLabel: 'aktive Mitglieder', mockup: <NetworkMockup /> },
  { id: 'jobs', label: 'Jobs finden', headline: 'Jobs kommen\nzu dir – nicht umgekehrt.', body: 'Mach dein Profil sichtbar und lass Arbeitgeber zu dir kommen. Keine ewige Bewerbungsrunde – einfach profil anlegen und warten bis es klingelt.', stat: '97%', statLabel: 'Höchster Match-Score', mockup: <RecruiterMockup /> },
  { id: 'recruiter', label: 'Recruiter', headline: 'Recruiter schreiben\ndich direkt an.', body: 'Du wirst gefunden – nicht gesucht. Recruiter aus deiner Branche kontaktieren dich direkt im Chat. Schnell, persönlich, ohne Anschreiben.', stat: '3×', statLabel: 'schneller zum Job', mockup: <RecruiterMockup /> },
  { id: 'community', label: 'Community', headline: 'Echte Stimmen\nvon echten Kollegen.', body: 'Mitarbeiter empfehlen ihren Arbeitgeber aus erster Hand. Keine HR-Hochglanzbroschüre – nur ehrliche Einblicke von Menschen die wirklich dort arbeiten.', stat: '234', statLabel: 'Empfehlungen diese Woche', mockup: <AdvocacyMockup /> },
];

const EMPLOYER_LOGOS = [
  { src: '/assets/employers/rothenberger.png', alt: 'Rothenberger' },
  { src: '/assets/employers/fraport.png', alt: 'Fraport' },
  { src: '/assets/employers/thyssenkrupp.png', alt: 'Thyssenkrupp' },
  { src: '/assets/employers/curmundo.png', alt: 'Curmundo' },
  { src: '/assets/employers/asklepios.png', alt: 'Asklepios' },
  { src: '/assets/employers/merck.png', alt: 'Merck' },
  { src: '/assets/employers/helios.png', alt: 'Helios Kliniken' },
  { src: '/assets/employers/klinikum-mitte.png', alt: 'Klinikum Mitte' },
  { src: '/assets/employers/awo.png', alt: 'AWO Berlin' },
];

const TICKER_EMPLOYERS = ['Klinikum Mitte', 'Würth AG', 'AWO Berlin', 'DRK', 'Helios Kliniken', 'BAUER AG', 'Caritas', 'Zeppelin GmbH', 'Diakonie', 'Städtische Kliniken', 'Thyssenkrupp', 'BAUKING'];
const TICKER_JOBS = ['Pflegefachkraft', 'Elektriker:in', 'Erzieher:in', 'Mechatroniker:in', 'Servicekraft', 'Lagerist:in', 'KFZ-Mechatroniker', 'Bürokauffrau/-mann', 'Schreiner:in', 'Dachdecker:in', 'Köchin/Koch', 'Azubi Pflege'];

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════════ */
export default function DarkLandingPage() {
  const [activeTab, setActiveTab] = useState('netzwerk');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const tab = TABS.find((t) => t.id === activeTab)!;
  const [finderAudience, setFinderAudience] = useState<'ausbildung' | 'job'>('ausbildung');

  return (
    <DarkLandingLayout>

      {/* HERO – dezenter Blau-Lila Akzent */}
      <section className="bv-section-hero" style={{ padding: 'clamp(100px,18vh,150px) 0 clamp(48px,8vh,80px)', position: 'relative', overflow: 'hidden', background: 'transparent' }}>
        <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translate(-50%,-50%)', width: 900, height: 500, background: 'radial-gradient(ellipse,rgba(81,112,255,.12) 0%,rgba(124,58,237,.08) 35%,transparent 65%)', pointerEvents: 'none' }} />
        <R style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', maxWidth: 820, margin: '0 auto' }}>
            <div className="fu" style={{ marginBottom: 24 }}>
              <Badge>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80' }} />
                Das Netzwerk für die, die wirklich arbeiten
              </Badge>
            </div>
            <h1 className="fu1" style={{ fontSize: 'clamp(38px,6.5vw,80px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-3px', color: 'white', marginBottom: 28 }}>
              Vernetze dich. <span className="grad-text">Werde sichtbar.</span> Finde deinen Job.
            </h1>
            <p className="fu2" style={{ fontSize: 'clamp(16px,2.2vw,20px)', color: 'rgba(255,255,255,.6)', lineHeight: 1.7, maxWidth: 580, margin: '0 auto 44px' }}>
              BeVisiblle ist die App für Pfleger:innen, Handwerker, Servicekräfte und alle Non-Akademiker. Netzwerken, austauschen, Jobs finden – und von Recruitern direkt kontaktiert werden.
            </p>
            <div className="fu3" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 32 }}>
              <Link to="/cv-generator" className="glow" style={{ background: 'linear-gradient(135deg,#5170ff,#7c3aed)', color: 'white', borderRadius: 99, padding: '15px 32px', fontSize: 15, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 9, boxShadow: '0 4px 24px rgba(81,112,255,.4)' }}>
                Kostenloses Profil erstellen
                <ArrowRight size={16} strokeWidth={2.5} />
              </Link>
              <a href="#features" className="cta-sec-btn" style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', color: 'rgba(255,255,255,.8)', borderRadius: 99, padding: '15px 26px', fontSize: 15, fontWeight: 500, textDecoration: 'none' }}>So funktioniert&apos;s ↓</a>
            </div>
            <div className="fu3" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
              <div className="hero-avatar-stack" style={{ display: 'flex' }}>
                {['David', 'Maria', 'Klaus', 'Julia'].map((n, i) => (
                  <div key={n} style={{ padding: 2, background: 'linear-gradient(135deg,#5170ff,#a78bfa)', borderRadius: '50%', display: 'inline-flex', marginLeft: i ? -10 : 0, boxShadow: '0 2px 12px rgba(81,112,255,.25)' }}><div style={{ borderRadius: '50%', overflow: 'hidden' }}><ProfileAvatar name={n} size={34} /></div></div>
                ))}
              </div>
              <div>
                <div style={{ display: 'flex', gap: 2, marginBottom: 3 }}>
                  {[1, 2, 3, 4, 5].map((j) => (
                    <svg key={j} width="13" height="13" viewBox="0 0 20 20" fill="#facc15"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  ))}
                </div>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', margin: 0 }}><strong style={{ color: 'white' }}>5.000+</strong> Fachkräfte dabei</p>
              </div>
            </div>
          </div>
          <div style={{ maxWidth: 420, margin: '72px auto 0', position: 'relative' }}>
            <div className="float"><FeedMockup /></div>
            <div className="si1 floatd dark-hero-badge" style={{ position: 'absolute', top: 60, left: -80, background: 'linear-gradient(135deg,rgba(81,112,255,.08),rgba(8,8,10,.98))', border: '1px solid rgba(81,112,255,.2)', borderRadius: 16, padding: '12px 16px', boxShadow: '0 8px 32px rgba(0,0,0,.5), 0 0 0 1px rgba(81,112,255,.08)', whiteSpace: 'nowrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, background: 'rgba(74,222,128,.15)', border: '1px solid rgba(74,222,128,.3)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'white', margin: 0 }}>Job gefunden!</p>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', margin: 0 }}>Klinikum Mitte · Hamburg</p>
                </div>
              </div>
            </div>
            <div className="si2 float dark-hero-badge" style={{ position: 'absolute', top: 200, right: -88, background: 'linear-gradient(135deg,rgba(124,58,237,.06),rgba(8,8,10,.98))', border: '1px solid rgba(124,58,237,.2)', borderRadius: 16, padding: '12px 16px', boxShadow: '0 8px 32px rgba(0,0,0,.5), 0 0 0 1px rgba(124,58,237,.08)', whiteSpace: 'nowrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ padding: 2, background: 'linear-gradient(135deg,#5170ff,#a78bfa)', borderRadius: '50%', display: 'inline-flex' }}><div style={{ borderRadius: '50%', overflow: 'hidden' }}><ProfileAvatar name="Sara N." size={32} /></div></div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'white', margin: 0 }}>Recruiter schreibt dir</p>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', margin: 0 }}>vor 2 Minuten</p>
                </div>
              </div>
            </div>
            <div className="si3 floatd dark-hero-badge" style={{ position: 'absolute', bottom: 80, left: -70, background: 'linear-gradient(135deg,rgba(81,112,255,.06),rgba(8,8,10,.98))', border: '1px solid rgba(81,112,255,.18)', borderRadius: 16, padding: '10px 14px', boxShadow: '0 8px 32px rgba(0,0,0,.5), 0 0 0 1px rgba(81,112,255,.06)', whiteSpace: 'nowrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ display: 'flex' }}>
                  {['Klaus', 'Sara', 'David'].map((n, i) => (
                    <div key={n} style={{ padding: 2, background: 'linear-gradient(135deg,#5170ff,#a78bfa)', borderRadius: '50%', display: 'inline-flex', marginLeft: i ? -8 : 0, boxShadow: '0 1px 8px rgba(81,112,255,.2)' }}><div style={{ borderRadius: '50%', overflow: 'hidden' }}><ProfileAvatar name={n} size={24} /></div></div>
                  ))}
                </div>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', margin: 0 }}>+38 neue Mitglieder heute</p>
              </div>
            </div>
          </div>
        </R>
      </section>

      {/* TICKER */}
      <div style={{ padding: '16px 0', borderBottom: '1px solid rgba(81,112,255,.08)', background: 'linear-gradient(180deg,transparent,rgba(81,112,255,.02),transparent)' }}>
        <p style={{ textAlign: 'center', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 14 }}>Arbeitgeber die dich finden</p>
        <Ticker items={TICKER_EMPLOYERS} speed={30} />
        <div style={{ marginTop: 10 }}><Ticker items={TICKER_JOBS} reverse speed={38} /></div>
      </div>

      {/* STATS */}
      <section style={{ padding: '64px 0', marginTop: -1, background: 'transparent' }}>
        <R>
          <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0, background: 'linear-gradient(135deg,rgba(81,112,255,.04),rgba(255,255,255,.02))', borderRadius: 24, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.3), 0 0 0 1px rgba(81,112,255,.08)', border: '1px solid rgba(81,112,255,.1)' }}>
            {[
              { n: '5.000+', label: 'Aktive Mitglieder', sub: 'Pflege, Handwerk & mehr' },
              { n: '3×', label: 'Schneller zum Job', sub: 'als klassische Bewerbung' },
              { n: '97%', label: 'Match-Genauigkeit', sub: 'mit deinem Wunschjob' },
              { n: '0€', label: 'Für Arbeitnehmer', sub: 'Immer kostenlos' },
            ].map((s, i) => (
              <div key={i} className="stats-cell" style={{ padding: '28px 24px', borderRight: i < 3 ? '1px solid rgba(255,255,255,.06)' : 'none', textAlign: 'center' }}>
                <p style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 900, color: 'white', letterSpacing: '-2px', margin: '0 0 4px' }}>{s.n}</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,.7)', margin: '0 0 3px' }}>{s.label}</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', margin: 0 }}>{s.sub}</p>
              </div>
            ))}
          </div>
        </R>
      </section>

      {/* FEATURE TABS */}
      <section
        id="features"
        style={{
          padding: '40px 0 100px',
          marginTop: -1,
          background: 'transparent',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)', width: 700, height: 400, background: 'radial-gradient(ellipse,rgba(81,112,255,.06) 0%,rgba(124,58,237,.04) 40%,transparent 70%)', pointerEvents: 'none' }} />
        <R style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontSize: 'clamp(28px,4.5vw,54px)', fontWeight: 900, color: 'white', letterSpacing: '-2px', lineHeight: 1.1, marginBottom: 16 }}>
              Alles in einer App.<span className="grad-text"> Endlich.</span>
            </h2>
            <p style={{ fontSize: 17, color: 'rgba(255,255,255,.6)', maxWidth: 440, margin: '0 auto' }}>Feed, Jobs, Chat, Netzwerk – für alle die mit den Händen und dem Herz arbeiten.</p>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 56 }}>
            {TABS.map((t) => (
              <button key={t.id} type="button" className={`tab-pill${activeTab === t.id ? ' on' : ''}`} onClick={() => setActiveTab(t.id)}>{t.label}</button>
            ))}
          </div>
          <div key={activeTab} className="feat-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 72, alignItems: 'center' }}>
            <div className="fu">
              <h3 style={{ fontSize: 'clamp(24px,3.5vw,42px)', fontWeight: 900, color: 'white', letterSpacing: '-1.5px', lineHeight: 1.15, marginBottom: 20, whiteSpace: 'pre-line' }}>{tab.headline}</h3>
              <p style={{ fontSize: 17, color: 'rgba(255,255,255,.6)', lineHeight: 1.75, marginBottom: 36 }}>{tab.body}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                <GlassCard style={{ borderRadius: 18, padding: '16px 22px', display: 'inline-flex', flexDirection: 'column', gap: 2, border: '1px solid rgba(81,112,255,.15)', boxShadow: '0 1px 3px rgba(0,0,0,.3), 0 0 20px rgba(81,112,255,.08)' }}>
                  <span style={{ fontSize: 'clamp(26px,3vw,36px)', fontWeight: 900, color: 'white', letterSpacing: '-1px' }}>{tab.stat}</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,.5)' }}>{tab.statLabel}</span>
                </GlassCard>
                <Link to="/cv-generator" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#5170ff,#7c3aed)', color: 'white', borderRadius: 99, padding: '13px 26px', fontSize: 14, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 20px rgba(81,112,255,.35)' }}>Jetzt loslegen →</Link>
              </div>
            </div>
            <div className="fu1">{tab.mockup}</div>
          </div>
        </R>
      </section>

      {/* FINDER DEMO SECTION – weiter unten, im „Alles in einer App“-Stil */}
      <section
        style={{
          padding: '0 0 72px',
          background: 'transparent',
        }}
      >
        <R>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2
              style={{
                fontSize: 'clamp(26px,3.6vw,38px)',
                fontWeight: 900,
                color: 'white',
                letterSpacing: '-2px',
                marginBottom: 12,
              }}
            >
              Finde deinen nächsten Schritt – im Chat.
            </h2>
            <p
              style={{
                fontSize: 17,
                color: 'rgba(255,255,255,.6)',
                maxWidth: 520,
                margin: '0 auto',
                lineHeight: 1.7,
              }}
            >
              Der BeVisiblle Coach hilft dir, in wenigen Fragen passende Richtungen und Jobs zu finden – egal ob Ausbildung oder
              Job ohne Studium.
            </p>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 8,
              flexWrap: 'wrap',
              marginBottom: 40,
            }}
          >
            <button
              type="button"
              className={`tab-pill${finderAudience === 'ausbildung' ? ' on' : ''}`}
              onClick={() => setFinderAudience('ausbildung')}
            >
              Ausbildungsfinder
            </button>
            <button
              type="button"
              className={`tab-pill${finderAudience === 'job' ? ' on' : ''}`}
              onClick={() => setFinderAudience('job')}
            >
              Job-Finder ohne Studium
            </button>
          </div>
          <div
            className="finder-landing-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0,1.15fr) minmax(0,0.9fr)',
              gap: 36,
              alignItems: 'center',
            }}
          >
            <div>
              <h3
                style={{
                  fontSize: 'clamp(20px,2.6vw,26px)',
                  fontWeight: 800,
                  color: 'white',
                  letterSpacing: '-1px',
                  margin: '0 0 10px',
                }}
              >
                {finderAudience === 'ausbildung'
                  ? 'Welche Ausbildung passt wirklich zu dir?'
                  : 'Welche Jobs passen zu deinem Leben?'}
              </h3>
              <p
                style={{
                  fontSize: 17,
                  color: 'rgba(255,255,255,.6)',
                  lineHeight: 1.75,
                  margin: '0 0 14px',
                  maxWidth: 460,
                }}
              >
                {finderAudience === 'ausbildung'
                  ? 'Der Coach fragt nach deinen Stärken, Wünschen und Rahmenbedingungen und schlägt dir Branchen, Ausbildungen und nächste Schritte vor – ohne, dass du Fachbegriffe kennen musst.'
                  : 'Der Coach zeigt dir Jobs ohne Studium, die zu deinem Alltag, deiner Sprache und deinen Wunsch-Arbeitszeiten passen – inklusive Vorschlägen für Quereinstieg und Weiterbildungen.'}
              </p>
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: '0 0 18px',
                  fontSize: 14,
                  color: 'rgba(255,255,255,.6)',
                  lineHeight: 1.6,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                {finderAudience === 'ausbildung' ? (
                  <>
                    <li>· Fragen in einfacher Sprache, Schritt für Schritt</li>
                    <li>· Konkrete Vorschläge mit Erklärung, warum sie zu dir passen</li>
                    <li>· Tipps für FSJ/Praktikum oder Sprachkurs als Einstieg</li>
                  </>
                ) : (
                  <>
                    <li>· Fokus auf Jobs ohne Studium und mit niedrigem Einstieg</li>
                    <li>· Empfehlungen mit Match‑Score und „Warum es passt“</li>
                    <li>· Ideen für Quereinstieg, Teilzeit und Sprachniveau</li>
                  </>
                )}
              </ul>
              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  flexWrap: 'wrap',
                  marginTop: 4,
                }}
              >
                <Link
                  to={finderAudience === 'ausbildung' ? '/ausbildungsfinder' : '/job-finder'}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    borderRadius: 999,
                    padding: '10px 18px',
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: 'none',
                    background: 'linear-gradient(135deg,#5170ff,#7c3aed)',
                    color: 'white',
                  }}
                >
                  {finderAudience === 'ausbildung' ? 'Ausbildungsfinder öffnen' : 'Job-Finder öffnen'}
                  <ArrowRight size={14} strokeWidth={2.2} />
                </Link>
                <span
                  style={{
                    fontSize: 12,
                    color: 'rgba(255,255,255,.5)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: '#4ade80',
                    }}
                  />
                  Antworten nur auf Basis deines Profils – kein Lebenslauf nötig
                </span>
              </div>
            </div>
            <div>
              <div
                style={{
                  maxWidth: 400,
                  margin: '0 auto',
                }}
              >
                <ConversationalFinder audience={finderAudience} mode="hybrid" compact />
              </div>
            </div>
          </div>
        </R>
      </section>

      {/* CAREER CARDS – dezenter Blau-Lila Akzent */}
      <section
        style={{
          padding: '0 0 100px',
          marginTop: -1,
          position: 'relative',
          overflow: 'hidden',
          background: 'transparent',
        }}
      >
        <div style={{ position: 'absolute', bottom: '15%', left: '50%', transform: 'translate(-50%,0)', width: 700, height: 350, background: 'radial-gradient(ellipse,rgba(81,112,255,.1) 0%,rgba(124,58,237,.06) 40%,transparent 70%)', pointerEvents: 'none' }} />
        <R>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <Badge color="#5170ff">Deine Karriere bei BeVisiblle</Badge>
            <h2 style={{ fontSize: 'clamp(32px,5vw,60px)', fontWeight: 900, color: 'white', letterSpacing: '-2.5px', lineHeight: 1.08, margin: '20px 0 16px' }}>
              <span className="grad-text">Dein Talent.</span> Dein Match.<br />Deine Zukunft.
            </h2>
            <p style={{ fontSize: 17, color: 'rgba(255,255,255,.6)', maxWidth: 520, margin: '0 auto' }}>Vernetze dich mit anderen aus deiner Branche. Wenn du auf der Suche nach einem neuen Job bist, schalte dein Profil einfach sichtbar.</p>
          </div>
          <div className="career-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
            {CAREER_BRANCHES.map((card: CareerBranchConfig, i: number) => (
              <Link key={card.id} to={card.link} className="career-card" style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 20, display: 'flex', flexDirection: 'column', overflow: 'hidden', textDecoration: 'none', boxShadow: '0 4px 24px rgba(0,0,0,.4)' }}>
                <div className="career-card-image-area" style={{ height: 320, background: `linear-gradient(160deg, ${card.accent}10 0%, ${card.accent}20 50%, ${card.accent}08 100%)`, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', borderRadius: '20px 20px 0 0' }}>
                  <div style={{ position: 'absolute', top: 14, right: 14, zIndex: 5, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(8px)', borderRadius: 99, padding: '5px 12px 5px 8px' }}>
                    <div style={{ position: 'relative', width: 8, height: 8 }}>
                      <div className="ping" style={{ position: 'absolute', width: 8, height: 8, borderRadius: '50%', background: 'rgba(74,222,128,.5)' }} />
                      <div style={{ position: 'absolute', width: 8, height: 8, borderRadius: '50%', background: '#4ade80' }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.9)', letterSpacing: '0.02em' }}>
                      <AnimatedCounter target={BRANCH_ACTIVE_MEMBERS[card.id] || 500} duration={2200 + i * 300} /> aktiv
                    </span>
                  </div>
                  <div style={{ position: 'absolute', bottom: '18%', left: '50%', transform: 'translateX(-50%)', width: 180, height: 180, borderRadius: '50%', background: `radial-gradient(circle, ${card.accent}18 0%, transparent 70%)`, filter: 'blur(25px)', pointerEvents: 'none' }} />
                  <div className="career-card-img-wrap" style={{ width: 300, maxWidth: '100%', height: 320, position: 'relative', zIndex: 2, marginBottom: -20, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                    <img src={card.image} alt={card.title} className="career-card-img" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', objectPosition: 'bottom', filter: 'drop-shadow(0 10px 28px rgba(0,0,0,.35)) drop-shadow(0 4px 8px rgba(0,0,0,.2))' }} />
                  </div>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, background: 'linear-gradient(to top, rgba(255,255,255,.03) 0%, transparent 100%)', pointerEvents: 'none', zIndex: 3 }} />
                </div>
                <div style={{ padding: '22px 24px 26px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <span style={{ display: 'inline-block', width: 'fit-content', fontSize: 9, fontWeight: 700, color: card.accent, background: `${card.accent}15`, border: `1px solid ${card.accent}30`, borderRadius: 6, padding: '3px 10px', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{card.subline}</span>
                  <h3 style={{ fontSize: 19, fontWeight: 800, color: 'white', margin: '0 0 5px', letterSpacing: '-0.5px' }}>{card.title}</h3>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', lineHeight: 1.65, margin: '0 0 22px', flex: 1 }}>{card.description}</p>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: card.accent }}>{card.buttonText}<ArrowRight size={13} strokeWidth={2.5} /></span>
                </div>
              </Link>
            ))}
          </div>
        </R>
      </section>

      {/* EMPLOYER LOGOS */}
      <section style={{ padding: '0 0 64px', background: 'transparent' }}>
        <R>
          <p style={{ textAlign: 'center', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 24 }}>Arbeitgeber die uns vertrauen</p>
          <div className="employer-logos-row" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 40 }}>
            {EMPLOYER_LOGOS.map((logo) => (
              <img
                key={logo.alt}
                src={logo.src}
                alt={logo.alt}
                style={{ height: 36, maxWidth: 140, objectFit: 'contain', opacity: 0.85 }}
              />
            ))}
          </div>
        </R>
      </section>

      {/* EMPLOYER SECTION */}
      <section
        id="employer"
        style={{
          padding: '0 0 100px',
          background: 'transparent',
        }}
      >
        <R>
          <div className="advo-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 80, alignItems: 'center' }}>
            <div>
              <Badge color="#059669">Für Unternehmen</Badge>
              <h2 style={{ fontSize: 'clamp(28px,4vw,50px)', fontWeight: 900, color: 'white', letterSpacing: '-2px', lineHeight: 1.12, margin: '20px 0 20px' }}>Eure Mitarbeiter sind<br />eure beste Werbung.</h2>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,.6)', lineHeight: 1.75, marginBottom: 32 }}>Wenn echte Mitarbeiter über ihren Arbeitgeber sprechen, glaubt man ihnen. Kein HR-Hochglanz – sondern authentische Stimmen die wirklich überzeugen und neue Fachkräfte anziehen.</p>
              {[
                { icon: '✓', text: 'Mitarbeiter posten über ihren Alltag und Arbeitgeber' },
                { icon: '✓', text: 'Unternehmensprofil mit Stellenanzeigen & Kultur' },
                { icon: '✓', text: 'Direktkontakt zu passenden Kandidat:innen' },
                { icon: '✓', text: 'Authentisches Employer Branding durch echte Stimmen' },
              ].map((b, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(74,222,128,.2)', border: '1px solid rgba(74,222,128,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#059669' }}>{b.icon}</span>
                  </div>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,.6)', lineHeight: 1.55, margin: 0 }}>{b.text}</p>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 12, marginTop: 36, flexWrap: 'wrap' }}>
                <Link to="/company" style={{ background: '#059669', border: 'none', color: 'white', borderRadius: 99, padding: '13px 26px', fontSize: 14, fontWeight: 600, textDecoration: 'none', boxShadow: '0 2px 8px rgba(5,150,105,.3)' }}>Demo buchen →</Link>
                <Link to="/company" style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', color: 'rgba(255,255,255,.8)', borderRadius: 99, padding: '13px 20px', fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>Mehr erfahren</Link>
              </div>
            </div>
            <div><AdvocacyMockup /></div>
          </div>
        </R>
      </section>

      {/* PRICING */}
      <section
        id="pricing"
        style={{
          padding: '0 0 100px',
          background: 'transparent',
        }}
      >
        <R>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 900, color: 'white', letterSpacing: '-2px', marginBottom: 12 }}>Simple, transparente Preise</h2>
            <p style={{ fontSize: 17, color: 'rgba(255,255,255,.6)', marginBottom: 24 }}>Flexibel wechseln – keine versteckten Kosten.</p>
            <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,.06)', borderRadius: 99, padding: 4 }}>
              <button type="button" onClick={() => setBillingCycle('monthly')} className={`tab-pill${billingCycle === 'monthly' ? ' on' : ''}`} style={{ margin: 0 }}>Monatlich</button>
              <button type="button" onClick={() => setBillingCycle('yearly')} className={`tab-pill${billingCycle === 'yearly' ? ' on' : ''}`} style={{ margin: 0 }}>Jährlich</button>
            </div>
          </div>
          <div className="pricing-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24, maxWidth: 1000, margin: '0 auto' }}>
            {COMPANY_PRICING_TIERS.map((tier) => {
              const price = tier.price.monthly != null ? (billingCycle === 'yearly' ? tier.price.yearly! : tier.price.monthly) : null;
              const period = billingCycle === 'yearly' ? 'Jahr' : 'Monat';
              const isEnterprise = tier.id === 'enterprise';
              return (
                <div key={tier.id} style={{ background: tier.id === 'pro' ? 'linear-gradient(180deg,rgba(81,112,255,.08),rgba(255,255,255,.02))' : 'rgba(255,255,255,.03)', border: tier.id === 'pro' ? '1px solid rgba(81,112,255,.35)' : '1px solid rgba(255,255,255,.08)', borderRadius: 20, padding: '28px 24px', position: 'relative', boxShadow: tier.id === 'pro' ? '0 1px 3px rgba(0,0,0,.3), 0 0 30px rgba(81,112,255,.12)' : '0 1px 3px rgba(0,0,0,.3)' }}>
                  {tier.badge && <span style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,#5170ff,#7c3aed)', color: 'white', fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 99, boxShadow: '0 2px 12px rgba(81,112,255,.4)' }}>{tier.badge}</span>}
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: 'white', marginBottom: 8 }}>{tier.title}</h3>
                  <div style={{ marginBottom: 8 }}>
                    {isEnterprise ? <span style={{ fontSize: 24, fontWeight: 800, color: 'white' }}>Kontaktiere uns</span> : <span style={{ fontSize: 28, fontWeight: 900, color: 'white' }}>€{price}<span style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,.5)' }}> /{period}</span></span>}
                  </div>
                  {tier.description && <p style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', marginBottom: 20 }}>{tier.description}</p>}
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {tier.features.map((f, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10, fontSize: 13, color: 'rgba(255,255,255,.7)' }}>
                        <span style={{ color: '#059669', flexShrink: 0 }}>✓</span>{f}
                      </li>
                    ))}
                  </ul>
                  {tier.ctaHref.startsWith('http') ? (
                    <a href={tier.ctaHref} target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginTop: 24, textAlign: 'center', background: tier.id === 'pro' ? 'linear-gradient(135deg,#5170ff,#7c3aed)' : 'rgba(255,255,255,.08)', color: tier.id === 'pro' ? 'white' : 'white', borderRadius: 99, padding: '12px 24px', fontSize: 14, fontWeight: 600, textDecoration: 'none', boxShadow: tier.id === 'pro' ? '0 4px 16px rgba(81,112,255,.35)' : 'none' }}>{tier.ctaLabel}</a>
                  ) : (
                    <Link to={tier.ctaHref.includes('unternehmensregistrierung') ? `${tier.ctaHref}&billing=${billingCycle}` : tier.ctaHref} style={{ display: 'block', marginTop: 24, textAlign: 'center', background: tier.id === 'pro' ? 'linear-gradient(135deg,#5170ff,#7c3aed)' : 'rgba(255,255,255,.08)', color: tier.id === 'pro' ? 'white' : 'white', borderRadius: 99, padding: '12px 24px', fontSize: 14, fontWeight: 600, textDecoration: 'none', boxShadow: tier.id === 'pro' ? '0 4px 16px rgba(81,112,255,.35)' : 'none' }}>{tier.ctaLabel}</Link>
                  )}
                </div>
              );
            })}
          </div>
        </R>
      </section>

    </DarkLandingLayout>
  );
}
