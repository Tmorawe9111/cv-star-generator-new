import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ChevronDown, Menu, X, ExternalLink, Check, Eye } from 'lucide-react';
import type { CareerBranchConfig } from '@/config/careerBranches';
import { getBranchContent, type BranchId } from '@/config/careerBranchContent';
import { ProfileAvatar } from '@/components/landing/ProfileAvatar';
import ConversationalFinder from '@/components/finder/ConversationalFinder';
import PflegeWuensche from './sections/PflegeWuensche';
import FachbereichTabs from './sections/FachbereichTabs';
import GewerkeFilter from './sections/GewerkeFilter';
import SchichtTabelle from './sections/SchichtTabelle';
import ArbeitsmodellFilter from './sections/ArbeitsmodellFilter';
import AzubiOrientierung from './sections/AzubiOrientierung';

interface CareerBranchLandingPageProps {
  branch: CareerBranchConfig;
}

const R = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`max-w-[1120px] mx-auto w-full px-5 sm:px-6 ${className}`}>{children}</div>
);

const BRANCH_RECRUITER: Record<string, { name: string; employer: string; role: string; message: string }> = {
  pflege: { name: 'Sandra M.', employer: 'Klinikum Mitte', role: 'Recruiterin', message: 'Hallo! Wir suchen eine Pflegefachkraft für unsere Intensivstation. Dein Profil passt perfekt! 🙌' },
  funktionsdienste: { name: 'Dr. Meyer', employer: 'Helios Kliniken', role: 'OP-Leitung', message: 'Ihr OTA-Profil hat uns beeindruckt. Wir suchen Verstärkung für unseren Zentral-OP.' },
  handwerk: { name: 'Thomas H.', employer: 'Rothenberger', role: 'Betriebsleiter', message: 'Moin! Wir suchen einen Elektriker für den Anlagenbau. Dein Profil sieht gut aus! 🔧' },
  industriemechaniker: { name: 'Petra L.', employer: 'Thyssenkrupp', role: 'HR Business Partner', message: 'Ihr Profil passt zu unserer Instandhaltung. Haben Sie Interesse an einem Gespräch?' },
  buromanagement: { name: 'Julia K.', employer: 'Curmundo', role: 'Office Lead', message: 'Hi! Wir suchen eine/n Office Manager:in mit Hybrid-Option. Dein Profil ist genau richtig! 💼' },
  ausbildung: { name: 'Anna S.', employer: 'Klinikum Mitte', role: 'Ausbildungskoordinatorin', message: 'Hey! Wir haben Ausbildungsplätze frei und dein Profil hat uns angesprochen! 🎓' },
};

const BRANCH_COMMUNITY: Record<string, {
  profile: { name: string; role: string; location: string; skills: string[] };
  stories: string[];
  post: { name: string; role: string; text: string; likes: string; comments: string; time: string };
  employerPost: { employer: string; text: string; openJobs: number };
  network: { name: string; role: string; mutual: string }[];
}> = {
  pflege: {
    profile: { name: 'Lisa Maier', role: 'Pflegefachkraft', location: 'Hamburg', skills: ['Intensivpflege', '3 J. Erfahrung'] },
    stories: ['Maria', 'Klaus', 'Julia', 'Tom'],
    post: { name: 'Maria K.', role: 'Pflegefachkraft · Hamburg', text: 'Heute meinen ersten Tag im Klinikum Mitte gestartet 🎉 Danke an alle die mich durch BeVisiblle gefunden haben!', likes: '124', comments: '18', time: 'vor 2h' },
    employerPost: { employer: 'Klinikum Mitte', text: '📢 Wir suchen Pflegefachkräfte für die Intensivstation! Faire Gehälter, echter Teamspirit.', openJobs: 3 },
    network: [{ name: 'Klaus B.', role: 'Pfleger', mutual: '12 gemeinsame' }, { name: 'Sara N.', role: 'Krankenschwester', mutual: '8 gemeinsame' }],
  },
  funktionsdienste: {
    profile: { name: 'Sandra W.', role: 'OTA', location: 'Berlin', skills: ['Zentral-OP', 'Stryker/Olympus'] },
    stories: ['Sandra', 'Michael', 'Nina', 'Jan'],
    post: { name: 'Sandra W.', role: 'OTA · Berlin', text: 'Nach 5 Jahren im selben OP endlich den Wechsel geschafft. Helios hat mich direkt angeschrieben 🏥', likes: '87', comments: '12', time: 'vor 4h' },
    employerPost: { employer: 'Helios Kliniken', text: '📢 Zentral-OP sucht OTA und ATA! Modernste Geräte, festes Team.', openJobs: 5 },
    network: [{ name: 'Michael R.', role: 'ATA', mutual: '6 gemeinsame' }, { name: 'Nina K.', role: 'MTR', mutual: '4 gemeinsame' }],
  },
  handwerk: {
    profile: { name: 'Klaus B.', role: 'Elektriker', location: 'Frankfurt', skills: ['Anlagenbau', 'Meister'] },
    stories: ['Klaus', 'David', 'Julia', 'Tom'],
    post: { name: 'Klaus B.', role: 'Elektriker · Frankfurt', text: 'Seit 3 Jahren bei Rothenberger und bereue keinen Tag. Wer handwerklich fit ist – meldet euch! 🔧⚡', likes: '234', comments: '41', time: 'vor 1h' },
    employerPost: { employer: 'Rothenberger', text: '🔧 Wir suchen Elektriker und KFZ-Mechatroniker! Gutes Werkzeug, faire Bezahlung.', openJobs: 4 },
    network: [{ name: 'David M.', role: 'KFZ-Mechatroniker', mutual: '15 gemeinsame' }, { name: 'Julia K.', role: 'Tischlerin', mutual: '9 gemeinsame' }],
  },
  industriemechaniker: {
    profile: { name: 'Max S.', role: 'Industriemechaniker', location: 'Essen', skills: ['SPS', 'Instandhaltung'] },
    stories: ['Max', 'Petra', 'Lars', 'Anna'],
    post: { name: 'Max S.', role: 'Industriemechaniker · Essen', text: 'Thyssenkrupp hat mich über BeVisiblle gefunden. Faire Schichten, moderner Maschinenpark. Top! ⚙️', likes: '67', comments: '8', time: 'vor 3h' },
    employerPost: { employer: 'Thyssenkrupp', text: '⚙️ Instandhalter gesucht! IG-Metall-Tarif, moderne Anlagen, echtes Team.', openJobs: 6 },
    network: [{ name: 'Petra L.', role: 'Mechatronikerin', mutual: '7 gemeinsame' }, { name: 'Lars W.', role: 'Techniker', mutual: '5 gemeinsame' }],
  },
  buromanagement: {
    profile: { name: 'Sara N.', role: 'Office Managerin', location: 'Hamburg', skills: ['SAP', 'Hybrid-Arbeit'] },
    stories: ['Sara', 'David', 'Lisa', 'Tom'],
    post: { name: 'Sara N.', role: 'Bürokauffrau · Hamburg', text: 'Auf StepStone 30 Bewerbungen, 2 Absagen. Bei BeVisiblle hat Curmundo MICH angeschrieben. Der Unterschied ist enorm! 💼', likes: '156', comments: '23', time: 'vor 5h' },
    employerPost: { employer: 'Curmundo', text: '💼 Office Manager:in gesucht! Hybrid, Gleitzeit, modernes Team.', openJobs: 2 },
    network: [{ name: 'David M.', role: 'Assistent der GL', mutual: '10 gemeinsame' }, { name: 'Lisa R.', role: 'Sachbearbeiterin', mutual: '6 gemeinsame' }],
  },
  ausbildung: {
    profile: { name: 'Jana K.', role: 'Azubi Pflege', location: 'Hamburg', skills: ['2. Lehrjahr', 'Realschule'] },
    stories: ['Jana', 'Tom', 'Lena', 'Max'],
    post: { name: 'Jana K.', role: 'Azubi Pflege · Hamburg', text: 'Ich wusste nicht wo ich anfangen soll. Klinikum Mitte hat mich angeschrieben – jetzt bin ich im 2. Lehrjahr und super happy! 🎓', likes: '89', comments: '14', time: 'vor 6h' },
    employerPost: { employer: 'Thyssenkrupp', text: '🎓 Ausbildungsplätze 2025! Industriemechaniker, Elektroniker, Büro – jetzt bewerben.', openJobs: 8 },
    network: [{ name: 'Tom R.', role: 'Azubi Mechatronik', mutual: '4 gemeinsame' }, { name: 'Lena M.', role: 'Azubi Büro', mutual: '3 gemeinsame' }],
  },
};

function LightFeedMockup({ branch }: { branch: CareerBranchConfig }) {
  const accent = branch.accent;
  const c = BRANCH_COMMUNITY[branch.id] ?? BRANCH_COMMUNITY.pflege;

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 22, overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,.08)' }}>
      <div style={{ background: `linear-gradient(90deg, ${accent}06, transparent)`, borderBottom: '1px solid #f1f3f5', padding: '10px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>BeVisib<span style={{ color: accent }}>ll</span>e</span>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <div style={{ position: 'relative' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            <div style={{ position: 'absolute', top: -2, right: -2, width: 7, height: 7, background: accent, borderRadius: '50%', border: '1.5px solid #fff' }} />
          </div>
          <div style={{ padding: 2, background: `linear-gradient(135deg, ${accent}, #a78bfa)`, borderRadius: '50%', display: 'inline-flex' }}>
            <div style={{ borderRadius: '50%', overflow: 'hidden' }}><ProfileAvatar name={c.profile.name} size={24} /></div>
          </div>
        </div>
      </div>

      <div style={{ padding: '12px 16px 8px', display: 'flex', gap: 12, borderBottom: '1px solid #f5f5f5', overflowX: 'auto' }}>
        {c.stories.map((name, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', padding: 2, background: `linear-gradient(135deg, ${accent}, #a78bfa)`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ borderRadius: '50%', overflow: 'hidden' }}><ProfileAvatar name={name} size={36} /></div>
            </div>
            <span style={{ fontSize: 9, color: '#94a3b8' }}>{name}</span>
          </div>
        ))}
      </div>

      <div style={{ padding: '12px 16px', borderBottom: '1px solid #f5f5f5' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ padding: 2, background: `linear-gradient(135deg, ${accent}, #a78bfa)`, borderRadius: '50%', display: 'inline-flex' }}>
            <div style={{ borderRadius: '50%', overflow: 'hidden' }}><ProfileAvatar name={c.post.name} size={30} /></div>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#0f172a', margin: 0 }}>{c.post.name}</p>
            <p style={{ fontSize: 9, color: '#94a3b8', margin: 0 }}>{c.post.role} · {c.post.time}</p>
          </div>
          <div style={{ background: `${accent}10`, border: `1px solid ${accent}25`, borderRadius: 99, padding: '2px 8px' }}>
            <span style={{ fontSize: 9, fontWeight: 600, color: accent }}>Offen für Jobs</span>
          </div>
        </div>
        <p style={{ fontSize: 11, color: '#475569', lineHeight: 1.6, marginBottom: 8 }}>{c.post.text}</p>
        <div style={{ display: 'flex', gap: 16 }}>
          {[['👍', c.post.likes], ['💬', c.post.comments], ['↗', 'Teilen']].map(([e, count], j) => (
            <span key={j} style={{ fontSize: 10, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 3 }}>{e} {count}</span>
          ))}
        </div>
      </div>

      <div style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 2px 8px ${accent}25` }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>{c.employerPost.employer[0]}</span>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#0f172a', margin: 0 }}>{c.employerPost.employer} <span style={{ fontSize: 9, color: accent }}>✓</span></p>
            <p style={{ fontSize: 9, color: '#94a3b8', margin: 0 }}>Arbeitgeber · vor 4h</p>
          </div>
        </div>
        <p style={{ fontSize: 11, color: '#475569', lineHeight: 1.6, marginBottom: 8 }}>{c.employerPost.text}</p>
        <div style={{ background: `${accent}06`, border: `1px solid ${accent}15`, borderRadius: 10, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: '#64748b' }}>{c.employerPost.openJobs} offene Stellen</span>
          <span style={{ fontSize: 10, fontWeight: 600, color: accent }}>Jetzt bewerben →</span>
        </div>
      </div>

      <div style={{ borderTop: '1px solid #f1f3f5', display: 'flex', justifyContent: 'space-around', padding: '8px 0 5px' }}>
        {[
          { d: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', active: true },
          { d: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
          { d: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
          { d: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
          { d: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
        ].map((n, i) => (
          <svg key={i} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={(n as { active?: boolean }).active ? accent : '#cbd5e1'} strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d={n.d} />
          </svg>
        ))}
      </div>
    </div>
  );
}

function LightProfileCard({ branch }: { branch: CareerBranchConfig }) {
  const accent = branch.accent;
  const c = BRANCH_COMMUNITY[branch.id] ?? BRANCH_COMMUNITY.pflege;
  const p = c.profile;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 20, overflow: 'hidden', boxShadow: '0 16px 48px rgba(0,0,0,.06)' }}>
        <div style={{ background: `linear-gradient(135deg, ${accent}10, ${accent}04)`, borderBottom: `1px solid ${accent}12`, padding: '22px 20px 26px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 12, right: 14, background: 'rgba(74,222,128,.08)', border: '1px solid rgba(74,222,128,.2)', borderRadius: 99, padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
            <span style={{ fontSize: 9, fontWeight: 600, color: '#059669' }}>Offen für Jobs</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ padding: 2, background: `linear-gradient(135deg, ${accent}, #a78bfa)`, borderRadius: '50%', display: 'inline-flex', flexShrink: 0, boxShadow: `0 0 16px ${accent}20` }}>
              <div style={{ borderRadius: '50%', overflow: 'hidden' }}><ProfileAvatar name={p.name} size={50} /></div>
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: '0 0 2px' }}>{p.name}</p>
              <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 8px' }}>{p.role} · {p.location}</p>
              <div style={{ display: 'flex', gap: 6 }}>
                {p.skills.map((t) => (
                  <span key={t} style={{ fontSize: 9, fontWeight: 600, background: `${accent}10`, border: `1px solid ${accent}20`, borderRadius: 99, padding: '2px 8px', color: accent }}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div style={{ padding: '14px 20px' }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 8px' }}>Dein Netzwerk</p>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {['Klaus', 'Sara', 'David', 'Tom', 'Maria', 'Julia'].map((n, i) => (
              <div key={n} style={{ padding: 2, background: `linear-gradient(135deg, ${accent}, #a78bfa)`, borderRadius: '50%', display: 'inline-flex', marginLeft: i ? -8 : 0, boxShadow: `0 1px 6px ${accent}15` }}>
                <div style={{ borderRadius: '50%', overflow: 'hidden' }}><ProfileAvatar name={n} size={30} /></div>
              </div>
            ))}
            <div style={{ marginLeft: 6, background: `${accent}10`, border: `1px solid ${accent}20`, borderRadius: 99, padding: '3px 10px' }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: accent }}>+248</span>
            </div>
          </div>
        </div>
      </div>

      <p style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>Kennt ihr euch?</p>
      {c.network.map((person, i) => (
        <div key={i} style={{ background: '#fff', border: '1px solid #f1f3f5', borderRadius: 14, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 2px 8px rgba(0,0,0,.03)' }}>
          <div style={{ padding: 2, background: `linear-gradient(135deg, ${accent}, #a78bfa)`, borderRadius: '50%', display: 'inline-flex', flexShrink: 0 }}>
            <div style={{ borderRadius: '50%', overflow: 'hidden' }}><ProfileAvatar name={person.name} size={34} /></div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', margin: 0 }}>{person.name}</p>
            <p style={{ fontSize: 10, color: '#94a3b8', margin: '1px 0 0' }}>{person.role} · {person.mutual}</p>
          </div>
          <span style={{ background: `${accent}10`, border: `1px solid ${accent}25`, borderRadius: 99, padding: '4px 12px', fontSize: 10, fontWeight: 600, color: accent, whiteSpace: 'nowrap' }}>+ Verbinden</span>
        </div>
      ))}
    </div>
  );
}

function LightRecruiterMockup({ branch }: { branch: CareerBranchConfig }) {
  const rec = BRANCH_RECRUITER[branch.id] ?? BRANCH_RECRUITER.pflege;
  const accent = branch.accent;
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 22, overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,.08), 0 0 0 1px rgba(0,0,0,.02)' }}>
      <div style={{ background: `linear-gradient(135deg, ${accent}08, ${accent}04)`, borderBottom: '1px solid #f1f3f5', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ position: 'relative' }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 3px 12px ${accent}30` }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{rec.employer[0]}</span>
          </div>
          <div style={{ position: 'absolute', bottom: -1, right: -1, width: 11, height: 11, background: '#4ade80', borderRadius: '50%', border: '2px solid #fff' }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', margin: 0 }}>{rec.name} – {rec.employer} <span style={{ color: accent, fontSize: 10 }}>✓</span></p>
          <p style={{ fontSize: 10, color: '#94a3b8', margin: '1px 0 0' }}>{rec.role} · schreibt dir gerade</p>
        </div>
      </div>
      <div className="cl-si1" style={{ margin: '12px 14px 6px', background: `${accent}08`, border: `1px solid ${accent}18`, borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 28, height: 28, background: `${accent}15`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Eye size={14} style={{ color: accent }} /></div>
        <div>
          <p style={{ fontSize: 10, fontWeight: 600, color: accent, margin: 0 }}>Dein Profil wurde angesehen</p>
          <p style={{ fontSize: 9, color: '#94a3b8', margin: '1px 0 0' }}>vor 3 Min. von {rec.employer}</p>
        </div>
      </div>
      <div style={{ padding: '6px 14px 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="cl-msg1" style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
          <div style={{ width: 24, height: 24, borderRadius: 8, background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 9, fontWeight: 800, color: '#fff' }}>{rec.employer[0]}</div>
          <div style={{ background: '#f8f9fa', borderRadius: '12px 12px 12px 4px', padding: '8px 12px', maxWidth: '80%' }}>
            <p style={{ fontSize: 11, color: '#374151', lineHeight: 1.5, margin: 0 }}>{rec.message}</p>
          </div>
        </div>
        <div className="cl-msg2" style={{ display: 'flex', alignItems: 'flex-end', gap: 6, justifyContent: 'flex-end' }}>
          <div style={{ background: accent, borderRadius: '12px 12px 4px 12px', padding: '8px 12px', maxWidth: '80%', boxShadow: `0 3px 12px ${accent}25` }}>
            <p style={{ fontSize: 11, color: '#fff', lineHeight: 1.5, margin: 0 }}>Ja, klingt super! Wann wäre ein Gespräch möglich? 😊</p>
          </div>
          <div style={{ borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}><ProfileAvatar name="Lisa" size={24} /></div>
        </div>
        <div className="cl-msg3" style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
          <div style={{ width: 24, height: 24, borderRadius: 8, background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 9, fontWeight: 800, color: '#fff' }}>{rec.employer[0]}</div>
          <div style={{ background: '#f8f9fa', borderRadius: '12px 12px 12px 4px', padding: '8px 14px', display: 'flex', gap: 4 }}>
            <span className="cl-b1" style={{ width: 5, height: 5, borderRadius: '50%', background: '#94a3b8' }} />
            <span className="cl-b2" style={{ width: 5, height: 5, borderRadius: '50%', background: '#94a3b8' }} />
            <span className="cl-b3" style={{ width: 5, height: 5, borderRadius: '50%', background: '#94a3b8' }} />
          </div>
        </div>
      </div>
      <div style={{ borderTop: '1px solid #f1f3f5', padding: '8px 14px', display: 'flex', gap: 8, background: '#fafafa' }}>
        <div style={{ flex: 1, background: '#f1f3f5', borderRadius: 99, padding: '7px 14px', fontSize: 10, color: '#94a3b8' }}>Antworten…</div>
        <div style={{ width: 28, height: 28, background: accent, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 3px 10px ${accent}30` }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
        </div>
      </div>
    </div>
  );
}

function FAQAccordion({ items, accent }: { items: { question: string; answer: string }[]; accent: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => (
        <div key={i} className="border border-gray-100 rounded-2xl overflow-hidden">
          <button type="button" onClick={() => setOpenIndex(openIndex === i ? null : i)} className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left bg-white text-gray-900 font-semibold text-[0.9rem] cursor-pointer border-none">
            <span>{item.question}</span>
            <ChevronDown className="flex-shrink-0 transition-transform duration-200" size={18} style={{ color: accent, transform: openIndex === i ? 'rotate(180deg)' : 'rotate(0)' }} />
          </button>
          <AnimatePresence>
            {openIndex === i && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                <div className="px-5 pb-4 text-gray-600 text-[0.85rem] leading-relaxed bg-white">{item.answer}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

export default function CareerBranchLandingPage({ branch }: CareerBranchLandingPageProps) {
  const content = getBranchContent(branch.id as BranchId);
  const accent = branch.accent;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const mainNavLinks = [
    { label: 'Lebenslauf', to: '/lebenslauf-erstellen' },
    { label: 'Community', to: '/community' },
    { label: 'Unternehmen', to: '/unternehmen' },
    { label: 'Über uns', to: '/about' },
  ];

  const renderBranchFeature = () => {
    switch (branch.id) {
      case 'pflege': return content.wuensche?.length ? <PflegeWuensche wuensche={content.wuensche} accent={accent} cardRadius={branch.cardRadius} /> : null;
      case 'funktionsdienste': return content.fachbereiche?.length ? <FachbereichTabs fachbereiche={content.fachbereiche} deviceExpertise={content.deviceExpertise} accent={accent} cardRadius={branch.cardRadius} /> : null;
      case 'handwerk': return content.gewerke?.length ? <GewerkeFilter gewerke={content.gewerke} accent={accent} /> : null;
      case 'industriemechaniker': return content.schichtmodelle?.length ? <SchichtTabelle schichtmodelle={content.schichtmodelle} tarifInfo={content.tarifInfo} accent={accent} /> : null;
      case 'buromanagement': return content.arbeitsmodelle?.length ? <ArbeitsmodellFilter arbeitsmodelle={content.arbeitsmodelle} softwareSkills={content.softwareSkills} accent={accent} cardRadius={branch.cardRadius} /> : null;
      case 'ausbildung': return content.orientierung?.length ? <AzubiOrientierung orientierung={content.orientierung} elternBox={content.elternBox} accent={accent} cardRadius={branch.cardRadius} /> : null;
      default: return null;
    }
  };

  const topJobs = content.jobs.slice(0, 3);
  const topTestimonials = content.testimonials.slice(0, 3);
  const topFaqs = content.faqs.slice(0, 4);
  const ctaUrl = `/cv-generator?returnTo=${encodeURIComponent(branch.link)}`;

  return (
    <div className="career-landing bg-white text-gray-900 min-h-screen overflow-x-hidden" style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>

      {/* HEADER */}
      <header className="fixed top-3 sm:top-4 left-0 right-0 z-50 px-4">
        <div className="max-w-[1120px] mx-auto">
          <div className="bg-white/98 backdrop-blur-xl border border-gray-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.06)] rounded-full py-2.5 px-4 sm:px-5 flex items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 no-underline">
              <img
                src="/assets/Logo_visiblle_transparent.png"
                alt="BeVisiblle"
                className="w-7 h-7 object-contain"
              />
              <span className="text-[15px] font-bold text-gray-900">BeVisib<span style={{ color: accent }}>ll</span>e</span>
              </Link>
            <nav className="hidden lg:flex items-center gap-6">
              {mainNavLinks.map((l) => (<Link key={l.to} to={l.to} className="text-[13px] font-medium text-gray-500 hover:text-gray-900 no-underline transition-colors">{l.label}</Link>))}
              <Link to="/" className="text-[13px] font-medium text-gray-500 hover:text-gray-900 no-underline transition-colors">Alle Branchen</Link>
              </nav>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link to="/auth" className="hidden sm:inline text-[13px] font-medium text-gray-500 hover:text-gray-900 py-2 px-3 no-underline">Login</Link>
              <Link to={ctaUrl} className="rounded-full py-2 px-5 text-[13px] font-bold text-white no-underline transition-opacity hover:opacity-90" style={{ background: accent, boxShadow: `0 4px 14px ${accent}40` }}>{branch.ctaText}</Link>
              <button type="button" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 border-none bg-transparent cursor-pointer">{mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}</button>
            </div>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="lg:hidden mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 max-w-[1120px] mx-auto">
            <div className="flex flex-col gap-0.5">
              {mainNavLinks.map((l) => (<Link key={l.to} to={l.to} onClick={() => setMobileMenuOpen(false)} className="py-2.5 px-3 rounded-lg text-gray-700 hover:bg-gray-50 no-underline">{l.label}</Link>))}
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="py-2.5 px-3 rounded-lg text-gray-700 hover:bg-gray-50 no-underline">Alle Branchen</Link>
            </div>
          </div>
        )}
      </header>

      {/* ═══ BLOCK 1 – HERO ═══ */}
      <section style={{ paddingTop: 120, paddingBottom: 40, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: '60%', height: '100%', background: `radial-gradient(ellipse at 80% 30%, ${accent}08 0%, transparent 60%)`, pointerEvents: 'none' }} />
        <R>
          <div className="cl-hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div className="cl-fu" style={{ marginBottom: 20 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, borderRadius: 99, border: `1px solid ${accent}30`, background: `${accent}08`, padding: '5px 14px', fontSize: 12, fontWeight: 600, color: accent }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: accent }} />{branch.subline}
                </span>
              </div>
              <h1 className="cl-fu1" style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 900, lineHeight: 1.08, letterSpacing: '-2px', color: '#0f172a', marginBottom: 20 }}>{branch.heroHeadline}</h1>
              <p className="cl-fu2" style={{ fontSize: 'clamp(15px, 1.8vw, 18px)', color: '#64748b', lineHeight: 1.7, maxWidth: 480, marginBottom: 32 }}>{branch.heroSubline}</p>
              <div className="cl-fu3" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
                <Link to={ctaUrl} className="cl-glow" style={{ '--cl-glow': `${accent}40`, background: accent, color: '#fff', borderRadius: 99, padding: '14px 28px', fontSize: 15, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: `0 4px 20px ${accent}40` } as React.CSSProperties}>
                  {branch.ctaText}<ArrowRight size={16} strokeWidth={2.5} />
                </Link>
                <a href="#schritte" style={{ background: 'rgba(0,0,0,.04)', border: '1px solid rgba(0,0,0,.08)', color: '#374151', borderRadius: 99, padding: '14px 22px', fontSize: 15, fontWeight: 500, textDecoration: 'none' }}>So funktioniert&apos;s ↓</a>
              </div>
              <div className="cl-fu3" style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
                {branch.trustSignals.map((s) => (<span key={s} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#64748b', fontWeight: 500 }}><Check size={13} strokeWidth={3} style={{ color: '#4ade80' }} />{s}</span>))}
              </div>
              <div className="cl-fu3" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex' }}>
                  {['Klaus', 'Sara', 'David', 'Maria', 'Tom'].map((n, i) => (
                    <div key={n} style={{ padding: 2, background: `linear-gradient(135deg, ${accent}, #a78bfa)`, borderRadius: '50%', display: 'inline-flex', marginLeft: i ? -10 : 0, boxShadow: `0 2px 8px ${accent}20` }}>
                      <div style={{ borderRadius: '50%', overflow: 'hidden' }}><ProfileAvatar name={n} size={34} /></div>
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ display: 'flex', gap: 1.5, marginBottom: 2 }}>
                    {[1,2,3,4,5].map((j) => (<svg key={j} width="12" height="12" viewBox="0 0 20 20" fill="#facc15"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>))}
                  </div>
                  <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}><strong style={{ color: '#374151' }}>5.000+</strong> {branch.title} dabei</p>
                </div>
              </div>
            </div>
            <div className="cl-float" style={{ position: 'relative' }}>
              <LightRecruiterMockup branch={branch} />
              <div className="cl-si1 cl-floatd cl-hero-badge" style={{ position: 'absolute', top: -16, left: -40, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,.08)', whiteSpace: 'nowrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 28, height: 28, background: 'rgba(74,222,128,.1)', border: '1px solid rgba(74,222,128,.25)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={14} strokeWidth={2.5} style={{ color: '#4ade80' }} /></div>
                  <div><p style={{ fontSize: 11, fontWeight: 700, color: '#0f172a', margin: 0 }}>Job gefunden!</p><p style={{ fontSize: 9, color: '#94a3b8', margin: 0 }}>Klinikum Mitte · Hamburg</p></div>
                </div>
              </div>
            </div>
          </div>
          {content.employers.length > 0 && (
            <div style={{ marginTop: 56, paddingTop: 32, borderTop: '1px solid #f1f3f5' }}>
              <p style={{ textAlign: 'center', fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 20 }}>Arbeitgeber die dich finden</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 36 }}>
                {content.employers.map((e) => e.logo ? (<img key={e.name} src={e.logo} alt={e.name} style={{ height: 28, maxWidth: 120, objectFit: 'contain', opacity: 0.7 }} />) : (<span key={e.name} style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1' }}>{e.name}</span>))}
          </div>
        </div>
          )}
        </R>
      </section>

      {/* ═══ BLOCK 2 – HOW IT WORKS ═══ */}
      <section id="schritte" style={{ padding: '64px 0 80px', background: '#f8f9fa' }}>
        <R>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, borderRadius: 99, border: `1px solid ${accent}25`, background: `${accent}06`, padding: '5px 14px', fontSize: 12, fontWeight: 600, color: accent, marginBottom: 16 }}>In 3 Schritten zum Job</span>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 42px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-1.5px', lineHeight: 1.15 }}>So funktioniert&apos;s</h2>
          </div>
          <div className="cl-steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, position: 'relative' }}>
            <div className="cl-step-line" style={{ position: 'absolute', top: 28, left: '16.6%', right: '16.6%', height: 2, background: `linear-gradient(90deg, ${accent}30, ${accent}60, ${accent}30)`, zIndex: 0 }} />
            {branch.features.map((f, i) => (
              <div key={i} className={`cl-fu${i > 0 ? i : ''}`} style={{ textAlign: 'center', position: 'relative', zIndex: 1, padding: '0 20px' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: i === 1 ? accent : '#fff', border: `2px solid ${accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: i === 1 ? `0 4px 20px ${accent}35` : `0 2px 10px ${accent}15`, color: i === 1 ? '#fff' : accent, fontSize: 20, fontWeight: 800 }}>{i + 1}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>{f.description}</p>
                  </div>
            ))}
          </div>
        </R>
      </section>

      {/* ═══ BLOCK 3 – BRANCH-SPECIFIC FEATURE ═══ */}
      {renderBranchFeature()}

      {/* ═══ BLOCK 3B – BRANCH-SPEZIFISCHER FINDER ═══ */}
      <section style={{ padding: '64px 0 72px', background: '#f8f9fa' }}>
        <R>
          <div style={{ maxWidth: 760, margin: '0 auto 24px' }}>
            <p
              style={{
                fontSize: 11,
                letterSpacing: 2,
                textTransform: 'uppercase',
                color: '#94a3b8',
                margin: '0 0 6px',
              }}
            >
              Noch unsicher?
            </p>
            <h2
              style={{
                fontSize: 'clamp(22px,3vw,30px)',
                fontWeight: 800,
                color: '#0f172a',
                letterSpacing: '-0.04em',
                margin: '0 0 8px',
              }}
            >
              Unsicher, ob {branch.title} zu dir passt?
            </h2>
            <p
              style={{
                fontSize: 14,
                color: '#64748b',
                lineHeight: 1.7,
                margin: 0,
                maxWidth: 520,
              }}
            >
              Frag den BeVisiblle Coach und hol dir Vorschläge für passende Jobs und Ausbildungen – direkt in dieser Branche.
            </p>
          </div>
          <ConversationalFinder
            audience={branch.id === 'ausbildung' ? 'ausbildung' : 'job'}
            mode="hybrid"
          />
        </R>
      </section>

      {/* ═══ BLOCK 4 – COMMUNITY EINBLICK (Feed + Profile + Network) ═══ */}
      <section style={{ padding: '80px 0', background: '#f8f9fa', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translate(-50%, -50%)', width: 800, height: 400, background: `radial-gradient(ellipse, ${accent}06 0%, transparent 60%)`, pointerEvents: 'none' }} />
        <R>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, borderRadius: 99, border: `1px solid ${accent}25`, background: `${accent}06`, padding: '5px 14px', fontSize: 12, fontWeight: 600, color: accent, marginBottom: 16 }}>Einblick in die Community</span>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 42px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-1.5px', lineHeight: 1.15, marginBottom: 12 }}>
              Echte Menschen. Echtes Netzwerk.
            </h2>
            <p style={{ fontSize: 16, color: '#64748b', maxWidth: 520, margin: '0 auto' }}>
              So sieht es aus, wenn du dabei bist – Kolleg:innen vernetzen sich, tauschen sich aus und finden neue Jobs.
            </p>
          </div>

          <div className="cl-community-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start', position: 'relative', zIndex: 1 }}>
            <div className="cl-float">
              <LightFeedMockup branch={branch} />
            </div>
            <div className="cl-floatd">
              <LightProfileCard branch={branch} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 48, flexWrap: 'wrap' }}>
            {[
              { n: '5.000+', label: 'Mitglieder', avatars: ['Klaus', 'Sara', 'David'] },
              { n: '12', label: 'Neue Jobs heute', avatars: ['Maria', 'Tom', 'Julia'] },
              { n: '38', label: 'Neue Mitglieder diese Woche', avatars: ['Lisa', 'Anna', 'Max'] },
            ].map((stat) => (
              <div key={stat.label} style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#fff', border: '1px solid #f1f3f5', borderRadius: 16, padding: '16px 24px', boxShadow: '0 2px 12px rgba(0,0,0,.04)' }}>
                <div style={{ display: 'flex' }}>
                  {stat.avatars.map((n, i) => (
                    <div key={n} style={{ padding: 1.5, background: `linear-gradient(135deg, ${accent}, #a78bfa)`, borderRadius: '50%', display: 'inline-flex', marginLeft: i ? -8 : 0 }}>
                      <div style={{ borderRadius: '50%', overflow: 'hidden' }}><ProfileAvatar name={n} size={28} /></div>
                    </div>
                  ))}
                </div>
                <div>
                  <p style={{ fontSize: 20, fontWeight: 900, color: accent, letterSpacing: '-1px', margin: 0, lineHeight: 1 }}>{stat.n}</p>
                  <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>{stat.label}</p>
                </div>
              </div>
            ))}
        </div>
        </R>
        <style>{`
          @media(max-width:900px) { .cl-community-grid { grid-template-columns: 1fr !important; } }
        `}</style>
      </section>

      {/* ═══ BLOCK 5 – TESTIMONIALS AS COMMUNITY POSTS ═══ */}
      {topTestimonials.length > 0 && (
        <section style={{ padding: '80px 0', background: '#fff' }}>
          <R>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, borderRadius: 99, border: `1px solid ${accent}25`, background: `${accent}06`, padding: '5px 14px', fontSize: 12, fontWeight: 600, color: accent, marginBottom: 16 }}>Aus der Community</span>
              <h2 style={{ fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-1.5px' }}>Was andere sagen</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(topTestimonials.length, 3)}, 1fr)`, gap: 20, maxWidth: 900, margin: '0 auto' }} className="cl-testimonials-grid">
              {topTestimonials.map((t, i) => (
                <div key={i} style={{ background: '#fff', border: '1px solid #f1f3f5', borderRadius: 20, padding: 0, boxShadow: '0 2px 12px rgba(0,0,0,.04)', overflow: 'hidden', transition: 'box-shadow .3s, transform .3s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,.08)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <div style={{ padding: '18px 20px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <div style={{ padding: 2, background: `linear-gradient(135deg, ${accent}, #a78bfa)`, borderRadius: '50%', display: 'inline-flex' }}>
                        <div style={{ borderRadius: '50%', overflow: 'hidden' }}><ProfileAvatar name={t.name} size={38} /></div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: 0 }}>{t.name}</p>
                        <p style={{ fontSize: 10, color: '#94a3b8', margin: '1px 0 0' }}>{t.role}{t.employer ? ` · ${t.employer}` : ''} · vor {i + 1} Wo.</p>
                      </div>
                    </div>
                    <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.65, marginBottom: 14 }}>
                      {t.quote}
                    </p>
                  </div>
                  <div style={{ borderTop: '1px solid #f5f5f5', padding: '10px 20px', display: 'flex', gap: 20 }}>
                    {[['👍', `${48 + i * 37}`], ['💬', `${6 + i * 4}`], ['↗', 'Teilen']].map(([e, c], j) => (
                      <span key={j} style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>{e} {c}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </R>
          <style>{`
            @media(max-width:700px) { .cl-testimonials-grid { grid-template-columns: 1fr !important; } }
          `}</style>
        </section>
      )}

      {/* ═══ BLOCK 6 – JOBS + FINAL CTA ═══ */}
      {topJobs.length > 0 && (
        <section style={{ padding: '64px 0', background: '#f8f9fa' }}>
          <R>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, borderRadius: 99, border: `1px solid ${accent}25`, background: `${accent}06`, padding: '5px 14px', fontSize: 12, fontWeight: 600, color: accent, marginBottom: 16 }}>Offene Stellen</span>
              <h2 style={{ fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-1.5px' }}>Aktuelle Stellenangebote</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 800, margin: '0 auto 48px' }}>
              {topJobs.map((job, i) => (
                <div key={i} style={{ background: '#fff', border: '1px solid #f1f3f5', borderRadius: 16, padding: '18px 22px', boxShadow: '0 2px 8px rgba(0,0,0,.03)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', transition: 'box-shadow .3s, transform .3s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,.06)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,.03)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>{job.title}</p>
                    <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>{job.employer} · {job.location}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {job.type && (<span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', background: `${accent}10`, color: accent, borderRadius: 99 }}>{job.type}</span>)}
                    <Link to={ctaUrl} style={{ fontSize: 13, fontWeight: 600, color: accent, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>Bewerben <ArrowRight size={14} /></Link>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: `linear-gradient(135deg, ${accent}, ${accent}dd)`, borderRadius: 24, padding: '48px 40px', textAlign: 'center', boxShadow: `0 12px 40px ${accent}25` }}>
              <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 900, color: '#fff', letterSpacing: '-1px', marginBottom: 12 }}>Bereit?</h2>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,.8)', marginBottom: 28, maxWidth: 480, margin: '0 auto 28px' }}>Erstelle dein Profil in 5 Minuten. Kostenlos, unverbindlich, jederzeit löschbar.</p>
              <Link to={ctaUrl} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: accent, borderRadius: 99, padding: '15px 32px', fontSize: 15, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.15)' }}>{branch.ctaText}<ArrowRight size={16} strokeWidth={2.5} /></Link>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 20, flexWrap: 'wrap' }}>
                {branch.trustSignals.slice(0, 3).map((s) => (<span key={s} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'rgba(255,255,255,.7)', fontWeight: 500 }}><Check size={13} strokeWidth={3} style={{ color: 'rgba(255,255,255,.9)' }} />{s}</span>))}
              </div>
            </div>
          </R>
        </section>
      )}

      {/* ═══ BLOCK 7 – FOOTER ZONE ═══ */}
      {topFaqs.length > 0 && (
        <section style={{ padding: '64px 0', background: '#fff' }}>
          <R>
            <div className="cl-footer-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'start' }}>
              <div>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 20 }}>Häufige Fragen</h3>
                <FAQAccordion items={topFaqs} accent={accent} />
              </div>
              <div>
                {content.seoCities && content.seoCities.length > 0 && (
                  <div style={{ marginBottom: 32 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>{branch.title} – Jobs in deiner Nähe</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {content.seoCities.map((city) => (
                        <Link key={city} to={`${ctaUrl}&city=${encodeURIComponent(city)}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, color: '#64748b', background: '#f8f9fa', textDecoration: 'none' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f3f5'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = '#f8f9fa'; }}
                        >{branch.title} {city}<ArrowRight size={12} /></Link>
                      ))}
                    </div>
                  </div>
                )}
                {content.backlinks && content.backlinks.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Weiterführende Links</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {content.backlinks.slice(0, 4).map((bl, i) => (
                        <a key={i} href={bl.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748b', textDecoration: 'none', padding: '6px 0' }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = '#0f172a'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; }}
                        ><ExternalLink size={13} style={{ color: accent, flexShrink: 0 }} /><span>{bl.label}</span></a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </R>
        </section>
      )}

      {/* ═══ FOOTER ═══ */}
      <footer style={{ borderTop: '1px solid #e5e7eb', background: '#fff', padding: '48px 0' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px' }}>
          <div className="cl-footer-inner-grid" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr', gap: 48, marginBottom: 48 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <img
                  src="/assets/Logo_visiblle_transparent.png"
                  alt="BeVisiblle"
                  style={{ width: 32, height: 32, objectFit: 'contain' }}
                />
                <span style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>BeVisib<span style={{ color: accent }}>ll</span>e</span>
              </div>
              <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.7, maxWidth: 230 }}>Das Karrierenetzwerk für Pfleger:innen, Handwerker, Servicekräfte und alle, die wirklich anpacken.</p>
            </div>
            {[
              { title: 'App', links: [{ label: 'Feed', to: '/community' }, { label: 'Jobs', to: '/jobs' }, { label: 'Profil', to: '/cv-generator' }] },
              { title: 'Company', links: [{ label: 'Über uns', to: '/about' }, { label: 'Für Unternehmen', to: '/company' }, { label: 'Blog', to: '/blog' }] },
              { title: 'Legal', links: [{ label: 'Datenschutz', to: '/datenschutz' }, { label: 'Impressum', to: '/impressum' }, { label: 'AGB', to: '/agb' }] },
            ].map((col) => (
              <div key={col.title}>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: '#94a3b8', marginBottom: 14 }}>{col.title}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{col.links.map((l) => (<Link key={l.label} to={l.to} style={{ fontSize: 13, color: '#64748b', textDecoration: 'none' }}>{l.label}</Link>))}</div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>&copy; 2025 BeVisiblle GmbH</p>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>DSGVO-konform · Datenschutz</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
